from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.sql import func
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
    
    @staticmethod
    async def search_customers(session: AsyncSession, query: str, skip: int = 0, limit: int = 100):
        """
        Search customers by name using full-text search.
        
        Args:
            session: Database session
            query: Search query string (searches in customer name)
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of matching customers
        """
        try:
            if not query or not query.strip():
                # Return empty list if query is empty
                return []
            
            search_term = f"%{query.strip()}%"
            
            # Case-insensitive LIKE search (works with SQLite and PostgreSQL)
            # SQLite: LIKE is case-insensitive for ASCII by default
            # For better cross-database support, use UPPER() or LOWER()
            result = await session.execute(
                select(Customer)
                .where(
                    func.upper(Customer.name).like(func.upper(search_term))
                )
                .order_by(Customer.name.asc())
                .offset(skip)
                .limit(limit)
            )
            customers = result.scalars().all()
            return customers
        except Exception as e:
            logger.error(f"Database error searching customers: {e}", exc_info=True)
            raise InternalServerException(
                user_message="Unable to search customers",
                dev_message=f"Database error in search_customers(query='{query}', skip={skip}, limit={limit}): {str(e)}"
            )

