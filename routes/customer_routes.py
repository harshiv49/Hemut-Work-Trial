from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.database import get_session
from service.customer_service import CustomerService
from routes.schemas import CustomerResponse, CustomerListResponse
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/", response_model=CustomerListResponse)
async def get_customers(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    session: AsyncSession = Depends(get_session)
):
    """
    Get all customers with pagination.
    
    Returns dual error messages on failure:
        - user_message: Friendly message for frontend
        - dev_message: Technical details for debugging
    """
    customers = await CustomerService.get_all_customers(session, skip=skip, limit=limit)
    return CustomerListResponse(
        customers=[CustomerResponse.model_validate(c) for c in customers],
        total=len(customers),
        skip=skip,
        limit=limit
    )


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Get a customer by ID.
    
    Returns dual error messages on failure:
        - user_message: Friendly message for frontend
        - dev_message: Technical details for debugging
    """
    customer = await CustomerService.get_customer_by_id(session, customer_id)
    return CustomerResponse.model_validate(customer)

