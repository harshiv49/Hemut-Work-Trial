from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.database import get_session
from service.user_service import UserService
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


# Pydantic schemas for request/response
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session)
):
    """Get all users with pagination."""
    try:
        users = await UserService.get_all_users(session, skip=skip, limit=limit)
        return users
    except Exception as e:
        logger.error(f"Error in get_users endpoint: {e}")
        raise


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get a user by ID."""
    try:
        user = await UserService.get_user_by_id(session, user_id)
        return user
    except Exception as e:
        logger.error(f"Error in get_user endpoint: {e}")
        raise


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_session)
):
    """Create a new user."""
    try:
        user = await UserService.create_user(
            session,
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name
        )
        return user
    except Exception as e:
        logger.error(f"Error in create_user endpoint: {e}")
        raise


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    session: AsyncSession = Depends(get_session)
):
    """Update a user."""
    try:
        update_data = user_data.model_dump(exclude_unset=True)
        user = await UserService.update_user(session, user_id, **update_data)
        return user
    except Exception as e:
        logger.error(f"Error in update_user endpoint: {e}")
        raise


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Delete a user."""
    try:
        await UserService.delete_user(session, user_id)
        return None
    except Exception as e:
        logger.error(f"Error in delete_user endpoint: {e}")
        raise

