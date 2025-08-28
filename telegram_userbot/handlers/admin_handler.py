"""
Admin Handler for Telegram User Bot
Handles admin commands and management
"""

import logging
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