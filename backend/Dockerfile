FROM python:3.13-slim
WORKDIR /app
COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir uvicorn fastapi sqlalchemy pydantic pydantic-settings python-multipart pyjwt itsdangerous qrcode pillow pytest httpx
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
