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
        """Get active admin telegram accounts"""
        try:
            result = self.client.table('admin_telegram_users').select('*').eq('is_active', True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting admin telegram accounts: {e}")
            return []

    async def is_user_admin(self, telegram_user_id: int) -> bool:
        """Check if telegram user is admin using RPC"""
        try:
            result = self.client.rpc('is_telegram_admin', {'telegram_user_id_param': telegram_user_id}).execute()
            return result.data if result.data is not None else False
        except Exception as e:
            logger.error(f"Error checking admin status for {telegram_user_id}: {e}")
            return False

    async def check_duplicate_upload(self, file_unique_id: str) -> bool:
        """Check if file was already uploaded"""
        try:
            result = self.client.table('telegram_uploads').select('id').eq('telegram_file_unique_id', file_unique_id).execute()
            return len(result.data) > 0 if result.data else False
        except Exception as e:
            logger.error(f"Error checking duplicate upload: {e}")
            return False

    async def update_upload_with_video_id(self, upload_id: str, video_id: str):
        """Update telegram upload record with video_id reference"""
        try:
            self.client.table('telegram_uploads').update({'video_id': video_id}).eq('id', upload_id).execute()
        except Exception as e:
            logger.error(f"Error updating upload with video_id: {e}")

    async def log_upload_failure(self, failure_data: dict) -> Optional[str]:
        """Log upload failure for admin review"""
        try:
            result = self.client.table('upload_failures').insert(failure_data).execute()
            return result.data[0]['id'] if result.data else None
        except Exception as e:
            logger.error(f"Error logging upload failure: {e}")
            return None

    async def store_admin_notification(self, notification_data: dict):
        """Store admin notification (placeholder for future notification system)"""
        try:
            # For now, just log the notification
            # In the future, this could store in a notifications table
            logger.info(f"Admin notification: {notification_data['type']} - {notification_data['title']}")
        except Exception as e:
            logger.error(f"Error storing admin notification: {e}")

    async def get_comprehensive_stats(self) -> Dict:
        """Get comprehensive statistics for admin dashboard"""
        try:
            stats = {}
            
            # Upload statistics (last 7 days)
            from datetime import datetime, timedelta
            week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            
            uploads_result = self.client.table('telegram_uploads').select('*').gte('created_at', week_ago).execute()
            uploads = uploads_result.data or []
            
            stats['total_uploads'] = len(uploads)
            stats['successful_uploads'] = len([u for u in uploads if u.get('upload_status') == 'completed'])
            stats['failed_uploads'] = len([u for u in uploads if u.get('upload_status') == 'failed'])
            stats['processing_uploads'] = len([u for u in uploads if u.get('upload_status') == 'processing'])
            
            stats['success_rate'] = (stats['successful_uploads'] / stats['total_uploads'] * 100) if stats['total_uploads'] > 0 else 0
            
            # File statistics
            total_size = sum(u.get('file_size', 0) for u in uploads if u.get('file_size'))
            stats['total_size_gb'] = total_size / (1024 * 1024 * 1024)
            stats['avg_size_mb'] = (total_size / len(uploads) / (1024 * 1024)) if uploads else 0
            
            # Group statistics
            groups_result = self.client.table('premium_groups').select('*').eq('auto_upload_enabled', True).execute()
            stats['active_groups'] = len(groups_result.data) if groups_result.data else 0
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting comprehensive stats: {e}")
            return {}

    async def get_recent_failures(self) -> list:
        """Get recent upload failures"""
        try:
            result = self.client.table('upload_failures').select('*').order('created_at', desc=True).limit(20).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting recent failures: {e}")
            return []