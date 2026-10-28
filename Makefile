.PHONY: dev test seed install clean

# Detect OS
ifeq ($(OS),Windows_NT)
    PYTHON = .venv\Scripts\python.exe
    DEV_CMD = powershell -ExecutionPolicy Bypass -File ./dev.ps1
else
    PYTHON = .venv/bin/python
    DEV_CMD = ./dev.sh
endif

dev:
	@echo "Starting KoshPramaan full stack..."
	$(DEV_CMD)

install:
	cd backend && uv venv && uv pip install -e .
	cd frontend && npm install

test:
	cd backend && $(PYTHON) -m pytest tests -v

seed:
	cd backend && $(PYTHON) -c "from app.seed import seed_database; print(seed_database())"

