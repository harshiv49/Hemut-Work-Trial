from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from schemas.database import Base


class BaseModel(Base):
    """Base model with common fields."""
    
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# =========================
# Freight Marketplace Models
# =========================


class OrderStatusType(BaseModel):
    __tablename__ = "order_status_types"
    name = Column(String, unique=True, index=True, nullable=False)

    # Orders using this status
    orders = relationship("Order", back_populates="status")

    def __repr__(self):
        return f"<OrderStatusType(name='{self.name}')>"


class StopTypeModel(BaseModel):
    __tablename__ = "stop_types"
    name = Column(String, unique=True, index=True, nullable=False)

    # Stops using this type
    stops = relationship("Stop", back_populates="stop_type")

    def __repr__(self):
        return f"<StopTypeModel(name='{self.name}')>"

# End legacy Enum classes


class Customer(BaseModel):
    __tablename__ = "customers"

    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)

    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")


class EquipmentType(BaseModel):
    __tablename__ = "equipment_types"

    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    orders = relationship("Order", back_populates="equipment_type")


class Address(BaseModel):
    __tablename__ = "addresses"

    location_name = Column(String, nullable=True)
    street = Column(String, nullable=True)
    city = Column(String, index=True, nullable=True)
    state = Column(String, nullable=True)
    zip_code = Column(String, index=True, nullable=True)
    latitude = Column(Numeric(10, 7), index=True, nullable=True)
    longitude = Column(Numeric(10, 7), index=True, nullable=True)

    stops = relationship("Stop", back_populates="address")


class Order(BaseModel):
    __tablename__ = "orders"

    customer_id = Column(Integer, ForeignKey("customers.id"), index=True, nullable=False)
    equipment_type_id = Column(Integer, ForeignKey("equipment_types.id"), index=True, nullable=False)
    status_id = Column(Integer, ForeignKey("order_status_types.id"), index=True, nullable=False)

    customer = relationship("Customer", back_populates="orders")
    equipment_type = relationship("EquipmentType", back_populates="orders")
    status = relationship("OrderStatusType", back_populates="orders")
    stops = relationship("Stop", back_populates="order", cascade="all, delete-orphan")
    load = relationship("Load", back_populates="order", uselist=False, cascade="all, delete-orphan")
    quotation = relationship("Quotation", back_populates="order", uselist=False, cascade="all, delete-orphan")


class Stop(BaseModel):
    __tablename__ = "stops"
    __table_args__ = (
        UniqueConstraint("order_id", "sequence_number", name="uq_stops_order_sequence"),
    )

    order_id = Column(Integer, ForeignKey("orders.id"), index=True, nullable=False)
    address_id = Column(Integer, ForeignKey("addresses.id"), index=True, nullable=False)
    stop_type_id = Column(Integer, ForeignKey("stop_types.id"), index=True, nullable=False)
    sequence_number = Column(Integer, nullable=False)
    scheduled_arrival_early = Column(DateTime(timezone=True), nullable=True)
    scheduled_arrival_late = Column(DateTime(timezone=True), nullable=True)

    order = relationship("Order", back_populates="stops")
    address = relationship("Address", back_populates="stops")
    stop_type = relationship("StopTypeModel", back_populates="stops")


class Load(BaseModel):
    __tablename__ = "loads"

    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, index=True, nullable=False)
    weight_lbs = Column(Integer, nullable=True)
    commodity = Column(String, nullable=True)

    order = relationship("Order", back_populates="load")


class Quotation(BaseModel):
    __tablename__ = "quotations"

    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, index=True, nullable=False)
    miles = Column(Integer, nullable=True)
    rate = Column(Numeric(12, 2), nullable=True)
    currency = Column(String, nullable=True, default="USD")

    order = relationship("Order", back_populates="quotation")


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

