"""
Authentication Handler for Telegram User Bot
Handles account linking with Supabase
"""

import logging
import secrets
import string
from pyrogram import Client
from pyrogram.types import Message
from utils.supabase_client import SupabaseManager

logger = logging.getLogger(__name__)

class AuthHandler:
    def __init__(self, supabase: SupabaseManager):
        self.supabase = supabase

    async def handle_link_account(self, client: Client, message: Message):
        """Handle account linking with Supabase"""
        try:
            user = message.from_user
            if not user:
                await message.reply_text("❌ Cannot identify user")
                return
            
            # Check if user is already linked
            if await self._is_user_linked(user.id):
                await message.reply_text("✅ Your Telegram account is already linked to Supabase!")
                return
            
            # Generate unique linking code
            link_code = self._generate_link_code()
            
            # Store linking code in database
            code_data = {
                'code': link_code,
                'telegram_user_id': user.id,
                'telegram_username': user.username or user.first_name
            }
            
            result = await self.supabase.client.table('telegram_link_codes').insert(code_data).execute()
            
            if not result.data:
                await message.reply_text("❌ Failed to generate linking code")
                return
            
            link_message = f"""
🔗 **Account Linking**

Your linking code: `{link_code}`

**How to link your account:**
1. Go to your website profile
2. Look for "Link Telegram Account" option
3. Enter this code: `{link_code}`
4. Your accounts will be linked!

**Note:** This code expires in 10 minutes for security.

Once linked, you can:
• Upload videos through this bot
• Access premium features
• Get notifications about your uploads
"""
            
            await message.reply_text(link_message)
            logger.info(f"Generated link code for user {user.id} (@{user.username})")
            
        except Exception as e:
            logger.error(f"Error in link account: {e}")
            await message.reply_text("❌ Error generating link code")

    async def _is_user_linked(self, telegram_user_id: int) -> bool:
        """Check if user is already linked"""
        try:
            result = await self.supabase.client.table('profiles').select('id').eq('telegram_user_id', telegram_user_id).execute()
            return bool(result.data)
        except Exception as e:
            logger.error(f"Error checking user link status: {e}")
            return False

    def _generate_link_code(self) -> str:
        """Generate secure 8-character linking code"""
        characters = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(characters) for _ in range(8))