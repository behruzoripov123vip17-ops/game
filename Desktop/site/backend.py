"""Dependency-free backend foundation for CAMILLA.

SQLite, signed session cookies, role checks and booking conflict protection.
The module uses only Python's standard library so it works in the existing venv.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import smtplib
import time
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen
from datetime import datetime, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
from email.message import EmailMessage
from pathlib import Path
from urllib.parse import parse_qs, urlparse

# SMS configuration - replace with real provider credentials
SMS_PROVIDER = "mock"  # "twilio", "eskiz", "mock"
TWILIO_ACCOUNT_SID = ""
TWILIO_AUTH_TOKEN = ""
TWILIO_FROM_NUMBER = ""
ESKIZ_EMAIL = ""
ESKIZ_PASSWORD = ""

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "camilla.sqlite3"
OWNER_EMAIL = "behruzoripov123vip17@gmail.com"
OWNER_CREDENTIALS_PATH = BASE_DIR / ".camilla-owner-credentials.txt"
ENV_PATH = BASE_DIR / ".env"
SESSION_TTL = 60 * 60 * 24 * 30
SMS_CODE_TTL = 300  # 5 minutes
SMS_CODE_LENGTH = 6


def load_local_env() -> None:
    """Load only simple KEY=VALUE settings from the local ignored .env file."""
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_local_env()
GOOGLE_CLIENT_ID = os.getenv("CAMILLA_GOOGLE_CLIENT_ID", "")


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE,
          phone TEXT UNIQUE, password_hash TEXT, role TEXT NOT NULL DEFAULT 'USER', language TEXT NOT NULL DEFAULT 'ru',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS specialists (
          id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          display_name TEXT NOT NULL, bio TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS services (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, duration_minutes INTEGER NOT NULL,
          price_uzs INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS availability (
          id INTEGER PRIMARY KEY, specialist_id INTEGER NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
          weekday INTEGER NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL,
          UNIQUE(specialist_id, weekday)
        );
        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
          specialist_id INTEGER NOT NULL REFERENCES specialists(id), service_id TEXT NOT NULL REFERENCES services(id),
          starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
          notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS bookings_specialist_time ON bookings(specialist_id, starts_at, ends_at);
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          kind TEXT NOT NULL, message TEXT NOT NULL, read_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sms_codes (
          id INTEGER PRIMARY KEY, phone TEXT NOT NULL, code TEXT NOT NULL,
          expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);
        """)
        # Lightweight migrations for databases created by earlier site versions.
        booking_columns = {row[1] for row in conn.execute("PRAGMA table_info(bookings)")}
        if "contact" not in booking_columns:
            conn.execute("ALTER TABLE bookings ADD COLUMN contact TEXT NOT NULL DEFAULT ''")
        if "payment_status" not in booking_columns:
            conn.execute("ALTER TABLE bookings ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'UNPAID'")
        user_columns = {row[1] for row in conn.execute("PRAGMA table_info(users)")}
        if "google_sub" not in user_columns:
            conn.execute("ALTER TABLE users ADD COLUMN google_sub TEXT")
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)")
        conn.executemany("INSERT OR IGNORE INTO services VALUES (?, ?, ?, ?, 1)", [
          ("a1", "Access Bars", 90, 300000), ("m1", "Маникюр без покрытия", 120, 70000),
          ("m2", "Маникюр с покрытием", 120, 140000), ("p1", "Педикюр", 120, 200000),
          ("d1", "Глубокое бикини", 60, 100000),
          ("m3", "Дизайн", 120, 20000), ("m4", "Наращивание ногтей", 120, 300000),
          ("m5", "Ремонт ногтей", 120, 25000), ("m6", "Снятие покрытия", 120, 30000),
          ("p2", "Обработка только пальчиков", 120, 150000), ("p3", "Обработка пяток", 120, 150000),
          ("p4", "Педикюр с покрытием", 120, 250000), ("d2", "Подмышки", 30, 30000),
          ("d3", "Руки полностью", 60, 70000), ("d4", "Ноги полностью", 60, 100000),
        ])
        conn.execute("UPDATE services SET duration_minutes=120 WHERE id='a1'")
        # The owner password exists only in a local, ignored file.  It is never
        # embedded in the site or sent to clients.
        if OWNER_CREDENTIALS_PATH.exists():
            owner_password = OWNER_CREDENTIALS_PATH.read_text(encoding="utf-8").split("Пароль: ", 1)[-1].strip()
        else:
            owner_password = secrets.token_urlsafe(24)
            OWNER_CREDENTIALS_PATH.write_text(
                "CAMILLA — данные владельца (храните файл в безопасном месте)\n"
                f"Email: {OWNER_EMAIL}\nПароль: {owner_password}\n",
                encoding="utf-8",
            )
            OWNER_CREDENTIALS_PATH.chmod(0o600)
        conn.execute("INSERT OR IGNORE INTO users(id,name,email,phone,password_hash,role) VALUES(1,?,?,?,?,?)", ("CAMILLA Owner", OWNER_EMAIL, "+998941215444", password_hash(owner_password), "ADMIN"))
        conn.execute("UPDATE users SET name=?, email=?, password_hash=?, role='ADMIN' WHERE id=1", ("CAMILLA Owner", OWNER_EMAIL, password_hash(owner_password)))
        conn.execute("INSERT OR IGNORE INTO specialists(id,user_id,display_name,bio) VALUES(1,1,?,?)", ("Шахло Сaitова Давроновна", "Основной специалист CAMILLA"))


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return salt.hex() + ":" + digest.hex()


def password_ok(password: str, encoded: str) -> bool:
    try:
        salt, expected = encoded.split(":", 1)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 210_000).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def send_owner_email(subject: str, message: str) -> bool:
    """Send a real owner notification when SMTP credentials are configured.
цф
    Secrets intentionally come only from the server environment, never browser JS.
    Gmail requires a Google App Password, not the normal account password.
    """
    host, password = os.getenv("CAMILLA_SMTP_HOST"), os.getenv("CAMILLA_SMTP_PASSWORD")
    if not host or not password:
        return False
    sender = os.getenv("CAMILLA_SMTP_USER", OWNER_EMAIL)
    try:
        email = EmailMessage()
        email["Subject"], email["From"], email["To"] = subject, sender, OWNER_EMAIL
        email.set_content(message)
        with smtplib.SMTP_SSL(host, int(os.getenv("CAMILLA_SMTP_PORT", "465")), timeout=12) as smtp:
            smtp.login(sender, password)
            smtp.send_message(email)
        return True
    except (OSError, smtplib.SMTPException):
        return False


def generate_sms_code() -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(SMS_CODE_LENGTH))


def send_sms(phone: str, code: str) -> bool:
    """Send SMS with verification code. Replace with real provider integration."""
    message = f"CAMILLA: Ваш код подтверждения {code}. Действует 5 минут. Не сообщайте никому."

    if SMS_PROVIDER == "twilio":
        try:
            # import twilio.rest
            # client = twilio.rest.Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            # client.messages.create(body=message, from_=TWILIO_FROM_NUMBER, to=phone)
            print(f"[TWILIO] Would send to {phone}: {message}")
            return True
        except Exception as e:
            print(f"[TWILIO ERROR] {e}")
            return False

    elif SMS_PROVIDER == "eskiz":
        try:
            # import requests
            # token = requests.post("https://notify.eskiz.uz/api/auth/login",
            #     json={"email": ESKIZ_EMAIL, "password": ESKIZ_PASSWORD}).json()["data"]["token"]
            # requests.post("https://notify.eskiz.uz/api/message/sms/send",
            #     headers={"Authorization": f"Bearer {token}"},
            #     json={"mobile_phone": phone, "message": message, "from": "4546"})
            print(f"[ESKIZ] Would send to {phone}: {message}")
            return True
        except Exception as e:
            print(f"[ESKIZ ERROR] {e}")
            return False

    else:  # mock - print to console for development
        print(f"\n{'='*50}")
        print(f"[MOCK SMS] To: {phone}")
        print(f"[MOCK SMS] Code: {code}")
        print(f"[MOCK SMS] Message: {message}")
        print(f"{'='*50}\n")
        return True


def verify_sms_code(conn, phone: str, code: str) -> bool:
    """Verify SMS code and delete it if valid."""
    row = conn.execute(
        "SELECT code, expires_at, attempts FROM sms_codes WHERE phone=? ORDER BY id DESC LIMIT 1",
        (phone,)
    ).fetchone()

    if not row:
        return False

    if row["expires_at"] < int(time.time()):
        conn.execute("DELETE FROM sms_codes WHERE phone=?", (phone,))
        return False

    if row["attempts"] >= 5:
        conn.execute("DELETE FROM sms_codes WHERE phone=?", (phone,))
        return False

    if not hmac.compare_digest(row["code"], code):
        conn.execute("UPDATE sms_codes SET attempts=attempts+1 WHERE phone=?", (phone,))
        return False

    conn.execute("DELETE FROM sms_codes WHERE phone=?", (phone,))
    return True


def create_or_get_user_by_phone(conn, phone: str, name: str = "") -> int:
    """Create or get user by phone number."""
    user = conn.execute("SELECT id FROM users WHERE phone=?", (phone,)).fetchone()
    if user:
        return user["id"]

    # Generate a unique username from phone
    base_name = name or f"User {phone[-4:]}"
    cur = conn.execute(
        "INSERT INTO users(name, phone, password_hash, language) VALUES(?, ?, ?, ?)",
        (base_name, phone, "", "ru")
    )
    return cur.lastrowid


def create_session(conn, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    conn.execute("INSERT INTO sessions VALUES (?, ?, ?)", (token, user_id, int(time.time()) + SESSION_TTL))
    return token


def public_user(row):
    return {k: row[k] for k in ("id", "name", "email", "role", "language", "created_at") if k in row.keys()}


def verify_google_credential(credential: str):
    """Verify the Google ID token with Google and return its trusted claims."""
    if not GOOGLE_CLIENT_ID or not credential:
        return None
    try:
        with urlopen("https://oauth2.googleapis.com/tokeninfo?" + urlencode({"id_token": credential}), timeout=8) as response:
            claims = json.loads(response.read())
    except (URLError, ValueError, OSError):
        return None
    try:
        expires_at = int(claims.get("exp", 0))
    except (TypeError, ValueError):
        return None
    if claims.get("aud") != GOOGLE_CLIENT_ID or claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        return None
    if expires_at <= int(time.time()):
        return None
    if str(claims.get("email_verified", "")).lower() not in ("true", "1") or not claims.get("sub") or not claims.get("email"):
        return None
    return claims


class APIHandler(BaseHTTPRequestHandler):
    def json(self, status, payload, cookies=""):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        if cookies: self.send_header("Set-Cookie", cookies)
        self.end_headers(); self.wfile.write(body)

    def body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length) or b"{}")

    def current_user(self, conn):
        raw = self.headers.get("Cookie", "")
        token = next((v.strip() for v in raw.split(";") if v.strip().startswith("camilla_session=")), "").split("=", 1)[-1]
        return conn.execute("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?", (token, int(time.time()))).fetchone()

    def do_POST(self):
        path = urlparse(self.path).path
        with db() as conn:
            try:
                data = self.body()
                if path == "/api/auth/register":
                    email = data.get("email", "").strip().lower()
                    if not email or "@" not in email or len(data.get("password", "")) < 8:
                        return self.json(400, {"error": "Укажите корректный email и пароль минимум из 8 символов"})
                    # The owner's address is reserved: it can only use the credentials
                    # created locally during initialisation above.
                    if email == OWNER_EMAIL.lower():
                        return self.json(403, {"error": "Этот email зарезервирован для аккаунта владельца. Войдите с паролем владельца."})
                    if conn.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
                        return self.json(409, {"error": "Этот email уже зарегистрирован"})
                    name = data.get("name", "").strip() or email.split("@", 1)[0]
                    cur = conn.execute("INSERT INTO users(name,email,password_hash,language) VALUES(?,?,?,?)", (name, email, password_hash(data["password"]), data.get("language", "ru")))
                    token = create_session(conn, cur.lastrowid)
                    return self.json(201, {"user": public_user(conn.execute("SELECT * FROM users WHERE id=?", (cur.lastrowid,)).fetchone())}, f"camilla_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={SESSION_TTL}")
                if path == "/api/auth/login":
                    user = conn.execute("SELECT * FROM users WHERE email=?", (data.get("email", "").strip().lower(),)).fetchone()
                    if not user or not user["password_hash"] or not password_ok(data.get("password", ""), user["password_hash"]):
                        return self.json(401, {"error": "Неверный email или пароль"})
                    token = create_session(conn, user["id"])
                    return self.json(200, {"user": public_user(user)}, f"camilla_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={SESSION_TTL}")
                if path == "/api/auth/google":
                    claims = verify_google_credential(data.get("credential", ""))
                    if not claims:
                        return self.json(401, {"error": "Не удалось подтвердить вход через Google"})
                    email, google_sub = claims["email"].strip().lower(), claims["sub"]
                    if email == OWNER_EMAIL.lower():
                        return self.json(403, {"error": "Для аккаунта владельца используйте сохранённый email и пароль."})
                    user = conn.execute("SELECT * FROM users WHERE google_sub=? OR email=?", (google_sub, email)).fetchone()
                    if user and user["google_sub"] and user["google_sub"] != google_sub:
                        return self.json(409, {"error": "Этот email уже связан с другим аккаунтом Google"})
                    if user:
                        conn.execute("UPDATE users SET google_sub=COALESCE(google_sub, ?) WHERE id=?", (google_sub, user["id"]))
                    else:
                        name = str(claims.get("name", "")).strip() or email.split("@", 1)[0]
                        cur = conn.execute("INSERT INTO users(name,email,google_sub,language) VALUES(?,?,?,?)", (name, email, google_sub, data.get("language", "ru")))
                        user = conn.execute("SELECT * FROM users WHERE id=?", (cur.lastrowid,)).fetchone()
                    user = conn.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
                    token = create_session(conn, user["id"])
                    return self.json(200, {"user": public_user(user)}, f"camilla_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={SESSION_TTL}")
                if path == "/api/auth/logout":
                    self.logout(conn); return self.json(204, {}, "camilla_session=; Path=/; Max-Age=0")
                user = self.current_user(conn)
                if not user: return self.json(401, {"error": "Войдите в аккаунт"})
                if path == "/api/admin/bookings/status":
                    if user["role"] != "ADMIN": return self.json(403, {"error": "Доступ только для администратора"})
                    status = data.get("status")
                    payment_status = data.get("payment_status")
                    if status not in (None, "CONFIRMED", "CANCELLED") or payment_status not in (None, "PAID", "UNPAID"):
                        return self.json(400, {"error": "Некорректный статус"})
                    if not status and not payment_status: return self.json(400, {"error": "Выберите изменение"})
                    fields, values = [], []
                    if status: fields.extend(["status=?"]); values.append(status)
                    if payment_status: fields.extend(["payment_status=?"]); values.append(payment_status)
                    values.append(data.get("id"))
                    if not conn.execute(f"UPDATE bookings SET {', '.join(fields)} WHERE id=?", values).rowcount:
                        return self.json(404, {"error": "Запись не найдена"})
                    return self.json(200, {"status": status, "payment_status": payment_status})
                if path == "/api/bookings":
                    required = (data.get("specialist_id"), data.get("service_id"), data.get("starts_at"), data.get("ends_at"))
                    if not all(required): return self.json(400, {"error": "Недостаточно данных для записи"})
                    try:
                        starts_at = datetime.fromisoformat(data["starts_at"])
                        ends_at = datetime.fromisoformat(data["ends_at"])
                    except (TypeError, ValueError):
                        return self.json(400, {"error": "Некорректное время записи"})
                    if starts_at.date() < datetime.now().date():
                        return self.json(400, {"error": "Нельзя записаться на прошедшую дату"})
                    durations = {"a1": 120, "m1": 120, "m2": 120, "m3": 120, "m4": 120, "m5": 120, "m6": 120,
                                 "p1": 120, "p2": 120, "p3": 120, "p4": 120, "d1": 60, "d2": 30, "d3": 60, "d4": 60}
                    duration = durations.get(data["service_id"])
                    start_minutes = starts_at.hour * 60 + starts_at.minute
                    crosses_break = start_minutes < 780 and start_minutes + (duration or 0) > 720
                    if not duration or starts_at.minute not in (0, 30) or start_minutes < 540 or start_minutes + duration > 1080 or crosses_break or ends_at != starts_at + timedelta(minutes=duration):
                        return self.json(400, {"error": "Выберите доступный интервал для этой услуги"})
                    if duration == 120 and start_minutes not in (540, 780, 900):
                        return self.json(400, {"error": "Для этой услуги доступны только двухчасовые интервалы"})
                    if data["service_id"] == "a1" and starts_at.weekday() != 4:
                        return self.json(400, {"error": "Access Bars доступен только по пятницам"})
                    if data["service_id"] != "a1" and starts_at.weekday() == 4:
                        return self.json(400, {"error": "По пятницам принимается только Access Bars"})
                    conflict = conn.execute("SELECT 1 FROM bookings WHERE specialist_id=? AND status IN ('PENDING','CONFIRMED') AND starts_at < ? AND ends_at > ?", (data["specialist_id"], data["ends_at"], data["starts_at"])).fetchone()
                    if conflict: return self.json(409, {"error": "Это время уже занято"})
                    contact = str(data.get("contact", "")).strip()[:120]
                    cur = conn.execute("INSERT INTO bookings(user_id,specialist_id,service_id,starts_at,ends_at,notes,contact) VALUES(?,?,?,?,?,?,?)", (user["id"], *required, data.get("notes", ""), contact))
                    service = conn.execute("SELECT name FROM services WHERE id=?", (data["service_id"],)).fetchone()
                    owner = conn.execute("SELECT id FROM users WHERE role='ADMIN' ORDER BY id LIMIT 1").fetchone()
                    if owner:
                        message = f"Новая запись: {user['name']} — {service['name'] if service else data['service_id']}, {starts_at.strftime('%d.%m.%Y %H:%M')}. Контакт: {contact or 'не указан'}"
                        conn.execute("INSERT INTO notifications(user_id,kind,message) VALUES(?,?,?)", (owner["id"], "NEW_BOOKING", message))
                        send_owner_email("CAMILLA: новая запись", message)
                    return self.json(201, {"id": cur.lastrowid, "status": "PENDING"})
            except sqlite3.IntegrityError:
                return self.json(409, {"error": "Операция конфликтует с существующими данными"})
            except (ValueError, json.JSONDecodeError):
                return self.json(400, {"error": "Некорректный запрос"})
        return self.json(404, {"error": "Маршрут не найден"})

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        with db() as conn:
            user = self.current_user(conn)
            if path == "/api/services":
                return self.json(200, {"services": [dict(x) for x in conn.execute("SELECT * FROM services WHERE active=1")]})
            if path == "/api/bookings/occupied":
                rows = conn.execute("SELECT starts_at, ends_at FROM bookings WHERE status IN ('PENDING','CONFIRMED') ORDER BY starts_at").fetchall()
                return self.json(200, {"bookings": [dict(x) for x in rows]})
            if path == "/api/auth/google/config":
                return self.json(200, {"client_id": GOOGLE_CLIENT_ID})
            if path == "/api/auth/me": return self.json(200, {"user": public_user(user) if user else None})
            if not user: return self.json(401, {"error": "Войдите в аккаунт"})
            if path == "/api/admin/bookings":
                if user["role"] != "ADMIN": return self.json(403, {"error": "Доступ только для администратора"})
                rows = conn.execute("SELECT b.*, s.name service_name, s.price_uzs, u.name customer_name, u.email customer_email FROM bookings b JOIN services s ON s.id=b.service_id JOIN users u ON u.id=b.user_id ORDER BY CASE WHEN b.starts_at >= datetime('now') THEN 0 ELSE 1 END, b.starts_at ASC").fetchall()
                return self.json(200, {"bookings": [dict(x) for x in rows]})
            if path == "/api/admin/analytics":
                if user["role"] != "ADMIN": return self.json(403, {"error": "Доступ только для администратора"})
                total = conn.execute("SELECT COUNT(*) FROM bookings").fetchone()[0]
                pending = conn.execute("SELECT COUNT(*) FROM bookings WHERE status='PENDING'").fetchone()[0]
                confirmed = conn.execute("SELECT COUNT(*) FROM bookings WHERE status='CONFIRMED'").fetchone()[0]
                customers = conn.execute("SELECT COUNT(*) FROM users WHERE role='USER'").fetchone()[0]
                unread = conn.execute("SELECT COUNT(*) FROM notifications WHERE user_id=? AND read_at IS NULL", (user["id"],)).fetchone()[0]
                weekly = conn.execute("SELECT s.name, COUNT(*) count, SUM(s.price_uzs) amount FROM bookings b JOIN services s ON s.id=b.service_id WHERE b.starts_at >= date('now','-6 days') AND b.status != 'CANCELLED' GROUP BY s.id ORDER BY count DESC").fetchall()
                week_total = conn.execute("SELECT COALESCE(SUM(s.price_uzs), 0) FROM bookings b JOIN services s ON s.id=b.service_id WHERE b.starts_at >= date('now','-6 days') AND b.status != 'CANCELLED'").fetchone()[0]
                paid_total = conn.execute("SELECT COALESCE(SUM(s.price_uzs), 0) FROM bookings b JOIN services s ON s.id=b.service_id WHERE b.payment_status='PAID' AND b.status != 'CANCELLED'").fetchone()[0]
                return self.json(200, {"total": total, "pending": pending, "confirmed": confirmed, "customers": customers, "unread_notifications": unread, "week_total": week_total, "paid_total": paid_total, "weekly_services": [dict(x) for x in weekly]})
            if path == "/api/admin/dashboard":
                if user["role"] != "ADMIN": return self.json(403, {"error": "Доступ только для владельца"})
                period = parse_qs(parsed.query).get("period", ["week"])[0]
                modifiers = {"day": "-0 days", "week": "-6 days", "month": "-29 days"}
                if period not in modifiers: return self.json(400, {"error": "Неизвестный период"})
                start = modifiers[period]
                rows = conn.execute("SELECT b.*, s.name service_name, s.price_uzs, u.name customer_name, u.email customer_email FROM bookings b JOIN services s ON s.id=b.service_id JOIN users u ON u.id=b.user_id WHERE date(b.starts_at) >= date('now', ?) ORDER BY b.starts_at ASC", (start,)).fetchall()
                totals = conn.execute("SELECT COUNT(*) count, COALESCE(SUM(s.price_uzs),0) expected, COALESCE(SUM(CASE WHEN b.payment_status='PAID' THEN s.price_uzs ELSE 0 END),0) paid FROM bookings b JOIN services s ON s.id=b.service_id WHERE date(b.starts_at) >= date('now', ?) AND b.status != 'CANCELLED'", (start,)).fetchone()
                services = conn.execute("SELECT s.name, COUNT(*) count, COALESCE(SUM(s.price_uzs),0) amount FROM bookings b JOIN services s ON s.id=b.service_id WHERE date(b.starts_at) >= date('now', ?) AND b.status != 'CANCELLED' GROUP BY s.id ORDER BY count DESC, amount DESC", (start,)).fetchall()
                upcoming = conn.execute("SELECT b.*, s.name service_name, s.price_uzs, u.name customer_name FROM bookings b JOIN services s ON s.id=b.service_id JOIN users u ON u.id=b.user_id WHERE b.starts_at >= datetime('now') AND b.status != 'CANCELLED' ORDER BY b.starts_at ASC LIMIT 10").fetchall()
                return self.json(200, {"period": period, "summary": dict(totals), "services": [dict(x) for x in services], "bookings": [dict(x) for x in rows], "upcoming": [dict(x) for x in upcoming]})
            if path == "/api/bookings":
                rows = conn.execute("SELECT b.*, s.name service_name FROM bookings b JOIN services s ON s.id=b.service_id WHERE b.user_id=? ORDER BY b.starts_at DESC", (user["id"],))
                return self.json(200, {"bookings": [dict(x) for x in rows]})
            if path == "/api/notifications":
                rows = conn.execute("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC", (user["id"],))
                return self.json(200, {"notifications": [dict(x) for x in rows]})
        return self.json(404, {"error": "Маршрут не найден"})

    def logout(self, conn):
        raw = self.headers.get("Cookie", "")
        token = next((v.strip() for v in raw.split(";") if v.strip().startswith("camilla_session=")), "").split("=", 1)[-1]
        conn.execute("DELETE FROM sessions WHERE token=?", (token,))

    def log_message(self, *_): pass


init_db()
