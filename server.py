#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

DEFAULT_PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable cache during development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        if path.endswith('.html'):
            return 'text/html; charset=utf-8'
        if path.endswith('.css'):
            return 'text/css; charset=utf-8'
        return super().guess_type(path)

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = DEFAULT_PORT
    httpd = None

    for attempt in range(10):
        try:
            httpd = ReusableTCPServer(("", port), Handler)
            break
        except OSError as e:
            if e.errno == 48: # Address already in use
                print(f"⚠️  พอร์ต {port} กำลังถูกใช้งานอยู่ กำลังลองพอร์ต {port + 1}...")
                port += 1
            else:
                raise e

    if not httpd:
        print(f"❌ ไม่สามารถเปิดเซิร์ฟเวอร์ได้เนื่องจากพอร์ต 8080-8089 ถูกใช้งานทั้งหมด")
        sys.exit(1)

    with httpd:
        print("\n" + "="*60)
        print("🧬 BioVerse VR: Biology Classroom & Lab Server Started")
        print("="*60)
        print(f"🌐 Local URL:    http://localhost:{port}")
        print(f"🥽 WebXR / VR:   เปิด URL นี้บน Browser ของแว่น VR (Meta Quest / Vision Pro)")
        print(f"💻 Desktop Mode: เปิดผ่าน Chrome, Edge, Safari, Firefox ได้ทันที")
        print("="*60)
        print("กด Ctrl+C เพื่อหยุดการทำงาน\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == '__main__':
    run()
