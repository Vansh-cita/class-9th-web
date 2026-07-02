#!/usr/bin/env python3
"""Next.js preview server for the CBSE Class 9 Learning Portal.

Usage:
    python preview_server.py          # Development mode (hot reload)
    python preview_server.py --prod   # Production mode (serves built files)

The server binds to http://localhost:8080 by default.
"""

import subprocess
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 8080
HOST = "0.0.0.0"
IS_WIN = sys.platform == "win32"


def print_banner(mode: str):
    print()
    print("=" * 60)
    print("  CBSE Class 9 Learning Portal")
    print(f"  Server:     http://localhost:{PORT}")
    print(f"  Mode:       {mode}")
    print("=" * 60)
    print()
    sys.stdout.flush()


def run(cmd: list[str]) -> int:
    return subprocess.run(cmd, check=False).returncode


if __name__ == "__main__":
    mode = "production" if "--prod" in sys.argv else "development"
    print_banner(mode)

    os.chdir(BASE_DIR)

    # On Windows, use .cmd wrappers (npx.cmd); on Unix, use shell resolution
    pnpm = "pnpm.cmd" if IS_WIN else "pnpm"
    npx = "npx.cmd" if IS_WIN else "npx"

    next_bin = os.path.join(BASE_DIR, "node_modules", ".bin", "next.cmd" if IS_WIN else "next")

    if mode == "production":
        if not os.path.isdir(".next"):
            print("  Running production build first...")
            sys.stdout.flush()
            rc = run([pnpm, "exec", "next", "build"])
            if rc != 0:
                print("\n  Build failed. Fix errors and try again.")
                sys.exit(1)
        cmd = [next_bin, "start", "-p", str(PORT), "-H", HOST]
    else:
        cmd = [next_bin, "dev", "-p", str(PORT), "-H", HOST]

    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
    except FileNotFoundError:
        print("Error: next not found. Run: pnpm install")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"\nServer exited with code {e.returncode}")
        sys.exit(e.returncode)
