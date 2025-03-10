FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create a script to start the application
RUN echo '#!/bin/bash\nport="${PORT:-8000}"\ngunicorn app:app --bind 0.0.0.0:$port' > start.sh && \
    chmod +x start.sh

# Command to run the application
CMD ["./start.sh"] 