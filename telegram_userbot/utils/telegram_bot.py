"""
Real-Time Telegram Bot for Admin Notifications - Phase 3
Handles instant admin notifications with inline keyboard controls
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from pyrogram import Client
from pyrogram.types import InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from .supabase_client import SupabaseManager

logger = logging.getLogger(__name__)

class TelegramNotificationBot:
    def __init__(self, client: Client, supabase: SupabaseManager):
        self.client = client
        self.supabase = supabase
        self._admin_cache = {}
        self._callback_data_cache = {}
        
    async def get_admin_accounts(self) -> List[Dict]:
        """Get cached admin telegram accounts"""
        try:
            # Cache for 5 minutes
            import time
            current_time = time.time()
            
            if 'admins' not in self._admin_cache or (current_time - self._admin_cache.get('timestamp', 0)) > 300:
                admins = await self.supabase.get_admin_telegram_accounts()
                self._admin_cache = {
                    'admins': admins,
                    'timestamp': current_time
                }
                logger.info(f"Refreshed admin cache: {len(admins)} admins")
            
            return self._admin_cache.get('admins', [])
            
        except Exception as e:
            logger.error(f"Error getting admin accounts: {e}")
            return []
    
    async def notify_upload_failure(self, failure_data: Dict[str, Any]) -> bool:
        """Send real-time notification to admins about upload failure"""
        try:
            admins = await self.get_admin_accounts()
            if not admins:
                logger.warning("No admin accounts found for notifications")
                return False
            
            # Parse failure details
            error_details = failure_data.get('error_details', {})
            file_info = error_details.get('file_info', {})
            file_name = file_info.get('original_name', 'Unknown File')
            error_type = failure_data.get('upload_type', 'unknown')
            error_message = error_details.get('error_message', 'Unknown error')
            upload_id = failure_data.get('id')
            
            # Categorize error type
            regular_error = error_details.get('regular_error')
            premium_error = error_details.get('premium_error')
            
            # Build notification message
            status_icon = "🚨"
            if regular_error and premium_error:
                error_category = "both_failed"
                error_summary = f"❌ Regular: {regular_error[:50]}...\n❌ Premium: {premium_error[:50]}..."
            elif regular_error:
                error_category = "regular_failed"
                error_summary = f"❌ Regular: {regular_error[:100]}...\n✅ Premium: Success"
            elif premium_error:
                error_category = "premium_failed"
                error_summary = f"✅ Regular: Success\n❌ Premium: {premium_error[:100]}..."
            else:
                error_category = "unknown_error"
                error_summary = f"❌ Error: {error_message[:100]}..."
            
            notification_text = f"""
{status_icon} **Upload Failed**

📁 **File:** `{file_name}`
🗂 **Size:** {file_info.get('file_size_mb', 0):.1f} MB
⏱ **Duration:** {file_info.get('duration', 0)//60}m {file_info.get('duration', 0)%60}s

**Status:**
{error_summary}

🔄 **Attempts:** {failure_data.get('attempt_count', 1)}/3
📅 **Time:** {failure_data.get('created_at', 'Unknown')[:19]}

Choose action below:
"""
            
            # Create callback data
            callback_base = f"retry:{upload_id}:{error_category}"
            
            # Store callback data for processing
            self._callback_data_cache[upload_id] = {
                'failure_data': failure_data,
                'error_category': error_category,
                'timestamp': asyncio.get_event_loop().time()
            }
            
            # Build inline keyboard based on error type
            keyboard_buttons = []
            
            if error_category == "both_failed":
                keyboard_buttons = [
                    [
                        InlineKeyboardButton("🔄 Retry Regular", callback_data=f"{callback_base}:regular"),
                        InlineKeyboardButton("🔄 Retry Premium", callback_data=f"{callback_base}:premium")
                    ],
                    [
                        InlineKeyboardButton("🔄 Retry Both", callback_data=f"{callback_base}:both"),
                        InlineKeyboardButton("❌ Cancel", callback_data=f"{callback_base}:cancel")
                    ]
                ]
            elif error_category == "regular_failed":
                keyboard_buttons = [
                    [
                        InlineKeyboardButton("🔄 Retry Regular", callback_data=f"{callback_base}:regular"),
                        InlineKeyboardButton("❌ Cancel", callback_data=f"{callback_base}:cancel")
                    ]
                ]
            elif error_category == "premium_failed":
                keyboard_buttons = [
                    [
                        InlineKeyboardButton("🔄 Retry Premium", callback_data=f"{callback_base}:premium"),
                        InlineKeyboardButton("❌ Cancel", callback_data=f"{callback_base}:cancel")
                    ]
                ]
            else:
                keyboard_buttons = [
                    [
                        InlineKeyboardButton("🔄 Retry Upload", callback_data=f"{callback_base}:both"),
                        InlineKeyboardButton("❌ Cancel", callback_data=f"{callback_base}:cancel")
                    ]
                ]
            
            # Add manual upload option if max retries reached
            if failure_data.get('attempt_count', 0) >= 3:
                keyboard_buttons.append([
                    InlineKeyboardButton("⚠️ Mark Manual Required", callback_data=f"{callback_base}:manual")
                ])
            
            keyboard = InlineKeyboardMarkup(keyboard_buttons)
            
            # Send to all admins
            success_count = 0
            for admin in admins:
                try:
                    telegram_user_id = admin.get('telegram_user_id')
                    if telegram_user_id:
                        await self.client.send_message(
                            chat_id=telegram_user_id,
                            text=notification_text,
                            reply_markup=keyboard,
                            parse_mode="markdown"
                        )
                        success_count += 1
                        logger.info(f"Notification sent to admin {telegram_user_id}")
                        
                except Exception as e:
                    logger.error(f"Failed to send notification to admin {admin.get('telegram_user_id')}: {e}")
            
            # Log notification attempt
            await self.supabase.log_admin_notification({
                'upload_failure_id': upload_id,
                'notification_type': 'upload_failure',
                'sent_to_count': success_count,
                'error_category': error_category,
                'message_preview': notification_text[:200]
            })
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Error sending failure notification: {e}")
            return False
    
    async def notify_upload_success(self, success_data: Dict[str, Any]) -> bool:
        """Send success notification to admins"""
        try:
            admins = await self.get_admin_accounts()
            if not admins:
                return False
            
            file_info = success_data.get('file_info', {})
            file_name = file_info.get('original_name', 'Unknown File')
            group_name = success_data.get('group_name', 'Unknown Group')
            
            notification_text = f"""
✅ **Upload Successful**

📁 **File:** `{file_name}`
👥 **Group:** {group_name}
🗂 **Size:** {file_info.get('file_size_mb', 0):.1f} MB
⏱ **Duration:** {file_info.get('duration', 0)//60}m {file_info.get('duration', 0)%60}s

🎯 **Doodstream:** ✅ Uploaded
🎯 **Premium:** ✅ Uploaded
🎬 **Video Record:** ✅ Created

Ready for viewing on website!
"""
            
            success_count = 0
            for admin in admins:
                try:
                    telegram_user_id = admin.get('telegram_user_id')
                    if telegram_user_id:
                        await self.client.send_message(
                            chat_id=telegram_user_id,
                            text=notification_text,
                            parse_mode="markdown"
                        )
                        success_count += 1
                        
                except Exception as e:
                    logger.error(f"Failed to send success notification to admin {admin.get('telegram_user_id')}: {e}")
            
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Error sending success notification: {e}")
            return False
    
    async def handle_callback_query(self, callback_query: CallbackQuery) -> bool:
        """Handle inline keyboard callback queries"""
        try:
            callback_data = callback_query.data
            user_id = callback_query.from_user.id
            
            # Verify user is admin
            if not await self.supabase.is_user_admin(user_id):
                await callback_query.answer("❌ Unauthorized: Admin access required", show_alert=True)
                return False
            
            # Parse callback data: retry:{upload_id}:{error_category}:{action}
            if not callback_data.startswith("retry:"):
                await callback_query.answer("❌ Invalid callback data", show_alert=True)
                return False
            
            parts = callback_data.split(":")
            if len(parts) != 4:
                await callback_query.answer("❌ Invalid callback format", show_alert=True)
                return False
            
            _, upload_id, error_category, action = parts
            
            # Get cached failure data
            cached_data = self._callback_data_cache.get(upload_id)
            if not cached_data:
                await callback_query.answer("❌ Callback data expired. Use /failures command.", show_alert=True)
                return False
            
            failure_data = cached_data['failure_data']
            
            # Handle different actions
            if action == "cancel":
                await callback_query.answer("❌ Upload cancelled by admin")
                await callback_query.edit_message_text(
                    text=callback_query.message.text + "\n\n❌ **CANCELLED BY ADMIN**",
                    parse_mode="markdown"
                )
                return True
            
            elif action == "manual":
                # Mark as requiring manual upload
                await self.supabase.mark_upload_manual_required(upload_id)
                await callback_query.answer("⚠️ Marked as requiring manual upload")
                await callback_query.edit_message_text(
                    text=callback_query.message.text + "\n\n⚠️ **MARKED FOR MANUAL UPLOAD**",
                    parse_mode="markdown"
                )
                return True
            
            elif action in ["regular", "premium", "both"]:
                # Start retry process
                await callback_query.answer(f"🔄 Starting {action} retry...")
                
                # Update message to show processing
                await callback_query.edit_message_text(
                    text=callback_query.message.text + f"\n\n🔄 **RETRY IN PROGRESS ({action.upper()})**",
                    parse_mode="markdown"
                )
                
                # Trigger retry via admin handler (async task)
                asyncio.create_task(self._process_retry(upload_id, action, callback_query))
                
                return True
            
            else:
                await callback_query.answer("❌ Unknown action", show_alert=True)
                return False
            
        except Exception as e:
            logger.error(f"Error handling callback query: {e}")
            await callback_query.answer("❌ Error processing request", show_alert=True)
            return False
    
    async def _process_retry(self, upload_id: str, retry_type: str, callback_query: CallbackQuery):
        """Process retry request asynchronously"""
        try:
            # Get original upload data
            upload_data = await self.supabase.get_upload_by_id(upload_id)
            if not upload_data:
                await callback_query.edit_message_text(
                    text=callback_query.message.text.replace("🔄 **RETRY IN PROGRESS", "❌ **RETRY FAILED - Upload not found"),
                    parse_mode="markdown"
                )
                return
            
            # Get original message
            chat_id = upload_data.get('telegram_chat_id')
            message_id = upload_data.get('telegram_message_id')
            
            if not chat_id or not message_id:
                await callback_query.edit_message_text(
                    text=callback_query.message.text.replace("🔄 **RETRY IN PROGRESS", "❌ **RETRY FAILED - Original message not found"),
                    parse_mode="markdown"
                )
                return
            
            # Retry the upload with specific provider
            success = await self.supabase.retry_upload_with_provider(upload_id, retry_type)
            
            if success:
                await callback_query.edit_message_text(
                    text=callback_query.message.text.replace("🔄 **RETRY IN PROGRESS", f"✅ **RETRY SUCCESSFUL ({retry_type.upper()})"),
                    parse_mode="markdown"
                )
            else:
                await callback_query.edit_message_text(
                    text=callback_query.message.text.replace("🔄 **RETRY IN PROGRESS", f"❌ **RETRY FAILED ({retry_type.upper()})"),
                    parse_mode="markdown"
                )
            
        except Exception as e:
            logger.error(f"Error processing retry: {e}")
            await callback_query.edit_message_text(
                text=callback_query.message.text.replace("🔄 **RETRY IN PROGRESS", f"❌ **RETRY ERROR: {str(e)[:50]}"),
                parse_mode="markdown"
            )
    
    async def cleanup_expired_callbacks(self):
        """Clean up expired callback data (call periodically)"""
        try:
            current_time = asyncio.get_event_loop().time()
            expired_keys = []
            
            for upload_id, data in self._callback_data_cache.items():
                # Expire after 1 hour
                if current_time - data['timestamp'] > 3600:
                    expired_keys.append(upload_id)
            
            for key in expired_keys:
                del self._callback_data_cache[key]
            
            if expired_keys:
                logger.info(f"Cleaned up {len(expired_keys)} expired callback entries")
                
        except Exception as e:
            logger.error(f"Error cleaning up callbacks: {e}")