from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.database import get_session
from routes.schemas import EquipmentTypeResponse, EquipmentTypeListResponse
from sqlalchemy import select
from sqlalchemy.sql import func
from schemas.models import EquipmentType
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/equipment-types", tags=["equipment-types"])


@router.get("/", response_model=EquipmentTypeListResponse)
async def get_equipment_types(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    session: AsyncSession = Depends(get_session)
):
    """
    Get all equipment types with pagination.
    
    Returns:
        - List of equipment types
    """
    try:
        result = await session.execute(
            select(EquipmentType)
            .order_by(EquipmentType.name)
            .offset(skip)
            .limit(limit)
        )
        equipment_types = result.scalars().all()
        
        return EquipmentTypeListResponse(
            equipment_types=[EquipmentTypeResponse.model_validate(et) for et in equipment_types],
            total=len(equipment_types),
            skip=skip,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error fetching equipment types: {e}", exc_info=True)
        from core.exceptions import InternalServerException
        raise InternalServerException(
            user_message="Unable to load equipment types",
            dev_message=f"Database error in get_equipment_types: {str(e)}"
        )


@router.get("/query", response_model=EquipmentTypeListResponse)
async def search_equipment_types(
    q: str = Query(..., min_length=1, description="Search query (equipment type name or description)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    session: AsyncSession = Depends(get_session)
):
    """
    Search equipment types by name or description using full-text search.
    
    Returns:
        - user_message: Friendly error message if search fails
        - dev_message: Technical details for debugging
    """
    try:
        if not q or not q.strip():
            return EquipmentTypeListResponse(
                equipment_types=[],
                total=0,
                skip=skip,
                limit=limit
            )
        
        search_term = f"%{q.strip()}%"
        
        # Case-insensitive LIKE search on name and description
        result = await session.execute(
            select(EquipmentType)
            .where(
                (func.upper(EquipmentType.name).like(func.upper(search_term))) |
                (func.upper(EquipmentType.description).like(func.upper(search_term)))
            )
            .order_by(EquipmentType.name.asc())
            .offset(skip)
            .limit(limit)
        )
        equipment_types = result.scalars().all()
        
        return EquipmentTypeListResponse(
            equipment_types=[EquipmentTypeResponse.model_validate(et) for et in equipment_types],
            total=len(equipment_types),
            skip=skip,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error searching equipment types: {e}", exc_info=True)
        from core.exceptions import InternalServerException
        raise InternalServerException(
            user_message="Unable to search equipment types",
            dev_message=f"Database error in search_equipment_types(query='{q}'): {str(e)}"
        )

