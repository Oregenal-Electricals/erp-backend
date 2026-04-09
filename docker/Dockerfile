FROM python:3.11-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

EXPOSE 8000

# Default: run API
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
