# Security Monitoring Dockerfile
FROM python:3.11-slim

# Set working directory  
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY telegram_userbot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install additional security packages
RUN pip install --no-cache-dir cryptography psutil

# Copy security code
COPY telegram_userbot/ .

# Create directories
RUN mkdir -p /app/logs /app/config /app/security

# Create non-root user
RUN useradd -m -u 1003 security && chown -R security:security /app
USER security

# Health check
HEALTHCHECK --interval=120s --timeout=10s --start-period=15s --retries=2 \
    CMD python -c "import security.security_manager; print('Security service running')"

# Run security monitoring
CMD ["python", "security/security_manager.py"]