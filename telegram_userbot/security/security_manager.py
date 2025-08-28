#!/usr/bin/env python3
"""
Advanced Security Manager for Production Telegram Bot
Provides comprehensive security monitoring, threat detection, and audit logging.
"""

import asyncio
import hashlib
import json
import logging
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import aiofiles
import cryptography.fernet as fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

@dataclass
class SecurityEvent:
    timestamp: datetime
    event_type: str
    severity: str  # low, medium, high, critical
    source_ip: str
    user_id: Optional[str]
    details: Dict
    action_taken: str

@dataclass
class RateLimit:
    requests: int
    window_seconds: int
    current_count: int
    window_start: float

class SecurityManager:
    def __init__(self, supabase_client, config_path: str = "config/security.json"):
        self.supabase = supabase_client
        self.config_path = config_path
        self.security_events = deque(maxlen=10000)
        self.rate_limits = defaultdict(lambda: defaultdict(RateLimit))
        self.suspicious_ips = set()
        self.blocked_ips = set()
        self.api_keys_rotation_schedule = {}
        self.audit_log_buffer = []
        self.encryption_key = None
        
        # Security thresholds
        self.max_failed_attempts = 5
        self.suspicious_threshold = 3
        self.rate_limit_configs = {
            'api_calls': RateLimit(100, 300, 0, time.time()),  # 100 calls per 5 min
            'uploads': RateLimit(20, 3600, 0, time.time()),    # 20 uploads per hour
            'downloads': RateLimit(50, 600, 0, time.time())    # 50 downloads per 10 min
        }
        
        self.logger = logging.getLogger('security_manager')
        self._setup_logging()
        self._load_config()
        self._initialize_encryption()

    def _setup_logging(self):
        """Setup security-specific logging with audit trail"""
        os.makedirs('logs/security', exist_ok=True)
        
        security_handler = logging.FileHandler('logs/security/security_audit.log')
        security_handler.setFormatter(
            logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        )
        self.logger.addHandler(security_handler)
        self.logger.setLevel(logging.INFO)

    def _load_config(self):
        """Load security configuration from encrypted file"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    config = json.load(f)
                    self.max_failed_attempts = config.get('max_failed_attempts', 5)
                    self.suspicious_threshold = config.get('suspicious_threshold', 3)
                    self.blocked_ips = set(config.get('blocked_ips', []))
        except Exception as e:
            self.logger.warning(f"Failed to load security config: {e}")

    def _initialize_encryption(self):
        """Initialize encryption for sensitive data"""
        try:
            password = os.getenv('SECURITY_ENCRYPTION_KEY', 'default_key_change_me').encode()
            salt = os.urandom(16)
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password))
            self.encryption_key = fernet.Fernet(key)
        except Exception as e:
            self.logger.error(f"Failed to initialize encryption: {e}")

    async def check_rate_limit(self, client_id: str, action_type: str, source_ip: str) -> Tuple[bool, str]:
        """Check if client has exceeded rate limits"""
        current_time = time.time()
        client_limits = self.rate_limits[client_id]
        
        if action_type not in client_limits:
            config = self.rate_limit_configs.get(action_type)
            if config:
                client_limits[action_type] = RateLimit(
                    config.requests, config.window_seconds, 0, current_time
                )
        
        limit = client_limits[action_type]
        
        # Reset window if expired
        if current_time - limit.window_start > limit.window_seconds:
            limit.current_count = 0
            limit.window_start = current_time
        
        # Check if limit exceeded
        if limit.current_count >= limit.requests:
            await self._log_security_event(
                event_type="rate_limit_exceeded",
                severity="medium",
                source_ip=source_ip,
                user_id=client_id,
                details={
                    "action_type": action_type,
                    "current_count": limit.current_count,
                    "limit": limit.requests,
                    "window_seconds": limit.window_seconds
                },
                action_taken="request_blocked"
            )
            return False, f"Rate limit exceeded for {action_type}"
        
        limit.current_count += 1
        return True, "OK"

    async def detect_suspicious_activity(self, client_id: str, source_ip: str, action: str, 
                                       metadata: Dict) -> bool:
        """Detect suspicious patterns in user activity"""
        current_time = time.time()
        
        # Check for rapid successive requests
        recent_events = [
            event for event in self.security_events 
            if event.user_id == client_id and 
               (current_time - event.timestamp.timestamp()) < 60
        ]
        
        if len(recent_events) > 20:  # More than 20 actions per minute
            await self._log_security_event(
                event_type="rapid_requests",
                severity="high",
                source_ip=source_ip,
                user_id=client_id,
                details={
                    "action": action,
                    "recent_count": len(recent_events),
                    "metadata": metadata
                },
                action_taken="flagged_suspicious"
            )
            self.suspicious_ips.add(source_ip)
            return True
        
        # Check for unusual file patterns
        if action == "file_upload":
            file_size = metadata.get('file_size', 0)
            if file_size > 2 * 1024 * 1024 * 1024:  # Files larger than 2GB
                await self._log_security_event(
                    event_type="large_file_upload",
                    severity="medium",
                    source_ip=source_ip,
                    user_id=client_id,
                    details={
                        "file_size": file_size,
                        "filename": metadata.get('filename', 'unknown')
                    },
                    action_taken="logged_for_review"
                )
        
        # Check for multiple failed authentication attempts
        failed_attempts = [
            event for event in self.security_events 
            if event.user_id == client_id and 
               event.event_type == "auth_failure" and
               (current_time - event.timestamp.timestamp()) < 3600  # Last hour
        ]
        
        if len(failed_attempts) >= self.max_failed_attempts:
            await self._log_security_event(
                event_type="multiple_auth_failures",
                severity="high",
                source_ip=source_ip,
                user_id=client_id,
                details={
                    "failed_attempts": len(failed_attempts),
                    "action": action
                },
                action_taken="account_locked"
            )
            self.blocked_ips.add(source_ip)
            return True
        
        return False

    async def _log_security_event(self, event_type: str, severity: str, source_ip: str,
                                 user_id: Optional[str], details: Dict, action_taken: str):
        """Log security event to both local storage and database"""
        event = SecurityEvent(
            timestamp=datetime.utcnow(),
            event_type=event_type,
            severity=severity,
            source_ip=source_ip,
            user_id=user_id,
            details=details,
            action_taken=action_taken
        )
        
        self.security_events.append(event)
        
        # Log to file
        self.logger.warning(
            f"SECURITY_EVENT: {event_type} | Severity: {severity} | "
            f"IP: {source_ip} | User: {user_id} | Action: {action_taken} | "
            f"Details: {json.dumps(details)}"
        )
        
        # Store in database for dashboard
        try:
            await self.supabase.table('analytics_events').insert({
                'event_type': 'security_event',
                'user_id': user_id,
                'event_data': {
                    'security_event_type': event_type,
                    'severity': severity,
                    'source_ip': source_ip,
                    'details': details,
                    'action_taken': action_taken
                }
            }).execute()
        except Exception as e:
            self.logger.error(f"Failed to store security event in database: {e}")

    async def rotate_api_keys(self):
        """Rotate API keys based on schedule"""
        current_time = datetime.utcnow()
        
        # Check if it's time to rotate Doodstream API key (monthly)
        last_rotation = self.api_keys_rotation_schedule.get('doodstream', 
                                                           current_time - timedelta(days=31))
        
        if (current_time - last_rotation).days >= 30:
            await self._rotate_doodstream_key()
            self.api_keys_rotation_schedule['doodstream'] = current_time
            
            await self._log_security_event(
                event_type="api_key_rotated",
                severity="low",
                source_ip="system",
                user_id="system",
                details={"service": "doodstream"},
                action_taken="key_rotated"
            )

    async def _rotate_doodstream_key(self):
        """Rotate Doodstream API key (placeholder - implement based on Doodstream API)"""
        # This would integrate with Doodstream's API key rotation if available
        self.logger.info("Doodstream API key rotation scheduled (implement based on provider)")

    async def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data for storage"""
        if self.encryption_key:
            return self.encryption_key.encrypt(data.encode()).decode()
        return data

    async def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        if self.encryption_key:
            try:
                return self.encryption_key.decrypt(encrypted_data.encode()).decode()
            except Exception as e:
                self.logger.error(f"Decryption failed: {e}")
                return ""
        return encrypted_data

    async def generate_security_report(self) -> Dict:
        """Generate comprehensive security report"""
        current_time = datetime.utcnow()
        last_24h = current_time - timedelta(hours=24)
        last_week = current_time - timedelta(days=7)
        
        # Filter events by time period
        events_24h = [e for e in self.security_events if e.timestamp >= last_24h]
        events_week = [e for e in self.security_events if e.timestamp >= last_week]
        
        # Group events by type and severity
        events_by_type = defaultdict(int)
        events_by_severity = defaultdict(int)
        
        for event in events_24h:
            events_by_type[event.event_type] += 1
            events_by_severity[event.severity] += 1
        
        report = {
            "report_generated": current_time.isoformat(),
            "summary": {
                "total_events_24h": len(events_24h),
                "total_events_week": len(events_week),
                "blocked_ips_count": len(self.blocked_ips),
                "suspicious_ips_count": len(self.suspicious_ips)
            },
            "events_by_type": dict(events_by_type),
            "events_by_severity": dict(events_by_severity),
            "top_threats": self._get_top_threats(events_24h),
            "blocked_ips": list(self.blocked_ips),
            "suspicious_ips": list(self.suspicious_ips),
            "recommendations": self._generate_security_recommendations(events_24h)
        }
        
        return report

    def _get_top_threats(self, events: List[SecurityEvent]) -> List[Dict]:
        """Get top security threats from events"""
        threat_count = defaultdict(int)
        threat_details = {}
        
        for event in events:
            if event.severity in ['high', 'critical']:
                key = f"{event.event_type}_{event.source_ip}"
                threat_count[key] += 1
                threat_details[key] = {
                    "event_type": event.event_type,
                    "source_ip": event.source_ip,
                    "severity": event.severity,
                    "last_seen": event.timestamp.isoformat()
                }
        
        # Sort by count and return top 10
        top_threats = sorted(threat_count.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return [
            {**threat_details[threat[0]], "count": threat[1]}
            for threat in top_threats
        ]

    def _generate_security_recommendations(self, events: List[SecurityEvent]) -> List[str]:
        """Generate security recommendations based on recent events"""
        recommendations = []
        
        # Count high-severity events
        high_severity_count = sum(1 for e in events if e.severity == 'high')
        if high_severity_count > 10:
            recommendations.append(
                "High number of high-severity events detected. Consider implementing stricter rate limiting."
            )
        
        # Check for repeated failed attempts
        auth_failures = sum(1 for e in events if e.event_type == 'auth_failure')
        if auth_failures > 20:
            recommendations.append(
                "Multiple authentication failures detected. Consider implementing CAPTCHA or 2FA."
            )
        
        # Check for suspicious IP activity
        if len(self.suspicious_ips) > 5:
            recommendations.append(
                "Multiple suspicious IPs detected. Review IP allowlist/blocklist configuration."
            )
        
        # Check for large file uploads
        large_uploads = sum(1 for e in events if e.event_type == 'large_file_upload')
        if large_uploads > 5:
            recommendations.append(
                "Multiple large file uploads detected. Review file size limits and storage capacity."
            )
        
        if not recommendations:
            recommendations.append("No immediate security concerns detected. Continue monitoring.")
        
        return recommendations

    async def start_monitoring(self):
        """Start continuous security monitoring"""
        self.logger.info("Starting security monitoring...")
        
        while True:
            try:
                # Rotate API keys if needed
                await self.rotate_api_keys()
                
                # Clean old events (keep last 7 days)
                cutoff_time = datetime.utcnow() - timedelta(days=7)
                self.security_events = deque(
                    [e for e in self.security_events if e.timestamp > cutoff_time],
                    maxlen=10000
                )
                
                # Generate and store security report
                if datetime.utcnow().hour == 0 and datetime.utcnow().minute < 5:  # Daily at midnight
                    report = await self.generate_security_report()
                    await self._store_security_report(report)
                
                # Save config with updated blocked IPs
                await self._save_config()
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                self.logger.error(f"Error in security monitoring: {e}")
                await asyncio.sleep(60)

    async def _store_security_report(self, report: Dict):
        """Store security report in database"""
        try:
            await self.supabase.table('analytics_events').insert({
                'event_type': 'security_report',
                'user_id': None,
                'event_data': report
            }).execute()
        except Exception as e:
            self.logger.error(f"Failed to store security report: {e}")

    async def _save_config(self):
        """Save current security configuration"""
        try:
            config = {
                'max_failed_attempts': self.max_failed_attempts,
                'suspicious_threshold': self.suspicious_threshold,
                'blocked_ips': list(self.blocked_ips),
                'last_updated': datetime.utcnow().isoformat()
            }
            
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, 'w') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            self.logger.error(f"Failed to save security config: {e}")

    def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is blocked"""
        return ip in self.blocked_ips

    def is_ip_suspicious(self, ip: str) -> bool:
        """Check if IP is flagged as suspicious"""
        return ip in self.suspicious_ips

    async def unblock_ip(self, ip: str, admin_user_id: str):
        """Unblock an IP address (admin action)"""
        if ip in self.blocked_ips:
            self.blocked_ips.remove(ip)
            await self._log_security_event(
                event_type="ip_unblocked",
                severity="low",
                source_ip=ip,
                user_id=admin_user_id,
                details={"unblocked_ip": ip},
                action_taken="ip_unblocked"
            )

    async def block_ip(self, ip: str, admin_user_id: str, reason: str):
        """Block an IP address (admin action)"""
        self.blocked_ips.add(ip)
        await self._log_security_event(
            event_type="ip_blocked",
            severity="medium",
            source_ip=ip,
            user_id=admin_user_id,
            details={"blocked_ip": ip, "reason": reason},
            action_taken="ip_blocked"
        )