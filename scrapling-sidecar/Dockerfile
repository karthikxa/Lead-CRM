FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m scrapling install || true
COPY app ./app
ENV SCRAPLING_MAX_CONCURRENCY=5
ENV SCRAPLING_SERVICE_TOKEN=local-dev-token
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
