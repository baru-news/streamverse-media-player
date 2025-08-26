"""
Telegram Bot Handlers Package
Contains all message and command handlers for the bot
"""

from .auth_handler import AuthHandler
from .file_handler import FileHandler

try:
    from .admin_handler import AdminHandler
except ImportError:
    # Admin handler is optional
    AdminHandler = None

__all__ = ['AuthHandler', 'FileHandler', 'AdminHandler']