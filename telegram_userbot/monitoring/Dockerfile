# Monitoring Service Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY telegram_userbot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy monitoring code
COPY telegram_userbot/ .

# Create directories
RUN mkdir -p /app/logs /app/config

# Create non-root user
RUN useradd -m -u 1002 monitor && chown -R monitor:monitor /app
USER monitor

# Health check
HEALTHCHECK --interval=60s --timeout=15s --start-period=10s --retries=2 \
    CMD python monitoring/health_monitor.py --health-check

# Expose monitoring port
EXPOSE 8081

# Run monitoring service
CMD ["python", "monitoring/health_monitor.py"]