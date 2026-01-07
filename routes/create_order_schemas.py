from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime


class AddressCreate(BaseModel):
    """Schema for creating an address."""
    location_name: Optional[str] = None
    location_id: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class StopCreate(BaseModel):
    """Schema for creating a stop."""
    stop_type: str = Field(..., description="PICKUP or DELIVERY")
    sequence_number: int = Field(..., ge=1, description="Stop sequence number (1, 2, 3, ...)")
    address: AddressCreate
    scheduled_arrival_early: Optional[datetime] = None
    scheduled_arrival_late: Optional[datetime] = None
    
    @validator('stop_type')
    def validate_stop_type(cls, v):
        """Validate stop type is PICKUP or DELIVERY."""
        allowed = ['PICKUP', 'DELIVERY']
        if v.upper() not in allowed:
            raise ValueError(f"stop_type must be one of {allowed}")
        return v.upper()


class LoadCreate(BaseModel):
    """Schema for creating load details."""
    weight_lbs: Optional[int] = Field(None, ge=0, description="Weight in pounds")
    commodity: Optional[str] = Field(None, max_length=255, description="Commodity description")


class QuotationCreate(BaseModel):
    """Schema for creating a quotation."""
    miles: Optional[int] = Field(None, ge=0, description="Total miles")
    rate: Optional[float] = Field(None, ge=0, description="Rate amount")
    currency: Optional[str] = Field("USD", max_length=3, description="Currency code (USD, EUR, etc.)")


class OrderCreate(BaseModel):
    """Schema for creating a new order."""
    customer_id: int = Field(..., gt=0, description="ID of the customer")
    equipment_type_id: int = Field(..., gt=0, description="ID of the equipment type")
    stops: List[StopCreate] = Field(..., min_items=2, description="At least 2 stops required (pickup and delivery)")
    load: Optional[LoadCreate] = None
    quotation: Optional[QuotationCreate] = None
    bill_of_lading_number: Optional[str] = Field(None, max_length=100, description="Bill of Lading number")
    shipment_id: Optional[str] = Field(None, max_length=100, description="Shipment ID")
    bol_notes: Optional[str] = Field(None, max_length=1000, description="Bill of Lading notes")
    
    @validator('stops')
    def validate_stops(cls, v):
        """Ensure stops have sequential numbering."""
        if len(v) < 2:
            raise ValueError("At least 2 stops required (pickup and delivery)")
        
        sequences = [stop.sequence_number for stop in v]
        if len(sequences) != len(set(sequences)):
            raise ValueError("Stop sequence numbers must be unique")
        
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "customer_id": 1,
                "equipment_type_id": 1,
                "stops": [
                    {
                        "stop_type": "PICKUP",
                        "sequence_number": 1,
                        "address": {
                            "location_name": "Warehouse A",
                            "street": "123 Main St",
                            "city": "New York",
                            "state": "NY",
                            "zip_code": "10001",
                            "latitude": 40.7128,
                            "longitude": -74.0060
                        },
                        "scheduled_arrival_early": "2024-01-15T08:00:00",
                        "scheduled_arrival_late": "2024-01-15T12:00:00"
                    },
                    {
                        "stop_type": "DELIVERY",
                        "sequence_number": 2,
                        "address": {
                            "location_name": "Distribution Center B",
                            "street": "456 Oak Ave",
                            "city": "Los Angeles",
                            "state": "CA",
                            "zip_code": "90001",
                            "latitude": 34.0522,
                            "longitude": -118.2437
                        },
                        "scheduled_arrival_early": "2024-01-17T08:00:00",
                        "scheduled_arrival_late": "2024-01-17T17:00:00"
                    }
                ],
                "load": {
                    "weight_lbs": 45000,
                    "commodity": "Electronics"
                },
                "quotation": {
                    "miles": 2800,
                    "rate": 5600.00,
                    "currency": "USD"
                },
                "bill_of_lading_number": "BOL-2024-001",
                "shipment_id": "SHIP-2024-001",
                "bol_notes": "Fragile items - handle with care"
            }
        }
