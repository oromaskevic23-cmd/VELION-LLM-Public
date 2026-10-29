#!/usr/bin/env python3
"""Opt-in local Soup CLI installer for VELION. Never launches a training run.

This standalone tool deliberately does NOT import project secrets, add any
external model endpoint, or modify VELION's signed local inference bridge.
"""
import argparse
import importlib.metadata
import json
import os
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ENV = HERE / ".venv"
SOUP_VERSION = "0.77.0"
SUPPORTED = (3, 11), (3, 12), (3, 13)


def python_supported(version=None):
    v = tuple(version or sys.version_info[:2])
    return v in SUPPORTED


def environment_python():
    return ENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def environment_soup():
    return ENV / ("Scripts/soup.exe" if os.name == "nt" else "bin/soup")


def status():
    installed = None
    py = environment_python()
    if py.is_file():
        proc = subprocess.run(
            [str(py), "-c", "from importlib.metadata import version; print(version('soup-cli'))"],
            capture_output=True, text=True, check=False, timeout=15,
        )
        if proc.returncode == 0:
            installed = proc.stdout.strip()
    result = {
        "project": "VELION",
        "component": "Soup Training Lab",
        "expected_soup_version": SOUP_VERSION,
        "python": sys.version.split()[0],
        "python_supported": python_supported(),
        "soup_installed_version": installed,
        "tool_installed_and_pinned": installed == SOUP_VERSION,
        "model_trained": False,
        "model_deployed": False,
        "production_authorized": False,
    }
    print(json.dumps(result, indent=2))
    return 0 if result["python_supported"] else 2


def install(mode, approved_heavy):
    if not python_supported():
        print("ERROR: Python 3.11, 3.12 or 3.13 required.", file=sys.stderr)
        return 2
    if mode == "train" and not approved_heavy:
        print("DENIED: --allow-heavy-install is required for the training stack.", file=sys.stderr)
        return 3
    if not ENV.exists():
        subprocess.run([sys.executable, "-m", "venv", str(ENV)], check=True)
    py = environment_python()
    requirements = HERE / ("requirements-train.txt" if mode == "train" else "requirements-cli.txt")
    # Pinned direct package on official PyPI, isolated from other IMPERIAL runtimes.
    subprocess.run([
        str(py), "-m", "pip", "install", "--disable-pip-version-check", "--no-input",
        "--index-url", "https://pypi.org/simple", "-r", str(requirements),
    ], check=True)
    # Fail if another Soup version was resolved unexpectedly.
    subprocess.run([
        str(py), "-c",
        f"from importlib.metadata import version; assert version('soup-cli') == '{SOUP_VERSION}'",
    ], check=True)
    print("Soup CLI installed in isolated environment; NO training or model download performed.")
    return status()


def doctor():
    if not environment_soup().is_file():
        print("NOT_INSTALLED: run the install command first.", file=sys.stderr)
        return 4
    # Upstream exit status is preserved, including missing optional training dependencies.
    return subprocess.run([str(environment_soup()), "doctor"], check=False).returncode


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("status")
    i = sub.add_parser("install")
    i.add_argument("--mode", choices=("core", "train"), default="core")
    i.add_argument("--allow-heavy-install", action="store_true")
    sub.add_parser("doctor")
    a = p.parse_args(argv)
    if a.command == "status":
        return status()
    if a.command == "install":
        return install(a.mode, a.allow_heavy_install)
    return doctor()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (subprocess.SubprocessError, OSError) as error:
        print(f"INSTALL_OR_DIAGNOSTIC_FAILED: {error}", file=sys.stderr)
        raise SystemExit(1)
