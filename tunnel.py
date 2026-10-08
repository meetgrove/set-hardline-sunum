#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SET x Hardline Nutrition Sunumu - Kesintisiz İnternet Tüneli (Cloudflare / Public URL)
Buket Hanım ve Hardline ekibinin sunumu internet üzerinden herhangi bir cihazdan
(telefon, tablet, bilgisayar) anında incelemesini sağlar.
Güncel linki tunnel_url.txt dosyasına yazar ve panoya (clipboard) kopyalar.
"""

import os
import sys
import time
import re
import socket
import subprocess
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BIN_PATH = os.path.join(BASE_DIR, 'bin', 'cloudflared')
LOG_FILE = os.path.join(BASE_DIR, 'tunnel.log')
TUNNEL_FILE = os.path.join(BASE_DIR, 'tunnel_url.txt')
PORT = 5090

if not os.path.exists(BIN_PATH):
    ALT_BIN = '/Users/berkesaygili/Desktop/SET KAMPÜSE HOŞGELDİN/SET_Fest_Genel_Sekreterlik_Sunumu_Web/bin/cloudflared'
    if os.path.exists(ALT_BIN):
        BIN_PATH = ALT_BIN
    else:
        print("❌ cloudflared binary bulunamadı:", BIN_PATH)
        sys.exit(1)

os.chmod(BIN_PATH, 0o755)

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def copy_to_clipboard(text):
    try:
        p = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE)
        p.communicate(text.encode('utf-8'))
    except Exception:
        pass

def notify_macos(title, message):
    try:
        cmd = f'display notification "{message}" with title "{title}" sound name "Glass"'
        subprocess.run(['osascript', '-e', cmd], capture_output=True, timeout=2)
    except Exception:
        pass

def check_local_server():
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{PORT}/", timeout=2)
        return True
    except Exception:
        return False

def ensure_local_server():
    if not check_local_server():
        print(f"⚡ Sunum web sunucusu ({PORT}) başlatılıyor...")
        subprocess.Popen([sys.executable, os.path.join(BASE_DIR, 'server.py')],
                         cwd=BASE_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1.5)

def start_one_tunnel():
    if os.path.exists(LOG_FILE):
        try: os.remove(LOG_FILE)
        except Exception: pass

    cmd = [BIN_PATH, 'tunnel', '--url', f'http://127.0.0.1:{PORT}']
    log_fp = open(LOG_FILE, 'w', encoding='utf-8', errors='ignore')
    proc = subprocess.Popen(cmd, stdout=log_fp, stderr=log_fp)

    pattern = re.compile(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com')
    public_url = None
    start_t = time.time()

    while time.time() - start_t < 25:
        if os.path.exists(LOG_FILE):
            try:
                with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                m = pattern.search(content)
                if m:
                    public_url = m.group(0)
                    break
            except Exception:
                pass
        time.sleep(0.5)

    if not public_url:
        proc.terminate()
        return None, None

    return proc, public_url

def main():
    print("=" * 68)
    print("🌐 SET x HARDLINE NUTRITION SUNUMU - CANLI İNTERNET TÜNELİ")
    print("=" * 68)

    ensure_local_server()
    local_ip = get_local_ip()

    while True:
        print("\n⏳ İnternet tüneli kuruluyor...")
        proc, public_url = start_one_tunnel()

        if not public_url:
            print("⚠️ Tünel linki alınamadı, 4 saniye sonra tekrar deneniyor...")
            time.sleep(4)
            continue

        try:
            with open(TUNNEL_FILE, 'w', encoding='utf-8') as f:
                f.write(public_url)
        except Exception:
            pass

        copy_to_clipboard(public_url)
        notify_macos("Hardline Sunum Linki Hazır!", f"Link panoya kopyalandı:\n{public_url}")

        print("=" * 68)
        print("🎉 TÜNEL BAŞARIYLA AÇILDI! BUKET HANIM'A İLETEBİLECEĞİNİZ LİNK:")
        print(f"👉 Canlı İnternet Linki:  {public_url}")
        print(f"👉 Yerel Ağ (LAN):        http://{local_ip}:{PORT}")
        print(f"👉 Localhost:             http://localhost:{PORT}")
        print("📋 (Link otomatik olarak panonuza kopyalandı! Doğrudan Cmd+V ile paylaşabilirsiniz)")
        print("=" * 68)
        print("Tünel aktif. Arka planda çalışmaya devam ediyor...\n")

        fail_count = 0
        while True:
            time.sleep(15)
            if proc.poll() is not None:
                print("⚡ Tünel süreci kapandı, yeniden bağlanıyor...")
                break

            try:
                req = urllib.request.Request(public_url, headers={'User-Agent': 'Mozilla/5.0'})
                res = urllib.request.urlopen(req, timeout=8)
                if res.status == 200:
                    fail_count = 0
                else:
                    fail_count += 1
            except Exception:
                fail_count += 1

            if fail_count >= 3:
                print("⚠️ Bağlantı kesildi, tünel yenileniyor...")
                try: proc.terminate()
                except Exception: pass
                break

if __name__ == '__main__':
    main()
