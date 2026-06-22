"""Ingestion statistics tracker.

Records counts of valid, invalid, and skipped profiles, calculates
processing speeds, and evaluates memory footprint during execution.
"""

import ctypes
import os
import sys
import time
from typing import Any, Dict, Optional

from utils.logger import get_logger

logger = get_logger(__name__)


def get_current_memory_mb() -> float:
    """Returns the resident memory usage of the current process in MB.

    Handles Windows (via ctypes) and Unix (via resource) natively.

    Returns:
        float: Memory footprint in megabytes.
    """
    # Windows native lookup
    if sys.platform == "win32":
        try:
            class PROCESS_MEMORY_COUNTERS(ctypes.Structure):
                _fields_ = [
                    ("cb", ctypes.c_ulong),
                    ("PageFaultCount", ctypes.c_ulong),
                    ("PeakWorkingSetSize", ctypes.c_size_t),
                    ("WorkingSetSize", ctypes.c_size_t),
                    ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
                    ("QuotaPagedPoolUsage", ctypes.c_size_t),
                    ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
                    ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
                    ("PagefileUsage", ctypes.c_size_t),
                    ("PeakPagefileUsage", ctypes.c_size_t),
                ]

            GetProcessMemoryInfo = ctypes.windll.psapi.GetProcessMemoryInfo
            GetCurrentProcess = ctypes.windll.kernel32.GetCurrentProcess

            counters = PROCESS_MEMORY_COUNTERS()
            counters.cb = ctypes.sizeof(PROCESS_MEMORY_COUNTERS)

            if GetProcessMemoryInfo(GetCurrentProcess(), ctypes.byref(counters), counters.cb):
                return counters.WorkingSetSize / (1024 * 1024)
        except Exception as e:
            logger.debug(f"Failed to fetch Windows memory via ctypes: {e}")
    else:
        # Unix fallback lookup
        try:
            import resource
            # ru_maxrss is in kilobytes on Linux, bytes on macOS
            usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
            if sys.platform == "darwin":
                return usage / (1024 * 1024)
            return usage / 1024.0
        except Exception as e:
            logger.debug(f"Failed to fetch Unix memory: {e}")

    return 0.0


class IngestionStats:
    """Tracks time, processing speed, memory usage, and validity metrics."""

    def __init__(self):
        self.total_records = 0
        self.valid_records = 0
        self.invalid_records = 0
        self.skipped_records = 0
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.peak_memory_mb = 0.0

    def start_timer(self) -> None:
        """Starts the monotonic timer and captures initial memory levels."""
        self.start_time = time.perf_counter()
        self.end_time = None
        self.peak_memory_mb = get_current_memory_mb()
        logger.info("Ingestion stats tracker timer started.")

    def finish_timer(self) -> None:
        """Stops the monotonic timer and updates memory footprint peaks."""
        self.end_time = time.perf_counter()
        current_mem = get_current_memory_mb()
        if current_mem > self.peak_memory_mb:
            self.peak_memory_mb = current_mem
        logger.info("Ingestion stats tracker timer finished.")

    def record_success(self) -> None:
        """Records a successfully validated and parsed record."""
        self.total_records += 1
        self.valid_records += 1
        # Periodically monitor memory to track peak levels
        if self.total_records % 1000 == 0:
            current_mem = get_current_memory_mb()
            if current_mem > self.peak_memory_mb:
                self.peak_memory_mb = current_mem

    def record_failure(self, is_skipped: bool = False) -> None:
        """Records a malformed or invalid candidate profile.

        Args:
            is_skipped: If True, indicates the row was bypassed without validation.
        """
        self.total_records += 1
        if is_skipped:
            self.skipped_records += 1
        else:
            self.invalid_records += 1

    def generate_report(self) -> Dict[str, Any]:
        """Synthesizes all logged metrics into a serializable dict payload.

        Returns:
            Dict[str, Any]: Ingestion performance report.
        """
        # Calculate time difference
        elapsed = 0.0
        if self.start_time:
            end = self.end_time or time.perf_counter()
            elapsed = end - self.start_time

        # Calculate records per second
        speed = 0.0
        if elapsed > 0:
            speed = self.total_records / elapsed

        return {
            "total_records": self.total_records,
            "valid_records": self.valid_records,
            "invalid_records": self.invalid_records,
            "skipped_records": self.skipped_records,
            "processing_time_seconds": round(elapsed, 3),
            "average_speed_records_per_second": round(speed, 2),
            "peak_memory_mb": round(self.peak_memory_mb, 2),
        }
