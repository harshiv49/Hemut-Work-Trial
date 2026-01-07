from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Union, Optional
import logging

logger = logging.getLogger(__name__)


class BaseAPIException(HTTPException):
    """
    Base exception for API errors with dual messaging:
    - user_message: Friendly message for frontend display
    - dev_message: Technical details for API caller/debugging
    """
    
    def __init__(
        self, 
        status_code: int, 
        user_message: str, 
        dev_message: Optional[str] = None
    ):
        self.user_message = user_message
        self.dev_message = dev_message or user_message
        
        # FastAPI detail field used for API response
        detail = {
            "user_message": self.user_message,
            "dev_message": self.dev_message
        }
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(BaseAPIException):
    """Exception for resource not found errors."""
    
    def __init__(
        self, 
        user_message: str = "The item you're looking for could not be found",
        dev_message: Optional[str] = None
    ):
        super().__init__(
            status_code=404, 
            user_message=user_message,
            dev_message=dev_message or "Resource not found in database"
        )


class BadRequestException(BaseAPIException):
    """Exception for bad request errors."""
    
    def __init__(
        self, 
        user_message: str = "Invalid request. Please check your input",
        dev_message: Optional[str] = None
    ):
        super().__init__(
            status_code=400, 
            user_message=user_message,
            dev_message=dev_message or "Bad request - invalid parameters"
        )


class UnauthorizedException(BaseAPIException):
    """Exception for unauthorized errors."""
    
    def __init__(
        self, 
        user_message: str = "Please log in to continue",
        dev_message: Optional[str] = None
    ):
        super().__init__(
            status_code=401, 
            user_message=user_message,
            dev_message=dev_message or "Unauthorized - authentication required"
        )


class ForbiddenException(BaseAPIException):
    """Exception for forbidden errors."""
    
    def __init__(
        self, 
        user_message: str = "You don't have permission to access this resource",
        dev_message: Optional[str] = None
    ):
        super().__init__(
            status_code=403, 
            user_message=user_message,
            dev_message=dev_message or "Forbidden - insufficient permissions"
        )


class InternalServerException(BaseAPIException):
    """Exception for internal server errors."""
    
    def __init__(
        self, 
        user_message: str = "Something went wrong. Please try again later",
        dev_message: Optional[str] = None
    ):
        super().__init__(
            status_code=500, 
            user_message=user_message,
            dev_message=dev_message or "Internal server error"
        )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler for all unhandled exceptions.
    Returns structured error response with user and dev messages.
    """
    try:
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        
        # Handle our custom exceptions with dual messaging
        if isinstance(exc, BaseAPIException):
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "user_message": exc.user_message,
                    "dev_message": exc.dev_message
                }
            )
        
        # Handle standard HTTPException
        if isinstance(exc, HTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "user_message": "An error occurred",
                    "dev_message": str(exc.detail)
                }
            )
        
        # Handle all other unexpected exceptions
        return JSONResponse(
            status_code=500,
            content={
                "user_message": "Something went wrong. Please try again later",
                "dev_message": f"Internal server error: {str(exc)}"
            }
        )
    except Exception as e:
        logger.error(f"Error in exception handler: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "user_message": "A critical error occurred",
                "dev_message": "Exception handler failed"
            }
        )

