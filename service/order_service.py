from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from schemas.models import Order, Customer, Stop, Address, StopTypeModel
from core.exceptions import NotFoundException
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

