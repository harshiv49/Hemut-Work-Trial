from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.database import get_session
from service.order_service import OrderService
from routes.schemas import OrderResponse, OrderListResponse
from routes.create_order_schemas import OrderCreate
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/", response_model=OrderListResponse)
async def get_orders(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Get all orders with pagination and optional customer filter.
    
    Returns:
        - user_message: Friendly error message if something goes wrong
        - dev_message: Technical details for debugging
    """
    orders = await OrderService.get_all_orders(
        session, 
        skip=skip, 
        limit=limit, 
        customer_id=customer_id
    )
    
    # Build response with minimal nested data for list view
    order_responses = []
    for order in orders:
        order_dict = {
            "id": order.id,
            "customer_id": order.customer_id,
            "equipment_type_id": order.equipment_type_id,
            "status_id": order.status_id,
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
            "stops": None,  # Omit for list view
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

