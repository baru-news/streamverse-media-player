# Telegram User Bot - Production Docker Image
# Ubuntu 22.04 base with Python 3.11

FROM ubuntu:22.04

# Prevent interactive installation prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    build-essential \
    ffmpeg \
    libopus0 \
    libopus-dev \
    libffi-dev \
    libsodium-dev \
    libnacl-dev \
    libssl-dev \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libmagic1 \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create virtual environment
RUN python3.11 -m venv /app/venv

# Activate virtual environment and upgrade pip
RUN /app/venv/bin/pip install --upgrade pip setuptools wheel

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN /app/venv/bin/pip install -r requirements.txt

# Copy application code
COPY main.py .
COPY .env.template .env

# Create necessary directories
RUN mkdir -p .sessions

# Set up non-root user for security
RUN useradd -m -u 1001 telegrambot && \
    chown -R telegrambot:telegrambot /app

USER telegrambot

# Expose port (if needed for health checks)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python3 -c "import sys; sys.exit(0)"

# Start command
CMD ["/app/venv/bin/python", "main.py"]