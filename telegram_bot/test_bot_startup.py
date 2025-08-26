#!/usr/bin/env python3
"""
Test script to check bot configuration and startup
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_config():
    """Test configuration loading"""
    try:
        from config import Config
        
        logger.info("Testing configuration...")
        config = Config()
        
        logger.info("✅ Configuration loaded successfully")
        logger.info(f"API ID: {config.API_ID}")
        logger.info(f"Phone: {config.PHONE_NUMBER}")
        logger.info(f"Session Dir: {config.SESSION_DIR}")
        logger.info(f"Download Dir: {config.DOWNLOAD_DIR}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Configuration failed: {e}")
        return False

async def test_supabase():
    """Test Supabase connection"""
    try:
        from supabase_client import SupabaseManager
        
        logger.info("Testing Supabase connection...")
        supabase = SupabaseManager()
        
        # Test a simple RPC call
        result = await supabase._call_rpc('is_telegram_admin', {'telegram_user_id_param': 12345})
        logger.info(f"✅ Supabase connection working: {result}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {e}")
        return False

async def test_pyrogram_client():
    """Test Pyrogram client creation"""
    try:
        from config import Config
        from pyrogram import Client
        
        logger.info("Testing Pyrogram client creation...")
        config = Config()
        
        client = Client(
            "test_session",
            api_id=config.API_ID,
            api_hash=config.API_HASH,
            phone_number=config.PHONE_NUMBER,
            workdir=config.SESSION_DIR
        )
        
        logger.info("✅ Pyrogram client created successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Pyrogram client creation failed: {e}")
        return False

async def main():
    """Run all tests"""
    logger.info("🚀 Starting bot diagnostics...")
    
    # Test configuration
    config_ok = await test_config()
    if not config_ok:
        logger.error("Configuration test failed - check your .env file")
        return False
    
    # Test Supabase
    supabase_ok = await test_supabase()
    if not supabase_ok:
        logger.error("Supabase test failed - check your credentials")
        return False
    
    # Test Pyrogram
    pyrogram_ok = await test_pyrogram_client()
    if not pyrogram_ok:
        logger.error("Pyrogram test failed - check your API credentials")
        return False
    
    logger.info("🎉 All tests passed! Bot should be ready to start.")
    return True

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        if result:
            print("\n✅ Bot configuration is working properly!")
            print("You can now start the bot with: python main.py")
        else:
            print("\n❌ Bot configuration has issues. Please fix the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nCritical error during testing: {e}")
        sys.exit(1)