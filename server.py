#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SET x Hardline Nutrition Sunum Sunucusu
Yerel HTTP sunucusunu başlatır ve tarayıcıda sunumu otomatik olarak açar.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import socket

PORT = 5090
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def is_port_available(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) != 0

def find_available_port(start_port=5090):
    port = start_port
    while port < start_port + 50:
        if is_port_available(port):
            return port
        port += 1
    return start_port

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    os.chdir(BASE_DIR)
    port = find_available_port(PORT)
    
    Handler = CustomHandler
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", port), Handler) as httpd:
        url = f"http://localhost:{port}"
        print("=" * 68)
        print("🎬 SET x HARDLINE NUTRITION SUNUM PORTALI BAŞLATILDI")
        print("=" * 68)
        print(f"👉 Yerel Bağlantı: {url}")
        print("⌨️  Durdurmak için: Ctrl + C")
        print("=" * 68)
        
        # Tarayıcıda aç
        try:
            webbrowser.open(url)
        except Exception:
            pass
            
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Sunucu durduruldu.")

if __name__ == '__main__':
    main()
