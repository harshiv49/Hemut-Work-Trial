from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import joinedload
from schemas.database import get_session
from schemas.models import LaneHistory, Lane
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lanes", tags=["lanes"])


class LaneHistoryResponse(BaseModel):
    """Response model for lane history."""
    id: int
    origin_city: str
    origin_state: str
    dest_city: str
    dest_state: str
    equipment_type: Optional[str] = None
    miles: Optional[int] = None
    rate: Decimal
    rate_per_mile: Optional[Decimal] = None
    weight_lbs: Optional[int] = None
    commodity: Optional[str] = None
    shipment_date: Optional[datetime] = None
    carrier_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class LaneStatistics(BaseModel):
    """Statistical summary for a lane."""
    avg_rate: Decimal
    min_rate: Decimal
    max_rate: Decimal
    avg_rate_per_mile: Optional[Decimal] = None
    total_shipments: int
    recent_shipments: int  # Last 30 days


@router.get("/history", response_model=List[LaneHistoryResponse])
async def get_lane_history(
    origin_city: str = Query(..., description="Origin city"),
    origin_state: str = Query(..., description="Origin state"),
    dest_city: str = Query(..., description="Destination city"),
    dest_state: str = Query(..., description="Destination state"),
    equipment_type: Optional[str] = Query(None, description="Filter by equipment type"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of records to return"),
    session: AsyncSession = Depends(get_session)
):
    """
    Get historical rate data for a specific lane (origin to destination pair).
    Returns most recent shipments first.
    """
    try:
        # First find the lane
        lane_result = await session.execute(
            select(Lane).where(
                and_(
                    func.upper(Lane.origin_city) == origin_city.upper(),
                    func.upper(Lane.origin_state) == origin_state.upper(),
                    func.upper(Lane.dest_city) == dest_city.upper(),
                    func.upper(Lane.dest_state) == dest_state.upper()
                )
            )
        )
        lane = lane_result.scalar_one_or_none()
        
        if not lane:
            return []
        
        # Now query lane history for this lane
        query = select(LaneHistory).where(LaneHistory.lane_id == lane.id)
        
        if equipment_type:
            query = query.where(func.lower(LaneHistory.equipment_type) == equipment_type.lower())
        
        result = await session.execute(
            query
            .order_by(LaneHistory.effective_date.desc())
            .limit(limit)
        )
        
        history_records = result.scalars().all()
        
        # Build response with lane info included
        responses = []
        for record in history_records:
            responses.append(LaneHistoryResponse(
                id=record.id,
                origin_city=lane.origin_city,
                origin_state=lane.origin_state,
                dest_city=lane.dest_city,
                dest_state=lane.dest_state,
                equipment_type=record.equipment_type,
                miles=record.miles,
                rate=record.base_rate or Decimal('0'),
                rate_per_mile=record.rate_per_mile,
                weight_lbs=record.weight_lbs,
                commodity=record.commodity,
                shipment_date=record.effective_date,
                carrier_name=record.carrier_name,
                created_at=record.created_at
            ))
        
        return responses
        
    except Exception as e:
        logger.error(f"Error getting lane history: {e}", exc_info=True)
        return []


@router.get("/statistics", response_model=LaneStatistics)
async def get_lane_statistics(
    origin_city: str = Query(..., description="Origin city"),
    origin_state: str = Query(..., description="Origin state"),
    dest_city: str = Query(..., description="Destination city"),
    dest_state: str = Query(..., description="Destination state"),
    equipment_type: Optional[str] = Query(None, description="Filter by equipment type"),
    session: AsyncSession = Depends(get_session)
):
    """
    Get statistical summary for a specific lane.
    Includes average, min, max rates and shipment counts.
    """
    try:
        from datetime import datetime, timedelta
        
        query_filter = and_(
            func.upper(LaneHistory.origin_city) == origin_city.upper(),
            func.upper(LaneHistory.origin_state) == origin_state.upper(),
            func.upper(LaneHistory.dest_city) == dest_city.upper(),
            func.upper(LaneHistory.dest_state) == dest_state.upper()
        )
        
        if equipment_type:
            query_filter = and_(
                query_filter,
                func.lower(LaneHistory.equipment_type) == equipment_type.lower()
            )
        
        # Get overall statistics
        result = await session.execute(
            select(
                func.avg(LaneHistory.rate).label('avg_rate'),
                func.min(LaneHistory.rate).label('min_rate'),
                func.max(LaneHistory.rate).label('max_rate'),
                func.avg(LaneHistory.rate_per_mile).label('avg_rate_per_mile'),
                func.count(LaneHistory.id).label('total_shipments')
            ).where(query_filter)
        )
        
        stats = result.one()
        
        # Get recent shipments count (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_result = await session.execute(
            select(func.count(LaneHistory.id))
            .where(
                and_(
                    query_filter,
                    LaneHistory.shipment_date >= thirty_days_ago
                )
            )
        )
        recent_count = recent_result.scalar() or 0
        
        return LaneStatistics(
            avg_rate=Decimal(str(stats.avg_rate or 0)),
            min_rate=Decimal(str(stats.min_rate or 0)),
            max_rate=Decimal(str(stats.max_rate or 0)),
            avg_rate_per_mile=Decimal(str(stats.avg_rate_per_mile or 0)) if stats.avg_rate_per_mile else None,
            total_shipments=stats.total_shipments or 0,
            recent_shipments=recent_count
        )
        
    except Exception as e:
        logger.error(f"Error getting lane statistics: {e}", exc_info=True)
        return LaneStatistics(
            avg_rate=Decimal('0'),
            min_rate=Decimal('0'),
            max_rate=Decimal('0'),
            avg_rate_per_mile=None,
            total_shipments=0,
            recent_shipments=0
        )

