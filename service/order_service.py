from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from schemas.models import (
    Order, Customer, Stop, Address, StopTypeModel, 
    EquipmentType, OrderStatusType, Load, Quotation
)
from core.exceptions import NotFoundException, BadRequestException
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
    async def get_all_orders(session: AsyncSession, skip: int = 0, limit: int = 100, customer_id: int = None):
        """Get all orders with pagination and optional customer filter."""
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
            
            if customer_id:
                query = query.where(Order.customer_id == customer_id)
            
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
                dev_message=f"Database error in get_all_orders(skip={skip}, limit={limit}, customer_id={customer_id}): {str(e)}"
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
            
            # Create the order
            order = Order(
                customer_id=customer_id,
                equipment_type_id=equipment_type_id,
                status_id=status.id,
                bill_of_lading_number=bill_of_lading_number,
                shipment_id=shipment_id,
                bol_notes=bol_notes
            )
            session.add(order)
            await session.flush()  # Get order ID
            
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
                
                # Get stop type
                stop_type_name = stop_data.get("stop_type", "PICKUP")
                stop_type_result = await session.execute(
                    select(StopTypeModel).where(StopTypeModel.name == stop_type_name)
                )
                stop_type = stop_type_result.scalar_one_or_none()
                if not stop_type:
                    raise BadRequestException(
                        user_message=f"Invalid stop type: {stop_type_name}",
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

