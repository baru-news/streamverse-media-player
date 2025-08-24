"""
Admin handler for Telegram Bot
Handles admin commands and premium group management
"""

import logging
from typing import Optional, List, Dict

from pyrogram import Client
from pyrogram.types import Message

from supabase_client import SupabaseManager

logger = logging.getLogger(__name__)

class AdminHandler:
    """Handles admin commands and operations"""
    
    def __init__(self, supabase: SupabaseManager):
        self.supabase = supabase
    
    async def handle_admin_command(self, client: Client, message: Message):
        """Handle /admin command - admin panel"""
        try:
            user = message.from_user
            
            # Check if user is admin
            if not await self.supabase.is_telegram_admin(user.id):
                await message.reply_text(
                    "❌ **Access Denied**\n\n"
                    "You don't have admin privileges."
                )
                return
            
            admin_text = f"""
🛡️ **Admin Panel**

**Available Commands:**

📊 **Monitoring:**
• `/groups` - List premium groups
• `/status` - Check your admin status

🔧 **Management:**
• `/addgroup <chat_id>` - Add premium group for auto-upload
• `/sync` - Sync Doodstream videos manually

💡 **Usage Examples:**
• `/addgroup -1001234567890` - Add group for auto-upload
• `/groups` - See all premium groups

⚡ **Quick Actions:**
• Forward this message to a group to get its Chat ID
• Use bot in premium groups for automatic video processing

📈 **Bot Status:** ✅ Online and Ready
            """.strip()
            
            await message.reply_text(admin_text)
            
        except Exception as e:
            logger.error(f"Error in admin handler: {e}")
            await message.reply_text(
                "❌ **Error**\n\n"
                "Failed to load admin panel. Please try again later."
            )
    
    async def handle_list_groups(self, client: Client, message: Message):
        """Handle /groups command - list premium groups"""
        try:
            user = message.from_user
            
            # Check admin privileges
            if not await self.supabase.is_telegram_admin(user.id):
                await message.reply_text(
                    "❌ **Access Denied**\n\n"
                    "You don't have admin privileges."
                )
                return
            
            # Get premium groups
            groups = await self.supabase.get_premium_groups()
            
            if not groups:
                await message.reply_text(
                    "📊 **Premium Groups**\n\n"
                    "No premium groups configured yet.\n\n"
                    "Use `/addgroup <chat_id>` to add groups for auto-upload."
                )
                return
            
            # Build groups list
            groups_text = "📊 **Premium Groups with Auto-Upload**\n\n"
            
            for i, group in enumerate(groups, 1):
                chat_title = group.get('chat_title', 'Unknown Group')
                chat_id = group.get('chat_id')
                enabled = "✅" if group.get('auto_upload_enabled') else "❌"
                
                groups_text += f"""
**{i}. {chat_title}**
• **Chat ID:** `{chat_id}`
• **Auto-Upload:** {enabled}
• **Added:** {group.get('created_at', 'Unknown')[:10]}
                """.strip() + "\n\n"
            
            groups_text += f"**Total:** {len(groups)} premium groups"
            
            await message.reply_text(groups_text)
            
        except Exception as e:
            logger.error(f"Error listing groups: {e}")
            await message.reply_text(
                "❌ **Error**\n\n"
                "Failed to retrieve groups list. Please try again later."
            )
    
    async def handle_add_group(self, client: Client, message: Message):
        """Handle /addgroup command - add premium group"""
        try:
            user = message.from_user
            
            # Check admin privileges
            if not await self.supabase.is_telegram_admin(user.id):
                await message.reply_text(
                    "❌ **Access Denied**\n\n"
                    "You don't have admin privileges."
                )
                return
            
            # Parse chat ID from command
            parts = message.text.split()
            if len(parts) < 2:
                await message.reply_text(
                    "❌ **Invalid Command**\n\n"
                    "**Usage:** `/addgroup <chat_id>`\n\n"
                    "**Example:** `/addgroup -1001234567890`\n\n"
                    "💡 **Tip:** Forward a message from the group to see its Chat ID"
                )
                return
            
            try:
                chat_id = int(parts[1])
            except ValueError:
                await message.reply_text(
                    "❌ **Invalid Chat ID**\n\n"
                    "Chat ID must be a number.\n\n"
                    "**Example:** `/addgroup -1001234567890`"
                )
                return
            
            # Get chat info
            try:
                chat_info = await client.get_chat(chat_id)
                chat_title = chat_info.title or f"Chat {chat_id}"
            except Exception as e:
                logger.warning(f"Could not get chat info for {chat_id}: {e}")
                chat_title = f"Unknown Group {chat_id}"
            
            # Check if group already exists
            existing_groups = await self.supabase.get_premium_groups()
            for group in existing_groups:
                if group.get('chat_id') == chat_id:
                    await message.reply_text(
                        f"⚠️ **Group Already Added**\n\n"
                        f"**Group:** {group.get('chat_title', 'Unknown')}\n"
                        f"**Chat ID:** `{chat_id}`\n"
                        f"**Status:** {'✅ Active' if group.get('auto_upload_enabled') else '❌ Disabled'}"
                    )
                    return
            
            # Get admin profile for tracking
            admin_profile = await self.supabase.get_profile_by_telegram_id(user.id)
            admin_id = admin_profile['id'] if admin_profile else None
            
            # Add group to database
            success = await self.supabase.add_premium_group(chat_id, chat_title, admin_id)
            
            if success:
                await message.reply_text(
                    f"✅ **Premium Group Added**\n\n"
                    f"**Group:** {chat_title}\n"
                    f"**Chat ID:** `{chat_id}`\n"
                    f"**Auto-Upload:** ✅ Enabled\n\n"
                    f"Videos uploaded to this group will now be automatically processed!"
                )
            else:
                await message.reply_text(
                    "❌ **Failed to Add Group**\n\n"
                    "Database error occurred. Please try again later."
                )
                
        except Exception as e:
            logger.error(f"Error adding group: {e}")
            await message.reply_text(
                "❌ **Error**\n\n"
                "Failed to add premium group. Please try again later."
            )
    
    async def handle_sync_command(self, client: Client, message: Message):
        """Handle /sync command - manual Doodstream sync"""
        try:
            user = message.from_user
            
            # Check admin privileges
            if not await self.supabase.is_telegram_admin(user.id):
                await message.reply_text(
                    "❌ **Access Denied**\n\n"
                    "You don't have admin privileges."
                )
                return
            
            status_message = await message.reply_text(
                "🔄 **Syncing Videos**\n\n"
                "Fetching latest videos from Doodstream...\n"
                "This may take a moment..."
            )
            
            # Trigger sync
            result = await self.supabase.sync_doodstream_videos()
            
            if result and result.get('success'):
                await status_message.edit_text(
                    "✅ **Sync Completed**\n\n"
                    f"Successfully synced videos from Doodstream.\n"
                    f"Check the admin panel for details."
                )
            else:
                await status_message.edit_text(
                    "❌ **Sync Failed**\n\n"
                    "Failed to sync videos from Doodstream.\n"
                    "Please check the logs or try again later."
                )
                
        except Exception as e:
            logger.error(f"Error in sync command: {e}")
            await message.reply_text(
                "❌ **Error**\n\n"
                "Failed to sync videos. Please try again later."
            )
    
    async def handle_forward_info(self, client: Client, message: Message):
        """Handle forwarded messages to show chat info (for admins)"""
        try:
            user = message.from_user
            
            # Check admin privileges
            if not await self.supabase.is_telegram_admin(user.id):
                return
            
            if message.forward_from_chat:
                chat = message.forward_from_chat
                info_text = f"""
📊 **Chat Information**

**Title:** {chat.title}
**Type:** {chat.type.name.title()}
**Chat ID:** `{chat.id}`
**Username:** @{chat.username or 'None'}

💡 **To add as premium group:**
`/addgroup {chat.id}`
                """.strip()
                
                await message.reply_text(info_text)
                
        except Exception as e:
            logger.error(f"Error in forward info: {e}")
    
    async def is_admin(self, telegram_user_id: int) -> bool:
        """Check if user is admin"""
        return await self.supabase.is_telegram_admin(telegram_user_id)
    
    async def get_premium_groups_count(self) -> int:
        """Get count of premium groups"""
        groups = await self.supabase.get_premium_groups()
        return len(groups) if groups else 0