"""Pydantic schemas for API request/response models."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# Address schemas
class AddressResponse(BaseModel):
    id: int
    location_name: Optional[str]
    street: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[str]
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Stop Type schemas
class StopTypeResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Stop schemas
class StopResponse(BaseModel):
    id: int
    order_id: int
    address_id: int
    stop_type_id: int
    sequence_number: int
    scheduled_arrival_early: Optional[datetime]
    scheduled_arrival_late: Optional[datetime]
    address: Optional[AddressResponse] = None
    stop_type: Optional[StopTypeResponse] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Load schemas
class LoadResponse(BaseModel):
    id: int
    order_id: int
    weight_lbs: Optional[int]
    commodity: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Quotation schemas
class QuotationResponse(BaseModel):
    id: int
    order_id: int
    miles: Optional[int]
    rate: Optional[Decimal]
    currency: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Customer schemas
class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Equipment Type schemas
class EquipmentTypeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Order Status Type schemas
class OrderStatusTypeResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Order schemas
class OrderResponse(BaseModel):
    id: int
    customer_id: int
    equipment_type_id: int
    status_id: int
    customer: Optional[CustomerResponse] = None
    equipment_type: Optional[EquipmentTypeResponse] = None
    status: Optional[OrderStatusTypeResponse] = None
    stops: Optional[List[StopResponse]] = None
    load: Optional[LoadResponse] = None
    quotation: Optional[QuotationResponse] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# List response schemas
class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    skip: int
    limit: int


class CustomerListResponse(BaseModel):
    customers: List[CustomerResponse]
    total: int
    skip: int
    limit: int

