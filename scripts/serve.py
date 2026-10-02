#!/usr/bin/env python3
"""
SUN.DYLE — local preview server.

    scripts/serve.py              # http://0.0.0.0:8091 — reachable from any
                                  # device on the home network
    scripts/serve.py 9000         # a different port
    scripts/serve.py --port 8091 --host 127.0.0.1

Same idea as `python3 -m http.server`, with two differences that matter while
you are editing:

  * Cache-Control: no-store on everything, so a normal refresh always shows the
    file you just saved. Without it the browser happily serves you last week's
    data/shows.js and you think your edit did nothing.
  * Missing files fall back to 404.html, the same as GitHub Pages does.
"""

import argparse
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            page = os.path.join(ROOT, "404.html")
            if os.path.exists(page):
                with open(page, "rb") as fh:
                    body = fh.read()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(body)
                return
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


def main():
    ap = argparse.ArgumentParser(description="Preview the SUN.DYLE site locally")
    ap.add_argument("port", nargs="?", type=int, default=8091)
    ap.add_argument("--host", default="0.0.0.0")
    args = ap.parse_args()

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((args.host, args.port), Handler) as httpd:
        print("SUN.DYLE site:  http://localhost:%d/" % args.port)
        if args.host == "0.0.0.0":
            print("on your network: http://<this-machine>.local:%d/" % args.port)
        print("serving %s" % ROOT)
        print("Ctrl-C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped.")


if __name__ == "__main__":
    main()
