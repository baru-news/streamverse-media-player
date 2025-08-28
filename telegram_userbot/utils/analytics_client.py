"""
Analytics Client for Telegram Upload Bot - Phase 4
Advanced analytics integration, intelligent insights, and predictive analytics
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict, Counter
from utils.supabase_client import SupabaseManager

logger = logging.getLogger(__name__)

@dataclass 
class AnalyticsEvent:
    """Analytics event structure"""
    event_type: str
    timestamp: datetime
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class AnalyticsClient:
    """Advanced analytics client with intelligent insights"""
    
    def __init__(self, supabase: SupabaseManager):
        self.supabase = supabase
        self.event_buffer: List[AnalyticsEvent] = []
        self.buffer_size = 50
        self.is_processing = False
        
    async def track_event(self, event_type: str, properties: Optional[Dict[str, Any]] = None, 
                         user_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None):
        """Track analytics event"""
        try:
            event = AnalyticsEvent(
                event_type=event_type,
                timestamp=datetime.now(),
                user_id=user_id,
                properties=properties or {},
                metadata=metadata or {}
            )
            
            self.event_buffer.append(event)
            
            # Flush buffer if it's full
            if len(self.event_buffer) >= self.buffer_size:
                await self._flush_events()
                
        except Exception as e:
            logger.error(f"Error tracking event: {e}")
    
    async def track_upload_start(self, file_name: str, file_size: int, user_id: Optional[str] = None):
        """Track upload start event"""
        await self.track_event(
            'upload_started',
            properties={
                'file_name': file_name,
                'file_size': file_size,
                'file_extension': file_name.split('.')[-1].lower() if '.' in file_name else 'unknown'
            },
            user_id=user_id
        )
    
    async def track_upload_complete(self, file_name: str, file_size: int, duration: float, 
                                  doodstream_id: str, user_id: Optional[str] = None):
        """Track upload completion event"""
        await self.track_event(
            'upload_completed',
            properties={
                'file_name': file_name,
                'file_size': file_size,
                'duration_seconds': duration,
                'doodstream_id': doodstream_id,
                'upload_speed_mbps': round((file_size / (1024 * 1024)) / duration, 2) if duration > 0 else 0
            },
            user_id=user_id
        )
    
    async def track_upload_error(self, file_name: str, error_type: str, error_message: str, 
                               user_id: Optional[str] = None):
        """Track upload error event"""
        await self.track_event(
            'upload_error',
            properties={
                'file_name': file_name,
                'error_type': error_type,
                'error_message': error_message
            },
            user_id=user_id
        )
    
    async def track_group_activity(self, group_id: str, group_name: str, message_count: int = 1):
        """Track group activity"""
        await self.track_event(
            'group_activity',
            properties={
                'group_id': group_id,
                'group_name': group_name,
                'message_count': message_count
            }
        )
    
    async def _flush_events(self):
        """Flush events to database"""
        if self.is_processing or not self.event_buffer:
            return
            
        self.is_processing = True
        
        try:
            events_data = []
            for event in self.event_buffer:
                events_data.append({
                    'event_type': event.event_type,
                    'timestamp': event.timestamp.isoformat(),
                    'user_id': event.user_id,
                    'properties': event.properties,
                    'metadata': event.metadata
                })
            
            result = self.supabase.client.table('analytics_events').insert(events_data).execute()
            logger.info(f"Flushed {len(events_data)} analytics events")
            
            self.event_buffer.clear()
            
        except Exception as e:
            logger.error(f"Error flushing analytics events: {e}")
        finally:
            self.is_processing = False
    
    async def get_upload_analytics(self, days: int = 7) -> Dict[str, Any]:
        """Get upload analytics for the last N days"""
        try:
            since = (datetime.now() - timedelta(days=days)).isoformat()
            
            result = self.supabase.client.table('analytics_events')\
                .select('*')\
                .in_('event_type', ['upload_started', 'upload_completed', 'upload_error'])\
                .gte('timestamp', since)\
                .execute()
            
            events = result.data or []
            
            # Categorize events
            started = [e for e in events if e['event_type'] == 'upload_started']
            completed = [e for e in events if e['event_type'] == 'upload_completed']
            errors = [e for e in events if e['event_type'] == 'upload_error']
            
            # Calculate metrics
            total_started = len(started)
            total_completed = len(completed)
            total_errors = len(errors)
            success_rate = (total_completed / total_started * 100) if total_started > 0 else 0
            
            # File type analysis
            file_types = Counter()
            total_size = 0
            total_duration = 0
            
            for event in completed:
                props = event.get('properties', {})
                if 'file_extension' in props:
                    file_types[props['file_extension']] += 1
                if 'file_size' in props:
                    total_size += props['file_size']
                if 'duration_seconds' in props:
                    total_duration += props['duration_seconds']
            
            # Error analysis
            error_types = Counter()
            for event in errors:
                props = event.get('properties', {})
                if 'error_type' in props:
                    error_types[props['error_type']] += 1
            
            return {
                'period_days': days,
                'summary': {
                    'uploads_started': total_started,
                    'uploads_completed': total_completed,
                    'uploads_failed': total_errors,
                    'success_rate': round(success_rate, 2),
                    'total_size_mb': round(total_size / (1024 * 1024), 2),
                    'avg_duration_seconds': round(total_duration / total_completed, 2) if total_completed > 0 else 0
                },
                'file_types': dict(file_types.most_common(10)),
                'error_types': dict(error_types.most_common(5)),
                'trends': await self._calculate_trends(events, days)
            }
            
        except Exception as e:
            logger.error(f"Error getting upload analytics: {e}")
            return {'error': str(e)}
    
    async def _calculate_trends(self, events: List[Dict], days: int) -> Dict[str, Any]:
        """Calculate trends from events"""
        try:
            # Group events by day
            daily_counts = defaultdict(int)
            
            for event in events:
                if event['event_type'] == 'upload_completed':
                    event_date = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00')).date()
                    daily_counts[event_date.isoformat()] += 1
            
            # Calculate trend (simple linear regression would be better)
            dates = sorted(daily_counts.keys())
            if len(dates) >= 2:
                recent_avg = sum(daily_counts[d] for d in dates[-3:]) / min(3, len(dates))
                earlier_avg = sum(daily_counts[d] for d in dates[:3]) / min(3, len(dates))
                trend = "increasing" if recent_avg > earlier_avg else "decreasing" if recent_avg < earlier_avg else "stable"
            else:
                trend = "insufficient_data"
            
            return {
                'daily_uploads': dict(daily_counts),
                'trend': trend,
                'peak_day': max(daily_counts.keys(), key=lambda k: daily_counts[k]) if daily_counts else None
            }
            
        except Exception as e:
            logger.error(f"Error calculating trends: {e}")
            return {'error': str(e)}
    
    async def get_group_analytics(self, days: int = 7) -> Dict[str, Any]:
        """Get group activity analytics"""
        try:
            since = (datetime.now() - timedelta(days=days)).isoformat()
            
            result = self.supabase.client.table('analytics_events')\
                .select('*')\
                .eq('event_type', 'group_activity')\
                .gte('timestamp', since)\
                .execute()
            
            events = result.data or []
            
            # Group analysis
            group_activity = defaultdict(int)
            
            for event in events:
                props = event.get('properties', {})
                group_name = props.get('group_name', 'Unknown')
                message_count = props.get('message_count', 1)
                group_activity[group_name] += message_count
            
            return {
                'period_days': days,
                'active_groups': len(group_activity),
                'total_messages': sum(group_activity.values()),
                'group_activity': dict(sorted(group_activity.items(), key=lambda x: x[1], reverse=True))
            }
            
        except Exception as e:
            logger.error(f"Error getting group analytics: {e}")
            return {'error': str(e)}
    
    async def close(self):
        """Cleanup and flush remaining events"""
        if self.event_buffer:
            await self._flush_events()