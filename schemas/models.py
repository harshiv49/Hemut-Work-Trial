from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from schemas.database import Base


class BaseModel(Base):
    """Base model with common fields."""
    
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# Example model - you can add more models here
class User(BaseModel):
    """Example User model with role field."""
    
    __tablename__ = "users"
    
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    role = Column(String, nullable=True, default="user")  # New role field

