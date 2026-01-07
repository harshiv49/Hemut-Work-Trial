from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from schemas.models import Customer
from core.exceptions import NotFoundException, InternalServerException
import logging

logger = logging.getLogger(__name__)


class CustomerService:
    """Service layer for Customer operations."""
    
    @staticmethod
    async def get_customer_by_id(session: AsyncSession, customer_id: int) -> Customer:
        """Get a customer by ID."""
        try:
            result = await session.execute(select(Customer).where(Customer.id == customer_id))
            customer = result.scalar_one_or_none()
            
            if not customer:
                raise NotFoundException(
                    user_message=f"Customer #{customer_id} could not be found",
                    dev_message=f"Customer with id {customer_id} does not exist in database"
                )
            
            return customer
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Database error getting customer {customer_id}: {e}", exc_info=True)
            raise InternalServerException(
                user_message="Unable to load customer details",
                dev_message=f"Database error in get_customer_by_id({customer_id}): {str(e)}"
            )
    
    @staticmethod
    async def get_all_customers(session: AsyncSession, skip: int = 0, limit: int = 100):
        """Get all customers with pagination."""
        try:
            result = await session.execute(
                select(Customer)
                .offset(skip)
                .limit(limit)
                .order_by(Customer.created_at.desc())
            )
            customers = result.scalars().all()
            return customers
        except Exception as e:
            logger.error(f"Database error getting customers: {e}", exc_info=True)
            raise InternalServerException(
                user_message="Unable to load customers",
                dev_message=f"Database error in get_all_customers(skip={skip}, limit={limit}): {str(e)}"
            )

