from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Union
import logging

logger = logging.getLogger(__name__)


class BaseAPIException(HTTPException):
    """Base exception for API errors."""
    
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(BaseAPIException):
    """Exception for resource not found errors."""
    
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)


class BadRequestException(BaseAPIException):
    """Exception for bad request errors."""
    
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=400, detail=detail)


class UnauthorizedException(BaseAPIException):
    """Exception for unauthorized errors."""
    
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status_code=401, detail=detail)


class ForbiddenException(BaseAPIException):
    """Exception for forbidden errors."""
    
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=403, detail=detail)


class InternalServerException(BaseAPIException):
    """Exception for internal server errors."""
    
    def __init__(self, detail: str = "Internal server error"):
        super().__init__(status_code=500, detail=detail)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for all unhandled exceptions."""
    try:
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        
        if isinstance(exc, HTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail}
            )
        
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    except Exception as e:
        logger.error(f"Error in exception handler: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

