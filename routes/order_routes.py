from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from schemas.database import get_session
from schemas.models import OrderStatusType, EquipmentType, TrackingEvent, Order, Stop
from service.order_service import OrderService
from routes.schemas import OrderResponse, OrderListResponse
from routes.create_order_schemas import OrderCreate
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])


class StatusTypeResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class EquipmentTypeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


@router.get("/", response_model=OrderListResponse)
async def get_orders(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    status_ids: Optional[str] = Query(None, description="Comma-separated list of status IDs to filter by"),
    equipment_type_ids: Optional[str] = Query(None, description="Comma-separated list of equipment type IDs to filter by"),
    pickup_date_from: Optional[str] = Query(None, description="Filter by pickup date from (ISO format)"),
    pickup_date_to: Optional[str] = Query(None, description="Filter by pickup date to (ISO format)"),
    delivery_date_from: Optional[str] = Query(None, description="Filter by delivery date from (ISO format)"),
    delivery_date_to: Optional[str] = Query(None, description="Filter by delivery date to (ISO format)"),
    session: AsyncSession = Depends(get_session)
):
    """
    Get all orders with pagination and optional filters.
    
    Returns:
        - user_message: Friendly error message if something goes wrong
        - dev_message: Technical details for debugging
    """
    # Parse comma-separated IDs
    status_ids_list = None
    if status_ids:
        try:
            status_ids_list = [int(id.strip()) for id in status_ids.split(',') if id.strip()]
        except ValueError:
            pass
    
    equipment_type_ids_list = None
    if equipment_type_ids:
        try:
            equipment_type_ids_list = [int(id.strip()) for id in equipment_type_ids.split(',') if id.strip()]
        except ValueError:
            pass
    
    orders = await OrderService.get_all_orders(
        session, 
        skip=skip, 
        limit=limit, 
        customer_id=customer_id,
        status_ids=status_ids_list,
        equipment_type_ids=equipment_type_ids_list,
        pickup_date_from=pickup_date_from,
        pickup_date_to=pickup_date_to,
        delivery_date_from=delivery_date_from,
        delivery_date_to=delivery_date_to
    )
    
    # Build response with stops data for list view (to show origin/destination cities)
    order_responses = []
    for order in orders:
        # Include stops data with address information for city display
        stops_data = None
        if order.stops:
            stops_data = [
                {
                    "id": stop.id,
                    "order_id": stop.order_id,
                    "address_id": stop.address_id,
                    "stop_type_id": stop.stop_type_id,
                    "sequence_number": stop.sequence_number,
                    "scheduled_arrival_early": stop.scheduled_arrival_early,
                    "scheduled_arrival_late": stop.scheduled_arrival_late,
                    "address": {
                        "id": stop.address.id,
                        "location_name": stop.address.location_name,
                        "street": stop.address.street,
                        "city": stop.address.city,
                        "state": stop.address.state,
                        "zip_code": stop.address.zip_code,
                        "latitude": stop.address.latitude,
                        "longitude": stop.address.longitude,
                        "created_at": stop.address.created_at,
                        "updated_at": stop.address.updated_at
                    } if stop.address else None,
                    "stop_type": {
                        "id": stop.stop_type.id,
                        "name": stop.stop_type.name,
                        "created_at": stop.stop_type.created_at,
                        "updated_at": stop.stop_type.updated_at
                    } if stop.stop_type else None,
                    "created_at": stop.created_at,
                    "updated_at": stop.updated_at
                }
                for stop in sorted(order.stops, key=lambda s: s.sequence_number)
            ]
        
        order_dict = {
            "id": order.id,
            "customer_id": order.customer_id,
            "equipment_type_id": order.equipment_type_id,
            "status_id": order.status_id,
            "pickup_date": order.pickup_date,
            "delivery_date": order.delivery_date,
            "bill_of_lading_number": order.bill_of_lading_number,
            "shipment_id": order.shipment_id,
            "bol_notes": order.bol_notes,
            "customer": {
                "id": order.customer.id,
                "name": order.customer.name,
                "email": order.customer.email,
                "created_at": order.customer.created_at,
                "updated_at": order.customer.updated_at
            } if order.customer else None,
            "equipment_type": {
                "id": order.equipment_type.id,
                "name": order.equipment_type.name,
                "description": order.equipment_type.description,
                "created_at": order.equipment_type.created_at,
                "updated_at": order.equipment_type.updated_at
            } if order.equipment_type else None,
            "status": {
                "id": order.status.id,
                "name": order.status.name,
                "created_at": order.status.created_at,
                "updated_at": order.status.updated_at
            } if order.status else None,
            "stops": stops_data,  # Include stops for city display
            "load": None,  # Omit for list view
            "quotation": None,  # Omit for list view
            "created_at": order.created_at,
            "updated_at": order.updated_at
        }
        order_responses.append(OrderResponse(**order_dict))
    
    return OrderListResponse(
        orders=order_responses,
        total=len(orders),
        skip=skip,
        limit=limit
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Get an order by ID with all related data.
    
    Returns:
        - user_message: Friendly error message if order not found
        - dev_message: Technical details for debugging
    """
    order = await OrderService.get_order_by_id(session, order_id)
    return OrderResponse.model_validate(order)


@router.get("/customer/{customer_id}", response_model=OrderListResponse)
async def get_orders_by_customer(
    customer_id: int,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    session: AsyncSession = Depends(get_session)
):
    """
    Get all orders for a specific customer.
    
    Returns:
        - user_message: Friendly error message if customer not found
        - dev_message: Technical details for debugging
    """
    orders = await OrderService.get_orders_by_customer(
        session, 
        customer_id=customer_id, 
        skip=skip, 
        limit=limit
    )
    return OrderListResponse(
        orders=[OrderResponse.model_validate(o) for o in orders],
        total=len(orders),
        skip=skip,
        limit=limit
    )


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new order with stops, load, and quotation details.
    
    This endpoint creates an order atomically in a single transaction:
    - Validates customer and equipment type
    - Creates addresses for each stop
    - Creates stops with proper sequencing
    - Optionally creates load and quotation
    - Sets initial status to CREATED
    
    Returns:
        - user_message: Friendly error message if validation fails
        - dev_message: Technical details for debugging
    """
    # Convert Pydantic models to dicts for service layer
    stops_data = [
        {
            "stop_type": stop.stop_type,
            "sequence_number": stop.sequence_number,
            "scheduled_arrival_early": stop.scheduled_arrival_early,
            "scheduled_arrival_late": stop.scheduled_arrival_late,
            "address": stop.address.model_dump()
        }
        for stop in order_data.stops
    ]
    
    load_data = order_data.load.model_dump() if order_data.load else None
    quotation_data = order_data.quotation.model_dump() if order_data.quotation else None
    
    order = await OrderService.create_order(
        session=session,
        customer_id=order_data.customer_id,
        equipment_type_id=order_data.equipment_type_id,
        stops_data=stops_data,
        load_data=load_data,
        quotation_data=quotation_data,
        bill_of_lading_number=order_data.bill_of_lading_number,
        shipment_id=order_data.shipment_id,
        bol_notes=order_data.bol_notes
    )
    
    return OrderResponse.model_validate(order)


@router.get("/filters/statuses", response_model=List[StatusTypeResponse])
async def get_order_statuses(session: AsyncSession = Depends(get_session)):
    """Get all available order status types for filtering."""
    try:
        result = await session.execute(select(OrderStatusType).order_by(OrderStatusType.name))
        statuses = result.scalars().all()
        return [StatusTypeResponse.model_validate(status) for status in statuses]
    except Exception as e:
        logger.error(f"Error getting order statuses: {e}", exc_info=True)
        return []


@router.get("/filters/equipment-types", response_model=List[EquipmentTypeResponse])
async def get_equipment_types(session: AsyncSession = Depends(get_session)):
    """Get all available equipment types for filtering."""
    try:
        result = await session.execute(select(EquipmentType).order_by(EquipmentType.name))
        equipment_types = result.scalars().all()
        return [EquipmentTypeResponse.model_validate(eq) for eq in equipment_types]
    except Exception as e:
        logger.error(f"Error getting equipment types: {e}", exc_info=True)
        return []


# ===== Tracking Webhook Endpoints =====

class TrackingWebhookPayload(BaseModel):
    """Payload for tracking webhook updates with stop-level tracking."""
    order_id: int
    stop_id: Optional[int] = None  # Optional: for stop-level tracking
    status: str  # NOT_REACHED, ARRIVED, LOADING, UNLOADING, DEPARTED
    location: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: Optional[str] = None  # ISO format string
    
    class Config:
        json_schema_extra = {
            "example": {
                "order_id": 1,
                "stop_id": 5,
                "status": "ARRIVED",
                "location": "Chicago, IL",
                "description": "Driver arrived at pickup location",
                "latitude": 41.8781,
                "longitude": -87.6298,
                "timestamp": "2026-01-07T15:30:00Z"
            }
        }


class TrackingEventResponse(BaseModel):
    """Response model for tracking events."""
    id: int
    order_id: int
    stop_id: Optional[int] = None
    status: str
    location: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/webhook/tracking", response_model=TrackingEventResponse, status_code=status.HTTP_201_CREATED)
async def receive_tracking_webhook(
    payload: TrackingWebhookPayload,
    session: AsyncSession = Depends(get_session)
):
    """
    Webhook endpoint to receive tracking updates for orders.
    
    Supports stop-level tracking with statuses:
    - NOT_REACHED: Stop not yet reached
    - ARRIVED: Driver arrived at stop
    - LOADING: Loading cargo at pickup
    - UNLOADING: Unloading cargo at delivery
    - DEPARTED: Departed from stop
    """
    try:
        # Verify order exists
        result = await session.execute(
            select(Order).where(Order.id == payload.order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID {payload.order_id} not found"
            )
        
        # Verify stop exists if stop_id provided
        if payload.stop_id:
            result = await session.execute(
                select(Stop).where(Stop.id == payload.stop_id, Stop.order_id == payload.order_id)
            )
            stop = result.scalar_one_or_none()
            
            if not stop:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Stop with ID {payload.stop_id} not found for order {payload.order_id}"
                )
        
        # Parse timestamp or use current time
        event_timestamp = datetime.utcnow()
        if payload.timestamp:
            try:
                event_timestamp = datetime.fromisoformat(payload.timestamp.replace('Z', '+00:00'))
            except ValueError:
                logger.warning(f"Invalid timestamp format: {payload.timestamp}, using current time")
        
        # Create tracking event
        tracking_event = TrackingEvent(
            order_id=payload.order_id,
            stop_id=payload.stop_id,
            status=payload.status,
            location=payload.location,
            description=payload.description,
            latitude=payload.latitude,
            longitude=payload.longitude,
            timestamp=event_timestamp
        )
        
        session.add(tracking_event)
        await session.commit()
        await session.refresh(tracking_event)
        
        logger.info(f"Created tracking event for order {payload.order_id}, stop {payload.stop_id}: {payload.status}")
        
        return TrackingEventResponse.model_validate(tracking_event)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing tracking webhook: {e}", exc_info=True)
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process tracking update"
        )


@router.get("/{order_id}/tracking", response_model=List[TrackingEventResponse])
async def get_order_tracking(
    order_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Get all tracking events for a specific order.
    Returns events sorted by timestamp in descending order (newest first).
    """
    try:
        # Verify order exists
        result = await session.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID {order_id} not found"
            )
        
        # Get tracking events
        result = await session.execute(
            select(TrackingEvent)
            .where(TrackingEvent.order_id == order_id)
            .order_by(TrackingEvent.timestamp.desc())
        )
        tracking_events = result.scalars().all()
        
        return [TrackingEventResponse.model_validate(event) for event in tracking_events]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tracking events for order {order_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tracking events"
        )


# ===== Price Assignment Endpoint =====

class AssignPricePayload(BaseModel):
    """Payload for assigning price to an order from the rate calculator."""
    base_rate: float
    miles: Optional[int] = None
    rate_per_mile: Optional[float] = None
    weight_lbs: Optional[int] = None
    commodity: Optional[str] = None
    carrier_name: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "base_rate": 2500.00,
                "miles": 500,
                "rate_per_mile": 5.00,
                "weight_lbs": 45000,
                "commodity": "Electronics",
                "carrier_name": "ABC Trucking",
                "notes": "Calculated from rate calculator"
            }
        }


class AssignPriceResponse(BaseModel):
    """Response for price assignment."""
    success: bool
    order_id: int
    lane_id: Optional[int] = None
    base_rate: float
    rate_per_mile: Optional[float] = None
    miles: Optional[int] = None
    lane_history_id: Optional[int] = None
    message: str


@router.post("/{order_id}/assign-price", response_model=AssignPriceResponse)
async def assign_price_to_order(
    order_id: int,
    payload: AssignPricePayload,
    session: AsyncSession = Depends(get_session)
):
    """
    Assign a price to an order from the rate calculator.
    
    This endpoint:
    - Updates/creates the order's quotation with the calculated price
    - Creates a lane history entry if the order has a lane assigned
    - Records pricing information for future rate analysis
    
    The price is typically calculated by the rate calculator based on:
    - Origin and destination
    - Equipment type
    - Distance
    - Weight and commodity
    - Historical lane data
    """
    try:
        result = await OrderService.assign_price_to_order(
            session=session,
            order_id=order_id,
            base_rate=payload.base_rate,
            miles=payload.miles,
            rate_per_mile=payload.rate_per_mile,
            weight_lbs=payload.weight_lbs,
            commodity=payload.commodity,
            carrier_name=payload.carrier_name,
            notes=payload.notes
        )
        
        return AssignPriceResponse(**result)
        
    except Exception as e:
        logger.error(f"Error assigning price to order {order_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign price: {str(e)}"
        )

