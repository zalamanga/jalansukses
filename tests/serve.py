import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class TestServer(ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True


class StaticHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):
        if len(args) < 2 or str(args[1]) not in {"200", "304"}:
            super().log_message(format, *args)


def main():
    parser = argparse.ArgumentParser(description="Serve public/ on the local computer.")
    parser.add_argument("--port", type=int, default=18771)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent / "public"
    handler = partial(StaticHandler, directory=str(root))
    with TestServer(("127.0.0.1", args.port), handler) as server:
        print(f"Local site: http://127.0.0.1:{args.port}/", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
