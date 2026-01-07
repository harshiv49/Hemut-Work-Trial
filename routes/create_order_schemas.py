"""Pydantic schemas for order creation."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class AddressCreate(BaseModel):
    """Schema for creating an address within a stop."""
    location_name: str = Field(..., description="Name of the location")
    location_id: Optional[str] = Field(None, description="Location ID (auto-generated if empty)")
    street: Optional[str] = Field(None, description="Street address")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State code (e.g., IL, TX)")
    zip_code: str = Field(..., description="ZIP code")
    latitude: Optional[Decimal] = Field(None, description="Latitude coordinate")
    longitude: Optional[Decimal] = Field(None, description="Longitude coordinate")


class StopCreate(BaseModel):
    """Schema for creating a stop."""
    stop_type: str = Field(..., description="Stop type: PICKUP or DROP")
    sequence_number: int = Field(..., ge=1, description="Stop sequence number (1, 2, 3...)")
    address: AddressCreate = Field(..., description="Address details for this stop")
    scheduled_arrival_early: datetime = Field(..., description="Earliest scheduled arrival")
    scheduled_arrival_late: datetime = Field(..., description="Latest scheduled arrival")


class LoadCreate(BaseModel):
    """Schema for creating load details."""
    weight_lbs: Optional[int] = Field(None, description="Weight in pounds")
    commodity: Optional[str] = Field(None, description="Commodity description")


class QuotationCreate(BaseModel):
    """Schema for creating quotation details."""
    miles: Optional[int] = Field(None, description="Total miles")
    rate: Optional[Decimal] = Field(None, description="Rate in dollars")
    currency: str = Field(default="USD", description="Currency code")


class OrderCreate(BaseModel):
    """Schema for creating a new order."""
    customer_id: int = Field(..., description="Customer ID")
    equipment_type_id: int = Field(..., description="Equipment type ID")
    stops: List[StopCreate] = Field(..., min_length=1, description="List of stops (at least 1 required)")
    load: Optional[LoadCreate] = Field(None, description="Load details")
    quotation: Optional[QuotationCreate] = Field(None, description="Quotation details")
    bill_of_lading_number: Optional[str] = Field(None, description="Bill of Lading number")
    shipment_id: Optional[str] = Field(None, description="Shipment ID")
    bol_notes: Optional[str] = Field(None, description="BOL notes")

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
                            "city": "Chicago",
                            "state": "IL",
                            "zip_code": "60601"
                        },
                        "scheduled_arrival_early": "2025-12-23T08:00:00",
                        "scheduled_arrival_late": "2025-12-23T17:00:00"
                    }
                ],
                "load": {
                    "weight_lbs": 22000,
                    "commodity": "General Freight"
                },
                "quotation": {
                    "miles": 500,
                    "rate": "1500.00"
                }
            }
        }

