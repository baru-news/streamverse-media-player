# Backup Service Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY telegram_userbot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install backup-specific packages
RUN pip install --no-cache-dir boto3 schedule

# Copy backup code
COPY telegram_userbot/ .

# Create directories
RUN mkdir -p /app/logs /app/config /app/backups

# Create non-root user
RUN useradd -m -u 1004 backup && chown -R backup:backup /app
USER backup

# Health check
HEALTHCHECK --interval=300s --timeout=30s --start-period=30s --retries=2 \
    CMD python -c "import backup.backup_service; print('Backup service running')"

# Run backup service
CMD ["python", "backup/backup_service.py"]