"""
Supabase Client for Telegram User Bot
"""

import logging
from typing import Optional, Dict, Any
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class SupabaseManager:
    def __init__(self):
        from config import Config
        self.config = Config()
        
        self.client: Optional[Client] = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize Supabase client"""
        try:
            self.client = create_client(
                self.config.SUPABASE_URL,
                self.config.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("✅ Supabase client initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Supabase client: {e}")
            raise

    async def test_connection(self) -> bool:
        """Test Supabase connection"""
        try:
            # Try to fetch one record from profiles table
            result = self.client.table('profiles').select('id').limit(1).execute()
            logger.info("✅ Supabase connection test successful")
            return True
        except Exception as e:
            logger.error(f"❌ Supabase connection test failed: {e}")
            return False

    async def get_premium_groups(self) -> list:
        """Get all premium groups with auto-upload enabled"""
        try:
            result = self.client.table('premium_groups').select('*').eq('auto_upload_enabled', True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting premium groups: {e}")
            return []

    async def log_upload(self, upload_data: Dict[str, Any]) -> Optional[str]:
        """Log upload to database"""
        try:
            result = self.client.table('telegram_uploads').insert(upload_data).execute()
            if result.data:
                return result.data[0]['id']
            return None
        except Exception as e:
            logger.error(f"Error logging upload: {e}")
            return None

    async def update_upload_status(self, upload_id: str, status: str, error_message: Optional[str] = None):
        """Update upload status"""
        try:
            update_data = {
                'upload_status': status,
                'processed_at': 'now()'
            }
            
            if error_message:
                update_data['error_message'] = error_message
            
            self.client.table('telegram_uploads').update(update_data).eq('id', upload_id).execute()
            
        except Exception as e:
            logger.error(f"Error updating upload status: {e}")

    async def create_video_record(self, video_data: Dict[str, Any]) -> Optional[str]:
        """Create video record in database"""
        try:
            result = self.client.table('videos').insert(video_data).execute()
            if result.data:
                return result.data[0]['id']
            return None
        except Exception as e:
            logger.error(f"Error creating video record: {e}")
            return None

    async def get_user_profile_by_telegram(self, telegram_user_id: int) -> Optional[Dict]:
        """Get user profile by Telegram ID"""
        try:
            result = self.client.table('profiles').select('*').eq('telegram_user_id', telegram_user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return None

    async def get_admin_telegram_accounts(self) -> list:
        """Get all active admin Telegram accounts"""
        try:
            result = self.client.table('admin_telegram_users').select('*').eq('is_active', True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting admin telegram accounts: {e}")
            return []