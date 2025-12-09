# Use Python 3.10 to match your library requirements
FROM python:3.10-slim

# Install the CRITICAL system tools that Buildpacks missed
# 'libsndfile1' and 'ffmpeg' are required for basic_pitch to read MP3s
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set up the app
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your code
COPY . .

# Start the server (Cloud Run sets the PORT env var automatically)
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app