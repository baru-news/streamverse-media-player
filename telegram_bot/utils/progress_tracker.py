"""
Progress tracking utilities for file uploads
Handles progress reporting and rate limiting
"""

import asyncio
import time
from typing import Dict, Callable, Optional
import logging

logger = logging.getLogger(__name__)

class ProgressTracker:
    """Tracks and manages progress for file operations"""
    
    def __init__(self):
        self.active_transfers: Dict[str, Dict] = {}
        self.update_intervals: Dict[str, float] = {}
    
    def create_progress_callback(self, 
                               transfer_id: str,
                               total_size: int,
                               update_callback: Optional[Callable] = None,
                               min_interval: float = 5.0) -> Callable:
        """
        Create a progress callback function for file transfers
        
        Args:
            transfer_id: Unique identifier for this transfer
            total_size: Total size of the file in bytes
            update_callback: Optional callback to call on progress updates
            min_interval: Minimum seconds between updates (to avoid rate limits)
        
        Returns:
            Async callback function for progress updates
        """
        
        # Initialize transfer tracking
        self.active_transfers[transfer_id] = {
            'start_time': time.time(),
            'total_size': total_size,
            'last_update_time': 0,
            'last_percent': 0,
            'bytes_transferred': 0
        }
        
        async def progress_callback(current: int, total: int):
            try:
                now = time.time()
                transfer_info = self.active_transfers.get(transfer_id)
                
                if not transfer_info:
                    return
                
                # Calculate progress
                percent = (current / total) * 100 if total > 0 else 0
                transfer_info['bytes_transferred'] = current
                
                # Check if we should update (rate limiting)
                time_since_update = now - transfer_info['last_update_time']
                percent_change = abs(percent - transfer_info['last_percent'])
                
                # Update conditions:
                # 1. Every 10% progress
                # 2. Every min_interval seconds
                # 3. On completion (100%)
                should_update = (
                    percent_change >= 10.0 or
                    time_since_update >= min_interval or
                    percent >= 100.0
                )
                
                if should_update:
                    transfer_info['last_update_time'] = now
                    transfer_info['last_percent'] = percent
                    
                    # Calculate speed
                    elapsed_time = now - transfer_info['start_time']
                    speed_bps = current / elapsed_time if elapsed_time > 0 else 0
                    
                    # Estimate remaining time
                    remaining_bytes = total - current
                    eta_seconds = remaining_bytes / speed_bps if speed_bps > 0 else 0
                    
                    progress_info = {
                        'transfer_id': transfer_id,
                        'current': current,
                        'total': total,
                        'percent': percent,
                        'speed_bps': speed_bps,
                        'eta_seconds': eta_seconds,
                        'elapsed_seconds': elapsed_time
                    }
                    
                    # Call the update callback if provided
                    if update_callback:
                        try:
                            if asyncio.iscoroutinefunction(update_callback):
                                await update_callback(progress_info)
                            else:
                                update_callback(progress_info)
                        except Exception as e:
                            logger.warning(f"Progress callback error: {e}")
                    
                    # Log progress
                    logger.debug(
                        f"Transfer {transfer_id}: {percent:.1f}% "
                        f"({self._format_bytes(current)}/{self._format_bytes(total)}) "
                        f"@ {self._format_speed(speed_bps)}"
                    )
            
            except Exception as e:
                logger.error(f"Progress tracking error for {transfer_id}: {e}")
        
        return progress_callback
    
    def finish_transfer(self, transfer_id: str):
        """Mark transfer as finished and clean up"""
        if transfer_id in self.active_transfers:
            transfer_info = self.active_transfers[transfer_id]
            elapsed = time.time() - transfer_info['start_time']
            total_size = transfer_info['total_size']
            avg_speed = total_size / elapsed if elapsed > 0 else 0
            
            logger.info(
                f"Transfer {transfer_id} completed: "
                f"{self._format_bytes(total_size)} in {elapsed:.1f}s "
                f"@ {self._format_speed(avg_speed)}"
            )
            
            del self.active_transfers[transfer_id]
    
    def cancel_transfer(self, transfer_id: str):
        """Cancel transfer and clean up"""
        if transfer_id in self.active_transfers:
            logger.info(f"Transfer {transfer_id} cancelled")
            del self.active_transfers[transfer_id]
    
    def get_active_transfers(self) -> Dict[str, Dict]:
        """Get information about all active transfers"""
        return self.active_transfers.copy()
    
    def _format_bytes(self, bytes_value: int) -> str:
        """Format bytes into human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.1f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.1f} TB"
    
    def _format_speed(self, bps: float) -> str:
        """Format speed into human readable format"""
        return f"{self._format_bytes(bps)}/s"
    
    def _format_time(self, seconds: float) -> str:
        """Format seconds into human readable time"""
        if seconds < 60:
            return f"{seconds:.0f}s"
        elif seconds < 3600:
            return f"{seconds/60:.1f}m"
        else:
            return f"{seconds/3600:.1f}h"

# Global instance
progress_tracker = ProgressTracker()