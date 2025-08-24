"""
Authentication handler for Telegram Bot
Handles user account linking and status checks
"""

import logging
from typing import Optional, Dict

from pyrogram import Client
from pyrogram.types import Message

from supabase_client import SupabaseManager

logger = logging.getLogger(__name__)

class AuthHandler:
    """Handles authentication and account linking"""
    
    def __init__(self, supabase: SupabaseManager):
        self.supabase = supabase
    
    async def handle_start(self, client: Client, message: Message):
        """Handle /start command"""
        try:
            user = message.from_user
            
            # Check if user already has linked account
            profile = await self.supabase.get_profile_by_telegram_id(user.id)
            
            if profile:
                # User is already linked
                is_premium = await self.supabase.is_premium_user(profile['id'])
                premium_text = "✨ **Premium User**" if is_premium else "🆓 **Free User**"
                
                welcome_text = f"""
👋 **Welcome back, {user.first_name}!**

🔗 **Account Status:** Linked
👤 **Username:** @{profile.get('username', 'Not set')}
💎 **Subscription:** {premium_text}

🎬 **Ready to upload videos!**
• Send any video file (up to 2GB) to upload
• Use `/help` to see all available commands
• Use `/status` to check your account details
                """.strip()
            else:
                # User needs to link account
                welcome_text = f"""
👋 **Welcome to the Video Upload Bot, {user.first_name}!**

🔗 **Account Setup Required**

To start uploading videos, you need to link your Telegram account:

1️⃣ Use the `/link` command to get a linking code
2️⃣ Visit our website and enter the code
3️⃣ Start uploading videos up to 2GB!

💡 **Features:**
• Upload videos directly through Telegram
• Automatic processing and hosting
• Premium users get priority processing
• Support for all major video formats

Type `/help` for more information or `/link` to get started!
                """.strip()
            
            await message.reply_text(welcome_text)
            
        except Exception as e:
            logger.error(f"Error in start handler: {e}")
            await message.reply_text(
                "❌ **Error**\n\n"
                "Something went wrong. Please try again later."
            )
    
    async def handle_link_account(self, client: Client, message: Message):
        """Handle /link command - generate linking code"""
        try:
            user = message.from_user
            
            # Check if already linked
            profile = await self.supabase.get_profile_by_telegram_id(user.id)
            if profile:
                await message.reply_text(
                    "✅ **Account Already Linked**\n\n"
                    f"Your Telegram account is already linked to: @{profile.get('username', 'Unknown')}\n\n"
                    "You can start uploading videos right away!\n"
                    "Use `/status` to see your account details."
                )
                return
            
            # Generate link code
            username = user.username or f"{user.first_name}_{user.id}"
            link_code = await self.supabase.create_telegram_link_code(user.id, username)
            
            if link_code:
                link_text = f"""
🔗 **Account Linking**

📋 **Your Link Code:** `{link_code}`

**Steps to link your account:**

1️⃣ Visit our website
2️⃣ Go to your Profile settings
3️⃣ Find "Link Telegram Account" section
4️⃣ Enter this code: `{link_code}`
5️⃣ Click "Link Account"

⏰ **Note:** This code expires in 10 minutes
🔄 Use `/link` again if you need a new code

Once linked, you can upload videos directly through this bot!
                """.strip()
                
                await message.reply_text(link_text)
            else:
                await message.reply_text(
                    "❌ **Link Code Generation Failed**\n\n"
                    "Unable to generate linking code. Please try again later."
                )
                
        except Exception as e:
            logger.error(f"Error in link handler: {e}")
            await message.reply_text(
                "❌ **Error**\n\n"
                "Failed to generate linking code. Please try again later."
            )
    
    async def handle_status(self, client: Client, message: Message):
        """Handle /status command - show account status"""
        try:
            user = message.from_user
            
            # Get profile info
            profile = await self.supabase.get_profile_by_telegram_id(user.id)
            
            if not profile:
                await message.reply_text(
                    "❌ **Account Not Linked**\n\n"
                    "Your Telegram account is not linked yet.\n"
                    "Use `/link` to get a linking code and connect your account."
                )
                return
            
            # Check premium status
            is_premium = await self.supabase.is_premium_user(profile['id'])
            
            # Check if user is admin
            is_admin = await self.supabase.is_telegram_admin(user.id)
            
            # Build status message
            status_text = f"""
👤 **Account Status**

🔗 **Linked Account:** ✅ Connected
📝 **Username:** @{profile.get('username', 'Not set')}
📧 **Email:** {profile.get('email', 'Not set')}

💎 **Subscription:** {'✨ Premium' if is_premium else '🆓 Free'}
🛡️ **Admin Access:** {'✅ Yes' if is_admin else '❌ No'}

📊 **Telegram Info:**
• **User ID:** `{user.id}`
• **Username:** @{user.username or 'Not set'}
• **First Name:** {user.first_name}

🎬 **Upload Status:** Ready
📏 **Max File Size:** 2GB
🎯 **Supported Formats:** MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V, 3GP, MPEG

💡 **Tip:** {'Premium users get priority processing!' if not is_premium else 'Enjoy your premium benefits!'}
            """.strip()
            
            await message.reply_text(status_text)
            
        except Exception as e:
            logger.error(f"Error in status handler: {e}")
            await message.reply_text(
                "❌ **Error**\n\n"
                "Failed to retrieve account status. Please try again later."
            )
    
    async def get_user_profile(self, telegram_user_id: int) -> Optional[Dict]:
        """Get user profile by Telegram ID"""
        return await self.supabase.get_profile_by_telegram_id(telegram_user_id)
    
    async def is_user_linked(self, telegram_user_id: int) -> bool:
        """Check if Telegram user has linked account"""
        profile = await self.supabase.get_profile_by_telegram_id(telegram_user_id)
        return profile is not None
    
    async def is_user_admin(self, telegram_user_id: int) -> bool:
        """Check if Telegram user is admin"""
        return await self.supabase.is_telegram_admin(telegram_user_id)