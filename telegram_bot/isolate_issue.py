#!/usr/bin/env python3
"""
Isolate which module is causing the proxy parameter issue
"""

import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_step_by_step():
    """Test imports one by one to isolate the issue"""
    
    logger.info("=== Step-by-step Import Testing ===")
    
    # Step 1: Basic pyrogram
    try:
        logger.info("Step 1: Testing basic pyrogram import...")
        from pyrogram import Client
        logger.info("✅ Basic pyrogram import successful")
    except Exception as e:
        logger.error(f"❌ Basic pyrogram failed: {e}")
        return
    
    # Step 2: Test config
    try:
        logger.info("Step 2: Testing config import...")
        from config import Config
        config = Config()
        logger.info("✅ Config import successful")
    except Exception as e:
        logger.error(f"❌ Config import failed: {e}")
        return
    
    # Step 3: Test supabase_client
    try:
        logger.info("Step 3: Testing supabase_client import...")
        from supabase_client import SupabaseManager
        supabase = SupabaseManager()
        logger.info("✅ SupabaseManager import successful")
    except Exception as e:
        logger.error(f"❌ SupabaseManager import failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 4: Test handlers
    try:
        logger.info("Step 4: Testing handlers import...")
        from handlers.file_handler import FileHandler
        from handlers.auth_handler import AuthHandler
        from handlers.admin_handler import AdminHandler
        logger.info("✅ All handlers import successful")
    except Exception as e:
        logger.error(f"❌ Handlers import failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 5: Test logger setup
    try:
        logger.info("Step 5: Testing logger setup...")
        from utils.logger_setup import setup_logging
        logger.info("✅ Logger setup import successful")
    except Exception as e:
        logger.error(f"❌ Logger setup failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 6: Test TelegramBot class creation (without pyrogram Client)
    try:
        logger.info("Step 6: Testing TelegramBot class creation...")
        
        class TestBot:
            def __init__(self):
                self.config = Config()
                self.supabase = SupabaseManager()
                self.file_handler = FileHandler(self.supabase)
                self.auth_handler = AuthHandler(self.supabase)
                self.admin_handler = AdminHandler(self.supabase)
                
        test_bot = TestBot()
        logger.info("✅ TestBot creation successful")
        
    except Exception as e:
        logger.error(f"❌ TestBot creation failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 7: Test Client creation with exact main.py parameters
    try:
        logger.info("Step 7: Testing Client creation with main.py parameters...")
        
        client = Client(
            "telegram_bot",
            api_id=config.API_ID,
            api_hash=config.API_HASH,
            phone_number=config.PHONE_NUMBER,
            workdir=config.SESSION_DIR
        )
        logger.info("✅ Client creation with main.py parameters successful!")
        
    except Exception as e:
        logger.error(f"❌ Client creation with main.py parameters failed: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return
    
    logger.info("🎉 All tests passed! The issue might be timing-related or environmental.")

if __name__ == "__main__":
    test_step_by_step()