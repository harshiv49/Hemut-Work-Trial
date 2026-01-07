from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from schemas.models import (
    Order, Customer, Stop, Address, StopTypeModel, 
    EquipmentType, OrderStatusType, Load, Quotation, Lane, LaneHistory
)
from core.exceptions import NotFoundException, BadRequestException
from sqlalchemy.sql import func
import logging

logger = logging.getLogger(__name__)


class OrderService:
    """Service layer for Order operations."""
    
    @staticmethod
    async def get_order_by_id(session: AsyncSession, order_id: int) -> Order:
        """Get an order by ID with all related data."""
        try:
            result = await session.execute(
                select(Order)
                .options(
                    selectinload(Order.customer),
                    selectinload(Order.equipment_type),
                    selectinload(Order.status),
                    selectinload(Order.stops).selectinload(Stop.address),
                    selectinload(Order.stops).selectinload(Stop.stop_type),
                    selectinload(Order.load),
                    selectinload(Order.quotation)
                )
                .where(Order.id == order_id)
            )
            order = result.scalar_one_or_none()
            
            if not order:
                raise NotFoundException(
                    user_message=f"Order #{order_id} could not be found",
                    dev_message=f"Order with id {order_id} does not exist in database"
                )
            
            return order
        except NotFoundException:
            # Re-raise our custom exception as-is
            raise
        except Exception as e:
            # Log and wrap unexpected database errors
            logger.error(f"Database error getting order {order_id}: {e}", exc_info=True)
            from core.exceptions import InternalServerException
            raise InternalServerException(
                user_message="Unable to load order details",
                dev_message=f"Database error in get_order_by_id({order_id}): {str(e)}"
            )
    
    @staticmethod
    async def get_all_orders(
        session: AsyncSession, 
        skip: int = 0, 
        limit: int = 100, 
        customer_id: int = None,
        status_ids: list[int] = None,
        equipment_type_ids: list[int] = None,
        pickup_date_from: str = None,
        pickup_date_to: str = None,
        delivery_date_from: str = None,
        delivery_date_to: str = None
    ):
        """Get all orders with pagination and optional filters."""
        try:
            query = select(Order).options(
                selectinload(Order.customer),
                selectinload(Order.equipment_type),
                selectinload(Order.status),
                selectinload(Order.stops).selectinload(Stop.address),
                selectinload(Order.stops).selectinload(Stop.stop_type),
                selectinload(Order.load),
                selectinload(Order.quotation)
            )
            
            # Apply filters
            if customer_id:
                query = query.where(Order.customer_id == customer_id)
            
            if status_ids:
                query = query.where(Order.status_id.in_(status_ids))
            
            if equipment_type_ids:
                query = query.where(Order.equipment_type_id.in_(equipment_type_ids))
            
            if pickup_date_from:
                query = query.where(Order.pickup_date >= pickup_date_from)
            
            if pickup_date_to:
                query = query.where(Order.pickup_date <= pickup_date_to)
            
            if delivery_date_from:
                query = query.where(Order.delivery_date >= delivery_date_from)
            
            if delivery_date_to:
                query = query.where(Order.delivery_date <= delivery_date_to)
            
            result = await session.execute(
                query
                .order_by(Order.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            orders = result.scalars().all()
            return orders
        except Exception as e:
            logger.error(f"Database error getting orders: {e}", exc_info=True)
            from core.exceptions import InternalServerException
            raise InternalServerException(
                user_message="Unable to load orders",
                dev_message=f"Database error in get_all_orders: {str(e)}"
            )
    
    @staticmethod
    async def get_orders_by_customer(session: AsyncSession, customer_id: int, skip: int = 0, limit: int = 100):
        """Get all orders for a specific customer."""
        try:
            # Verify customer exists
            customer_result = await session.execute(select(Customer).where(Customer.id == customer_id))
            customer = customer_result.scalar_one_or_none()
            
            if not customer:
                raise NotFoundException(
                    user_message=f"Customer #{customer_id} could not be found",
                    dev_message=f"Customer with id {customer_id} does not exist in database"
                )
            
            return await OrderService.get_all_orders(session, skip=skip, limit=limit, customer_id=customer_id)
        except (NotFoundException, InternalServerException):
            # Re-raise our custom exceptions as-is
            raise
        except Exception as e:
            logger.error(f"Error getting orders for customer {customer_id}: {e}", exc_info=True)
            from core.exceptions import InternalServerException
            raise InternalServerException(
                user_message="Unable to load customer orders",
                dev_message=f"Error in get_orders_by_customer({customer_id}): {str(e)}"
            )
    
    @staticmethod
    async def create_order(
        session: AsyncSession,
        customer_id: int,
        equipment_type_id: int,
        stops_data: list,
        load_data: dict = None,
        quotation_data: dict = None,
        bill_of_lading_number: str = None,
        shipment_id: str = None,
        bol_notes: str = None
    ) -> Order:
        """
        Create a new order with all related data in a single transaction.
        
        Args:
            session: Database session
            customer_id: ID of the customer
            equipment_type_id: ID of the equipment type
            stops_data: List of stop dictionaries with address data
            load_data: Optional load details
            quotation_data: Optional quotation details
            bill_of_lading_number: Optional BOL number
            shipment_id: Optional shipment ID
            bol_notes: Optional BOL notes
        
        Returns:
            Created Order instance with all relationships loaded
        """
        try:
            # Validate customer exists
            customer_result = await session.execute(select(Customer).where(Customer.id == customer_id))
            customer = customer_result.scalar_one_or_none()
            if not customer:
                raise BadRequestException(
                    user_message=f"Customer #{customer_id} not found",
                    dev_message=f"Customer with id {customer_id} does not exist"
                )
            
            # Validate equipment type exists
            equipment_result = await session.execute(select(EquipmentType).where(EquipmentType.id == equipment_type_id))
            equipment_type = equipment_result.scalar_one_or_none()
            if not equipment_type:
                raise BadRequestException(
                    user_message=f"Equipment type #{equipment_type_id} not found",
                    dev_message=f"Equipment type with id {equipment_type_id} does not exist"
                )
            
            # Get or create "CREATED" status
            status_result = await session.execute(select(OrderStatusType).where(OrderStatusType.name == "CREATED"))
            status = status_result.scalar_one_or_none()
            if not status:
                status = OrderStatusType(name="CREATED")
                session.add(status)
                await session.flush()
            
            # Extract pickup and delivery dates from stops, and find origin/destination cities for lane
            pickup_date = None
            delivery_date = None
            origin_city = None
            origin_state = None
            dest_city = None
            dest_state = None
            
            # Sort stops by sequence to get first pickup and last delivery
            sorted_stops = sorted(stops_data, key=lambda x: x.get("sequence_number", 0))
            
            for stop_data in sorted_stops:
                stop_type_name = stop_data.get("stop_type", "").upper()
                scheduled_early = stop_data.get("scheduled_arrival_early")
                address_data = stop_data.get("address", {})
                
                # Map DELIVERY to DROP for database compatibility
                if stop_type_name == "DELIVERY":
                    stop_type_name = "DROP"
                
                if stop_type_name == "PICKUP" and scheduled_early and not pickup_date:
                    pickup_date = scheduled_early
                    # Get origin city from first pickup
                    if not origin_city and address_data.get("city") and address_data.get("state"):
                        origin_city = address_data.get("city").upper()
                        origin_state = address_data.get("state").upper()
                
                if stop_type_name == "DROP" and scheduled_early:
                    delivery_date = scheduled_early  # Last delivery date will be final
                    # Get destination city from last delivery (will be overwritten until last one)
                    if address_data.get("city") and address_data.get("state"):
                        dest_city = address_data.get("city").upper()
                        dest_state = address_data.get("state").upper()
            
            # Find or create lane based on origin and destination
            lane_id = None
            if origin_city and origin_state and dest_city and dest_state:
                try:
                    # Try to find existing lane
                    lane_result = await session.execute(
                        select(Lane).where(
                            Lane.origin_city == origin_city,
                            Lane.origin_state == origin_state,
                            Lane.dest_city == dest_city,
                            Lane.dest_state == dest_state
                        )
                    )
                    lane = lane_result.scalar_one_or_none()
                    
                    if not lane:
                        # Create new lane if it doesn't exist
                        lane = Lane(
                            origin_city=origin_city,
                            origin_state=origin_state,
                            dest_city=dest_city,
                            dest_state=dest_state,
                            miles=None  # Will be calculated later if needed
                        )
                        session.add(lane)
                        await session.flush()
                        logger.info(f"Created new lane: {origin_city}, {origin_state} → {dest_city}, {dest_state}")
                    
                    lane_id = lane.id
                    
                    # Create lane history entry for this order (price will be set later by calculator)
                    lane_history = LaneHistory(
                        lane_id=lane.id,
                        order_id=None,  # Will be updated after order is created
                        base_rate=None,  # To be calculated by pricing engine
                        equipment_type=equipment_type.name if equipment_type else None,
                        miles=lane.miles,
                        effective_date=func.now()
                    )
                    session.add(lane_history)
                    
                except Exception as e:
                    logger.warning(f"Error handling lane: {e}. Order will be created without lane assignment.")
                    lane_id = None
            
            # Create the order with lane assignment
            order = Order(
                customer_id=customer_id,
                equipment_type_id=equipment_type_id,
                status_id=status.id,
                lane_id=lane_id,  # Assign the lane
                pickup_date=pickup_date,
                delivery_date=delivery_date,
                bill_of_lading_number=bill_of_lading_number,
                shipment_id=shipment_id,
                bol_notes=bol_notes
            )
            session.add(order)
            await session.flush()  # Get order ID
            
            # Update lane_history with order_id now that we have it
            if lane_id:
                try:
                    lane_history.order_id = order.id
                except:
                    pass  # Ignore if lane_history update fails
            
            # Create stops with addresses
            for stop_data in stops_data:
                # Create or find address
                address_data = stop_data.get("address", {})
                address = Address(
                    location_name=address_data.get("location_name"),
                    location_id=address_data.get("location_id"),
                    street=address_data.get("street"),
                    city=address_data.get("city"),
                    state=address_data.get("state"),
                    zip_code=address_data.get("zip_code"),
                    latitude=address_data.get("latitude"),
                    longitude=address_data.get("longitude")
                )
                session.add(address)
                await session.flush()  # Get address ID
                
                # Get stop type (map DELIVERY to DROP for database compatibility)
                stop_type_name = stop_data.get("stop_type", "PICKUP").upper()
                if stop_type_name == "DELIVERY":
                    stop_type_name = "DROP"
                
                stop_type_result = await session.execute(
                    select(StopTypeModel).where(StopTypeModel.name == stop_type_name)
                )
                stop_type = stop_type_result.scalar_one_or_none()
                if not stop_type:
                    raise BadRequestException(
                        user_message=f"Invalid stop type: {stop_data.get('stop_type')}",
                        dev_message=f"Stop type '{stop_type_name}' does not exist in database"
                    )
                
                # Create stop
                stop = Stop(
                    order_id=order.id,
                    address_id=address.id,
                    stop_type_id=stop_type.id,
                    sequence_number=stop_data.get("sequence_number"),
                    scheduled_arrival_early=stop_data.get("scheduled_arrival_early"),
                    scheduled_arrival_late=stop_data.get("scheduled_arrival_late")
                )
                session.add(stop)
            
            # Create load if provided
            if load_data:
                load = Load(
                    order_id=order.id,
                    weight_lbs=load_data.get("weight_lbs"),
                    commodity=load_data.get("commodity")
                )
                session.add(load)
            
            # Create quotation if provided
            if quotation_data:
                quotation = Quotation(
                    order_id=order.id,
                    miles=quotation_data.get("miles"),
                    rate=quotation_data.get("rate"),
                    currency=quotation_data.get("currency", "USD")
                )
                session.add(quotation)
            
            # Commit transaction
            await session.commit()
            
            # Reload order with all relationships
            order = await OrderService.get_order_by_id(session, order.id)
            
            return order
            
        except (NotFoundException, BadRequestException):
            await session.rollback()
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating order: {e}", exc_info=True)
            from core.exceptions import InternalServerException
            raise InternalServerException(
                user_message="Unable to create order",
                dev_message=f"Database error in create_order: {str(e)}"
            )
    
    @staticmethod
    async def assign_price_to_order(
        session: AsyncSession,
        order_id: int,
        base_rate: float,
        miles: int = None,
        rate_per_mile: float = None,
        weight_lbs: int = None,
        commodity: str = None,
        carrier_name: str = None,
        notes: str = None
    ) -> dict:
        """
        Assign a price to an order from the rate calculator and add it to lane history.
        
        Args:
            session: Database session
            order_id: ID of the order to price
            base_rate: The calculated price/rate for the order
            miles: Distance in miles
            rate_per_mile: Rate per mile (calculated as base_rate / miles)
            weight_lbs: Weight of the shipment
            commodity: Type of commodity
            carrier_name: Name of the carrier
            notes: Additional notes
        
        Returns:
            Dictionary with order and lane history information
        """
        try:
            # Get the order with relationships
            order = await OrderService.get_order_by_id(session, order_id)
            
            # Calculate rate per mile if not provided
            if not rate_per_mile and miles and miles > 0:
                rate_per_mile = base_rate / miles
            
            # Update or create quotation for the order
            if order.quotation:
                order.quotation.rate = base_rate
                order.quotation.miles = miles if miles else order.quotation.miles
            else:
                quotation = Quotation(
                    order_id=order_id,
                    miles=miles,
                    rate=base_rate,
                    currency="USD"
                )
                session.add(quotation)
            
            # If order has a lane, create/update lane history
            lane_history = None
            if order.lane_id:
                # Get equipment type name
                equipment_type_name = order.equipment_type.name if order.equipment_type else None
                
                # Get weight and commodity from load if not provided
                if not weight_lbs and order.load:
                    weight_lbs = order.load.weight_lbs
                if not commodity and order.load:
                    commodity = order.load.commodity
                
                # Create new lane history entry
                lane_history = LaneHistory(
                    lane_id=order.lane_id,
                    order_id=order_id,
                    base_rate=base_rate,
                    rate_per_mile=rate_per_mile,
                    equipment_type=equipment_type_name,
                    weight_lbs=weight_lbs,
                    commodity=commodity,
                    miles=miles,
                    carrier_name=carrier_name,
                    notes=notes,
                    effective_date=func.now()
                )
                session.add(lane_history)
                
                logger.info(f"Created lane history for order {order_id}, lane {order.lane_id}, rate ${base_rate}")
            else:
                logger.warning(f"Order {order_id} has no lane assigned, cannot create lane history")
            
            await session.commit()
            
            # Refresh to get the created IDs
            if lane_history:
                await session.refresh(lane_history)
            
            return {
                "success": True,
                "order_id": order_id,
                "lane_id": order.lane_id,
                "base_rate": base_rate,
                "rate_per_mile": rate_per_mile,
                "miles": miles,
                "lane_history_id": lane_history.id if lane_history else None,
                "message": "Price assigned successfully"
            }
            
        except NotFoundException:
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error assigning price to order {order_id}: {e}", exc_info=True)
            from core.exceptions import InternalServerException
            raise InternalServerException(
                user_message="Unable to assign price to order",
                dev_message=f"Error in assign_price_to_order({order_id}): {str(e)}"
            )

