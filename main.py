from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.config import settings
from core.logging import setup_logging, get_logger
from core.exceptions import global_exception_handler
from schemas import init_db
from routes import user_router
from routes.customer_routes import router as customer_router
from routes.order_routes import router as order_router
from routes.equipment_routes import router as equipment_router
from routes.lane_routes import router as lane_router

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown."""
    try:
        # Startup
        logger.info("Starting application...")
        await init_db()
        logger.info("Database initialized")
        yield
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise
    finally:
        # Shutdown
        try:
            logger.info("Shutting down application...")
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")


# Create FastAPI app
app = FastAPI(
    title="FastAPI Backend",
    description="FastAPI backend with async routes and SQLAlchemy",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add global exception handler
app.add_exception_handler(Exception, global_exception_handler)

# Include routers
app.include_router(user_router)
app.include_router(customer_router)
app.include_router(order_router)
app.include_router(equipment_router)
app.include_router(lane_router)


@app.get("/", tags=["health"])
async def health_check():
    """Health check endpoint."""
    try:
        return {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        raise


if __name__ == "__main__":
    import uvicorn
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level=settings.LOG_LEVEL.lower()
        )
    except Exception as e:
        logger.error(f"Error running application: {e}")
        raise

