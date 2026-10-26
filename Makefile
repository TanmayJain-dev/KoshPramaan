.PHONY: dev test seed install clean

dev:
	@echo "Starting KoshPramaan full stack..."
	powershell -ExecutionPolicy Bypass -File ./dev.ps1

install:
	cd backend && uv venv && uv pip install -e .
	cd frontend && npm install

test:
	cd backend && .venv\Scripts\python.exe -m pytest tests -v

seed:
	cd backend && .venv\Scripts\python.exe -c "from app.seed import seed_database; print(seed_database())"
