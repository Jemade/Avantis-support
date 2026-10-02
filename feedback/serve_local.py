import http.server
import json
import os
import urllib.parse
from datetime import datetime

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class FeedbackHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path.endswith("send_feedback.php"):
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            
            content_type = self.headers.get("Content-Type", "")
            data = {}

            if "application/json" in content_type:
                try:
                    data = json.loads(post_body.decode("utf-8"))
                except Exception:
                    data = {}
            elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
                # Basic form-urlencoded parsing fallback
                try:
                    parsed = urllib.parse.parse_qs(post_body.decode("utf-8", errors="ignore"))
                    data = {k: v[0] if len(v) == 1 else v for k, v in parsed.items()}
                except Exception:
                    data = {}

            # Log submission
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "recipient": "jayden.mapasure@avantis.co.zw",
                "payload": data or post_body.decode("utf-8", errors="ignore")[:500]
            }

            log_path = os.path.join(DIRECTORY, "feedback_submissions.log")
            try:
                with open(log_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(log_entry) + "\n")
            except Exception as e:
                print("Logging error:", e)

            # Return success response matching send_feedback.php
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            response = {
                "success": True,
                "message": "Thank you! Your feedback has been sent to jayden.mapasure@avantis.co.zw",
                "logged": True,
                "local_dev": True
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self.send_error(404, "Endpoint not found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        self.end_headers()

if __name__ == "__main__":
    server_address = ("127.0.0.1", PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, FeedbackHandler)
    print(f"Feedback dev server running at http://127.0.0.1:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
