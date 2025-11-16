FROM python:3.11-slim

WORKDIR /app

# Install system deps (gcc for building, curl for debug)
RUN apt-get update && apt-get install -y gcc curl && apt-get clean

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend project
COPY config/ ./config/
COPY api/ ./api/
COPY manage.py .
COPY fake_data.py .

# Expose Django port
EXPOSE 8000

# Start Django
CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]