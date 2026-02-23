# AltAlpha Lab - Makefile
# Run the entire project from the root directory

.PHONY: all install install-backend install-frontend dev dev-backend dev-frontend build clean help

# Default target
all: install dev

# Python virtual environment
VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
UVICORN := $(VENV)/bin/uvicorn

# Create virtual environment
$(VENV)/bin/activate:
	python3 -m venv $(VENV)

# Install all dependencies
install: install-backend install-frontend

# Install backend Python dependencies
install-backend: $(VENV)/bin/activate
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

# Install frontend npm dependencies
install-frontend:
	cd frontend && npm install

# Run both backend and frontend in development mode
dev:
	@echo "Starting AltAlpha Lab..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@make -j2 dev-backend dev-frontend

# Run backend only (FastAPI with uvicorn)
dev-backend: $(VENV)/bin/activate
	$(UVICORN) main:app --reload --host 0.0.0.0 --port 8000

# Run frontend only (Vite dev server)
dev-frontend:
	cd frontend && npm run dev

# Build frontend for production
build:
	cd frontend && npm run build

# Lint frontend
lint:
	cd frontend && npm run lint

# Preview production build
preview:
	cd frontend && npm run preview

# Clean up generated files
clean:
	rm -rf $(VENV)
	rm -rf __pycache__
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Show help
help:
	@echo "AltAlpha Lab - Available commands:"
	@echo ""
	@echo "  make install          - Install all dependencies (backend + frontend)"
	@echo "  make install-backend  - Install Python dependencies only"
	@echo "  make install-frontend - Install npm dependencies only"
	@echo "  make dev              - Run both backend and frontend (development)"
	@echo "  make dev-backend      - Run backend only (FastAPI on port 8000)"
	@echo "  make dev-frontend     - Run frontend only (Vite on port 5173)"
	@echo "  make build            - Build frontend for production"
	@echo "  make lint             - Lint frontend code"
	@echo "  make preview          - Preview production build"
	@echo "  make clean            - Remove all generated files"
	@echo "  make help             - Show this help message"
