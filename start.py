#!/usr/bin/env python3
"""Start frontend (Vite) and backend (FastAPI) concurrently.

Usage:
    python start.py
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"


def _command_exists(command: str) -> bool:
    return shutil.which(command) is not None


def _print_missing_dependency_message() -> bool:
    has_error = False

    if not _command_exists("npm"):
        print("[ERROR] npm was not found. Install Node.js and ensure npm is on your PATH.")
        has_error = True

    if not _command_exists("uvicorn"):
        print("[ERROR] uvicorn was not found. Install it with: pip install uvicorn")
        has_error = True

    return has_error


def _start_process(command: list[str], cwd: Path) -> subprocess.Popen:
    return subprocess.Popen(
        command,
        cwd=str(cwd),
        stdout=None,
        stderr=None,
        shell=False,
    )


def _terminate_process(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return

    process.terminate()
    try:
        process.wait(timeout=8)
    except subprocess.TimeoutExpired:
        process.kill()


def main() -> int:
    if _print_missing_dependency_message():
        return 1

    if not FRONTEND_DIR.exists():
        print(f"[ERROR] frontend directory not found: {FRONTEND_DIR}")
        return 1

    frontend_process: subprocess.Popen | None = None
    backend_process: subprocess.Popen | None = None

    try:
        frontend_process = _start_process(["npm", "run", "dev"], FRONTEND_DIR)
        backend_process = _start_process(["uvicorn", "main:app", "--reload"], ROOT_DIR)

        time.sleep(1)

        if frontend_process.poll() is not None:
            print("[ERROR] Frontend failed to start. Check npm logs/output.")
            return 1

        if backend_process.poll() is not None:
            print("[ERROR] Backend failed to start. Check uvicorn logs/output.")
            return 1

        print("App started successfully")
        print("Frontend: http://127.0.0.1:5173")
        print("Backend:  http://127.0.0.1:8000")

        while True:
            frontend_exit = frontend_process.poll()
            backend_exit = backend_process.poll()

            if frontend_exit is not None:
                print(f"[INFO] Frontend process exited with code {frontend_exit}.")
                break

            if backend_exit is not None:
                print(f"[INFO] Backend process exited with code {backend_exit}.")
                break

            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[INFO] Shutdown requested. Stopping services...")
    except OSError as exc:
        print(f"[ERROR] Failed to start processes: {exc}")
        return 1
    finally:
        if frontend_process is not None:
            _terminate_process(frontend_process)
        if backend_process is not None:
            _terminate_process(backend_process)

    return 0


if __name__ == "__main__":
    sys.exit(main())
