"""
Upload Handler for Telegram User Bot
Handles file uploads from premium groups
"""

import os
import asyncio
import logging
import json
from pathlib import Path
from typing import Dict, Optional

import httpx
from pyrogram import Client
from pyrogram.types import Message
from utils.supabase_client import SupabaseManager

logger = logging.getLogger(__name__)

class UploadHandler:
    def __init__(self, supabase: SupabaseManager):
        self.supabase = supabase
        self.download_dir = Path("/opt/telegram-userbot/downloads")
        self.download_dir.mkdir(parents=True, exist_ok=True)
        
        # Supported video formats
        self.video_formats = {
            'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v'
        }
        
        # Supported document MIME types for videos
        self.video_mime_types = {
            'video/mp4', 'video/x-msvideo', 'video/quicktime', 
            'video/x-ms-wmv', 'video/webm', 'video/x-flv'
        }

    async def handle_group_upload(self, client: Client, message: Message):
        """Handle file uploads from premium groups"""
        try:
            # Check if this is a premium group with auto-upload enabled
            if not await self.is_premium_group(message.chat.id):
                return
                
            # Get file info
            file_info = self._get_file_info(message)
            if not file_info:
                return
                
            # Check file size (2GB limit)
            if file_info['size'] > 2147483648:  # 2GB
                logger.warning(f"File too large: {file_info['size']} bytes")
                await message.react("❌")
                return
                
            logger.info(f"📹 Processing upload from group {message.chat.title}: {file_info['name']}")
            
            # React to show processing
            await message.react("⏳")
            
            # Process the upload
            success = await self._process_group_upload(client, message, file_info)
            
            # Update reaction based on result
            if success:
                await message.react("✅")
                logger.info(f"✅ Successfully processed: {file_info['name']}")
            else:
                await message.react("❌")
                logger.error(f"❌ Failed to process: {file_info['name']}")
                
        except Exception as e:
            logger.error(f"Error handling group upload: {e}")
            try:
                await message.react("❌")
            except:
                pass

    async def is_premium_group(self, chat_id: int) -> bool:
        """Check if chat is a premium group with auto-upload enabled"""
        try:
            result = self.supabase.client.functions.invoke(
                'user-bot-webhook',
                {
                    'action': 'check_premium_group',
                    'chat_id': chat_id
                }
            ).execute()
            
            if result.data and result.data.get('is_premium'):
                return True
                
        except Exception as e:
            logger.error(f"Error checking premium group status: {e}")
            
        return False

    def _get_file_info(self, message: Message) -> Optional[Dict]:
        """Extract file information from message"""
        try:
            file_info = None
            
            if message.video:
                file_info = {
                    'id': message.video.file_id,
                    'unique_id': message.video.file_unique_id,
                    'size': message.video.file_size,
                    'name': getattr(message.video, 'file_name', f"video_{message.id}.mp4"),
                    'mime_type': getattr(message.video, 'mime_type', 'video/mp4'),
                    'duration': getattr(message.video, 'duration', 0),
                    'type': 'video'
                }
            elif message.document:
                # Check if document is a video file
                mime_type = getattr(message.document, 'mime_type', '')
                file_name = getattr(message.document, 'file_name', '')
                
                # Check by MIME type or file extension
                is_video = (
                    mime_type in self.video_mime_types or
                    any(file_name.lower().endswith(f'.{ext}') for ext in self.video_formats)
                )
                
                if is_video:
                    file_info = {
                        'id': message.document.file_id,
                        'unique_id': message.document.file_unique_id,
                        'size': message.document.file_size,
                        'name': file_name or f"document_{message.id}",
                        'mime_type': mime_type or 'application/octet-stream',
                        'type': 'document'
                    }
            
            return file_info
            
        except Exception as e:
            logger.error(f"Error extracting file info: {e}")
            return None

    async def _process_group_upload(self, client: Client, message: Message, file_info: Dict) -> bool:
        """Process upload from group"""
        try:
            # Log upload to database
            upload_data = {
                'telegram_chat_id': message.chat.id,
                'telegram_message_id': message.id,
                'telegram_user_id': message.from_user.id if message.from_user else 0,
                'telegram_file_id': file_info['id'],
                'telegram_file_unique_id': file_info['unique_id'],
                'original_filename': file_info['name'],
                'file_size': file_info['size'],
                'mime_type': file_info.get('mime_type'),
                'upload_status': 'processing'
            }
            
            # Insert upload record
            result = self.supabase.client.table('telegram_uploads').insert(upload_data).execute()
            
            if not result.data:
                logger.error("Failed to create upload record")
                return False
                
            upload_id = result.data[0]['id']
            
            # Download file
            file_path = await self._download_file(client, message, file_info)
            if not file_path:
                await self._update_upload_status(upload_id, 'failed', 'Download failed')
                return False
            
            # Upload to Doodstream via edge function
            doodstream_result = await self._upload_to_doodstream(file_path, file_info['name'])

            # Clean up downloaded file
            try:
                os.unlink(file_path)
            except Exception:
                pass

            if doodstream_result and doodstream_result.get('success'):
                status = 'partial_success' if doodstream_result.get('hasErrors') else 'completed'
                error_msg = (
                    json.dumps(doodstream_result.get('errors'))
                    if doodstream_result.get('hasErrors')
                    else None
                )

                # Update upload status
                await self._update_upload_status(
                    upload_id,
                    status,
                    error_msg,
                    doodstream_result.get('file_code')
                )

                # Create video record if needed
                await self._create_video_record(file_info, doodstream_result, message)

                return not doodstream_result.get('hasErrors')
            else:
                await self._update_upload_status(upload_id, 'failed', 'Doodstream upload failed')
                return False
                
        except Exception as e:
            logger.error(f"Error processing group upload: {e}")
            return False

    async def _download_file(self, client: Client, message: Message, file_info: Dict) -> Optional[str]:
        """Download file from Telegram"""
        try:
            file_path = self.download_dir / f"{file_info['unique_id']}_{file_info['name']}"
            
            logger.info(f"📥 Downloading: {file_info['name']}")
            
            # Download with progress
            await client.download_media(
                message=message,
                file_name=str(file_path)
            )
            
            if file_path.exists():
                logger.info(f"✅ Downloaded: {file_path}")
                return str(file_path)
            else:
                logger.error(f"❌ Download failed: {file_path}")
                return None
                
        except Exception as e:
            logger.error(f"Error downloading file: {e}")
            return None

    async def _upload_to_doodstream(self, file_path: str, title: str) -> Optional[Dict]:
        """Upload file to Doodstream via edge function using streaming"""
        try:
            logger.info(f"☁️ Uploading to Doodstream: {title}")

            function_url = f"{self.supabase.config.SUPABASE_URL}/functions/v1/doodstream-premium"
            headers = {
                "Authorization": f"Bearer {self.supabase.config.SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": self.supabase.config.SUPABASE_SERVICE_ROLE_KEY,
            }

            async with httpx.AsyncClient(timeout=None) as client:
                with open(file_path, "rb") as f:
                    files = {"file": (os.path.basename(file_path), f, "application/octet-stream")}
                    data = {"action": "upload_dual", "title": title}
                    response = await client.post(function_url, data=data, files=files, headers=headers)
                    response.raise_for_status()
                    result = response.json()

            if result.get("success"):
                logger.info("✅ Doodstream upload successful")
                data = result.get("results", {})
                return {
                    "success": True,
                    "hasErrors": result.get("hasErrors"),
                    "errors": result.get("errors"),
                    "regular_file_code": (data.get("regular") or {}).get("file_code"),
                    "premium_file_code": (data.get("premium") or {}).get("file_code"),
                    "file_code": (data.get("regular") or {}).get("file_code") or (data.get("premium") or {}).get("file_code"),
                }
            else:
                logger.error(f"❌ Doodstream upload failed: {result}")
                return None

        except Exception as e:
            logger.error(f"Error uploading to Doodstream: {e}")
            return None

    async def _update_upload_status(self, upload_id: str, status: str, error_message: Optional[str] = None, file_code: Optional[str] = None):
        """Update upload status in database"""
        try:
            update_data = {
                'upload_status': status,
                'processed_at': 'now()'
            }
            
            if error_message:
                update_data['error_message'] = error_message
                
            if file_code:
                update_data['doodstream_file_code'] = file_code
            
            self.supabase.client.table('telegram_uploads').update(update_data).eq('id', upload_id).execute()
            
        except Exception as e:
            logger.error(f"Error updating upload status: {e}")

    async def _create_video_record(self, file_info: Dict, doodstream_result: Dict, message: Message):
        """Create video record in database"""
        try:
            # Check if video already exists
            existing = self.supabase.client.table('videos').select('id').eq('file_code', doodstream_result.get('file_code')).execute()
            
            if existing.data:
                logger.info("Video already exists in database")
                return
            
            # Create new video record
            video_data = {
                'title': file_info['name'],
                'file_code': doodstream_result.get('file_code'),
                'doodstream_file_code': doodstream_result.get('file_code'),
                'regular_file_code': doodstream_result.get('regular_file_code'),
                'premium_file_code': doodstream_result.get('premium_file_code'),
                'file_size': file_info['size'],
                'duration': file_info.get('duration'),
                'status': 'processing',
                'upload_status': {
                    'regular': 'completed' if doodstream_result.get('regular_file_code') else 'pending',
                    'premium': 'completed' if doodstream_result.get('premium_file_code') else 'pending'
                }
            }
            
            result = self.supabase.client.table('videos').insert(video_data).execute()
            
            if result.data:
                logger.info(f"✅ Created video record: {result.data[0]['id']}")
            else:
                logger.error("Failed to create video record")
            
        except Exception as e:
            logger.error(f"Error creating video record: {e}")
