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
from importlib.util import find_spec
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
VITE_BIN_WIN = FRONTEND_DIR / "node_modules" / ".bin" / "vite.cmd"
VITE_BIN_UNIX = FRONTEND_DIR / "node_modules" / ".bin" / "vite"


def _resolve_npm_command() -> list[str] | None:
    for candidate in ("npm", "npm.cmd", "npm.exe"):
        resolved = shutil.which(candidate)
        if resolved:
            return [resolved]
    return None


def _resolve_uvicorn_command() -> list[str] | None:
    for candidate in ("uvicorn", "uvicorn.exe", "uvicorn.cmd"):
        resolved = shutil.which(candidate)
        if resolved:
            return [resolved]

    if find_spec("uvicorn") is not None:
        return [sys.executable, "-m", "uvicorn"]

    return None


def _print_missing_dependency_message(npm_command: list[str] | None, uvicorn_command: list[str] | None) -> bool:
    has_error = False

    if npm_command is None:
        print("[ERROR] npm was not found. Install Node.js and ensure npm is on your PATH.")
        has_error = True

    if uvicorn_command is None:
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


def _ensure_frontend_dependencies(npm_command: list[str]) -> bool:
    vite_exists = VITE_BIN_WIN.exists() or VITE_BIN_UNIX.exists()
    if vite_exists:
        return True

    print("[INFO] Frontend dependencies are missing. Running npm install...")
    install_result = subprocess.run([*npm_command, "install"], cwd=str(FRONTEND_DIR), shell=False)
    if install_result.returncode != 0:
        print("[ERROR] npm install failed. Frontend could not be prepared.")
        return False

    vite_exists = VITE_BIN_WIN.exists() or VITE_BIN_UNIX.exists()
    if not vite_exists:
        print("[ERROR] Vite binary was not found after npm install. Please check frontend/package.json.")
        return False

    return True


def _terminate_process(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return

    process.terminate()
    try:
        process.wait(timeout=8)
    except subprocess.TimeoutExpired:
        process.kill()


def main() -> int:
    npm_command = _resolve_npm_command()
    uvicorn_command = _resolve_uvicorn_command()

    if _print_missing_dependency_message(npm_command, uvicorn_command):
        return 1

    if not FRONTEND_DIR.exists():
        print(f"[ERROR] frontend directory not found: {FRONTEND_DIR}")
        return 1

    if npm_command is None or uvicorn_command is None:
        return 1

    if not _ensure_frontend_dependencies(npm_command):
        return 1

    frontend_process: subprocess.Popen | None = None
    backend_process: subprocess.Popen | None = None

    try:
        frontend_process = _start_process([*npm_command, "run", "dev"], FRONTEND_DIR)
        backend_process = _start_process([*uvicorn_command, "main:app", "--reload"], ROOT_DIR)

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
