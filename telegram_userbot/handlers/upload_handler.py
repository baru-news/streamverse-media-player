"""
Upload Handler for Telegram User Bot
Handles file uploads from premium groups with admin validation and direct streaming
"""

import os
import asyncio
import logging
import json
import uuid
import string
import random
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
        """Handle file uploads from premium groups with admin validation"""
        try:
            # Check if sender is admin
            if not await self._is_sender_admin(message.from_user.id if message.from_user else 0):
                logger.info(f"Upload ignored: sender not admin")
                return
                
            # Check if this is a premium group with auto-upload enabled
            if not await self.is_premium_group(message.chat.id):
                return
                
            # Get file info
            file_info = self._get_file_info(message)
            if not file_info:
                return
                
            # Check video duration (minimum 60 seconds)
            duration = file_info.get('duration', 0)
            if duration > 0 and duration < 60:
                logger.info(f"Video skipped: duration {duration}s < 60s")
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

    async def _is_sender_admin(self, telegram_user_id: int) -> bool:
        """Check if sender is admin using Supabase RPC"""
        try:
            result = self.supabase.client.rpc('is_telegram_admin', {
                'telegram_user_id_param': telegram_user_id
            }).execute()
            
            return result.data or False
                
        except Exception as e:
            logger.error(f"Error checking admin status: {e}")
            return False

    async def is_premium_group(self, chat_id: int) -> bool:
        """Check if chat is a premium group with auto-upload enabled"""
        try:
            result = self.supabase.client.rpc('is_premium_group_with_autoupload', {
                'chat_id_param': chat_id
            }).execute()
            
            return result.data or False
                
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

    def _generate_random_filename(self, original_name: str) -> str:
        """Generate random filename to avoid conflicts"""
        # Generate random string
        random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        
        # Sanitize original name
        sanitized_name = "".join(c for c in original_name if c.isalnum() or c in ".-_")
        
        return f"{random_string}_{sanitized_name}"

    async def _process_group_upload(self, client: Client, message: Message, file_info: Dict) -> bool:
        """Process upload from group using direct streaming"""
        try:
            # Generate random filename
            random_filename = self._generate_random_filename(file_info['name'])
            
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
            
            # Upload to Doodstream via direct streaming (no local download)
            doodstream_result = await self._stream_to_doodstream(client, message, file_info, random_filename)

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

                # Send admin notification if there are errors
                if doodstream_result.get('hasErrors'):
                    await self._notify_admin_of_errors(file_info['name'], doodstream_result.get('errors'))

                return not doodstream_result.get('hasErrors')
            else:
                await self._update_upload_status(upload_id, 'failed', 'Doodstream upload failed')
                await self._notify_admin_of_failure(file_info['name'], 'Complete upload failure')
                return False
                
        except Exception as e:
            logger.error(f"Error processing group upload: {e}")
            return False

    async def _stream_to_doodstream(self, client: Client, message: Message, file_info: Dict, filename: str) -> Optional[Dict]:
        """Stream file directly to Doodstream without local download"""
        try:
            logger.info(f"☁️ Streaming to Doodstream: {filename}")

            function_url = f"{self.supabase.config.SUPABASE_URL}/functions/v1/doodstream-premium"
            headers = {
                "Authorization": f"Bearer {self.supabase.config.SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": self.supabase.config.SUPABASE_SERVICE_ROLE_KEY,
            }

            # Get file stream from Telegram
            file_stream = await client.get_file(file_info['id'])
            
            async with httpx.AsyncClient(timeout=None) as http_client:
                # Stream file data directly from Telegram to Doodstream
                async with http_client.stream("GET", file_stream.file_path) as stream:
                    files = {"file": (filename, stream.aiter_bytes(), "application/octet-stream")}
                    data = {"action": "upload_dual", "title": filename}
                    response = await http_client.post(function_url, data=data, files=files, headers=headers)
                    response.raise_for_status()
                    result = response.json()

            if result.get("success"):
                logger.info("✅ Doodstream stream upload successful")
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
                logger.error(f"❌ Doodstream stream upload failed: {result}")
                return None

        except Exception as e:
            logger.error(f"Error streaming to Doodstream: {e}")
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

    async def _notify_admin_of_errors(self, filename: str, errors: Dict):
        """Send notification to admins about partial upload failures"""
        try:
            # Get admin telegram accounts
            admins = await self.supabase.get_admin_telegram_accounts()
            
            error_message = f"❌ Upload partial failure: {filename}\n"
            if errors.get('regular'):
                error_message += f"Regular: {errors['regular']}\n"
            if errors.get('premium'): 
                error_message += f"Premium: {errors['premium']}\n"
            
            # Send to all admin accounts (implementation depends on how you want to send messages)
            logger.warning(f"Admin notification needed: {error_message}")
            
        except Exception as e:
            logger.error(f"Error notifying admin of errors: {e}")

    async def _notify_admin_of_failure(self, filename: str, error: str):
        """Send notification to admins about complete upload failure"""
        try:
            # Get admin telegram accounts  
            admins = await self.supabase.get_admin_telegram_accounts()
            
            error_message = f"❌ Upload complete failure: {filename}\nError: {error}"
            
            # Send to all admin accounts (implementation depends on how you want to send messages)
            logger.error(f"Admin notification needed: {error_message}")
            
        except Exception as e:
            logger.error(f"Error notifying admin of failure: {e}")

    async def _create_video_record(self, file_info: Dict, doodstream_result: Dict, message: Message):
        """Create video record in database"""
        try:
            # Check if video already exists
            existing = self.supabase.client.table('videos').select('id').eq('file_code', doodstream_result.get('file_code')).execute()
            
            if existing.data:
                logger.info("Video already exists in database")
                return
            
            # Create new video record with random title
            random_title = self._generate_random_filename(file_info['name'])
            
            video_data = {
                'title': random_title,
                'original_title': file_info['name'],
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
