"""
Logging setup for Telegram User Bot
"""

import logging
import logging.handlers
import os
from pathlib import Path

def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """Setup logging configuration"""
    
    # Create logs directory
    log_dir = Path("/opt/telegram-userbot/logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            # Console handler
            logging.StreamHandler(),
            # File handler with rotation
            logging.handlers.RotatingFileHandler(
                log_dir / "userbot.log",
                maxBytes=10 * 1024 * 1024,  # 10MB
                backupCount=5
            )
        ]
    )
    
    # Set specific logger levels
    logging.getLogger("pyrogram").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    
    logger = logging.getLogger("telegram_userbot")
    logger.info("🔧 Logging setup completed")
    
    return logger