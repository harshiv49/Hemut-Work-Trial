from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
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
    location_id = Column(String, nullable=True)  # Auto-generated if empty
    street = Column(String, nullable=True)
    city = Column(String, index=True, nullable=True)
    state = Column(String, nullable=True)
    zip_code = Column(String, index=True, nullable=True)
    latitude = Column(Numeric(10, 7), index=True, nullable=True)
    longitude = Column(Numeric(10, 7), index=True, nullable=True)

    stops = relationship("Stop", back_populates="address")


class Lane(BaseModel):
    """Shipping lanes representing routes between origin and destination cities."""
    
    __tablename__ = "lanes"
    __table_args__ = (
        UniqueConstraint("origin_city", "origin_state", "dest_city", "dest_state", name="uq_lanes_origin_dest"),
        Index("ix_lanes_origin", "origin_city", "origin_state"),
        Index("ix_lanes_dest", "dest_city", "dest_state"),
    )
    
    origin_city = Column(String, nullable=False, index=True)
    origin_state = Column(String, nullable=False, index=True)
    dest_city = Column(String, nullable=False, index=True)
    dest_state = Column(String, nullable=False, index=True)
    
    # Approximate distance (can be updated from route calculations)
    miles = Column(Integer, nullable=True)
    
    # Relationships
    orders = relationship("Order", back_populates="lane")
    lane_history = relationship("LaneHistory", back_populates="lane", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Lane({self.origin_city}, {self.origin_state} → {self.dest_city}, {self.dest_state})>"


class Order(BaseModel):
    __tablename__ = "orders"
    __table_args__ = (
        # Descending index on created_at for efficient sorting in list views
        Index("ix_orders_created_desc", "created_at", postgresql_using="btree", postgresql_ops={"created_at": "DESC"}),
    )

    customer_id = Column(Integer, ForeignKey("customers.id"), index=True, nullable=False)
    equipment_type_id = Column(Integer, ForeignKey("equipment_types.id"), index=True, nullable=False)
    status_id = Column(Integer, ForeignKey("order_status_types.id"), index=True, nullable=False)
    lane_id = Column(Integer, ForeignKey("lanes.id"), index=True, nullable=True)  # Assigned lane for pricing
    
    # Shipping dates (derived from stops but stored for easy access and querying)
    pickup_date = Column(DateTime(timezone=True), nullable=True, index=True)
    delivery_date = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Reference numbers
    bill_of_lading_number = Column(String, nullable=True)
    shipment_id = Column(String, nullable=True)
    
    # Notes
    bol_notes = Column(String, nullable=True)

    customer = relationship("Customer", back_populates="orders")
    equipment_type = relationship("EquipmentType", back_populates="orders")
    status = relationship("OrderStatusType", back_populates="orders")
    lane = relationship("Lane", back_populates="orders")
    stops = relationship("Stop", back_populates="order", cascade="all, delete-orphan")
    load = relationship("Load", back_populates="order", uselist=False, cascade="all, delete-orphan")
    quotation = relationship("Quotation", back_populates="order", uselist=False, cascade="all, delete-orphan")
    tracking_events = relationship("TrackingEvent", back_populates="order", cascade="all, delete-orphan")


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
class TrackingEvent(BaseModel):
    """Tracking events for order status updates."""
    
    __tablename__ = "tracking_events"
    
    order_id = Column(Integer, ForeignKey("orders.id"), index=True, nullable=False)
    status = Column(String, nullable=False, index=True)  # DEPARTED, IN_TRANSIT, ARRIVED, etc.
    location = Column(String, nullable=True)  # Current location
    description = Column(String, nullable=True)  # Additional details
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)  # Event timestamp
    
    order = relationship("Order", back_populates="tracking_events")
    
    def __repr__(self):
        return f"<TrackingEvent(order_id={self.order_id}, status='{self.status}', timestamp='{self.timestamp}')>"


class LaneHistory(BaseModel):
    """Historical pricing data for lanes - tracks rate changes over time."""
    
    __tablename__ = "lane_history"
    __table_args__ = (
        Index("ix_lane_history_lane_effective", "lane_id", "effective_date"),
    )
    
    lane_id = Column(Integer, ForeignKey("lanes.id"), index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True, nullable=True)  # Order that triggered this price
    
    # Pricing information
    base_rate = Column(Numeric(12, 2), nullable=True)  # Base price for the lane (can be null if not yet calculated)
    rate_per_mile = Column(Numeric(8, 2), nullable=True)  # Calculated rate per mile
    
    # Context for the pricing
    equipment_type = Column(String, nullable=True)  # Van, Flatbed, etc.
    weight_lbs = Column(Integer, nullable=True)
    commodity = Column(String, nullable=True)
    miles = Column(Integer, nullable=True)
    
    # Temporal information
    effective_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    # Additional metadata
    carrier_name = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    
    # Relationships
    lane = relationship("Lane", back_populates="lane_history")
    
    def __repr__(self):
        return f"<LaneHistory(lane_id={self.lane_id}, base_rate=${self.base_rate}, effective_date={self.effective_date})>"


class User(BaseModel):
    """Example User model with role field."""
    
    __tablename__ = "users"
    
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    role = Column(String, nullable=True, default="user")  # New role field

