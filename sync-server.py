#!/usr/bin/env python3
"""
平子的工作台 · 可选轻量云同步服务端
用法：
    python3 sync-server.py --port 8137 --data ./sync-data
特性：
    - POST /sync?token=<令牌>  上传全量备份 JSON
    - GET  /sync?token=<令牌>  下载全量备份 JSON
    - 令牌即数据隔离边界，建议设置足够复杂的 token 并配合 HTTPS
    - 默认同时提供静态文件服务（index.html 等）
"""
import os, sys, json, hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8137
DATA_DIR = sys.argv[2] if len(sys.argv) > 2 else './sync-data'
STATIC_DIR = sys.argv[3] if len(sys.argv) > 3 else os.path.dirname(os.path.abspath(__file__))

os.makedirs(DATA_DIR, exist_ok=True)

# 静态文件 MIME
MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[sync] {self.address_string()} - {fmt % args}")

    def send(self, code, body=None, ctype='text/plain; charset=utf-8', extra=None):
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # 关闭所有缓存，满足「永远实时拉取服务器最新文件」
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        if extra:
            for k, v in extra.items(): self.send_header(k, v)
        self.end_headers()
        if body:
            self.wfile.write(body if isinstance(body, bytes) else body.encode('utf-8'))

    def path_file(self, path):
        if path == '/': path = '/index.html'
        # 安全：只允许 STATIC_DIR 内文件
        safe = os.path.normpath(os.path.join(STATIC_DIR, path.lstrip('/')))
        if not safe.startswith(os.path.normpath(STATIC_DIR) + os.sep) and safe != os.path.normpath(STATIC_DIR):
            return None
        return safe if os.path.isfile(safe) else None

    def do_OPTIONS(self):
        self.send(204)

    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        if parsed.path == '/sync':
            token = qs.get('token', [''])[0].strip()
            if not token: return self.send(400, '缺少 token')
            fn = os.path.join(DATA_DIR, hashlib.sha256(token.encode()).hexdigest() + '.json')
            if not os.path.exists(fn): return self.send(404, '暂无云端数据')
            with open(fn, 'rb') as f: data = f.read()
            return self.send(200, data, 'application/json; charset=utf-8')
        # 静态文件
        pf = self.path_file(parsed.path)
        if pf:
            ext = os.path.splitext(pf)[1]
            with open(pf, 'rb') as f: data = f.read()
            return self.send(200, data, MIME.get(ext, 'application/octet-stream'))
        return self.send(404, 'Not found')

    def do_POST(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        if parsed.path == '/sync':
            token = qs.get('token', [''])[0].strip()
            if not token: return self.send(400, '缺少 token')
            length = int(self.headers.get('Content-Length', 0))
            if not length: return self.send(400, '缺少 body')
            body = self.rfile.read(length)
            try:
                obj = json.loads(body)
                if not isinstance(obj, dict): raise ValueError('must be object')
            except Exception as e:
                return self.send(400, 'JSON 格式错误: ' + str(e))
            fn = os.path.join(DATA_DIR, hashlib.sha256(token.encode()).hexdigest() + '.json')
            with open(fn, 'wb') as f: f.write(body)
            return self.send(200, json.dumps({ 'ok': True, 'bytes': len(body) }), 'application/json; charset=utf-8')
        return self.send(404, 'Not found')

if __name__ == '__main__':
    print(f"平子工作台同步服务启动：http://0.0.0.0:{PORT}")
    print(f"数据目录: {os.path.abspath(DATA_DIR)}")
    print(f"静态目录: {os.path.abspath(STATIC_DIR)}")
    HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
