"""ASGI entrypoint for running the API from repository root.

Usage:
    uvicorn main:app --reload
"""

from backend.app.main import app

__all__ = ["app"]
