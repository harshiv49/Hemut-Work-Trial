from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from schemas.models import User
from core.exceptions import NotFoundException, BadRequestException
import logging

logger = logging.getLogger(__name__)


class UserService:
    """Service layer for User operations."""
    
    @staticmethod
    async def get_user_by_id(session: AsyncSession, user_id: int) -> User:
        """Get a user by ID."""
        try:
            result = await session.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if not user:
                raise NotFoundException(f"User with id {user_id} not found")
            
            return user
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error getting user by id: {e}")
            raise
    
    @staticmethod
    async def get_user_by_email(session: AsyncSession, email: str) -> User:
        """Get a user by email."""
        try:
            result = await session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            
            if not user:
                raise NotFoundException(f"User with email {email} not found")
            
            return user
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            raise
    
    @staticmethod
    async def get_all_users(session: AsyncSession, skip: int = 0, limit: int = 100):
        """Get all users with pagination."""
        try:
            result = await session.execute(select(User).offset(skip).limit(limit))
            users = result.scalars().all()
            return users
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            raise
    
    @staticmethod
    async def create_user(session: AsyncSession, email: str, username: str, full_name: str = None) -> User:
        """Create a new user."""
        try:
            # Check if user already exists
            existing_user = await session.execute(
                select(User).where((User.email == email) | (User.username == username))
            )
            if existing_user.scalar_one_or_none():
                raise BadRequestException("User with this email or username already exists")
            
            user = User(email=email, username=username, full_name=full_name)
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            return user
        except BadRequestException:
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating user: {e}")
            raise
    
    @staticmethod
    async def update_user(session: AsyncSession, user_id: int, **kwargs) -> User:
        """Update a user."""
        try:
            user = await UserService.get_user_by_id(session, user_id)
            
            for key, value in kwargs.items():
                if hasattr(user, key) and value is not None:
                    setattr(user, key, value)
            
            await session.commit()
            await session.refresh(user)
            
            return user
        except NotFoundException:
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error updating user: {e}")
            raise
    
    @staticmethod
    async def delete_user(session: AsyncSession, user_id: int) -> bool:
        """Delete a user."""
        try:
            user = await UserService.get_user_by_id(session, user_id)
            await session.delete(user)
            await session.commit()
            return True
        except NotFoundException:
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error deleting user: {e}")
            raise

