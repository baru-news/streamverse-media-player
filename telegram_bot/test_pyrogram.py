#!/usr/bin/env python3
"""
Minimal test script to isolate Pyrogram Client initialization issue
"""

import os
import sys
import logging
from pathlib import Path

# Set up minimal logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_pyrogram_import():
    """Test if pyrogram can be imported"""
    try:
        import pyrogram
        logger.info(f"✅ Pyrogram import successful - Version: {pyrogram.__version__}")
        return True
    except Exception as e:
        logger.error(f"❌ Pyrogram import failed: {e}")
        return False

def test_client_creation():
    """Test basic Client creation without actual connection"""
    try:
        from pyrogram import Client
        
        # Test with minimal parameters
        logger.info("Testing Client creation with minimal parameters...")
        
        # Get env vars
        api_id = os.getenv('TELEGRAM_API_ID')
        api_hash = os.getenv('TELEGRAM_API_HASH')
        phone = os.getenv('TELEGRAM_PHONE_NUMBER')
        
        if not all([api_id, api_hash, phone]):
            logger.error("❌ Missing required environment variables")
            logger.info("Required: TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_PHONE_NUMBER")
            return False
        
        # Create client instance (don't start it)
        client = Client(
            "test_session",
            api_id=int(api_id),
            api_hash=api_hash,
            phone_number=phone,
            workdir="/opt/telegram-bot/sessions"
        )
        
        logger.info("✅ Client creation successful!")
        logger.info(f"Client app version: {client.app_version}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Client creation failed: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False

def test_config_import():
    """Test if our config module works"""
    try:
        sys.path.append('/opt/telegram-bot/telegram_bot')
        from config import Config
        
        config = Config()
        logger.info("✅ Config import and initialization successful")
        logger.info(str(config))
        return True
        
    except Exception as e:
        logger.error(f"❌ Config import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_environment():
    """Check environment variables"""
    logger.info("=== Environment Check ===")
    
    required_vars = [
        'TELEGRAM_API_ID', 'TELEGRAM_API_HASH', 'TELEGRAM_PHONE_NUMBER',
        'SUPABASE_SERVICE_ROLE_KEY', 'DOODSTREAM_API_KEY'
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if 'key' in var.lower() or 'hash' in var.lower():
                masked = f"{value[:4]}...{value[-4:]}" if len(value) > 8 else "***"
                logger.info(f"✅ {var}: {masked}")
            else:
                logger.info(f"✅ {var}: {value}")
        else:
            logger.error(f"❌ {var}: Not set")
    
    # Check for any proxy-related env vars
    proxy_vars = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 
                  'TELEGRAM_PROXY', 'PROXY_URL', 'PROXY_HOST', 'PROXY_PORT']
    
    proxy_found = False
    for var in proxy_vars:
        value = os.getenv(var)
        if value:
            logger.warning(f"⚠️  Proxy variable found: {var}={value}")
            proxy_found = True
    
    if not proxy_found:
        logger.info("✅ No proxy environment variables found")

def main():
    """Run all tests"""
    logger.info("=== Pyrogram Diagnostic Test ===")
    
    # Check environment
    check_environment()
    
    # Test pyrogram import
    if not test_pyrogram_import():
        return
    
    # Test config import
    if not test_config_import():
        return
    
    # Test client creation
    if test_client_creation():
        logger.info("🎉 All tests passed! The issue might be elsewhere.")
    else:
        logger.error("💥 Client creation failed - this is the root cause!")

if __name__ == "__main__":
    main()