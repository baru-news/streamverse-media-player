"""
Logging configuration for Telegram Bot
Sets up structured logging with file and console output
"""

import logging
import logging.handlers
import os
import sys
from pathlib import Path
from datetime import datetime

def setup_logging():
    """Set up logging configuration"""
    
    # Create logs directory
    log_dir = Path('/opt/telegram-bot/logs')
    log_dir.mkdir(parents=True, exist_ok=True, mode=0o755)
    
    # Log level from environment
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    simple_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(simple_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler - rotating logs
    file_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'telegram_bot.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = logging.handlers.RotatingFileHandler(
        log_dir / 'telegram_bot_errors.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=3
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(error_handler)
    
    # Pyrogram logger (more verbose)
    pyrogram_logger = logging.getLogger('pyrogram')
    pyrogram_logger.setLevel(logging.WARNING)  # Reduce Pyrogram verbosity
    
    # AsyncIO logger
    asyncio_logger = logging.getLogger('asyncio')
    asyncio_logger.setLevel(logging.WARNING)
    
    # HTTP libraries
    logging.getLogger('aiohttp').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    
    # Initial log message
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized - Level: {log_level}")
    logger.info(f"Log files: {log_dir}")
    
    return logger

def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(name)