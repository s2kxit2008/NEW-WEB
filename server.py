import http.server
import socketserver
import json
import os
import urllib.parse
import uuid
import datetime
import re
import shutil

PORT = 5000
DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")

# Admin credentials
ADMIN_USERNAME = "hamim"
ADMIN_PASSWORD = "1"

# Ensure uploads folder exists
os.makedirs(UPLOADS_DIR, exist_ok=True)

# ===================================================
# DEFAULT DATA
# ===================================================
DEFAULT_DATA = {
    "store_info": {
        "name": "ONLY RED SHOP",
        "tagline": "Dominate Free Fire and Emulators with instant key delivery, undetected external panels, and BR MODS.",
        "discord_url": "https://discord.gg/onlyred",
        "badges": [
            {"text": "OBB 54 UNDETECTED", "type": "green"},
            {"text": "INSTANT DELIVERY",  "type": "red"}
        ]
    },
    "downloads": {
        "emulator": {
            "name": "Optimized Emulator", "type": "Emulator",
            "version": "v5.2.1-Bypass",
            "description": "High-FPS pre-configured emulator with built-in anti-detection & 120FPS bypass.",
            "url": "https://example.com/downloads/OnlyRed_Emulator_Setup.zip",
            "file_size": "420 MB", "icon": "emulator"
        },
        "apk": {
            "name": "Safe Modded APK", "type": "APK",
            "version": "v1.108.x (OBB 54)",
            "description": "Custom anti-ban APK with auto-headshot hook, antenna, and ESP features.",
            "url": "https://example.com/downloads/OnlyRed_Client_OBB54.apk",
            "file_size": "85 MB", "icon": "apk"
        },
        "exe": {
            "name": "External Panel Loader", "type": "EXE",
            "version": "v4.9.0-Final",
            "description": "Undetected external memory injector with Fake Lag, Aimbot, and Stream-Proof ESP.",
            "url": "https://example.com/downloads/OnlyRed_External_Loader.exe",
            "file_size": "18 MB", "icon": "exe"
        }
    },
    "products": [
        {
            "id": "br-mods", "title": "BR MODS", "badge": "BR MODS", "badge_color": "red",
            "description": "Premium Free Fire BR MODS with high stability and safety features.",
            "image": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
            "has_video": True, "featured": False,
            "packages": [
                {"id": "br-1d",  "duration": "1 DAY",   "price_usd": 0.5, "price_bdt": 50},
                {"id": "br-10d", "duration": "10 DAY",  "price_usd": 3.0, "price_bdt": 300},
                {"id": "br-30d", "duration": "30 DAY",  "price_usd": 7.0, "price_bdt": 700}
            ]
        },
        {
            "id": "fake-lag", "title": "FAKE LAG", "badge": "FAKE LAG", "badge_color": "red",
            "description": "High performance fake lag tool for ultimate gameplay advantage.",
            "image": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
            "has_video": False, "featured": False,
            "packages": [
                {"id": "fl-10d", "duration": "10 DAY", "price_usd": 2.0, "price_bdt": 200},
                {"id": "fl-30d", "duration": "30 DAY", "price_usd": 5.0, "price_bdt": 500}
            ]
        },
        {
            "id": "bypass-emulator", "title": "Bypass Emulator", "badge": "FEATURED", "badge_color": "gold",
            "description": "Safe matchmaking emulator bypass for high rank placement.",
            "image": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
            "has_video": False, "featured": True,
            "packages": [
                {"id": "be-7d",  "duration": "7 DAY",   "price_usd": 2.0, "price_bdt": 200},
                {"id": "be-1m",  "duration": "1 MONTH", "price_usd": 6.0, "price_bdt": 600},
                {"id": "be-1obb","duration": "1 OBB",   "price_usd": 8.0, "price_bdt": 800}
            ]
        },
        {
            "id": "premium-panel", "title": "PREMIUM PANEL ( EXTERNAL )", "badge": "EXTERNAL PANEL", "badge_color": "red",
            "description": "Fully automated instant license key delivery via ONLY RED API.",
            "image": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80",
            "has_video": False, "featured": False,
            "packages": [
                {"id": "pp-7d",  "duration": "7 DAY",   "price_usd": 2.0,  "price_bdt": 200},
                {"id": "pp-1m",  "duration": "1 MONTH", "price_usd": 5.0,  "price_bdt": 500},
                {"id": "pp-1obb","duration": "1 OBB",   "price_usd": 7.0,  "price_bdt": 700},
                {"id": "pp-life","duration": "LIFETIME","price_usd": 15.0, "price_bdt": 1500}
            ]
        }
    ],
    "keys": [
        {"key": "RED-VIP-9999",  "product_id": "premium-panel", "duration": "LIFETIME", "max_uses": -1, "used_by": ["demo_user"], "created_at": "2026-09-08 00:00:00"},
        {"key": "DEMO-KEY-1USE", "product_id": "br-mods",       "duration": "10 DAY",  "max_uses": 1,  "used_by": [],            "created_at": "2026-09-08 00:00:00"},
        {"key": "DUO-KEY-2USE",  "product_id": "fake-lag",      "duration": "30 DAY",  "max_uses": 2,  "used_by": [],            "created_at": "2026-09-08 00:00:00"}
    ],
    "users": {
        "demo_user": {
            "id": "demo_user", "email": "gamer@gmail.com", "name": "Pro Gamer",
            "licenses": [{"key": "RED-VIP-9999", "product_id": "premium-panel",
                          "product_title": "PREMIUM PANEL ( EXTERNAL )", "duration": "LIFETIME",
                          "claimed_at": "2026-09-08 00:00:00"}]
        }
    },
    "orders": []
}


def load_data():
    if not os.path.exists(DATA_FILE):
        save_data(DEFAULT_DATA)
        return DEFAULT_DATA
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Loading data: {e}")
        return DEFAULT_DATA


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_mime_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    return {
        ".html": "text/html; charset=utf-8",
        ".css":  "text/css",
        ".js":   "application/javascript",
        ".json": "application/json",
        ".png":  "image/png",
        ".jpg":  "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif":  "image/gif",
        ".ico":  "image/x-icon",
        ".svg":  "image/svg+xml",
    }.get(ext, "application/octet-stream")


# ===================================================
# Manual multipart/form-data parser (no cgi module needed)
# ===================================================
def sniff_image_ext(data, filename="", content_type=""):
    """Pick a safe image extension from magic bytes, filename, or MIME type."""
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if data[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif"
    ext = os.path.splitext(filename or "")[1].lower()
    if ext == ".jpeg":
        ext = ".jpg"
    if ext in (".jpg", ".png", ".webp", ".gif"):
        return ext
    ctype = (content_type or "").lower()
    if "png" in ctype:
        return ".png"
    if "webp" in ctype:
        return ".webp"
    if "gif" in ctype:
        return ".gif"
    if "jpeg" in ctype or "jpg" in ctype:
        return ".jpg"
    return None


def parse_multipart(body_bytes, content_type):
    """
    Robust multipart parser. Handles quoted and unquoted boundaries.
    Returns: {field_name: {"filename": str|None, "data": bytes, "content_type": str}}
    """
    m = re.search(r'boundary=(?:"([^"]+)"|([^\s;]+))', content_type)
    if not m:
        return {}
    boundary = (m.group(1) or m.group(2)).encode("latin-1")

    parts = {}
    raw = body_bytes
    if raw.startswith(b"--" + boundary):
        raw = b"\r\n" + raw
    elif not raw.startswith(b"\r\n"):
        raw = b"\r\n" + raw

    delim = b"\r\n--" + boundary
    segments = raw.split(delim)
    for seg in segments[1:]:
        if seg.startswith(b"--"):
            break
        if seg.startswith(b"\r\n"):
            seg = seg[2:]
        elif seg.startswith(b"\n"):
            seg = seg[1:]

        if b"\r\n\r\n" in seg:
            raw_headers, file_data = seg.split(b"\r\n\r\n", 1)
        elif b"\n\n" in seg:
            raw_headers, file_data = seg.split(b"\n\n", 1)
        else:
            continue

        if file_data.endswith(b"\r\n"):
            file_data = file_data[:-2]
        elif file_data.endswith(b"\n"):
            file_data = file_data[:-1]

        header_text = raw_headers.decode("utf-8", errors="replace")

        disp_m = re.search(r'Content-Disposition:[^\r\n]*\bname="([^"]+)"', header_text, re.I)
        fname_m = re.search(
            r'Content-Disposition:[^\r\n]*\bfilename\*?=(?:UTF-8\'\')?"?([^";\r\n]+)"?',
            header_text,
            re.I,
        )
        ctype_m = re.search(r"Content-Type:\s*([^\r\n]+)", header_text, re.I)

        if not disp_m:
            continue

        field = disp_m.group(1)
        filename = urllib.parse.unquote(fname_m.group(1).strip()) if fname_m else None
        ctype = ctype_m.group(1).strip() if ctype_m else "application/octet-stream"
        parts[field] = {"filename": filename, "data": file_data, "content_type": ctype}

    return parts


# ===================================================
# HTTP Request Handler
# ===================================================
class CustomHandler(http.server.SimpleHTTPRequestHandler):

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def serve_file(self, filepath):
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', get_mime_type(filepath))
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_response(404)
            self.end_headers()

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return self.rfile.read(length) if length > 0 else b''

    def read_json_body(self):
        try:
            return json.loads(self.read_body().decode('utf-8'))
        except Exception:
            return {}

    # --------------------------------------------------
    # GET
    # --------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path   = parsed.path

        # Admin login page
        if path in ('/admin', '/admin/'):
            self.serve_file(os.path.join(os.path.dirname(__file__), 'admin.html'))
            return

        # Admin panel page
        if path == '/admin-panel.html':
            self.serve_file(os.path.join(os.path.dirname(__file__), 'admin-panel.html'))
            return

        # Admin panel JS
        if path == '/admin-panel.js':
            self.serve_file(os.path.join(os.path.dirname(__file__), 'admin-panel.js'))
            return

        # Uploaded images
        if path.startswith('/uploads/'):
            filename = os.path.basename(path[len('/uploads/'):])
            self.serve_file(os.path.join(UPLOADS_DIR, filename))
            return

        data = load_data()

        if path == '/api/products':
            self.send_json({"success": True, "products": data.get("products", [])})
            return
        if path == '/api/categories':
            self.send_json({"success": True, "categories": data.get("categories", [])})
            return
        if path == '/api/store-info':
            self.send_json({"success": True, "info": data.get("store_info", {})})
            return
        if path == '/api/downloads':
            self.send_json({"success": True, "downloads": data.get("downloads", {})})
            return
        if path == '/api/admin/keys':
            self.send_json({"success": True, "keys": data.get("keys", [])})
            return
        if path == '/api/admin/stats':
            keys = data.get("keys", [])
            self.send_json({"success": True, "stats": {
                "total_products": len(data.get("products", [])),
                "total_keys":     len(keys),
                "total_users":    len(data.get("users", {})),
                "claimed_keys":   sum(len(k.get("used_by", [])) for k in keys)
            }})
            return
        if path.startswith('/api/user/') and path.endswith('/licenses'):
            user_id = path.split('/')[3]
            user = data.get("users", {}).get(user_id)
            if user:
                self.send_json({"success": True, "licenses": user.get("licenses", []),
                                "can_download": len(user.get("licenses", [])) > 0})
            else:
                self.send_json({"success": True, "licenses": [], "can_download": False})
            return

        return super().do_GET()

    # --------------------------------------------------
    # POST
    # --------------------------------------------------
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path   = parsed.path
        data   = load_data()

        # ---- Admin Login ----
        if path == '/api/admin/login':
            payload = self.read_json_body()
            if payload.get('username') == ADMIN_USERNAME and payload.get('password') == ADMIN_PASSWORD:
                self.send_json({"success": True})
            else:
                self.send_json({"success": False, "message": "Invalid credentials"}, 401)
            return

        # ---- Image Upload (manual multipart parser) ----
        if path == '/api/admin/upload-image':
            content_type = self.headers.get('Content-Type', '')
            if 'multipart/form-data' not in content_type:
                self.send_json({"success": False, "message": "Expected multipart/form-data"}, 400)
                return
            try:
                body = self.read_body()
                parts = parse_multipart(body, content_type)

                file_part = parts.get('image') or parts.get('file') or next(iter(parts.values()), None)
                if not file_part or not file_part.get('data'):
                    self.send_json({"success": False, "message": "No image file found in upload"}, 400)
                    return
                original_name = file_part.get('filename') or 'upload'
                file_data = file_part['data']
                ext = sniff_image_ext(file_data, original_name, file_part.get("content_type", ""))

                if not ext:
                    self.send_json({"success": False, "message": "Invalid file type. Use JPG, PNG, WEBP, GIF."}, 400)
                    return

                if len(file_data) > 5 * 1024 * 1024:
                    self.send_json({"success": False, "message": "File too large. Max 5MB."}, 400)
                    return

                unique_name = f"{uuid.uuid4().hex[:14]}{ext}"
                save_path   = os.path.join(UPLOADS_DIR, unique_name)
                with open(save_path, 'wb') as f:
                    f.write(file_data)

                print(f"[UPLOAD] Saved: {unique_name} ({len(file_data)} bytes)")
                self.send_json({"success": True, "url": f"/uploads/{unique_name}", "filename": unique_name})
            except Exception as e:
                print(f"[UPLOAD ERROR] {e}")
                self.send_json({"success": False, "message": str(e)}, 500)
            return

        # All other routes use JSON body
        payload = self.read_json_body()

        # ---- User Login ----
        if path == '/api/auth/login':
            email   = payload.get("email", "").strip() or "guest@gmail.com"
            name    = payload.get("name",  "").strip() or email.split("@")[0].capitalize()
            user_id = email.replace("@", "_").replace(".", "_")
            if user_id not in data["users"]:
                data["users"][user_id] = {"id": user_id, "email": email, "name": name, "licenses": []}
                save_data(data)
            user = data["users"][user_id]
            self.send_json({"success": True, "user": user,
                            "can_download": len(user.get("licenses", [])) > 0})
            return

        # ---- Claim Key ----
        if path == '/api/keys/claim':
            key_code = payload.get("key", "").strip().upper()
            user_id  = payload.get("user_id", "").strip()
            if not key_code:
                self.send_json({"success": False, "message": "Please enter a valid key"}, 400); return
            if not user_id or user_id not in data["users"]:
                self.send_json({"success": False, "message": "Please log in first"}, 401); return

            found_key = next((k for k in data["keys"] if k["key"].upper() == key_code), None)
            if not found_key:
                self.send_json({"success": False, "message": "Invalid license key."}, 404); return

            used_by  = found_key.setdefault("used_by", [])
            max_uses = found_key.get("max_uses", 1)
            if user_id in used_by:
                self.send_json({"success": False, "message": "You already claimed this key!"}, 400); return
            if max_uses != -1 and len(used_by) >= max_uses:
                self.send_json({"success": False,
                                "message": f"Key reached max limit ({max_uses})."}, 400); return

            used_by.append(user_id)
            product_title = found_key.get("product_id")
            for p in data["products"]:
                if p["id"] == found_key.get("product_id"):
                    product_title = p["title"]; break

            lic = {"key": found_key["key"], "product_id": found_key.get("product_id"),
                   "product_title": product_title, "duration": found_key.get("duration", "LIFETIME"),
                   "claimed_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
            data["users"][user_id].setdefault("licenses", []).append(lic)
            save_data(data)
            self.send_json({"success": True,
                            "message": f"Key claimed! Access unlocked for {product_title} ({found_key.get('duration')}).",
                            "license": lic, "can_download": True})
            return

        # ---- Purchase ----
        if path == '/api/purchase':
            user_id    = payload.get("user_id", "").strip()
            product_id = payload.get("product_id", "").strip()
            package_id = payload.get("package_id", "").strip()
            pay_method = payload.get("payment_method", "Instant").strip()
            if not user_id or user_id not in data["users"]:
                self.send_json({"success": False, "message": "Please log in first"}, 401); return

            target_prod = target_pkg = None
            for p in data["products"]:
                if p["id"] == product_id:
                    target_prod = p
                    target_pkg  = next((pk for pk in p.get("packages", []) if pk["id"] == package_id), None)
                    break
            if not target_prod or not target_pkg:
                self.send_json({"success": False, "message": "Product/package not found"}, 404); return

            rkey = f"OR-{target_prod['id'][:3].upper()}-{uuid.uuid4().hex[:8].upper()}"
            data["keys"].append({"key": rkey, "product_id": target_prod["id"],
                                  "duration": target_pkg["duration"], "max_uses": 1,
                                  "used_by": [user_id],
                                  "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
            lic = {"key": rkey, "product_id": target_prod["id"],
                   "product_title": target_prod["title"], "duration": target_pkg["duration"],
                   "claimed_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
            data["users"][user_id].setdefault("licenses", []).append(lic)
            data.setdefault("orders", []).append({
                "id": str(uuid.uuid4())[:8], "user_id": user_id,
                "product_title": target_prod["title"], "duration": target_pkg["duration"],
                "price_usd": target_pkg["price_usd"], "price_bdt": target_pkg["price_bdt"],
                "key": rkey, "payment_method": pay_method,
                "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            save_data(data)
            self.send_json({"success": True, "message": f"Payment successful! Key: {rkey}",
                            "key": rkey, "license": lic, "can_download": True})
            return

        # ---- Admin: Generate Key ----
        if path == '/api/admin/keys/generate':
            product_id   = payload.get("product_id")
            duration     = payload.get("duration", "LIFETIME")
            max_uses_str = str(payload.get("max_uses", "1")).lower()
            max_uses     = -1 if max_uses_str in ("unlimited", "-1", "inf") else int(max_uses_str) if max_uses_str.isdigit() else 1
            custom       = payload.get("custom_key", "").strip().upper()
            key_code     = custom if custom else f"OR-{(product_id or 'RED')[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
            rec = {"key": key_code, "product_id": product_id, "duration": duration,
                   "max_uses": max_uses, "used_by": [],
                   "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
            data["keys"].insert(0, rec)
            save_data(data)
            self.send_json({"success": True, "key": rec})
            return

        # ---- Admin: Add/Update Product ----
        if path == '/api/admin/products':
            prod = payload.get("product")
            if not prod or not prod.get("title"):
                self.send_json({"success": False, "message": "Title required"}, 400); return
            if not prod.get("id"):
                slug = prod["title"].lower().replace(" ", "-")
                prod["id"] = f"{slug[:16]}-{uuid.uuid4().hex[:4]}"
            
            # Sync product categories to global categories
            prod_cats = prod.get("categories", [])
            existing_cats = data.setdefault("categories", [])
            for c in prod_cats:
                c_clean = c.strip()
                if c_clean and c_clean not in existing_cats:
                    existing_cats.append(c_clean)

            idx = next((i for i, p in enumerate(data["products"]) if p["id"] == prod["id"]), None)
            if idx is not None:
                data["products"][idx] = prod
            else:
                data["products"].append(prod)
            save_data(data)
            self.send_json({"success": True, "product": prod, "categories": data["categories"]})
            return

        # ---- Admin: Add/Manage Category ----
        if path == '/api/admin/categories':
            cat_name = payload.get("category", "").strip()
            action   = payload.get("action", "add")
            existing = data.setdefault("categories", ["ALL", "Windows", "Android", "iOS", "Emulators", "Utility"])
            if action == "add" and cat_name and cat_name not in existing:
                existing.append(cat_name)
            elif action == "delete" and cat_name in existing:
                existing.remove(cat_name)
            save_data(data)
            self.send_json({"success": True, "categories": existing})
            return

        # ---- Admin: Add Package ----
        if path == '/api/admin/packages/add':
            pid      = payload.get("product_id")
            duration = payload.get("duration", "").strip().upper()
            if not pid or not duration:
                self.send_json({"success": False, "message": "Missing product_id or duration"}, 400); return
            target = next((p for p in data["products"] if p["id"] == pid), None)
            if not target:
                self.send_json({"success": False, "message": "Product not found"}, 404); return
            pkg = {"id": f"{pid[:2]}-{duration.lower().replace(' ', '')}-{uuid.uuid4().hex[:3]}",
                   "duration": duration,
                   "price_usd": float(payload.get("price_usd", 0)),
                   "price_bdt": float(payload.get("price_bdt", 0))}
            target.setdefault("packages", []).append(pkg)
            save_data(data)
            self.send_json({"success": True, "product": target, "new_package": pkg})
            return

        # ---- Admin: Update Downloads ----
        if path == '/api/admin/downloads':
            if payload.get("downloads"):
                data["downloads"] = payload["downloads"]
                save_data(data)
            self.send_json({"success": True, "downloads": data["downloads"]})
            return

        # ---- Admin: Delete Key ----
        if path == '/api/admin/keys/delete':
            key_code = payload.get("key", "").strip()
            data["keys"] = [k for k in data["keys"] if k["key"] != key_code]
            save_data(data)
            self.send_json({"success": True})
            return

        # ---- Admin: Delete Product ----
        if path == '/api/admin/products/delete':
            prod_id = payload.get("product_id")
            data["products"] = [p for p in data["products"] if p["id"] != prod_id]
            save_data(data)
            self.send_json({"success": True})
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} {fmt % args}")


def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    load_data()
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        httpd.allow_reuse_address = True
        print("=" * 54)
        print(f"  STORE       ->  http://localhost:{PORT}")
        print(f"  ADMIN LOGIN ->  http://localhost:{PORT}/admin")
        print(f"  Credentials ->  user: {ADMIN_USERNAME}   pass: {ADMIN_PASSWORD}")
        print("=" * 54)
        httpd.serve_forever()


if __name__ == "__main__":
    run()
