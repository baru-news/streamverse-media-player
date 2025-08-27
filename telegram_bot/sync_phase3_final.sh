#!/bin/bash
# Phase 3: Final files and complete verification for 100% sync

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}❌ $1${NC}"; }

verify_file() {
    local filepath=$1
    local expected_lines=$2
    local description=$3
    
    if [ ! -f "$filepath" ]; then
        error "$description: File not found at $filepath"
        return 1
    fi
    
    local actual_lines=$(wc -l < "$filepath")
    if [ "$actual_lines" -ne "$expected_lines" ]; then
        error "$description: Line count mismatch. Expected: $expected_lines, Got: $actual_lines"
        return 1
    fi
    
    success "$description: ✓ $actual_lines lines (correct)"
    return 0
}

BOT_DIR="/opt/telegram-bot/telegram_bot"

echo ""
echo "📄 FASE 3C: FINAL CRITICAL FILES"
echo "================================"

echo ""
echo "📝 Creating admin_handler.py (277 lines)..."
cat > $BOT_DIR/handlers/admin_handler.py << 'ADMIN_EOF'
import logging
from typing import Dict, Any
from pyrogram import Client
from pyrogram.types import Message, Chat
from pyrogram.errors import PeerIdInvalid, FloodWait, ChannelPrivate

class AdminHandler:
    """Handler for admin commands and operations"""
    
    def __init__(self, supabase):
        """Initialize admin handler with Supabase client"""
        self.supabase = supabase
        self.logger = logging.getLogger(__name__)

    async def handle_admin_command(self, client: Client, message: Message):
        """Handle the /admin command - show admin panel"""
        try:
            user_id = message.from_user.id
            
            if not self.is_admin(user_id):
                await message.reply("❌ You don't have admin privileges.")
                return
            
            self.logger.info(f"Admin command from user {user_id}")
            
            # Get stats
            groups_count = self.get_premium_groups_count()
            
            admin_panel = f"""
🔧 **ADMIN PANEL**
==================

**System Status:**
• 🏆 Premium Groups: {groups_count}
• 🤖 Bot Status: Active
• 📊 Database: Connected

**Available Commands:**
• `/groups` - List all premium groups
• `/addgroup` - Add new premium group
• `/sync` - Sync Doodstream videos
• `/status` - Check your admin status

**Quick Actions:**
• Forward any group message to me to get chat info
• Use chat ID to quickly add premium groups

**System Info:**
• All uploads are automatically processed
• Premium groups have auto-upload enabled
• Failed uploads are logged for review

Ready for admin tasks! 🚀
            """
            
            await message.reply(admin_panel)
            
        except Exception as e:
            self.logger.error(f"Error in handle_admin_command: {e}")
            await message.reply("❌ Error accessing admin panel.")

    async def handle_list_groups(self, client: Client, message: Message):
        """Handle /groups command - list premium groups"""
        try:
            user_id = message.from_user.id
            
            if not self.is_admin(user_id):
                await message.reply("❌ You don't have admin privileges.")
                return
            
            self.logger.info(f"Groups list requested by admin {user_id}")
            
            groups = self.supabase.get_premium_groups()
            
            if not groups:
                await message.reply("""
📊 **Premium Groups List**

No premium groups configured yet.

Use `/addgroup <chat_id>` to add groups.
                """)
                return
            
            groups_text = "📊 **Premium Groups List**\n\n"
            
            for i, group in enumerate(groups, 1):
                chat_id = group.get('chat_id')
                title = group.get('chat_title', 'Unknown')
                auto_upload = "✅" if group.get('auto_upload_enabled') else "❌"
                
                groups_text += f"""
**{i}. {title}**
• 🆔 Chat ID: `{chat_id}`
• 🔄 Auto Upload: {auto_upload}
• 📅 Added: {group.get('created_at', 'Unknown')[:10]}
                """
            
            groups_text += f"\n**Total Groups: {len(groups)}**"
            
            await message.reply(groups_text)
            
        except Exception as e:
            self.logger.error(f"Error in handle_list_groups: {e}")
            await message.reply("❌ Error retrieving groups list.")

    async def handle_add_group(self, client: Client, message: Message):
        """Handle /addgroup command - add premium group"""
        try:
            user_id = message.from_user.id
            
            if not self.is_admin(user_id):
                await message.reply("❌ You don't have admin privileges.")
                return
            
            # Parse command
            command_parts = message.text.split()
            if len(command_parts) < 2:
                await message.reply("""
❌ **Invalid Command Format**

**Usage:** `/addgroup <chat_id>`

**Example:** `/addgroup -1001234567890`

**How to get Chat ID:**
1. Forward any message from the group to me
2. I'll show you the chat ID
3. Use that ID with this command

Or add me to the group and I'll show the ID.
                """)
                return
            
            try:
                chat_id = int(command_parts[1])
            except ValueError:
                await message.reply("❌ Invalid chat ID. Must be a number.")
                return
            
            self.logger.info(f"Adding group {chat_id} by admin {user_id}")
            
            # Check if group already exists
            existing_groups = self.supabase.get_premium_groups()
            for group in existing_groups:
                if group.get('chat_id') == chat_id:
                    await message.reply(f"""
✅ **Group Already Added**

Chat ID `{chat_id}` is already in the premium groups list.

Use `/groups` to see all premium groups.
                    """)
                    return
            
            # Try to get chat info
            chat_title = "Unknown Group"
            try:
                chat_info = await client.get_chat(chat_id)
                chat_title = chat_info.title or f"Chat {chat_id}"
            except (PeerIdInvalid, ChannelPrivate):
                chat_title = f"Private Chat {chat_id}"
            except Exception as e:
                self.logger.warning(f"Could not get chat info for {chat_id}: {e}")
                chat_title = f"Group {chat_id}"
            
            # Add to database
            profile = self.supabase.get_profile_by_telegram_id(user_id)
            admin_id = profile.get('id') if profile else str(user_id)
            
            success = self.supabase.add_premium_group(chat_id, chat_title, admin_id)
            
            if success:
                await message.reply(f"""
✅ **Premium Group Added Successfully!**

**Group Details:**
• 📝 Title: {chat_title}
• 🆔 Chat ID: `{chat_id}`
• 🔄 Auto Upload: Enabled
• 👤 Added by: You

The group is now configured for automatic video uploads!

Use `/groups` to see all premium groups.
                """)
            else:
                await message.reply("❌ Failed to add group to database.")
            
        except Exception as e:
            self.logger.error(f"Error in handle_add_group: {e}")
            await message.reply("❌ Error adding group.")

    async def handle_sync_command(self, client: Client, message: Message):
        """Handle manual sync command for Doodstream"""
        try:
            user_id = message.from_user.id
            
            if not self.is_admin(user_id):
                await message.reply("❌ You don't have admin privileges.")
                return
            
            self.logger.info(f"Manual sync requested by admin {user_id}")
            
            sync_msg = await message.reply("🔄 Starting Doodstream sync...")
            
            # Call sync function
            result = self.supabase.sync_doodstream_videos()
            
            if result and result.get('success'):
                await sync_msg.edit_text("""
✅ **Sync Completed Successfully!**

Doodstream videos have been synchronized with the database.

Check the website to see updated video listings.
                """)
            else:
                error_msg = result.get('error', 'Unknown error') if result else 'No response'
                await sync_msg.edit_text(f"""
❌ **Sync Failed**

Error: {error_msg}

Please check the logs and try again.
                """)
            
        except Exception as e:
            self.logger.error(f"Error in handle_sync_command: {e}")
            await message.reply("❌ Error during sync operation.")

    async def handle_forward_info(self, client: Client, message: Message):
        """Handle forwarded messages to show chat info"""
        try:
            user_id = message.from_user.id
            
            if not self.is_admin(user_id):
                return  # Silently ignore for non-admins
            
            forward_from = message.forward_from_chat
            if not forward_from:
                return  # Not a forwarded message from chat
            
            chat_id = forward_from.id
            chat_title = forward_from.title or "Unknown"
            chat_type = forward_from.type.name if forward_from.type else "unknown"
            
            self.logger.info(f"Forwarded message info requested by admin {user_id} for chat {chat_id}")
            
            info_text = f"""
📋 **Chat Information**

**Details:**
• 📝 Title: {chat_title}
• 🆔 Chat ID: `{chat_id}`
• 📱 Type: {chat_type}

**Quick Actions:**
To add as premium group, use:
`/addgroup {chat_id}`

**Current Status:**
"""
            
            # Check if already premium group
            groups = self.supabase.get_premium_groups()
            is_premium = any(g.get('chat_id') == chat_id for g in groups)
            
            if is_premium:
                info_text += "✅ Already configured as premium group"
            else:
                info_text += "❌ Not configured as premium group"
            
            await message.reply(info_text)
            
        except Exception as e:
            self.logger.error(f"Error in handle_forward_info: {e}")

    def is_admin(self, telegram_user_id: int) -> bool:
        """Check if user has admin privileges"""
        try:
            return self.supabase.is_telegram_admin(telegram_user_id)
        except Exception as e:
            self.logger.error(f"Error checking admin status: {e}")
            return False

    def get_premium_groups_count(self) -> int:
        """Get count of premium groups"""
        try:
            groups = self.supabase.get_premium_groups()
            return len(groups) if groups else 0
        except Exception as e:
            self.logger.error(f"Error getting groups count: {e}")
            return 0
ADMIN_EOF

verify_file "$BOT_DIR/handlers/admin_handler.py" 277 "handlers/admin_handler.py"

echo ""
echo "📝 Creating progress_tracker.py (165 lines)..."
cat > $BOT_DIR/utils/progress_tracker.py << 'PROGRESS_EOF'
import logging
import asyncio
from typing import Optional, Callable, Dict, Any
from pyrogram.types import Message

class ProgressTracker:
    """Track and display upload/download progress"""
    
    def __init__(self):
        """Initialize progress tracker"""
        self.logger = logging.getLogger(__name__)
        self.active_transfers = {}

    async def track_download_progress(self, 
                                    client, 
                                    message: Message, 
                                    file_info: Dict[str, Any],
                                    status_message: Message) -> Optional[str]:
        """
        Track download progress with live updates
        
        Args:
            client: Pyrogram client
            message: Original message with file
            file_info: File information dictionary
            status_message: Status message to update
            
        Returns:
            Path to downloaded file or None if failed
        """
        try:
            file_id = file_info['file_id']
            file_size = file_info.get('file_size', 0)
            filename = file_info.get('file_name', f'file_{file_id}')
            
            self.logger.info(f"Starting download of {filename} ({file_size} bytes)")
            
            # Initialize progress tracking
            progress_data = {
                'downloaded': 0,
                'total': file_size,
                'percentage': 0,
                'last_update': 0
            }
            
            self.active_transfers[file_id] = progress_data
            
            # Progress callback function
            async def progress_callback(current: int, total: int):
                try:
                    if file_id not in self.active_transfers:
                        return
                    
                    # Update progress data
                    progress_data['downloaded'] = current
                    progress_data['total'] = total
                    progress_data['percentage'] = (current / total * 100) if total > 0 else 0
                    
                    # Only update every 5% or every 10 seconds to avoid spam
                    import time
                    current_time = time.time()
                    percentage_diff = abs(progress_data['percentage'] - progress_data['last_update'])
                    
                    if percentage_diff >= 5 or (current_time - progress_data.get('last_time', 0)) >= 10:
                        await self._update_download_status(status_message, progress_data, filename)
                        progress_data['last_update'] = progress_data['percentage']
                        progress_data['last_time'] = current_time
                        
                except Exception as e:
                    self.logger.error(f"Error in progress callback: {e}")
            
            # Start download
            try:
                file_path = await client.download_media(
                    message=message,
                    file_name=f"/opt/telegram-bot/downloads/{filename}",
                    progress=progress_callback
                )
                
                # Final update
                if file_path:
                    await status_message.edit_text(
                        f"✅ **Download Complete**\n\n"
                        f"📁 **File:** {filename}\n"
                        f"📊 **Size:** {self._format_size(file_size)}\n"
                        f"🔄 **Next:** Uploading to Doodstream..."
                    )
                    self.logger.info(f"Download completed: {file_path}")
                else:
                    await status_message.edit_text("❌ **Download Failed**")
                    self.logger.error("Download failed - no file path returned")
                
                return file_path
                
            except Exception as e:
                await status_message.edit_text(f"❌ **Download Failed:** {str(e)}")
                self.logger.error(f"Download error: {e}")
                return None
            
            finally:
                # Clean up tracking
                if file_id in self.active_transfers:
                    del self.active_transfers[file_id]
        
        except Exception as e:
            self.logger.error(f"Error in track_download_progress: {e}")
            return None

    async def _update_download_status(self, 
                                    status_message: Message, 
                                    progress_data: Dict, 
                                    filename: str):
        """Update download status message"""
        try:
            downloaded = progress_data['downloaded']
            total = progress_data['total']
            percentage = progress_data['percentage']
            
            # Create progress bar
            progress_bar = self._create_progress_bar(percentage)
            
            status_text = f"""
🔄 **Downloading File**

📁 **File:** {filename}
📊 **Progress:** {progress_bar} {percentage:.1f}%
📈 **Downloaded:** {self._format_size(downloaded)} / {self._format_size(total)}

⏳ Please wait while the file downloads...
            """
            
            await status_message.edit_text(status_text)
            
        except Exception as e:
            # Don't log edit errors as they're common due to rate limits
            pass

    def _create_progress_bar(self, percentage: float, length: int = 10) -> str:
        """Create a text progress bar"""
        filled = int(length * percentage / 100)
        bar = "█" * filled + "░" * (length - filled)
        return f"[{bar}]"

    def _format_size(self, size_bytes: int) -> str:
        """Format file size in human readable format"""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB"]
        import math
        i = int(math.floor(math.log(size_bytes, 1024)))
        p = math.pow(1024, i)
        s = round(size_bytes / p, 2)
        return f"{s} {size_names[i]}"

    async def show_upload_progress(self, 
                                 status_message: Message, 
                                 filename: str, 
                                 stage: str = "uploading"):
        """Show upload progress with spinning animation"""
        try:
            spinner_chars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
            
            for i in range(20):  # Show spinner for a bit
                char = spinner_chars[i % len(spinner_chars)]
                
                if stage == "uploading":
                    text = f"""
{char} **Uploading to Doodstream**

📁 **File:** {filename}
🔄 **Status:** Processing upload...
⏳ **Please wait:** This may take several minutes for large files

The file is being uploaded and processed on Doodstream servers.
                    """
                elif stage == "processing":
                    text = f"""
{char} **Processing Video**

📁 **File:** {filename}
🔄 **Status:** Server processing...
⏳ **Please wait:** Generating thumbnails and metadata

Your video is being processed and will be available shortly.
                    """
                
                try:
                    await status_message.edit_text(text)
                    await asyncio.sleep(0.5)
                except:
                    break  # Stop if we can't edit anymore
                    
        except Exception as e:
            self.logger.error(f"Error in show_upload_progress: {e}")

    def cleanup_transfer(self, file_id: str):
        """Clean up tracking data for a transfer"""
        if file_id in self.active_transfers:
            del self.active_transfers[file_id]

    def get_active_transfers_count(self) -> int:
        """Get number of active transfers"""
        return len(self.active_transfers)
PROGRESS_EOF

verify_file "$BOT_DIR/utils/progress_tracker.py" 165 "utils/progress_tracker.py"

echo ""
success "FASE 3C completed: All remaining files created and verified!"

echo ""
echo "🔧 FASE 4: FINAL ENVIRONMENT SETUP"
echo "=================================="

log "Setting final permissions..."
sudo chown -R telegram-bot:telegram-bot $BOT_DIR
find $BOT_DIR -name "*.py" -exec chmod 644 {} \;
success "Final permissions set"

echo ""
echo "✅ COMPLETE 100% SYNCHRONIZATION FINISHED!"
echo "========================================="
echo ""
echo "📋 ALL FILES VERIFIED:"
echo "• ✅ main.py (181 lines)"
echo "• ✅ config.py (130 lines)"  
echo "• ✅ supabase_client.py (297 lines)"
echo "• ✅ handlers/__init__.py (15 lines)"
echo "• ✅ handlers/auth_handler.py (200 lines)"
echo "• ✅ handlers/admin_handler.py (277 lines)"
echo "• ✅ utils/__init__.py (1 line)"
echo "• ✅ utils/logger_setup.py (88 lines)"
echo "• ✅ utils/progress_tracker.py (165 lines)"
echo ""
echo "📋 STILL NEED:"
echo "• Create file_handler.py (391 lines) - CRITICAL!"
echo "• Setup .env file with your credentials"
echo "• Test bot startup"
echo ""
echo "🎯 NEXT STEP: Run sync_file_handler.sh to create the final critical file!"