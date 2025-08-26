"""
Supabase integration for Telegram Bot
Handles database operations and API calls to Supabase
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List
import aiohttp
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class SupabaseManager:
    """Manages Supabase database operations and API calls"""
    
    def __init__(self):
        from config import Config
        self.config = Config()
        self.supabase_config = self.config.get_supabase_config()
        self.headers = {
            'apikey': self.supabase_config['service_role_key'],
            'Authorization': f"Bearer {self.supabase_config['service_role_key']}",
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        self.base_url = self.supabase_config['url']
    
    async def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make HTTP request to Supabase API"""
        url = f"{self.base_url}/rest/v1/{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method, 
                    url, 
                    headers=self.headers,
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status in [200, 201, 204]:
                        if response.content_length and response.content_length > 0:
                            return await response.json()
                        return {}
                    else:
                        error_text = await response.text()
                        logger.error(f"Supabase API error {response.status}: {error_text}")
                        return None
                        
        except asyncio.TimeoutError:
            logger.error(f"Timeout making request to {endpoint}")
            return None
        except Exception as e:
            logger.error(f"Error making request to {endpoint}: {e}")
            return None
    
    async def _call_rpc(self, function_name: str, params: Dict) -> Optional[Any]:
        """Call Supabase RPC function"""
        url = f"{self.base_url}/rest/v1/rpc/{function_name}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    headers=self.headers,
                    json=params,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        error_text = await response.text()
                        logger.error(f"RPC function {function_name} error {response.status}: {error_text}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error calling RPC function {function_name}: {e}")
            return None
    
    async def call_edge_function(self, function_name: str, payload: Dict) -> Optional[Dict]:
        """Call Supabase Edge Function"""
        url = f"{self.base_url}/functions/v1/{function_name}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    headers=self.headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=300)  # 5 minutes for file operations
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        error_text = await response.text()
                        logger.error(f"Edge function {function_name} error {response.status}: {error_text}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error calling edge function {function_name}: {e}")
            return None
    
    # User and Profile Management
    async def get_profile_by_telegram_id(self, telegram_user_id: int) -> Optional[Dict]:
        """Get user profile by Telegram user ID"""
        endpoint = f"profiles?telegram_user_id=eq.{telegram_user_id}&select=*"
        result = await self._make_request('GET', endpoint)
        return result[0] if result and len(result) > 0 else None
    
    async def update_profile_telegram_data(self, user_id: str, telegram_user_id: int, 
                                         telegram_username: str, telegram_chat_id: int) -> bool:
        """Update profile with Telegram data"""
        data = {
            'telegram_user_id': telegram_user_id,
            'telegram_username': telegram_username,
            'telegram_chat_id': telegram_chat_id,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        endpoint = f"profiles?id=eq.{user_id}"
        result = await self._make_request('PATCH', endpoint, data)
        return result is not None
    
    async def is_telegram_admin(self, telegram_user_id: int) -> bool:
        """Check if Telegram user is an admin"""
        try:
            result = await self._call_rpc('is_telegram_admin', {
                'telegram_user_id_param': telegram_user_id
            })
            return result if result is not None else False
        except Exception as e:
            logger.error(f"Error checking admin status: {e}")
            return False
    
    async def is_premium_user(self, user_id: str) -> bool:
        """Check if user has premium subscription"""
        try:
            result = await self._call_rpc('check_user_premium_status', {
                'user_id_param': user_id
            })
            return result if result is not None else False
        except Exception as e:
            logger.error(f"Error checking premium status: {e}")
            return False
    
    # Premium Groups Management
    async def is_premium_group_with_autoupload(self, chat_id: int) -> bool:
        """Check if chat is premium group with auto-upload enabled"""
        try:
            result = await self._call_rpc('is_premium_group_with_autoupload', {
                'chat_id_param': chat_id
            })
            return result if result is not None else False
        except Exception as e:
            logger.error(f"Error checking premium group status: {e}")
            return False
    
    async def add_premium_group(self, chat_id: int, chat_title: str, admin_id: str) -> bool:
        """Add premium group for auto-upload"""
        data = {
            'chat_id': chat_id,
            'chat_title': chat_title,
            'added_by_admin_id': admin_id,
            'auto_upload_enabled': True
        }
        
        endpoint = "premium_groups"
        result = await self._make_request('POST', endpoint, data)
        return result is not None
    
    async def get_premium_groups(self) -> List[Dict]:
        """Get list of premium groups"""
        endpoint = "premium_groups?auto_upload_enabled=eq.true&select=*"
        result = await self._make_request('GET', endpoint)
        return result if result else []
    
    # Telegram Upload Tracking
    async def log_telegram_upload(self, telegram_data: Dict) -> Optional[str]:
        """Log Telegram file upload attempt"""
        data = {
            'telegram_chat_id': telegram_data['chat_id'],
            'telegram_user_id': telegram_data['user_id'],
            'telegram_message_id': telegram_data['message_id'],
            'telegram_file_id': telegram_data['file_id'],
            'telegram_file_unique_id': telegram_data['file_unique_id'],
            'original_filename': telegram_data.get('filename'),
            'file_size': telegram_data.get('file_size'),
            'mime_type': telegram_data.get('mime_type'),
            'upload_status': 'pending'
        }
        
        endpoint = "telegram_uploads"
        result = await self._make_request('POST', endpoint, data)
        return result[0]['id'] if result and len(result) > 0 else None
    
    async def update_telegram_upload_status(self, upload_id: str, status: str, 
                                          doodstream_file_code: Optional[str] = None,
                                          video_id: Optional[str] = None,
                                          error_message: Optional[str] = None) -> bool:
        """Update Telegram upload status"""
        data = {
            'upload_status': status,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        if doodstream_file_code:
            data['doodstream_file_code'] = doodstream_file_code
        if video_id:
            data['video_id'] = video_id
        if error_message:
            data['error_message'] = error_message
        if status == 'completed':
            data['processed_at'] = datetime.utcnow().isoformat()
        
        endpoint = f"telegram_uploads?id=eq.{upload_id}"
        result = await self._make_request('PATCH', endpoint, data)
        return result is not None
    
    # Doodstream Integration
    async def upload_to_doodstream(self, file_path: str, title: str) -> Optional[Dict]:
        """Upload file to Doodstream via edge function"""
        # This would use the existing doodstream-api edge function
        # For now, we'll call it with file data
        try:
            # Read file and prepare for upload
            with open(file_path, 'rb') as f:
                # Note: For large files, we might need to implement chunked upload
                # This is a simplified version
                logger.info(f"Uploading {file_path} to Doodstream...")
                
                # Call the existing doodstream-api edge function
                result = await self.call_edge_function('doodstream-api', {
                    'action': 'upload',
                    'title': title
                    # File handling would need to be implemented based on the edge function
                })
                
                return result
                
        except Exception as e:
            logger.error(f"Error uploading to Doodstream: {e}")
            return None
    
    async def sync_doodstream_videos(self) -> Optional[Dict]:
        """Sync videos from Doodstream to database"""
        return await self.call_edge_function('doodstream-api', {'action': 'syncVideos'})
    
    # Link Code Management
    async def create_telegram_link_code(self, telegram_user_id: int, telegram_username: str) -> Optional[str]:
        """Create a link code for Telegram account linking"""
        data = {
            'telegram_user_id': telegram_user_id,
            'telegram_username': telegram_username,
            'code': self._generate_link_code()
        }
        
        endpoint = "telegram_link_codes"
        result = await self._make_request('POST', endpoint, data)
        return result[0]['code'] if result and len(result) > 0 else None
    
    def _generate_link_code(self) -> str:
        """Generate a random link code"""
        import random
        import string
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    # Upload Failures Management
    async def log_upload_failure(self, video_id: Optional[str], upload_type: str, error_details: Dict) -> bool:
        """Log upload failure for admin review"""
        data = {
            'video_id': video_id,
            'upload_type': upload_type,
            'error_details': error_details,
            'requires_manual_upload': True
        }
        
        endpoint = "upload_failures"
        result = await self._make_request('POST', endpoint, data)
        return result is not None