"""
Configuration for Telegram User Bot
"""

import os
from pathlib import Path
from typing import Optional

class Config:
    """Configuration class for Telegram User Bot"""
    
    def __init__(self):
        # Required Telegram API credentials (NOT Bot Token!)
        self.TELEGRAM_API_ID: int = int(os.getenv('TELEGRAM_API_ID', '0'))
        self.TELEGRAM_API_HASH: str = os.getenv('TELEGRAM_API_HASH', '')
        self.TELEGRAM_PHONE_NUMBER: str = os.getenv('TELEGRAM_PHONE_NUMBER', '')
        
        # Supabase Configuration
        self.SUPABASE_URL: str = os.getenv('SUPABASE_URL', 'https://agsqdznjjxptiyorljtv.supabase.co')
        self.SUPABASE_SERVICE_ROLE_KEY: str = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
        self.SUPABASE_ANON_KEY: str = os.getenv('SUPABASE_ANON_KEY', '')
        
        # Doodstream API Keys
        self.DOODSTREAM_API_KEY: str = os.getenv('DOODSTREAM_API_KEY', '')
        self.DOODSTREAM_PREMIUM_API_KEY: str = os.getenv('DOODSTREAM_PREMIUM_API_KEY', '')
        
        # Bot Settings
        self.SESSION_DIR: str = os.getenv('SESSION_DIR', '/opt/telegram-userbot/sessions')
        self.DOWNLOAD_DIR: str = os.getenv('DOWNLOAD_DIR', '/opt/telegram-userbot/downloads')
        self.LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
        self.MAX_FILE_SIZE: int = int(os.getenv('MAX_FILE_SIZE', '2147483648'))  # 2GB
        
        # Create directories
        Path(self.SESSION_DIR).mkdir(parents=True, exist_ok=True)
        Path(self.DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)
        
    def validate(self) -> bool:
        """Validate required configuration"""
        required_fields = [
            ('TELEGRAM_API_ID', self.TELEGRAM_API_ID),
            ('TELEGRAM_API_HASH', self.TELEGRAM_API_HASH),
            ('TELEGRAM_PHONE_NUMBER', self.TELEGRAM_PHONE_NUMBER),
            ('SUPABASE_URL', self.SUPABASE_URL),
            ('SUPABASE_SERVICE_ROLE_KEY', self.SUPABASE_SERVICE_ROLE_KEY),
            ('DOODSTREAM_API_KEY', self.DOODSTREAM_API_KEY)
        ]
        
        missing_fields = []
        for field_name, field_value in required_fields:
            if not field_value or (isinstance(field_value, int) and field_value == 0):
                missing_fields.append(field_name)
        
        if missing_fields:
            print(f"❌ Missing required configuration: {', '.join(missing_fields)}")
            print("📝 Please check your .env file")
            return False
            
        return True
        
    def __str__(self) -> str:
        """String representation (hide sensitive data)"""
        return f"""
Telegram User Bot Configuration:
- API ID: {self.TELEGRAM_API_ID}
- API Hash: {'*' * len(self.TELEGRAM_API_HASH) if self.TELEGRAM_API_HASH else 'NOT SET'}
- Phone: {self.TELEGRAM_PHONE_NUMBER}
- Supabase URL: {self.SUPABASE_URL}
- Service Key: {'SET' if self.SUPABASE_SERVICE_ROLE_KEY else 'NOT SET'}
- Doodstream Key: {'SET' if self.DOODSTREAM_API_KEY else 'NOT SET'}
- Session Dir: {self.SESSION_DIR}
- Download Dir: {self.DOWNLOAD_DIR}
- Max File Size: {self.MAX_FILE_SIZE / 1024 / 1024:.0f}MB
"""