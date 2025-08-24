"""
Configuration management for Telegram Bot
Handles environment variables and settings
"""

import os
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class Config:
    """Configuration class for the Telegram bot"""
    
    def __init__(self):
        self.load_config()
    
    def load_config(self):
        """Load configuration from environment variables"""
        
        # Telegram API credentials
        self.API_ID = self._get_env_int('TELEGRAM_API_ID')
        self.API_HASH = self._get_env('TELEGRAM_API_HASH')
        self.PHONE_NUMBER = self._get_env('TELEGRAM_PHONE_NUMBER')
        
        # Bot settings
        self.SESSION_DIR = self._get_env('SESSION_DIR', '/opt/telegram-bot/sessions')
        self.DOWNLOAD_DIR = self._get_env('DOWNLOAD_DIR', '/opt/telegram-bot/downloads')
        self.LOG_LEVEL = self._get_env('LOG_LEVEL', 'INFO')
        self.MAX_FILE_SIZE = self._get_env_int('MAX_FILE_SIZE', 2147483648)  # 2GB default
        
        # Supabase configuration
        self.SUPABASE_URL = self._get_env('SUPABASE_URL', 'https://agsqdznjjxptiyorljtv.supabase.co')
        self.SUPABASE_SERVICE_ROLE_KEY = self._get_env('SUPABASE_SERVICE_ROLE_KEY')
        self.SUPABASE_ANON_KEY = self._get_env('SUPABASE_ANON_KEY')
        
        # Doodstream configuration
        self.DOODSTREAM_API_KEY = self._get_env('DOODSTREAM_API_KEY')
        self.DOODSTREAM_PREMIUM_API_KEY = self._get_env('DOODSTREAM_PREMIUM_API_KEY')
        
        # Create necessary directories
        self._create_directories()
        
        # Validate required configuration
        self._validate_config()
    
    def _get_env(self, key: str, default: Optional[str] = None) -> str:
        """Get environment variable with optional default"""
        value = os.getenv(key, default)
        if value is None:
            raise ValueError(f"Required environment variable {key} is not set")
        return value
    
    def _get_env_int(self, key: str, default: Optional[int] = None) -> int:
        """Get environment variable as integer with optional default"""
        value = os.getenv(key)
        if value is None:
            if default is not None:
                return default
            raise ValueError(f"Required environment variable {key} is not set")
        
        try:
            return int(value)
        except ValueError:
            raise ValueError(f"Environment variable {key} must be a valid integer")
    
    def _create_directories(self):
        """Create necessary directories if they don't exist"""
        directories = [
            self.SESSION_DIR,
            self.DOWNLOAD_DIR,
            '/opt/telegram-bot/logs'
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True, mode=0o755)
            logger.debug(f"Directory ensured: {directory}")
    
    def _validate_config(self):
        """Validate required configuration"""
        required_vars = [
            ('TELEGRAM_API_ID', self.API_ID),
            ('TELEGRAM_API_HASH', self.API_HASH),
            ('TELEGRAM_PHONE_NUMBER', self.PHONE_NUMBER),
            ('SUPABASE_SERVICE_ROLE_KEY', self.SUPABASE_SERVICE_ROLE_KEY),
            ('DOODSTREAM_API_KEY', self.DOODSTREAM_API_KEY)
        ]
        
        missing_vars = []
        for var_name, var_value in required_vars:
            if not var_value:
                missing_vars.append(var_name)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        logger.info("Configuration validated successfully")
    
    def get_supabase_config(self) -> dict:
        """Get Supabase configuration dictionary"""
        return {
            'url': self.SUPABASE_URL,
            'service_role_key': self.SUPABASE_SERVICE_ROLE_KEY,
            'anon_key': self.SUPABASE_ANON_KEY
        }
    
    def get_doodstream_config(self) -> dict:
        """Get Doodstream configuration dictionary"""
        return {
            'api_key': self.DOODSTREAM_API_KEY,
            'premium_api_key': self.DOODSTREAM_PREMIUM_API_KEY
        }
    
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.LOG_LEVEL.upper() == 'DEBUG'
    
    def __str__(self) -> str:
        """String representation of config (without sensitive data)"""
        return f"""
Telegram Bot Configuration:
- API ID: {self.API_ID}
- Phone: {self.PHONE_NUMBER[:3]}***{self.PHONE_NUMBER[-3:] if self.PHONE_NUMBER else 'Not set'}
- Session Dir: {self.SESSION_DIR}
- Download Dir: {self.DOWNLOAD_DIR}
- Log Level: {self.LOG_LEVEL}
- Max File Size: {self.MAX_FILE_SIZE / (1024**3):.1f} GB
- Supabase URL: {self.SUPABASE_URL}
        """.strip()