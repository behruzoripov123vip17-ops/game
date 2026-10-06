#!/usr/bin/env python3
"""Small development server entry point for the static CAMILLA site.

It intentionally supports the familiar ``python manage.py runserver`` command
without requiring Django or any third-party package.
"""
from __future__ import annotations

import argparse
import http.server
import os
import socketserver
from pathlib import Path
from backend import APIHandler, init_db

BASE_DIR = Path(__file__).resolve().parent


class SiteHandler(http.server.SimpleHTTPRequestHandler):
    """Serve project files and fall back to index.html for the root route."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def log_message(self, fmt, *args):
        # Keep the familiar, useful request log while avoiding noisy host data.
        super().log_message(fmt, *args)

    # Reuse the API handler helpers while keeping SimpleHTTPRequestHandler
    # responsible for serving the frontend files.
    json = APIHandler.json
    body = APIHandler.body
    current_user = APIHandler.current_user
    logout = APIHandler.logout

    def do_GET(self):
        if self.path.startswith("/api/"):
            return APIHandler.do_GET(self)
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/"):
            return APIHandler.do_POST(self)
        self.send_error(404)


def main() -> None:
    init_db()
    parser = argparse.ArgumentParser(description="CAMILLA development server")
    subparsers = parser.add_subparsers(dest="command")
    runserver = subparsers.add_parser("runserver", help="start the local web server")
    runserver.add_argument("address", nargs="?", default="127.0.0.1:8000")
    args = parser.parse_args()

    if args.command != "runserver":
        parser.error("use: python manage.py runserver [host:port]")

    host, separator, port_text = args.address.rpartition(":")
    if not separator:
        host, port_text = "127.0.0.1", host
    host = host or "127.0.0.1"
    try:
        port = int(port_text)
        if not 1 <= port <= 65535:
            raise ValueError
    except ValueError:
        parser.error("port must be a number from 1 to 65535")

    with socketserver.ThreadingTCPServer((host, port), SiteHandler) as server:
        server.allow_reuse_address = True
        print(f"CAMILLA is running at http://{host}:{port}/")
        print("Press Ctrl+C to stop.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
