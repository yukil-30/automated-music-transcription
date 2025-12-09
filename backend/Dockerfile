# Use Python 3.10 (Compatible with basic_pitch/music21)
FROM python:3.9-slim

# Install system dependencies required for audio processing
# libsndfile1 is CRITICAL for audio loading
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy requirements first (to cache dependencies)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose the port
EXPOSE 5328

# Start the application using Gunicorn (Production server)
# 'app:app' means: look in app.py for the variable named 'app'
CMD ["gunicorn", "--bind", "0.0.0.0:5328", "--timeout", "120", "app:app"]