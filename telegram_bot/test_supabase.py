#!/usr/bin/env python3
"""
Test SupabaseManager to isolate the issue
"""

import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_supabase_only():
    """Test SupabaseManager in isolation"""
    
    logger.info("=== Testing SupabaseManager ===")
    
    # Step 1: Test config first
    try:
        logger.info("Step 1: Testing config...")
        from config import Config
        config = Config()
        logger.info("✅ Config creation successful")
        logger.info(str(config))
    except Exception as e:
        logger.error(f"❌ Config failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 2: Test SupabaseManager import only
    try:
        logger.info("Step 2: Testing SupabaseManager import...")
        from supabase_client import SupabaseManager
        logger.info("✅ SupabaseManager import successful")
    except Exception as e:
        logger.error(f"❌ SupabaseManager import failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 3: Test SupabaseManager instantiation
    try:
        logger.info("Step 3: Testing SupabaseManager instantiation...")
        supabase = SupabaseManager()
        logger.info("✅ SupabaseManager creation successful")
    except Exception as e:
        logger.error(f"❌ SupabaseManager creation failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 4: Test a simple method
    try:
        logger.info("Step 4: Testing SupabaseManager method...")
        # Test a simple method that doesn't require network
        url = supabase.base_url
        logger.info(f"✅ SupabaseManager config access successful: {url}")
    except Exception as e:
        logger.error(f"❌ SupabaseManager method failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    logger.info("🎉 SupabaseManager tests passed!")

if __name__ == "__main__":
    test_supabase_only()