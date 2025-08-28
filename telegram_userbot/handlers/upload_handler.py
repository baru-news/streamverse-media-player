"""
Enhanced Upload Handler for Telegram User Bot - Phase 2
Handles video uploads from premium groups to Doodstream with advanced filtering, retry logic, and notifications
"""

import asyncio
import logging
import secrets
import string
import re
import json
import httpx
from datetime import datetime
from typing import Optional, Dict, Any
from pyrogram import Client
from pyrogram.types import Message
from utils.supabase_client import SupabaseManager

logger = logging.getLogger(__name__)

class UploadHandler:
    def __init__(self, supabase: SupabaseManager):
        self.supabase = supabase
        
        # Supported video formats
        self.supported_video_formats = {
            'video/mp4', 'video/avi', 'video/mkv', 'video/mov', 
            'video/wmv', 'video/flv', 'video/webm', 'video/m4v',
            'video/3gp', 'video/3gpp', 'video/quicktime'
        }
        
        # Supported video extensions
        self.supported_video_extensions = {
            '.mp4', '.avi', '.mkv', '.mov', '.wmv', 
            '.flv', '.webm', '.m4v', '.3gp', '.qt'
        }

    async def handle_group_upload(self, client: Client, message: Message):
        """Handle group upload messages with enhanced filtering"""
        try:
            # Enhanced message filtering
            if not await self._validate_message_context(client, message):
                return
                
            # Check if sender is admin
            if not await self._is_sender_admin(message.from_user.id):
                logger.info(f"Upload ignored - sender {message.from_user.id} is not admin")
                return
            
            # Check if group is premium with auto-upload enabled
            if not await self.is_premium_group(message.chat.id):
                logger.info(f"Upload ignored - group {message.chat.id} not premium or auto-upload disabled")
                return
            
            # Get file information with enhanced validation
            file_info = await self._get_file_info_enhanced(message)
            if not file_info:
                logger.warning("No valid file found in message or validation failed")
                return
                
            # Enhanced duration validation with content type check
            if not await self._validate_file_criteria(file_info):
                return
            
            # React to show processing
            await message.react("⏳")
            
            # Process the upload with enhanced tracking
            success = await self._process_group_upload_enhanced(client, message, file_info)
            
            if success:
                logger.info("Group upload completed successfully")
                await message.react("✅")
                await self._notify_admin_success(file_info, message.chat.title or "Unknown Group")
            else:
                logger.error("Group upload failed")
                await message.react("❌")
                
        except Exception as e:
            logger.error(f"Error in handle_group_upload: {e}")
            try:
                await message.react("❌")
            except:
                pass
            # Enhanced error notification with context
            await self._notify_admin_of_failure(
                file_info.get('original_name', 'Unknown file') if 'file_info' in locals() else "Unknown file", 
                f"Upload handler error: {str(e)}",
                {
                    'chat_id': message.chat.id,
                    'chat_title': message.chat.title,
                    'user_id': message.from_user.id,
                    'message_id': message.id
                }
            )

    async def _validate_message_context(self, client: Client, message: Message) -> bool:
        """Enhanced message context validation"""
        try:
            # Basic checks
            if not message.from_user:
                logger.debug("Message has no sender info")
                return False
                
            if not message.chat:
                logger.debug("Message has no chat info")
                return False
                
            # Check if bot has proper permissions in the group
            try:
                chat_member = await client.get_chat_member(message.chat.id, (await client.get_me()).id)
                if not chat_member or chat_member.status in ['kicked', 'left']:
                    logger.warning(f"Bot not properly joined in chat {message.chat.id}")
                    return False
            except Exception as e:
                logger.warning(f"Cannot check bot permissions in chat {message.chat.id}: {e}")
                # Continue processing even if we can't check permissions
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating message context: {e}")
            return False

    async def _is_sender_admin(self, telegram_user_id: int) -> bool:
        """Check if sender is admin using Supabase RPC"""
        try:
            result = await self.supabase.is_user_admin(telegram_user_id)
            return result
        except Exception as e:
            logger.error(f"Error checking admin status for user {telegram_user_id}: {e}")
            return False

    async def is_premium_group(self, chat_id: int) -> bool:
        """Check if chat is premium group with auto-upload enabled using Supabase RPC"""
        try:
            result = self.supabase.client.rpc('is_premium_group_with_autoupload', {'chat_id_param': chat_id}).execute()
            return result.data if result.data is not None else False
        except Exception as e:
            logger.error(f"Error checking premium group status for {chat_id}: {e}")
            return False

    async def _get_file_info_enhanced(self, message: Message) -> Optional[Dict]:
        """Extract file information from message with enhanced validation"""
        try:
            file_info = None
            
            if message.video:
                video = message.video
                file_info = {
                    'file_id': video.file_id,
                    'file_unique_id': video.file_unique_id,
                    'file_size': video.file_size,
                    'mime_type': video.mime_type,
                    'duration': video.duration,
                    'original_name': video.file_name or f"video_{video.file_unique_id}.mp4",
                    'file_type': 'video',
                    'width': getattr(video, 'width', 0),
                    'height': getattr(video, 'height', 0),
                    'thumbnail': getattr(video, 'thumbs', None)
                }
            
            elif message.document:
                document = message.document
                
                # Enhanced video document detection
                if self._is_video_document(document):
                    file_info = {
                        'file_id': document.file_id,
                        'file_unique_id': document.file_unique_id,
                        'file_size': document.file_size,
                        'mime_type': document.mime_type,
                        'duration': getattr(document, 'duration', 0),
                        'original_name': document.file_name or f"document_{document.file_unique_id}",
                        'file_type': 'document'
                    }
            
            # Enhanced file processing
            if file_info:
                file_info['random_filename'] = self._generate_random_filename(file_info['original_name'])
                file_info['upload_timestamp'] = message.date.isoformat() if message.date else None
                file_info['file_size_mb'] = round(file_info['file_size'] / (1024 * 1024), 2) if file_info['file_size'] else 0
                
                # Check for duplicate uploads
                if await self._is_duplicate_upload(file_info['file_unique_id']):
                    logger.info(f"Duplicate upload detected: {file_info['file_unique_id']}")
                    return None
                
            return file_info
            
        except Exception as e:
            logger.error(f"Error getting enhanced file info: {e}")
            return None

    def _is_video_document(self, document) -> bool:
        """Enhanced video document detection"""
        try:
            # Check MIME type
            if document.mime_type and document.mime_type.lower() in self.supported_video_formats:
                return True
                
            # Check file extension
            if document.file_name:
                file_ext = '.' + document.file_name.lower().split('.')[-1] if '.' in document.file_name else ''
                if file_ext in self.supported_video_extensions:
                    return True
                    
            return False
            
        except Exception as e:
            logger.error(f"Error checking if document is video: {e}")
            return False

    async def _validate_file_criteria(self, file_info: Dict) -> bool:
        """Enhanced file criteria validation"""
        try:
            # Duration validation (must be > 60 seconds)
            duration = file_info.get('duration', 0)
            if duration <= 60:
                logger.info(f"File rejected - duration {duration}s <= 60s threshold: {file_info['original_name']}")
                return False
            
            # File size validation (reasonable limits)
            file_size_mb = file_info.get('file_size_mb', 0)
            if file_size_mb > 2048:  # 2GB limit
                logger.info(f"File rejected - size {file_size_mb}MB exceeds 2GB limit: {file_info['original_name']}")
                return False
                
            if file_size_mb < 1:  # 1MB minimum
                logger.info(f"File rejected - size {file_size_mb}MB below 1MB minimum: {file_info['original_name']}")
                return False
            
            # Resolution validation (if available)
            if 'width' in file_info and 'height' in file_info:
                if file_info['width'] < 240 or file_info['height'] < 240:
                    logger.info(f"File rejected - resolution {file_info['width']}x{file_info['height']} too low: {file_info['original_name']}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating file criteria: {e}")
            return False

    async def _is_duplicate_upload(self, file_unique_id: str) -> bool:
        """Check if file was already uploaded"""
        try:
            result = await self.supabase.check_duplicate_upload(file_unique_id)
            return result
        except Exception as e:
            logger.error(f"Error checking duplicate upload: {e}")
            return False

    def _generate_random_filename(self, original_name: str) -> str:
        """Generate random filename to avoid conflicts"""
        try:
            # Generate random string
            random_string = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            
            # Clean original name
            clean_name = re.sub(r'[^\w\-_\.]', '_', original_name)
            clean_name = re.sub(r'_{2,}', '_', clean_name)
            
            # Get file extension
            if '.' in clean_name:
                name_part, ext_part = clean_name.rsplit('.', 1)
                return f"{random_string}_{name_part}.{ext_part}"
            else:
                return f"{random_string}_{clean_name}"
                
        except Exception as e:
            logger.error(f"Error generating random filename: {e}")
            return f"upload_{secrets.token_hex(6)}"

    async def _process_group_upload_enhanced(self, client: Client, message: Message, file_info: Dict) -> bool:
        """Process group upload to Doodstream with enhanced tracking and retry logic"""
        upload_id = None
        try:
            # Generate filename with enhanced metadata
            filename = file_info['random_filename']
            
            # Enhanced upload logging with metadata
            upload_data = {
                'telegram_file_id': file_info['file_id'],
                'telegram_file_unique_id': file_info['file_unique_id'],
                'telegram_chat_id': message.chat.id,
                'telegram_user_id': message.from_user.id,
                'telegram_message_id': message.id,
                'original_filename': file_info['original_name'],
                'file_size': file_info['file_size'],
                'mime_type': file_info['mime_type'],
                'upload_status': 'processing'
            }
            
            upload_id = await self.supabase.log_upload(upload_data)
            if not upload_id:
                logger.error("Failed to log upload to database")
                await self._log_upload_failure(file_info, "Database logging failed")
                return False
            
            # Stream upload to Doodstream with retry mechanism
            doodstream_result = await self._stream_to_doodstream_with_retry(client, message, file_info, filename, upload_id)
            
            if doodstream_result and doodstream_result.get('success'):
                # Update upload status to completed
                await self._update_upload_status(upload_id, 'completed', file_code=doodstream_result.get('file_code'))
                
                # Create video record in database with enhanced metadata
                video_id = await self._create_video_record_enhanced(file_info, doodstream_result, message, upload_id)
                
                if video_id:
                    logger.info(f"Successfully created video record: {video_id}")
                    
                    # Update telegram upload with video_id reference
                    await self.supabase.update_upload_with_video_id(upload_id, video_id)
                    
                    return True
                else:
                    logger.error("Failed to create video record")
                    await self._update_upload_status(upload_id, 'failed', error_message="Failed to create video record")
                    await self._log_upload_failure(file_info, "Video record creation failed", upload_id)
                    return False
            else:
                error_msg = doodstream_result.get('error', 'Upload failed') if doodstream_result else 'No response from Doodstream'
                await self._update_upload_status(upload_id, 'failed', error_message=error_msg)
                await self._log_upload_failure(file_info, error_msg, upload_id)
                logger.error(f"Doodstream upload failed: {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"Error processing enhanced group upload: {e}")
            if upload_id:
                await self._update_upload_status(upload_id, 'failed', error_message=str(e))
                await self._log_upload_failure(file_info, str(e), upload_id)
            return False

    async def _stream_to_doodstream_with_retry(self, client: Client, message: Message, file_info: Dict, filename: str, upload_id: str) -> Optional[Dict]:
        """Stream file to Doodstream with retry logic"""
        max_retries = 3
        retry_delay = 5  # seconds
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Doodstream upload attempt {attempt + 1}/{max_retries} for {filename}")
                
                # Update status to show current attempt
                if attempt > 0:
                    await self._update_upload_status(upload_id, 'processing', error_message=f"Retry attempt {attempt + 1}/{max_retries}")
                
                result = await self._stream_to_doodstream(client, message, file_info, filename)
                
                if result and result.get('success'):
                    logger.info(f"Doodstream upload successful on attempt {attempt + 1}")
                    return result
                    
                if attempt < max_retries - 1:
                    logger.warning(f"Doodstream upload failed on attempt {attempt + 1}, retrying in {retry_delay}s...")
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    
            except Exception as e:
                logger.error(f"Error on upload attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2
        
        logger.error(f"All {max_retries} upload attempts failed for {filename}")
        return None

    async def _stream_to_doodstream(self, client: Client, message: Message, file_info: Dict, filename: str) -> Optional[Dict]:
        """Stream file data directly to Doodstream via Supabase edge function"""
        try:
            # Call the doodstream-premium edge function for dual upload
            result = self.supabase.client.functions.invoke(
                'doodstream-premium',
                {
                    'action': 'upload_dual',
                    'telegram_file_id': file_info['file_id'],
                    'title': filename,
                    'file_info': {
                        'original_name': file_info['original_name'],
                        'file_size': file_info['file_size'],
                        'mime_type': file_info['mime_type'],
                        'duration': file_info.get('duration', 0)
                    }
                }
            ).execute()
            
            if result.data and result.data.get('success'):
                logger.info(f"Doodstream dual upload completed: {filename}")
                return {
                    'success': True,
                    'file_code': result.data.get('regular_result', {}).get('file_code'),
                    'premium_file_code': result.data.get('premium_result', {}).get('file_code'),
                    'regular_url': result.data.get('regular_result', {}).get('download_url'),
                    'premium_url': result.data.get('premium_result', {}).get('download_url'),
                    'response': result.data
                }
            else:
                error_message = result.data.get('error', 'Unknown error') if result.data else 'No response'
                logger.error(f"Doodstream upload failed: {error_message}")
                return {'success': False, 'error': error_message}
                
        except Exception as e:
            logger.error(f"Error streaming to Doodstream: {e}")
            return {'success': False, 'error': str(e)}

    async def _update_upload_status(self, upload_id: str, status: str, error_message: Optional[str] = None, file_code: Optional[str] = None):
        """Update upload status in database"""
        try:
            update_data = {
                'upload_status': status,
                'processed_at': datetime.now().isoformat() if status in ['completed', 'failed'] else None
            }
            
            if error_message:
                update_data['error_message'] = error_message
                
            if file_code:
                update_data['doodstream_file_code'] = file_code
            
            await self.supabase.update_upload_status(upload_id, status, error_message)
            
        except Exception as e:
            logger.error(f"Error updating upload status: {e}")

    async def _log_upload_failure(self, file_info: Dict, error: str, upload_id: str = None):
        """Log upload failure for admin review and retry"""
        try:
            failure_data = {
                'upload_type': 'telegram_auto',
                'error_details': {
                    'error_message': error,
                    'file_info': file_info,
                    'upload_id': upload_id,
                    'timestamp': datetime.now().isoformat()
                },
                'requires_manual_upload': True,
                'attempt_count': 1
            }
            
            if upload_id:
                # Link to telegram upload record
                failure_data['video_id'] = None  # Will be set if video record exists
                
            await self.supabase.log_upload_failure(failure_data)
            
        except Exception as e:
            logger.error(f"Error logging upload failure: {e}")

    async def _notify_admin_of_failure(self, filename: str, error: str, context: Dict = None):
        """Enhanced admin notification for upload failures"""
        try:
            # Get admin accounts
            admins = await self.supabase.get_admin_telegram_accounts()
            
            if not admins:
                logger.warning("No admin telegram accounts found for notifications")
                return
            
            # Enhanced notification with context
            context_info = ""
            if context:
                context_info = f"""
📊 **Context:**
• Chat: {context.get('chat_title', 'Unknown')} ({context.get('chat_id', 'N/A')})
• User: {context.get('user_id', 'N/A')}
• Message: {context.get('message_id', 'N/A')}
"""
            
            notification_text = f"""
🚨 **Upload Failed - Auto Retry Available**

📁 **File:** `{filename}`
❌ **Error:** {error[:500]}{'...' if len(error) > 500 else ''}
🕐 **Time:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{context_info}
🔄 **Action:** Use `/retry {context.get('chat_id', '')} {context.get('message_id', '')}` to retry this upload

Check logs for full details.
"""
            
            # Log notification for admin system (placeholder for actual bot notifications)
            logger.info(f"Admin notification queued for {len(admins)} admins: Upload failure - {filename}")
            
            # Store notification in database for admin dashboard
            await self.supabase.store_admin_notification({
                'type': 'upload_failure',
                'title': f'Upload Failed: {filename}',
                'message': notification_text,
                'context': context or {},
                'priority': 'high'
            })
            
        except Exception as e:
            logger.error(f"Error notifying admins of failure: {e}")

    async def _notify_admin_success(self, file_info: Dict, group_name: str):
        """Notify admins of successful uploads"""
        try:
            notification_text = f"""
✅ **Upload Successful**

📁 **File:** `{file_info['original_name']}`
📊 **Size:** {file_info.get('file_size_mb', 0):.1f} MB
⏱️ **Duration:** {file_info.get('duration', 0)}s
🏠 **Group:** {group_name}
🕐 **Time:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
            
            await self.supabase.store_admin_notification({
                'type': 'upload_success',
                'title': f'Upload Success: {file_info["original_name"]}',
                'message': notification_text,
                'context': {'file_info': file_info, 'group_name': group_name},
                'priority': 'normal'
            })
            
        except Exception as e:
            logger.error(f"Error notifying admins of success: {e}")

    async def _create_video_record_enhanced(self, file_info: Dict, doodstream_result: Dict, message: Message, upload_id: str) -> Optional[str]:
        """Create enhanced video record in database with full metadata"""
        try:
            # Generate enhanced metadata
            video_data = {
                'title': file_info['original_name'],
                'description': f"Auto-uploaded from Telegram group: {message.chat.title or 'Unknown'}\nUpload ID: {upload_id}",
                'file_code': doodstream_result['file_code'],
                'doodstream_file_code': doodstream_result['file_code'],
                'file_size': file_info['file_size'],
                'duration': file_info.get('duration'),
                'status': 'active',
                'provider_data': {
                    'upload_source': 'telegram_auto',
                    'telegram_file_id': file_info['file_id'],
                    'telegram_chat_id': message.chat.id,
                    'telegram_user_id': message.from_user.id,
                    'upload_timestamp': file_info.get('upload_timestamp'),
                    'doodstream_response': doodstream_result
                }
            }
            
            # Add premium file code if available
            if doodstream_result.get('premium_file_code'):
                video_data['premium_file_code'] = doodstream_result['premium_file_code']
            
            video_id = await self.supabase.create_video_record(video_data)
            return video_id
            
        except Exception as e:
            logger.error(f"Error creating enhanced video record: {e}")
            return None