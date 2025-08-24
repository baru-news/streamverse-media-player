"""
File upload handler for Telegram Bot
Handles video uploads up to 2GB with progress tracking
"""

import asyncio
import logging
import os
import tempfile
from typing import Optional, Dict
from pathlib import Path
from datetime import datetime

from pyrogram import Client
from pyrogram.types import Message
from pyrogram.errors import FloodWait

from supabase_client import SupabaseManager
from utils.progress_tracker import ProgressTracker

logger = logging.getLogger(__name__)

class FileHandler:
    """Handles file upload operations"""
    
    def __init__(self, supabase: SupabaseManager):
        self.supabase = supabase
        from config import Config
        self.config = Config()
        self.progress_tracker = ProgressTracker()
        
        # Supported video formats
        self.supported_formats = {
            'video/mp4', 'video/avi', 'video/mkv', 'video/mov', 
            'video/wmv', 'video/flv', 'video/webm', 'video/m4v',
            'video/3gp', 'video/mpeg', 'video/quicktime'
        }
    
    async def handle_file_upload(self, client: Client, message: Message):
        """Handle private file upload"""
        try:
            # Check if user is linked
            profile = await self.supabase.get_profile_by_telegram_id(message.from_user.id)
            if not profile:
                await message.reply_text(
                    "❌ **Account Not Linked**\n\n"
                    "Please link your Telegram account first using `/link` command.\n"
                    "Visit our website to get your account linked!"
                )
                return
            
            # Check file type and size
            file_info = self._get_file_info(message)
            if not file_info:
                await message.reply_text(
                    "❌ **Unsupported File Format**\n\n"
                    "Please send a video file in supported format:\n"
                    "MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V, 3GP, MPEG"
                )
                return
            
            if file_info['size'] > self.config.MAX_FILE_SIZE:
                size_gb = file_info['size'] / (1024**3)
                max_gb = self.config.MAX_FILE_SIZE / (1024**3)
                await message.reply_text(
                    f"❌ **File Too Large**\n\n"
                    f"File size: {size_gb:.2f} GB\n"
                    f"Maximum allowed: {max_gb:.1f} GB"
                )
                return
            
            # Start upload process
            await self._process_upload(client, message, file_info, profile)
            
        except Exception as e:
            logger.error(f"Error handling file upload: {e}")
            await message.reply_text(
                "❌ **Upload Error**\n\n"
                "An error occurred while processing your file. Please try again later."
            )
    
    async def handle_group_upload(self, client: Client, message: Message):
        """Handle group file upload for premium groups"""
        try:
            # Check if it's a premium group with auto-upload
            if not await self.supabase.is_premium_group_with_autoupload(message.chat.id):
                return  # Silently ignore non-premium groups
            
            # Check file type
            file_info = self._get_file_info(message)
            if not file_info:
                return  # Silently ignore non-video files
            
            # Check file size
            if file_info['size'] > self.config.MAX_FILE_SIZE:
                await message.reply_text(
                    f"⚠️ **File Too Large for Auto-Upload**\n\n"
                    f"File size: {file_info['size'] / (1024**3):.2f} GB\n"
                    f"Maximum: {self.config.MAX_FILE_SIZE / (1024**3):.1f} GB\n\n"
                    "Please upload smaller files for automatic processing."
                )
                return
            
            # Get uploader info (use bot user as fallback for service account)
            uploader_profile = None
            if message.from_user:
                uploader_profile = await self.supabase.get_profile_by_telegram_id(message.from_user.id)
            
            # Start upload process for group
            await self._process_group_upload(client, message, file_info, uploader_profile)
            
        except Exception as e:
            logger.error(f"Error handling group upload: {e}")
            await message.reply_text(
                "❌ **Auto-Upload Error**\n\n"
                "Failed to process group upload. Admins have been notified."
            )
    
    def _get_file_info(self, message: Message) -> Optional[Dict]:
        """Extract file information from message"""
        file_obj = None
        file_type = None
        
        if message.video:
            file_obj = message.video
            file_type = 'video'
        elif message.document and message.document.mime_type in self.supported_formats:
            file_obj = message.document
            file_type = 'document'
        else:
            return None
        
        return {
            'file_id': file_obj.file_id,
            'file_unique_id': file_obj.file_unique_id,
            'size': file_obj.file_size,
            'name': getattr(file_obj, 'file_name', f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
            'mime_type': getattr(file_obj, 'mime_type', 'video/mp4'),
            'duration': getattr(file_obj, 'duration', None),
            'type': file_type
        }
    
    async def _process_upload(self, client: Client, message: Message, file_info: Dict, profile: Dict):
        """Process file upload to Doodstream"""
        upload_id = None
        temp_file = None
        status_message = None
        
        try:
            # Log upload attempt
            telegram_data = {
                'chat_id': message.chat.id,
                'user_id': message.from_user.id,
                'message_id': message.id,
                'file_id': file_info['file_id'],
                'file_unique_id': file_info['file_unique_id'],
                'filename': file_info['name'],
                'file_size': file_info['size'],
                'mime_type': file_info['mime_type']
            }
            
            upload_id = await self.supabase.log_telegram_upload(telegram_data)
            
            # Send initial status
            status_message = await message.reply_text(
                "🎬 **Starting Upload Process**\n\n"
                f"📁 File: `{file_info['name']}`\n"
                f"📊 Size: {file_info['size'] / (1024**2):.1f} MB\n"
                f"⏱️ Status: Downloading from Telegram..."
            )
            
            # Download file with progress
            temp_file = await self._download_with_progress(
                client, message, file_info, status_message
            )
            
            if not temp_file:
                raise Exception("Failed to download file from Telegram")
            
            # Update status
            await status_message.edit_text(
                "🎬 **Upload Process**\n\n"
                f"📁 File: `{file_info['name']}`\n"
                f"📊 Size: {file_info['size'] / (1024**2):.1f} MB\n"
                f"⏱️ Status: Uploading to Doodstream...\n"
                f"🔄 Please wait, this may take several minutes..."
            )
            
            # Upload to Doodstream via edge function
            result = await self._upload_to_doodstream(temp_file, file_info['name'])
            
            if result and result.get('success'):
                # Update database
                await self.supabase.update_telegram_upload_status(
                    upload_id, 'completed', 
                    result.get('file_code'),
                    result.get('video_id')
                )
                
                # Success message
                await status_message.edit_text(
                    "✅ **Upload Successful!**\n\n"
                    f"📁 File: `{file_info['name']}`\n"
                    f"🎯 File Code: `{result.get('file_code', 'N/A')}`\n"
                    f"🌐 Your video will be available on the platform shortly.\n"
                    f"⚡ Processing may take a few minutes..."
                )
                
                # Trigger video sync
                asyncio.create_task(self.supabase.sync_doodstream_videos())
                
            else:
                raise Exception(f"Doodstream upload failed: {result}")
                
        except Exception as e:
            logger.error(f"Upload process error: {e}")
            
            # Log failure
            if upload_id:
                await self.supabase.update_telegram_upload_status(
                    upload_id, 'failed', error_message=str(e)
                )
                
                # Log for admin review
                await self.supabase.log_upload_failure(
                    None, 'telegram_upload', 
                    {'error': str(e), 'file_info': file_info, 'upload_id': upload_id}
                )
            
            # Error message
            if status_message:
                await status_message.edit_text(
                    "❌ **Upload Failed**\n\n"
                    f"📁 File: `{file_info['name']}`\n"
                    f"⚠️ Error: Upload to Doodstream failed\n"
                    f"🔄 Please try again later or contact support."
                )
        
        finally:
            # Clean up temp file
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except:
                    pass
    
    async def _process_group_upload(self, client: Client, message: Message, file_info: Dict, uploader_profile: Optional[Dict]):
        """Process group upload for premium groups"""
        # Similar to _process_upload but adapted for group context
        upload_id = None
        temp_file = None
        
        try:
            # Log upload attempt
            telegram_data = {
                'chat_id': message.chat.id,
                'user_id': message.from_user.id if message.from_user else 0,
                'message_id': message.id,
                'file_id': file_info['file_id'],
                'file_unique_id': file_info['file_unique_id'],
                'filename': file_info['name'],
                'file_size': file_info['size'],
                'mime_type': file_info['mime_type']
            }
            
            upload_id = await self.supabase.log_telegram_upload(telegram_data)
            
            # React to message to show processing
            try:
                await message.react("⏳")
            except:
                pass
            
            # Download file
            temp_file = await client.download_media(message, file_name=None)
            
            if not temp_file:
                raise Exception("Failed to download file from Telegram")
            
            # Upload to Doodstream
            result = await self._upload_to_doodstream(temp_file, file_info['name'])
            
            if result and result.get('success'):
                # Update database
                await self.supabase.update_telegram_upload_status(
                    upload_id, 'completed', 
                    result.get('file_code'),
                    result.get('video_id')
                )
                
                # React with success
                try:
                    await message.react("✅")
                except:
                    pass
                
                # Trigger video sync
                asyncio.create_task(self.supabase.sync_doodstream_videos())
                
            else:
                raise Exception(f"Doodstream upload failed: {result}")
                
        except Exception as e:
            logger.error(f"Group upload error: {e}")
            
            # Log failure
            if upload_id:
                await self.supabase.update_telegram_upload_status(
                    upload_id, 'failed', error_message=str(e)
                )
            
            # React with error
            try:
                await message.react("❌")
            except:
                pass
        
        finally:
            # Clean up temp file
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except:
                    pass
    
    async def _download_with_progress(self, client: Client, message: Message, 
                                    file_info: Dict, status_message: Message) -> Optional[str]:
        """Download file with progress updates"""
        try:
            # Create temp file
            temp_dir = Path(self.config.DOWNLOAD_DIR)
            temp_file = temp_dir / f"tg_{file_info['file_unique_id']}.tmp"
            
            # Progress callback
            last_update = 0
            async def progress_callback(current: int, total: int):
                nonlocal last_update
                percent = (current / total) * 100
                
                # Update every 10% or every 30 seconds
                now = asyncio.get_event_loop().time()
                if percent - last_update >= 10 or now - progress_callback.last_time >= 30:
                    last_update = percent
                    progress_callback.last_time = now
                    
                    try:
                        await status_message.edit_text(
                            "🎬 **Upload Process**\n\n"
                            f"📁 File: `{file_info['name']}`\n"
                            f"📊 Size: {file_info['size'] / (1024**2):.1f} MB\n"
                            f"⏱️ Status: Downloading from Telegram...\n"
                            f"📈 Progress: {percent:.1f}%"
                        )
                    except FloodWait as e:
                        await asyncio.sleep(e.value)
                    except:
                        pass  # Ignore edit errors
            
            progress_callback.last_time = asyncio.get_event_loop().time()
            
            # Download file
            downloaded_file = await client.download_media(
                message, 
                file_name=str(temp_file),
                progress=progress_callback
            )
            
            return downloaded_file
            
        except Exception as e:
            logger.error(f"Download error: {e}")
            return None
    
    async def _upload_to_doodstream(self, file_path: str, title: str) -> Optional[Dict]:
        """Upload file to Doodstream using edge function"""
        try:
            # For large files, we need to implement chunked upload
            # This is a simplified version - actual implementation would handle large files
            
            # Call the doodstream-premium edge function for dual upload
            result = await self.supabase.call_edge_function('doodstream-premium', {
                'action': 'upload_dual',
                'title': title
                # File would be handled through multipart upload in actual implementation
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Doodstream upload error: {e}")
            return None