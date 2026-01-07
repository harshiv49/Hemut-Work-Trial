import logging
import sys
from core.config import settings


def setup_logging():
    """Configure logging for the application."""
    try:
        log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
        
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        # Set specific loggers
        logging.getLogger("uvicorn").setLevel(log_level)
        logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
        
    except Exception as e:
        print(f"Error setting up logging: {e}")
        raise


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance."""
    try:
        return logging.getLogger(name)
    except Exception as e:
        print(f"Error getting logger: {e}")
        raise

