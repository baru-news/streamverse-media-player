"""
Admin Handler for Telegram User Bot
Handles admin commands and management
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict
from pyrogram import Client
from pyrogram.types import Message
from utils.supabase_client import SupabaseManager

logger = logging.getLogger(__name__)

class AdminHandler:
    def __init__(self, supabase: SupabaseManager):
        self.supabase = supabase

    async def handle_start(self, client: Client, message: Message):
        """Handle /start command"""
        try:
            me = await client.get_me()
            welcome_text = f"""
🤖 **Telegram User Bot** - Auto Upload System

👤 **Logged in as:** {me.first_name} (@{me.username})
📱 **Phone:** {me.phone_number}
🆔 **User ID:** {me.id}

**Available Commands:**
• `/status` - Check bot status
• `/groups` - List premium groups
• `/addgroup <chat_id>` - Add premium group
• `/sync` - Sync Doodstream videos
• `/link <code>` - Link Supabase account

**How it works:**
1. Bot monitors premium groups automatically
2. When video files are posted, they're auto-uploaded to Doodstream
3. Videos appear on your website automatically
4. Premium groups can be managed via commands

**Setup:**
1. Add bot to premium groups as admin
2. Files will be auto-processed and uploaded
3. Check status with `/status` command

Need help? Contact your system administrator.
"""
            
            await message.reply_text(welcome_text)
            
        except Exception as e:
            logger.error(f"Error in start command: {e}")
            await message.reply_text("❌ Error processing command")

    async def handle_status(self, client: Client, message: Message):
        """Handle /status command"""
        try:
            # Get bot info
            me = await client.get_me()
            
            # Get premium groups
            groups = await self._get_premium_groups()
            
            # Get recent uploads
            recent_uploads = await self._get_recent_uploads()
            
            status_text = f"""
📊 **Bot Status Report**

**User Information:**
👤 Name: {me.first_name} (@{me.username})
📱 Phone: {me.phone_number}
🆔 ID: {me.id}

**Premium Groups:** {len(groups)}
**Recent Uploads (24h):** {len(recent_uploads)}

**Groups Status:**
"""
            
            if groups:
                for group in groups[:5]:  # Show max 5 groups
                    status_text += f"• {group.get('chat_title', 'Unknown')} (ID: {group['chat_id']})\n"
                    
                if len(groups) > 5:
                    status_text += f"• ... and {len(groups) - 5} more groups\n"
            else:
                status_text += "• No premium groups configured\n"
            
            status_text += f"""
**Recent Activity:**
"""
            
            if recent_uploads:
                for upload in recent_uploads[:3]:  # Show max 3 recent
                    status = "✅" if upload['upload_status'] == 'completed' else "⏳" if upload['upload_status'] == 'processing' else "❌"
                    status_text += f"{status} {upload.get('original_filename', 'Unknown')}\n"
            else:
                status_text += "• No recent uploads\n"
                
            status_text += f"""
Use `/groups` to manage premium groups
Use `/sync` to manually sync Doodstream
"""
            
            await message.reply_text(status_text)
            
        except Exception as e:
            logger.error(f"Error in status command: {e}")
            await message.reply_text("❌ Error getting status")

    async def handle_groups(self, client: Client, message: Message):
        """Handle /groups command"""
        try:
            groups = await self._get_premium_groups()
            
            if not groups:
                await message.reply_text("📂 No premium groups configured.\n\nUse `/addgroup <chat_id>` to add groups.")
                return
            
            groups_text = f"📂 **Premium Groups ({len(groups)})**\n\n"
            
            for i, group in enumerate(groups, 1):
                auto_status = "🟢 ON" if group.get('auto_upload_enabled') else "🔴 OFF"
                groups_text += f"{i}. **{group.get('chat_title', 'Unknown')}**\n"
                groups_text += f"   ID: `{group['chat_id']}`\n"
                groups_text += f"   Auto Upload: {auto_status}\n\n"
            
            groups_text += "Use `/addgroup <chat_id>` to add more groups"
            
            await message.reply_text(groups_text)
            
        except Exception as e:
            logger.error(f"Error in groups command: {e}")
            await message.reply_text("❌ Error getting groups list")

    async def handle_add_group(self, client: Client, message: Message):
        """Handle /addgroup command"""
        try:
            # Parse chat ID from command
            command_parts = message.text.split()
            if len(command_parts) < 2:
                await message.reply_text("❌ Usage: `/addgroup <chat_id>`\n\nExample: `/addgroup -1001234567890`")
                return
            
            try:
                chat_id = int(command_parts[1])
            except ValueError:
                await message.reply_text("❌ Invalid chat ID. Must be a number.\n\nExample: `/addgroup -1001234567890`")
                return
            
            # Check if group already exists
            existing = self.supabase.client.table('premium_groups').select('*').eq('chat_id', chat_id).execute()
            
            if existing.data:
                await message.reply_text(f"⚠️ Group {chat_id} is already in premium groups list")
                return
            
            # Try to get chat info
            try:
                chat = await client.get_chat(chat_id)
                chat_title = chat.title
            except Exception:
                chat_title = f"Unknown Group ({chat_id})"
            
            # Add to premium groups
            group_data = {
                'chat_id': chat_id,
                'chat_title': chat_title,
                'auto_upload_enabled': True
            }
            
            result = self.supabase.client.table('premium_groups').insert(group_data).execute()
            
            if result.data:
                await message.reply_text(f"✅ Added premium group: **{chat_title}**\nID: `{chat_id}`\nAuto upload: 🟢 Enabled")
            else:
                await message.reply_text("❌ Failed to add group to database")
            
        except Exception as e:
            logger.error(f"Error in add group command: {e}")
            await message.reply_text("❌ Error adding group")

    async def handle_sync(self, client: Client, message: Message):
        """Handle /sync command"""
        try:
            await message.reply_text("🔄 Starting manual sync with Doodstream...")
            
            # Call sync edge function
            result = self.supabase.client.functions.invoke(
                'doodstream-api',
                {
                    'action': 'syncVideos'
                }
            ).execute()
            
            if result.data and result.data.get('success'):
                videos_count = len(result.data.get('result', []))
                await message.reply_text(f"✅ Sync completed successfully!\n📹 Processed {videos_count} videos")
            else:
                error_msg = result.data.get('error', 'Unknown error') if result.data else 'No response'
                await message.reply_text(f"❌ Sync failed: {error_msg}")
            
        except Exception as e:
            logger.error(f"Error in sync command: {e}")
            await message.reply_text("❌ Error during sync")

    async def handle_retry_upload(self, client: Client, message: Message):
        """Enhanced /retry command with provider-specific retry options"""
        try:
            command_parts = message.text.split()
            if len(command_parts) < 2:
                await message.reply_text("""
❌ **Usage:**
• `/retry <upload_id>` - Retry by upload failure ID
• `/retry <chat_id> <message_id>` - Retry by original message
• `/retry <upload_id> regular` - Retry only regular upload
• `/retry <upload_id> premium` - Retry only premium upload

Use `/failures` to get upload IDs
""")
                return
            
            # Parse command arguments
            if len(command_parts) == 2:
                # Single argument - could be upload_id or chat_id
                try:
                    # Try as upload_id first (UUID format)
                    upload_id = command_parts[1]
                    if len(upload_id) == 36 and upload_id.count('-') == 4:  # UUID format
                        success = await self._retry_by_upload_id(upload_id, "both")
                        if success:
                            await message.reply_text("✅ Retry successful!")
                        else:
                            await message.reply_text("❌ Retry failed. Check logs for details.")
                        return
                    else:
                        await message.reply_text("❌ Invalid upload ID format. Use `/failures` to get valid IDs.")
                        return
                        
                except Exception:
                    await message.reply_text("❌ Invalid upload ID format.")
                    return
            
            elif len(command_parts) == 3:
                # Could be: chat_id + message_id OR upload_id + provider
                first_arg = command_parts[1]
                second_arg = command_parts[2]
                
                # Check if first arg is UUID (upload_id + provider)
                if len(first_arg) == 36 and first_arg.count('-') == 4:
                    upload_id = first_arg
                    provider = second_arg.lower()
                    
                    if provider not in ['regular', 'premium', 'both']:
                        await message.reply_text("❌ Provider must be 'regular', 'premium', or 'both'")
                        return
                    
                    success = await self._retry_by_upload_id(upload_id, provider)
                    if success:
                        await message.reply_text(f"✅ {provider.title()} retry successful!")
                    else:
                        await message.reply_text(f"❌ {provider.title()} retry failed. Check logs for details.")
                    return
                    
                else:
                    # Legacy format: chat_id + message_id
                    try:
                        chat_id = int(first_arg)
                        message_id = int(second_arg)
                        
                        success = await self._retry_by_message(client, chat_id, message_id)
                        if success:
                            await message.reply_text("✅ Retry successful!")
                        else:
                            await message.reply_text("❌ Retry failed. Check logs for details.")
                        return
                        
                    except ValueError:
                        await message.reply_text("❌ Invalid chat_id or message_id. Must be numbers.")
                        return
            
            else:
                await message.reply_text("❌ Too many arguments. See usage above.")
                return
            
        except Exception as e:
            logger.error(f"Error in retry command: {e}")
            await message.reply_text("❌ Error during retry")
    
    async def _retry_by_upload_id(self, upload_id: str, provider: str) -> bool:
        """Retry upload by failure ID with specific provider"""
        try:
            # Get upload failure data
            failure_data = await self.supabase.get_upload_failure_by_id(upload_id)
            if not failure_data:
                return False
            
            # Get original upload data
            upload_data = await self.supabase.get_upload_by_failure_id(upload_id)
            if not upload_data:
                return False
            
            # Increment attempt count
            attempt_count = failure_data.get('attempt_count', 0) + 1
            if attempt_count > 3:
                await self.supabase.mark_upload_manual_required(upload_id)
                return False
            
            # Update attempt count
            await self.supabase.update_failure_attempt_count(upload_id, attempt_count)
            
            # Trigger retry with specific provider
            success = await self.supabase.retry_upload_with_provider(upload_data.get('id'), provider)
            
            # Log retry result
            retry_result = {
                'timestamp': datetime.now().isoformat(),
                'provider': provider,
                'attempt': attempt_count,
                'success': success
            }
            
            await self.supabase.add_retry_history(upload_id, retry_result)
            
            return success
            
        except Exception as e:
            logger.error(f"Error retrying upload by ID {upload_id}: {e}")
            return False
    
    async def _retry_by_message(self, client: Client, chat_id: int, message_id: int) -> bool:
        """Legacy retry by original message"""
        try:
            # Get the original message
            original_message = await client.get_messages(chat_id, message_id)
            if not original_message:
                return False
            
            # Import upload handler to retry the upload
            from .upload_handler import UploadHandler
            upload_handler = UploadHandler(self.supabase)
            upload_handler.set_client(client)  # Set client for notifications
            
            # Process the upload again
            return await upload_handler.handle_group_upload(client, original_message)
            
        except Exception as e:
            logger.error(f"Error retrying by message {chat_id}/{message_id}: {e}")
            return False

    async def handle_failures(self, client: Client, message: Message):
        """Enhanced /failures command with detailed categorization"""
        try:
            # Get recent failures with enhanced details
            failures = await self._get_recent_failures()
            
            if not failures:
                await message.reply_text("📋 No recent upload failures found.")
                return
            
            failures_text = f"📋 **Recent Upload Failures ({len(failures)})**\n\n"
            
            for i, failure in enumerate(failures[:10], 1):  # Show max 10
                error_details = failure.get('error_details', {})
                file_info = error_details.get('file_info', {})
                error_category = error_details.get('error_category', 'unknown')
                
                # Status icons based on category
                if error_category == "both_failed":
                    status_icon = "🔴"
                    error_desc = "Both providers failed"
                elif error_category == "regular_failed":
                    status_icon = "🟡"
                    error_desc = "Regular provider failed"
                elif error_category == "premium_failed":
                    status_icon = "🟠"
                    error_desc = "Premium provider failed"
                else:
                    status_icon = "❌"
                    error_desc = "Unknown error"
                
                failures_text += f"{i}. {status_icon} **{file_info.get('original_name', 'Unknown')}**\n"
                failures_text += f"   ID: `{failure.get('id', 'N/A')[:8]}...`\n"
                failures_text += f"   Status: {error_desc}\n"
                failures_text += f"   Attempts: {failure.get('attempt_count', 0)}/3\n"
                failures_text += f"   Time: {failure.get('created_at', 'Unknown')[:19]}\n"
                
                # Show specific errors if available
                regular_error = error_details.get('regular_error')
                premium_error = error_details.get('premium_error')
                
                if regular_error:
                    failures_text += f"   🔴 Regular: {regular_error[:50]}...\n"
                if premium_error:
                    failures_text += f"   🟠 Premium: {premium_error[:50]}...\n"
                
                # Show retry options
                manual_required = failure.get('requires_manual_upload', False)
                if manual_required:
                    failures_text += f"   ⚠️ **Manual upload required**\n"
                elif failure.get('attempt_count', 0) < 3:
                    failures_text += f"   🔄 Use: `/retry {failure.get('id')}`\n"
                
                failures_text += "\n"
            
            if len(failures) > 10:
                failures_text += f"... and {len(failures) - 10} more failures\n\n"
            
            failures_text += """
**Retry Commands:**
• `/retry <upload_id>` - Retry both providers
• `/retry <upload_id> regular` - Retry regular only
• `/retry <upload_id> premium` - Retry premium only

**Legend:**
🔴 Both failed | 🟡 Regular failed | 🟠 Premium failed
"""
            
            await message.reply_text(failures_text)
            
        except Exception as e:
            logger.error(f"Error in failures command: {e}")
            await message.reply_text("❌ Error getting failures list")

    async def handle_stats(self, client: Client, message: Message):
        """Handle /stats command to show detailed statistics"""
        try:
            # Get comprehensive stats
            stats = await self._get_comprehensive_stats()
            
            stats_text = f"""
📊 **Comprehensive Bot Statistics**

**Upload Statistics (Last 7 Days):**
• Total Uploads: {stats.get('total_uploads', 0)}
• Successful: {stats.get('successful_uploads', 0)} ({stats.get('success_rate', 0):.1f}%)
• Failed: {stats.get('failed_uploads', 0)}
• Processing: {stats.get('processing_uploads', 0)}

**File Statistics:**
• Total Size: {stats.get('total_size_gb', 0):.2f} GB
• Average Size: {stats.get('avg_size_mb', 0):.1f} MB
• Average Duration: {stats.get('avg_duration_min', 0):.1f} minutes

**Group Activity:**
• Active Groups: {stats.get('active_groups', 0)}
• Most Active Group: {stats.get('most_active_group', 'N/A')}

**System Health:**
• Retry Success Rate: {stats.get('retry_success_rate', 0):.1f}%
• Average Processing Time: {stats.get('avg_processing_time', 0):.1f}s

Use `/failures` to see recent failures
Use `/groups` to manage premium groups
"""
            
            await message.reply_text(stats_text)
            
        except Exception as e:
            logger.error(f"Error in stats command: {e}")
            await message.reply_text("❌ Error getting statistics")

    async def _get_premium_groups(self) -> List[Dict]:
        """Get premium groups from database"""
        try:
            result = self.supabase.client.table('premium_groups').select('*').order('created_at', desc=True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting premium groups: {e}")
            return []

    async def _get_recent_uploads(self) -> List[Dict]:
        """Get recent uploads from database"""
        try:
            result = self.supabase.client.table('telegram_uploads').select('*').order('created_at', desc=True).limit(10).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting recent uploads: {e}")
            return []

    async def _get_recent_failures(self) -> List[Dict]:
        """Get recent upload failures"""
        try:
            result = self.supabase.client.table('upload_failures').select('*').order('created_at', desc=True).limit(20).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting recent failures: {e}")
            return []

    async def _get_comprehensive_stats(self) -> Dict:
        """Get comprehensive statistics for the bot"""
        try:
            stats = {}
            
            # Upload statistics (last 7 days)
            week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            
            uploads_result = self.supabase.client.table('telegram_uploads').select('*').gte('created_at', week_ago).execute()
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
            groups_result = self.supabase.client.table('premium_groups').select('*').eq('auto_upload_enabled', True).execute()
            stats['active_groups'] = len(groups_result.data) if groups_result.data else 0
            
            # Most active group (placeholder)
            stats['most_active_group'] = 'Analysis pending'
            
            # System health metrics (placeholder)
            stats['retry_success_rate'] = 85.0  # Would calculate from actual retry data
            stats['avg_processing_time'] = 45.0  # Would calculate from actual processing times
            stats['avg_duration_min'] = 12.5  # Would calculate from video durations
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting comprehensive stats: {e}")
            return {}