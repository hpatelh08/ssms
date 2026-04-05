from flask import Flask, render_template, render_template_string, request, redirect, url_for, session, flash, send_from_directory, Response, abort, make_response
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime
import json
import time
import socket
import subprocess
import re
import secrets
import random

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'


def _no_cache(response: Response) -> Response:
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.errorhandler(404)
def _log_404(err):
    try:
        print("404:", request.method, request.path)
    except Exception:
        pass
    return err


@app.before_request
def _handle_api_preflight():
    if request.method != 'OPTIONS':
        return None
    if not (request.path.startswith('/api/') or request.path.startswith('/auth/')):
        return None

    response = app.make_default_options_response()
    origin = request.headers.get('Origin', '')
    if origin in ('http://127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:5000', 'http://localhost:5000'):
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Vary'] = 'Origin'
    return response


@app.after_request
def _add_api_cors_headers(response):
    if request.path.startswith('/api/') or request.path.startswith('/auth/'):
        origin = request.headers.get('Origin', '')
        if origin in ('http://127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:5000', 'http://localhost:5000'):
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Vary'] = 'Origin'
    return response

# Admin Dashboard (React build) location
ADMIN_DASHBOARD_DIST_DIR = os.path.join(
    os.path.dirname(__file__),
    'Admin Dashboard',
    'frontend-react',
    'dist',
)
ADMIN_DASHBOARD_BACKEND_DB_PATH = os.path.join(
    os.path.dirname(__file__),
    'Admin Dashboard',
    'backend',
    'database.sqlite',
)

TEACHER_PORTAL_DIR = os.path.join(os.path.dirname(__file__), 'teacher portal')
TEACHER_PORTAL_RUN_BAT = os.path.join(TEACHER_PORTAL_DIR, 'run.bat')
TEACHER_PORTAL_SERVER_DIR = os.path.join(TEACHER_PORTAL_DIR, 'server')
TEACHER_PORTAL_CLIENT_DIR = os.path.join(TEACHER_PORTAL_DIR, 'client')
NPM_EXECUTABLE = 'npm.cmd' if os.name == 'nt' else 'npm'
TEACHER_PORTAL_CLIENT_PORT = 3000
TEACHER_PORTAL_SERVER_PORT = 5001
TEACHER_DEMO_GRADES = list(range(1, 8))
TEACHER_DEMO_SECTIONS = ['A', 'B', 'C']
TEACHER_DEMO_NAME_FALLBACKS = {
    '7A': 'Teacher 7A',
    '7B': 'Teacher 7B',
    '7C': 'Teacher 7C',
}
_teacher_portal_last_start_attempt = 0
ADMIN_TIMETABLE_MIN_STANDARD = 1
ADMIN_TIMETABLE_MAX_STANDARD = 6
ADMIN_TIMETABLE_PRIMARY_MAX = 5
ADMIN_TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
ADMIN_TIMETABLE_SLOTS_WEEKDAY = [
    {'num': 1, 'time': '07:00 - 07:40'},
    {'num': 2, 'time': '07:40 - 08:20'},
    {'num': 3, 'time': '08:20 - 09:00'},
    {'num': 4, 'time': '09:00 - 09:40'},
    {'num': 'B', 'time': '09:40 - 10:00', 'isBreak': True},
    {'num': 5, 'time': '10:00 - 10:40'},
    {'num': 6, 'time': '10:40 - 11:20'},
    {'num': 7, 'time': '11:20 - 12:00'},
]
ADMIN_TIMETABLE_SLOTS_SATURDAY = [
    {'num': 1, 'time': '07:00 - 07:40'},
    {'num': 2, 'time': '07:40 - 08:20'},
    {'num': 3, 'time': '08:20 - 09:00'},
    {'num': 'B', 'time': '09:00 - 09:20', 'isBreak': True},
    {'num': 4, 'time': '09:20 - 10:00'},
    {'num': 5, 'time': '10:00 - 10:40'},
    {'num': 6, 'time': '10:40 - 11:20'},
]
ADMIN_TIMETABLE_SUBJECTS_BY_STD = {
    'primary': ['English', 'Mathematics', 'EVS', 'Gujarati', 'Hindi', 'Drawing', 'PT', 'Moral Science', 'GK'],
    'upper': ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Gujarati', 'Sanskrit', 'Computer', 'PT', 'Drawing'],
}
ADMIN_TIMETABLE_SUBJECT_MAP = {
    'Mathematics': 'Mathematics',
    'Science': 'Science',
    'Biology': 'Science',
    'Chemistry': 'Science',
    'Physics': 'Science',
    'English': 'English',
    'Hindi': 'Hindi',
    'Sanskrit': 'Sanskrit',
    'Computer': 'Computer',
    'Art': 'Drawing',
    'PE': 'PT',
    'History': 'Social Science',
    'Geography': 'Social Science',
    'Civics': 'Social Science',
    'Music': 'GK',
    'Accountancy': 'EVS',
    'Economics': 'EVS',
    'Commerce': 'Moral Science',
    'Business Studies': 'Moral Science',
    'Psychology': 'GK',
}

STUDENT_DASHBOARD_DIST_DIR = os.path.join(
    os.path.dirname(__file__),
    'student dashboard',
    'frontend',
    'dist',
)

STUDENT_PORTAL_ROOT_DIR = os.path.join(os.path.dirname(__file__), 'student portal')
STUDENT_LOGIN_ACCOUNTS = {
    'STU20240001': {'grade': 1, 'password': 'Stu@001'},
    'STU20240121': {'grade': 2, 'password': 'Stu@121'},
    'STU20240241': {'grade': 3, 'password': 'Stu@241'},
    'STU20240361': {'grade': 4, 'password': 'Stu@361'},
    'STU20240481': {'grade': 5, 'password': 'Stu@481'},
    'STU20240601': {'grade': 6, 'password': 'Stu@601'},
}

STUDENT_LOGIN_THEMES = {
    1: {
        'name': 'Cartoon',
        'badge': 'Std 1 Cartoon Theme',
        'hero_title': 'Welcome back, bright learner',
        'hero_copy': 'Step into a playful cartoon world filled with cheerful colors and friendly shapes.',
        'accent': '#ff7a59',
        'accent_soft': '#ffd9cf',
        'accent_deep': '#cb4b2f',
        'bg_start': '#fff8f3',
        'bg_end': '#ffe8d9',
        'panel_left_start': '#fff5ea',
        'panel_left_end': '#ffe0c8',
        'panel_right': '#ffffff',
        'scene_title': 'Cartoon classroom',
        'scene_copy': 'Clouds, stars, and stickers make Std 1 feel fun and friendly.',
        'tags': ['Bright doodles', 'Happy clouds', 'Playful stickers'],
    },
    2: {
        'name': 'Garden',
        'badge': 'Std 2 Garden Theme',
        'hero_title': 'Grow your learning garden',
        'hero_copy': 'A fresh garden world with leaves, blooms, and soft green light welcomes Std 2.',
        'accent': '#2f9e44',
        'accent_soft': '#dff4e1',
        'accent_deep': '#1f6b30',
        'bg_start': '#f5fff7',
        'bg_end': '#e4f8e7',
        'panel_left_start': '#eefce9',
        'panel_left_end': '#d8f5d5',
        'panel_right': '#ffffff',
        'scene_title': 'Garden grove',
        'scene_copy': 'Fresh grass, flowers, and little birds bring a calm learning mood.',
        'tags': ['Blooming flowers', 'Leaf trails', 'Tiny birds'],
    },
    3: {
        'name': 'Space',
        'badge': 'Std 3 Space Theme',
        'hero_title': 'Launch into a space mission',
        'hero_copy': 'Travel through a bright galaxy with stars, planets, and a glowing rocket trail.',
        'accent': '#7c3aed',
        'accent_soft': '#e8dcff',
        'accent_deep': '#4c1d95',
        'bg_start': '#f6f3ff',
        'bg_end': '#e7ddff',
        'panel_left_start': '#f1e9ff',
        'panel_left_end': '#ded0ff',
        'panel_right': '#ffffff',
        'scene_title': 'Galaxy control',
        'scene_copy': 'Stars and planets turn Std 3 into a friendly universe adventure.',
        'tags': ['Star trails', 'Friendly planets', 'Rocket sparks'],
    },
    4: {
        'name': 'Gold Mining',
        'badge': 'Std 4 Gold Mining Theme',
        'hero_title': 'Dig for golden ideas',
        'hero_copy': 'Step into a gold mining world with warm lantern light and treasure-filled tunnels.',
        'accent': '#d4a017',
        'accent_soft': '#fff0bf',
        'accent_deep': '#8a5b00',
        'bg_start': '#fffdf4',
        'bg_end': '#fff0cc',
        'panel_left_start': '#fff5d6',
        'panel_left_end': '#ffe29b',
        'panel_right': '#ffffff',
        'scene_title': 'Golden tunnel',
        'scene_copy': 'Ore, lanterns, and polished gold give Std 4 a treasure-hunt mood.',
        'tags': ['Lantern glow', 'Gold ore', 'Treasure tunnel'],
    },
    5: {
        'name': 'Forest',
        'badge': 'Std 5 Forest Theme',
        'hero_title': 'Explore the forest path',
        'hero_copy': 'A calm forest login with trees, moss, and layered greens keeps Std 5 warm and focused.',
        'accent': '#2d6a4f',
        'accent_soft': '#dcefe5',
        'accent_deep': '#184a34',
        'bg_start': '#f5fbf6',
        'bg_end': '#dff2e1',
        'panel_left_start': '#e8f6eb',
        'panel_left_end': '#cfe8d5',
        'panel_right': '#ffffff',
        'scene_title': 'Forest trail',
        'scene_copy': 'Trees, moss, and soft sunlight create a peaceful student login.',
        'tags': ['Forest canopy', 'Moss path', 'Morning light'],
    },
    6: {
        'name': 'Water',
        'badge': 'Std 6 Water Theme',
        'hero_title': 'Dive into the water world',
        'hero_copy': 'Blue waves, bubbles, and coral light make Std 6 feel fresh and lively.',
        'accent': '#0891b2',
        'accent_soft': '#cffafe',
        'accent_deep': '#0f5b78',
        'bg_start': '#f2fbff',
        'bg_end': '#d8f4ff',
        'panel_left_start': '#e6fbff',
        'panel_left_end': '#c6f3ff',
        'panel_right': '#ffffff',
        'scene_title': 'Ocean bay',
        'scene_copy': 'Waves and bubbles give Std 6 a cool underwater classroom feel.',
        'tags': ['Ocean waves', 'Bubble shine', 'Coral glow'],
    },
}

STD3_LOGIN_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Std 3 Login | Smart School System</title>
  <style>
    :root {
      --bg1: #07111f;
      --bg2: #11183a;
      --bg3: #2a1d74;
      --card: rgba(255,255,255,0.08);
      --line: rgba(255,255,255,0.18);
      --text: #eef4ff;
      --muted: rgba(238,244,255,0.72);
      --accent: #8b5cf6;
      --accent2: #38bdf8;
      --accent3: #22c55e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      font-family: "Segoe UI", "Trebuchet MS", sans-serif;
      background:
        radial-gradient(circle at 20% 15%, rgba(255,255,255,0.12), transparent 0 18%),
        radial-gradient(circle at 82% 18%, rgba(139,92,246,0.22), transparent 0 16%),
        radial-gradient(circle at 68% 78%, rgba(56,189,248,0.16), transparent 0 18%),
        linear-gradient(135deg, var(--bg1), var(--bg2) 52%, var(--bg3));
      overflow-x: hidden;
    }
    .stars, .stars::before, .stars::after {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image:
        radial-gradient(circle at 8% 18%, rgba(255,255,255,0.92) 0 1px, transparent 1.5px),
        radial-gradient(circle at 18% 42%, rgba(255,255,255,0.8) 0 1px, transparent 1.5px),
        radial-gradient(circle at 32% 12%, rgba(255,255,255,0.78) 0 1px, transparent 1.5px),
        radial-gradient(circle at 46% 26%, rgba(255,255,255,0.9) 0 1px, transparent 1.5px),
        radial-gradient(circle at 66% 20%, rgba(255,255,255,0.82) 0 1px, transparent 1.5px),
        radial-gradient(circle at 78% 34%, rgba(255,255,255,0.86) 0 1px, transparent 1.5px),
        radial-gradient(circle at 88% 16%, rgba(255,255,255,0.84) 0 1px, transparent 1.5px),
        radial-gradient(circle at 14% 72%, rgba(255,255,255,0.74) 0 1px, transparent 1.5px),
        radial-gradient(circle at 34% 84%, rgba(255,255,255,0.82) 0 1px, transparent 1.5px),
        radial-gradient(circle at 62% 70%, rgba(255,255,255,0.9) 0 1px, transparent 1.5px),
        radial-gradient(circle at 88% 76%, rgba(255,255,255,0.76) 0 1px, transparent 1.5px);
      opacity: 0.65;
      animation: drift 14s linear infinite;
    }
    .stars::before { opacity: 0.35; animation-duration: 20s; transform: translateY(-12px); }
    .stars::after { opacity: 0.25; animation-duration: 28s; transform: translateY(14px); }
    .shell { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .panel {
      width: min(1180px, 100%);
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      overflow: hidden;
      border-radius: 34px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.06);
      box-shadow: 0 30px 90px rgba(0,0,0,0.34);
      backdrop-filter: blur(18px);
    }
    .hero, .login { padding: 36px; }
    .hero {
      position: relative;
      overflow: hidden;
      border-right: 1px solid var(--line);
      background:
        radial-gradient(circle at 25% 15%, rgba(255,255,255,0.1), transparent 0 18%),
        linear-gradient(180deg, rgba(25,28,85,0.95), rgba(44,24,130,0.94));
    }
    .eyebrow {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-radius: 999px;
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.16);
      color: #e0e7ff; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase;
    }
    .title { margin: 18px 0 12px; font-size: clamp(2.4rem, 5vw, 4.4rem); line-height: 0.95; letter-spacing: -0.06em; }
    .lead { margin: 0; max-width: 34rem; color: var(--muted); font-size: 1.02rem; line-height: 1.75; }
    .orbit {
      position: absolute; right: 32px; top: 34px; width: 132px; height: 132px;
      border-radius: 50%; border: 1px solid rgba(255,255,255,0.22);
      animation: spin 20s linear infinite;
    }
    .orbit::before {
      content: ""; position: absolute; inset: 14px; border-radius: 50%;
      border: 1px dashed rgba(255,255,255,0.24);
    }
    .planet {
      position: absolute; right: 42px; top: 48px; width: 52px; height: 52px; border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #f8fafc 0 10%, #a78bfa 14%, #4c1d95 74%, #111827 100%);
      box-shadow: 0 0 26px rgba(56,189,248,0.5);
      animation: pulse 4.6s ease-in-out infinite;
    }
    .trail {
      position: absolute; left: 30px; bottom: 32px; width: calc(100% - 60px); height: 3px;
      border-radius: 999px; background: linear-gradient(90deg, transparent, rgba(139,92,246,0.7), rgba(56,189,248,0.95), rgba(255,255,255,0.8), transparent);
      box-shadow: 0 0 18px rgba(56,189,248,0.28); animation: shimmer 3.4s ease-in-out infinite;
    }
    .badge-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
    .badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 12px; border-radius: 999px; background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.14); color: #f8fbff; font-size: 0.84rem; font-weight: 800;
    }
    .badge::before { content: "✦"; color: #fef08a; }
    .login { background: rgba(255,255,255,0.96); color: #10233d; }
    .login h2 { margin: 0 0 8px; font-size: 2rem; letter-spacing: -0.04em; }
    .login p { margin: 0 0 22px; color: #5d6c84; line-height: 1.6; }
    .error {
      margin: 0 0 18px; padding: 14px 16px; border-radius: 16px;
      border: 1px solid rgba(194,65,12,0.2); background: rgba(194,65,12,0.08); color: #9a3412; font-weight: 700;
    }
    .field { margin-bottom: 18px; }
    label { display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 800; color: #29415f; }
    .input-wrap { position: relative; }
    input {
      width: 100%; border: 1px solid rgba(37,99,235,0.18); border-radius: 16px; padding: 14px 16px;
      font: inherit; color: #10233d; background: #fff; outline: none; transition: border-color .2s, transform .2s, box-shadow .2s;
    }
    .input-wrap input { padding-right: 82px; }
    input:focus { border-color: rgba(139,92,246,0.62); box-shadow: 0 0 0 4px rgba(139,92,246,0.14); transform: translateY(-1px); }
    .toggle {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      border: 1px solid rgba(37,99,235,0.16); background: rgba(255,255,255,0.95);
      color: #4c1d95; border-radius: 12px; padding: 8px 12px; font-size: 0.82rem; font-weight: 800; cursor: pointer;
    }
    .actions { display: flex; gap: 12px; align-items: center; margin-top: 24px; flex-wrap: wrap; }
    .btn {
      border: 0; border-radius: 16px; padding: 14px 20px; font: inherit; font-weight: 800; cursor: pointer;
      transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
    }
    .btn:hover { transform: translateY(-1px); filter: brightness(1.02); }
    .btn-primary {
      color: white;
      background: linear-gradient(135deg, #7c3aed, #2563eb);
      box-shadow: 0 16px 30px rgba(124,58,237,0.26);
      min-width: 180px;
    }
    .hint { color: #5d6c84; font-size: 0.92rem; }
    .return-link { display: inline-flex; margin-top: 18px; color: #4c1d95; text-decoration: none; font-weight: 800; font-size: 0.92rem; }
    .return-link:hover { text-decoration: underline; }
    .footer-note { margin-top: 22px; color: rgba(238,244,255,0.72); font-size: 0.92rem; line-height: 1.6; }
    @media (max-width: 920px) {
      .panel { grid-template-columns: 1fr; }
      .hero { border-right: 0; border-bottom: 1px solid var(--line); }
    }
    @media (max-width: 640px) {
      .shell { padding: 14px; }
      .hero, .login { padding: 22px; }
      .title { font-size: 2.25rem; }
      .login h2 { font-size: 1.65rem; }
      .actions { flex-direction: column; align-items: stretch; }
      .btn-primary { width: 100%; }
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-3px) scale(1.04); } }
    @keyframes drift { from { transform: translate3d(0,0,0); } to { transform: translate3d(0,-12px,0); } }
    @keyframes shimmer { 0%,100% { opacity: 0.65; transform: scaleX(0.95); } 50% { opacity: 1; transform: scaleX(1.02); } }
  </style>
</head>
<body>
  <span class="stars" aria-hidden="true"></span>
  <main class="shell">
    <section class="panel" aria-labelledby="login-title">
      <div class="hero">
        <div>
          <div class="eyebrow">{{ theme.badge }}</div>
          <h1 class="title">{{ theme.hero_title }}</h1>
          <p class="lead">{{ theme.hero_copy }}</p>
          <div class="orbit" aria-hidden="true"></div>
          <div class="planet" aria-hidden="true"></div>
          <div class="trail" aria-hidden="true"></div>
          <div class="badge-row">
            {% for tag in theme.tags %}
              <span class="badge">{{ tag }}</span>
            {% endfor %}
          </div>
        </div>
        <div class="footer-note">
          Std 3 uses the school-issued Student ID and password from the admin side. The same credentials open this space-themed portal.
        </div>
      </div>
      <div class="login">
        <h2 id="login-title">Student Login</h2>
        <p>Enter your Student ID and password to open the Std 3 portal.</p>
        {% if error %}
          <div class="error" role="alert">{{ error }}</div>
        {% endif %}
        <form method="post" action="{{ url_for('student_login_grade', grade=grade) }}" autocomplete="on">
          <div class="field">
            <label for="student_id">Student ID</label>
            <input id="student_id" name="student_id" type="text" placeholder="{{ student_id }}" value="{{ student_id|e }}" required autofocus />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <div class="input-wrap">
              <input id="password" name="password" type="password" placeholder="Enter your password" required />
              <button type="button" class="toggle" data-toggle-password="password">Show</button>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-primary" type="submit">Continue Std 3</button>
            <div class="hint">Use the Std 3 Student ID and password assigned by the school admin.</div>
          </div>
        </form>
        <a class="return-link" href="{{ url_for('student_login') }}">Back to standard picker</a>
      </div>
    </section>
  </main>
  <script>
    (function () {
      var toggle = document.querySelector('[data-toggle-password="password"]');
      if (!toggle) return;
      toggle.addEventListener('click', function () {
        var input = document.getElementById('password');
        if (!input) return;
        var nextType = input.type === 'password' ? 'text' : 'password';
        input.type = nextType;
        toggle.textContent = nextType === 'password' ? 'Show' : 'Hide';
      });
    })();
  </script>
</body>
</html>
"""


def _render_std3_login(**context):
    return render_template_string(STD3_LOGIN_TEMPLATE, **context)

STUDENT_LOGIN_PAGE_GRADES = {1, 2, 3, 4, 5, 6}

# Global variable to store current user (for testing)
current_user = None

# Database initialization
def init_db():
    conn = sqlite3.connect('school.db', timeout=10)
    c = conn.cursor()
    
    # Create tables
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL,
                    class_assigned TEXT,
                    student_id TEXT
                )''')
                
    c.execute('''CREATE TABLE IF NOT EXISTS students (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    class TEXT NOT NULL,
                    parent_username TEXT,
                    FOREIGN KEY (parent_username) REFERENCES users(username)
                )''')
                
    c.execute('''CREATE TABLE IF NOT EXISTS attendance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id TEXT NOT NULL,
                    date DATE NOT NULL,
                    status TEXT NOT NULL,
                    FOREIGN KEY (student_id) REFERENCES students(student_id)
                )''')
                
    c.execute('''CREATE TABLE IF NOT EXISTS homework (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    class TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    description TEXT NOT NULL,
                    due_date DATE NOT NULL
                )''')
                
    c.execute('''CREATE TABLE IF NOT EXISTS exams (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    class TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    exam_date DATE NOT NULL,
                    time_slot TEXT NOT NULL,
                    description TEXT
                )''')
                
    c.execute('''CREATE TABLE IF NOT EXISTS marks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    exam_name TEXT NOT NULL,
                    marks_obtained REAL NOT NULL,
                    total_marks REAL NOT NULL,
                    FOREIGN KEY (student_id) REFERENCES students(student_id)
                )''')
                
    c.execute('''CREATE TABLE IF NOT EXISTS behavior (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id TEXT NOT NULL,
                    date DATE NOT NULL,
                    behavior_type TEXT NOT NULL,
                    description TEXT,
                    FOREIGN KEY (student_id) REFERENCES students(student_id)
                )''')
                
    c.execute('''CREATE TABLE IF NOT EXISTS assignments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    class TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    description TEXT NOT NULL,
                    submission_date DATE NOT NULL
                )''')

    # Tokens used by the Std 8 Student Dashboard (React app) auth API
    c.execute('''CREATE TABLE IF NOT EXISTS api_tokens (
                    token TEXT PRIMARY KEY,
                    refresh_token TEXT UNIQUE,
                    username TEXT NOT NULL,
                    role TEXT NOT NULL,
                    uid TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')

    c.execute('''CREATE TABLE IF NOT EXISTS visitor_bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    visit_date DATE NOT NULL,
                    visit_time TEXT NOT NULL,
                    num_visitors INTEGER NOT NULL,
                    purpose TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT
                )''')

    c.execute('''CREATE TABLE IF NOT EXISTS visitor_inquiries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    inquiry_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    status TEXT DEFAULT 'new',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    response TEXT,
                    responded_at TIMESTAMP
                )''')

    c.execute('''CREATE TABLE IF NOT EXISTS visitor_faq (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question TEXT NOT NULL UNIQUE,
                    answer TEXT NOT NULL,
                    category TEXT NOT NULL,
                    display_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')
    
    conn.commit()
    conn.close()

    # ensure visitor_username column exists in bookings and inquiries
    try:
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        # bookings
        c.execute("PRAGMA table_info(visitor_bookings)")
        cols = [r[1] for r in c.fetchall()]
        if 'visitor_username' not in cols:
            c.execute("ALTER TABLE visitor_bookings ADD COLUMN visitor_username TEXT")
        # inquiries
        c.execute("PRAGMA table_info(visitor_inquiries)")
        cols = [r[1] for r in c.fetchall()]
        if 'visitor_username' not in cols:
            c.execute("ALTER TABLE visitor_inquiries ADD COLUMN visitor_username TEXT")
        conn.commit()
    except Exception:
        pass
    finally:
        try:
            conn.close()
        except:
            pass

# Sample data creation
def create_sample_data():
    try:
        conn = sqlite3.connect('school.db', timeout=10)
        c = conn.cursor()
        
        # Check if base data already exists
        c.execute("SELECT COUNT(*) FROM users WHERE role='admin_hod'")
        if c.fetchone()[0] == 0:
            # Prepare all users and students data first
            users_data = []
            students_data = []
            
            # Admin accounts
            users_data.append(('admin_hod', generate_password_hash('admin123'), 'admin_hod', None, None))
            users_data.append(('admin_teacher', generate_password_hash('admin123'), 'admin_teacher', None, None))
            
            # Create class teachers and students for grades 1 to 7
            grades = TEACHER_DEMO_GRADES
            sections = TEACHER_DEMO_SECTIONS
            
            for grade in grades:
                for section in sections:
                    # Class teacher
                    teacher_username = f'teach{grade}{section}'
                    teacher_password = f'teach{grade}{section}123'
                    users_data.append((teacher_username, generate_password_hash(teacher_password), 'teacher', f'Class {grade}-{section}', None))
                    
                    # 50 students per class (build data, then batch insert)
                    for i in range(1, 51):
                        old_id = f"{grade}{section}{i:03d}"
                        new_username = f"stu{grade:02d}{section}{i:03d}"
                        student_password = f"stu{i:03d}"
                        
                        # Student record
                        students_data.append((old_id, f"Student {grade}-{section} {i}", f'Class {grade}', None))
                        
                        # Student user
                        users_data.append((new_username, generate_password_hash(student_password), 'student', None, old_id))
                        
                        # Parent user
                        parent_username = f"parent_{new_username}"
                        parent_password = f"parent{i:03d}"
                        users_data.append((parent_username, generate_password_hash(parent_password), 'parent', None, old_id))
            
            # Batch insert users
            c.executemany("""INSERT INTO users (username, password, role, class_assigned, student_id) 
                           VALUES (?, ?, ?, ?, ?)""", users_data)
            
            # Batch insert students
            c.executemany("""INSERT INTO students (student_id, name, class, parent_username) 
                           VALUES (?, ?, ?, ?)""", students_data)
            
            conn.commit()
        else:
            pass

        # Ensure the new Admin Portal account exists (used by unified login)
        c.execute("SELECT COUNT(*) FROM users WHERE username=? AND role='admin'", ('admin001@admin.com',))
        if (c.fetchone()[0] or 0) == 0:
            c.execute(
                "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                ('admin001@admin.com', generate_password_hash('Admin@123'), 'admin'),
            )
            conn.commit()

        # Ensure demo Student accounts for Std 1-7 exist (used to open student portal)
        try:
            c.execute("SELECT COUNT(*) FROM users WHERE role='student' AND username LIKE 'stu01A%'")
            has_std_1 = (c.fetchone()[0] or 0) > 0
        except Exception:
            has_std_1 = False

        if not has_std_1:
            for grade in range(1, 8):
                for i in range(1, 11):  # 10 demo students per grade (A section)
                    old_id = f"{grade}A{i:03d}"
                    username = f"stu{grade:02d}A{i:03d}"
                    password = f"stu{i:03d}"

                    c.execute("SELECT COUNT(*) FROM students WHERE student_id=?", (old_id,))
                    if (c.fetchone()[0] or 0) == 0:
                        c.execute(
                            "INSERT INTO students (student_id, name, class, parent_username) VALUES (?, ?, ?, ?)",
                            (old_id, f"Student {grade}-A {i}", f"Class {grade}", None),
                        )

                    c.execute("SELECT COUNT(*) FROM users WHERE username=? AND role='student'", (username,))
                    if (c.fetchone()[0] or 0) == 0:
                        c.execute(
                            "INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)",
                            (username, generate_password_hash(password), 'student', old_id),
                        )

            conn.commit()

        # Keep teacher demo accounts restricted to Std 1-7 (Section A)
        desired_teacher_accounts = []
        for grade in TEACHER_DEMO_GRADES:
            for section in TEACHER_DEMO_SECTIONS:
                teacher_username = f'teach{grade}{section}'
                teacher_password = f'teach{grade}{section}123'
                desired_teacher_accounts.append(
                    (
                        teacher_username,
                        generate_password_hash(teacher_password),
                        'teacher',
                        f'Class {grade}-{section}',
                        None,
                    )
                )

        desired_teacher_usernames = [account[0] for account in desired_teacher_accounts]
        placeholders = ','.join('?' for _ in desired_teacher_usernames)
        c.execute(
            f"DELETE FROM users WHERE role='teacher' AND username NOT IN ({placeholders})",
            desired_teacher_usernames,
        )

        for username, password_hash, role, class_assigned, student_id in desired_teacher_accounts:
            c.execute("SELECT COUNT(*) FROM users WHERE username=? AND role='teacher'", (username,))
            if (c.fetchone()[0] or 0) > 0:
                c.execute(
                    "UPDATE users SET password=?, class_assigned=?, student_id=? WHERE username=? AND role='teacher'",
                    (password_hash, class_assigned, student_id, username),
                )
            else:
                c.execute(
                    "INSERT INTO users (username, password, role, class_assigned, student_id) VALUES (?, ?, ?, ?, ?)",
                    (username, password_hash, role, class_assigned, student_id),
                )

        conn.commit()
        
        conn.close()
    except Exception as e:
        print(f"Note: Sample data creation skipped: {e}")

@app.route('/')
def index():
    return redirect(url_for('visitor_page'))

@app.route('/visitor')
def visitor_page():
    return render_template('visitor_page.html')


# Category gallery page - shows all images for a given category (files in static/images starting with category)
@app.route('/gallery/<category>')
def gallery_category(category):
    # map slug back to category prefix (category already slugified)
    prefix = category.lower()
    images_dir = os.path.join(app.root_path, 'static', 'images')
    files = []
    try:
        for fname in os.listdir(images_dir):
            if not os.path.isfile(os.path.join(images_dir, fname)):
                continue
            # compare lowercase filename startswith prefix
            if fname.lower().startswith(prefix):
                files.append(fname)
    except Exception:
        files = []

    files.sort()
    # Build a friendly title
    title = prefix.replace('_', ' ').title()
    return render_template('gallery_category.html', images=files, title=title, prefix=prefix)

# Visitor Booking API
@app.route('/api/visitor/book-visit', methods=['POST'])
def book_visit():
    # Require login so inquiries are linked to visitor account
    if 'username' not in session:
        return {'success': False, 'message': 'Login required'}, 401

    try:
        data = request.get_json()

        # Validate input
        required_fields = ['full_name', 'email', 'phone', 'inquiry_type', 'message']
        for field in required_fields:
            if not data.get(field):
                return {'success': False, 'message': f'Missing field: {field}'}, 400

        conn = sqlite3.connect('school.db')
        c = conn.cursor()

        c.execute("""INSERT INTO visitor_inquiries 
                    (full_name, email, phone, inquiry_type, message, status, visitor_username) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)""",
                  (data['full_name'], data['email'], data['phone'], data['inquiry_type'], data['message'], 'new', session.get('username')))

        conn.commit()
        inquiry_id = c.lastrowid
        conn.close()

        return {'success': True, 'message': 'Inquiry submitted', 'inquiry_id': inquiry_id}, 201
    except Exception as e:
        print(f"Error saving inquiry: {e}")
        return {'success': False, 'message': str(e)}, 500
        conn.close()

        return {
            'success': True,
            'message': 'Booking confirmed! We will contact you soon.',
            'booking_id': booking_id
        }, 201

    except Exception as e:
        print(f"Error booking visit: {e}")
        return {'success': False, 'message': str(e)}, 500

# Visitor Inquiry API
@app.route('/api/visitor/inquiry', methods=['POST'])
def submit_inquiry():
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['full_name', 'email', 'phone', 'inquiry_type', 'message']
        for field in required_fields:
            if not data.get(field):
                return {'success': False, 'message': f'Missing field: {field}'}, 400
        
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        
        # Insert inquiry
        c.execute("""INSERT INTO visitor_inquiries 
                    (full_name, email, phone, inquiry_type, message) 
                    VALUES (?, ?, ?, ?, ?)""",
                  (data['full_name'], data['email'], data['phone'], 
                   data['inquiry_type'], data['message']))
        
        conn.commit()
        inquiry_id = c.lastrowid
        conn.close()
        
        return {
            'success': True,
            'message': 'Thank you for your inquiry! We will get back to you soon.',
            'inquiry_id': inquiry_id
        }, 201
        
    except Exception as e:
        print(f"Error submitting inquiry: {e}")
        return {'success': False, 'message': str(e)}, 500

# Get FAQ List
@app.route('/api/visitor/faq', methods=['GET'])
def get_faq():
    try:
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        
        c.execute("SELECT id, question, answer, category FROM visitor_faq ORDER BY display_order, id")
        faqs = c.fetchall()
        
        faq_list = []
        for faq in faqs:
            faq_list.append({
                'id': faq[0],
                'question': faq[1],
                'answer': faq[2],
                'category': faq[3]
            })
        
        conn.close()
        return {'success': True, 'data': faq_list}, 200
        
    except Exception as e:
        print(f"Error fetching FAQ: {e}")
        return {'success': False, 'message': str(e)}, 500

# Admin: View Visitor Bookings
@app.route('/admin/visitor-bookings')
def view_visitor_bookings():
    if 'username' not in session or session['role'] != 'admin_hod':
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get all bookings
    c.execute("""SELECT id, full_name, email, phone, visit_date, visit_time, 
                        num_visitors, purpose, status, created_at 
                 FROM visitor_bookings ORDER BY created_at DESC""")
    bookings = c.fetchall()
    
    # Convert to list of dicts
    booking_list = []
    for b in bookings:
        booking_list.append({
            'id': b[0],
            'full_name': b[1],
            'email': b[2],
            'phone': b[3],
            'visit_date': b[4],
            'visit_time': b[5],
            'num_visitors': b[6],
            'purpose': b[7],
            'status': b[8],
            'created_at': b[9]
        })
    
    # Get statistics
    c.execute("SELECT COUNT(*) FROM visitor_bookings WHERE status='pending'")
    pending_count = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM visitor_bookings WHERE status='confirmed'")
    confirmed_count = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM visitor_bookings WHERE status='completed'")
    completed_count = c.fetchone()[0]
    
    conn.close()
    
    return render_template('admin_visitor_bookings.html',
                          bookings=booking_list,
                          pending_count=pending_count,
                          confirmed_count=confirmed_count,
                          completed_count=completed_count)

# Admin: Update Booking Status
@app.route('/api/admin/booking/status', methods=['POST'])
def update_booking_status():
    if 'username' not in session or session['role'] != 'admin_hod':
        return {'success': False, 'message': 'Unauthorized'}, 401
    
    try:
        data = request.get_json()
        booking_id = data.get('booking_id')
        status = data.get('status')
        
        if not booking_id or not status:
            return {'success': False, 'message': 'Missing fields'}, 400
        
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        
        c.execute("UPDATE visitor_bookings SET status=? WHERE id=?", (status, booking_id))
        conn.commit()
        conn.close()
        
        return {'success': True, 'message': f'Booking status updated to {status}'}, 200
        
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500

# Admin: View Inquiries
@app.route('/admin/visitor-inquiries')
def view_visitor_inquiries():
    if 'username' not in session or session.get('role') not in ('admin', 'admin_hod', 'super_admin'):
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get all inquiries
    c.execute("""SELECT id, full_name, email, phone, inquiry_type, message, status, created_at 
                 FROM visitor_inquiries ORDER BY created_at DESC""")
    inquiries = c.fetchall()
    
    # Convert to list of dicts
    inquiry_list = []
    for inq in inquiries:
        inquiry_list.append({
            'id': inq[0],
            'full_name': inq[1],
            'email': inq[2],
            'phone': inq[3],
            'inquiry_type': inq[4],
            'message': inq[5],
            'status': inq[6],
            'created_at': inq[7]
        })
    
    # Get statistics
    c.execute("SELECT COUNT(*) FROM visitor_inquiries WHERE status='new'")
    new_count = c.fetchone()[0]
    
    c.execute("SELECT COUNT(*) FROM visitor_inquiries WHERE status='responded'")
    responded_count = c.fetchone()[0]
    
    conn.close()
    
    return render_template('admin_visitor_inquiries.html',
                          inquiries=inquiry_list,
                          new_count=new_count,
                          responded_count=responded_count)

# Admin: Visitor Inquiries API
@app.route('/api/admin/visitor-inquiries', methods=['GET'])
def api_view_visitor_inquiries():
    if 'username' not in session or session.get('role') not in ('admin', 'admin_hod', 'super_admin'):
        return {'success': False, 'message': 'Unauthorized'}, 401

    try:
        conn = sqlite3.connect('school.db')
        c = conn.cursor()

        c.execute("""
            SELECT id, full_name, email, phone, inquiry_type, message, status, created_at, response, responded_at
            FROM visitor_inquiries
            ORDER BY created_at DESC
        """)
        rows = c.fetchall()

        inquiries = [{
            'id': row[0],
            'full_name': row[1],
            'email': row[2],
            'phone': row[3],
            'inquiry_type': row[4],
            'message': row[5],
            'status': row[6],
            'created_at': row[7],
            'response': row[8],
            'responded_at': row[9]
        } for row in rows]

        c.execute("SELECT COUNT(*) FROM visitor_inquiries")
        total_count = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM visitor_inquiries WHERE status='new'")
        new_count = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM visitor_inquiries WHERE status='responded'")
        responded_count = c.fetchone()[0]

        conn.close()
        return {
            'success': True,
            'data': {
                'inquiries': inquiries,
                'total_count': total_count,
                'new_count': new_count,
                'responded_count': responded_count
            }
        }, 200
    except Exception as e:
        print(f"Error fetching visitor inquiries: {e}")
        return {'success': False, 'message': str(e)}, 500

# Admin: Respond to Inquiry
@app.route('/api/admin/inquiry/respond', methods=['POST'])
def respond_to_inquiry():
    if 'username' not in session or session.get('role') not in ('admin', 'admin_hod', 'super_admin'):
        return {'success': False, 'message': 'Unauthorized'}, 401
    
    try:
        data = request.get_json()
        inquiry_id = data.get('inquiry_id')
        response = data.get('response')
        
        if not inquiry_id or not response:
            return {'success': False, 'message': 'Missing fields'}, 400
        
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        
        c.execute("""UPDATE visitor_inquiries 
                    SET status='responded', response=?, responded_at=CURRENT_TIMESTAMP 
                    WHERE id=?""", (response, inquiry_id))
        conn.commit()
        conn.close()
        
        return {'success': True, 'message': 'Response sent successfully'}, 200
        
    except Exception as e:
        return {'success': False, 'message': str(e)}, 500

@app.route('/login', methods=['GET', 'POST'])
def login():
    return redirect(url_for('visitor_page'))


def _normalize_student_login_id(student_id: str) -> str:
    return re.sub(r'\s+', '', str(student_id or '').strip()).upper()


def _parse_student_grade(value: str | int | None, student_id: str = '') -> int | None:
    raw_value = str(value or '').strip()
    match = re.search(r'(\d{1,2})', raw_value)
    if match:
        try:
            return int(match.group(1))
        except Exception:
            pass

    student_match = re.search(r'(\d{1,2})', str(student_id or ''))
    if student_match:
        try:
            return int(student_match.group(1))
        except Exception:
            pass

    return None


def _build_admin_student_profile(row) -> dict:
    student_id = _normalize_student_login_id(row['student_id'] if isinstance(row, sqlite3.Row) else row[2] if len(row) > 2 else '')
    student_name = str(row['name'] if isinstance(row, sqlite3.Row) else row[4] if len(row) > 4 else '').strip()
    class_value = row['class'] if isinstance(row, sqlite3.Row) else row[6] if len(row) > 6 else ''
    section = str(row['section'] if isinstance(row, sqlite3.Row) else row[7] if len(row) > 7 else '').strip().upper()
    grade = _parse_student_grade(class_value, student_id)
    class_name = f'Std {grade}' if grade else (f'Class {class_value}'.strip() if class_value else 'Student')

    return {
        'uid': student_id,
        'email': student_id,
        'name': student_name or student_id,
        'student_id': student_id,
        'class_name': class_name,
        'class': class_name,
        'student_class': class_name,
        'grade': grade,
        'division': section,
        'admissionNumber': str(row['admission'] if isinstance(row, sqlite3.Row) else row[5] if len(row) > 5 else '').strip(),
        'grNo': str(row['gr_number'] if isinstance(row, sqlite3.Row) else row[1] if len(row) > 1 else '').strip(),
        'password': str(row['student_password'] if isinstance(row, sqlite3.Row) else row[3] if len(row) > 3 else ''),
        'parentName': str(row['parent'] if isinstance(row, sqlite3.Row) else row[8] if len(row) > 8 else '').strip(),
        'phone': str(row['phone'] if isinstance(row, sqlite3.Row) else row[9] if len(row) > 9 else '').strip(),
        'dob': str(row['dob'] if isinstance(row, sqlite3.Row) else row[12] if len(row) > 12 else '').strip(),
        'gender': str(row['gender'] if isinstance(row, sqlite3.Row) else row[13] if len(row) > 13 else 'Male').strip() or 'Male',
        'bloodGroup': str(row['blood_group'] if isinstance(row, sqlite3.Row) else row[14] if len(row) > 14 else '').strip(),
        'address': str(row['address'] if isinstance(row, sqlite3.Row) else row[15] if len(row) > 15 else '').strip(),
        'status': str(row['status'] if isinstance(row, sqlite3.Row) else row[10] if len(row) > 10 else 'Active').strip() or 'Active',
        'parentAccessKey': str(row['parent_access_key'] if isinstance(row, sqlite3.Row) else row[16] if len(row) > 16 else '').strip(),
        'parentId': str(row['parent_id'] if isinstance(row, sqlite3.Row) else row[17] if len(row) > 17 else '').strip(),
        'profile_photo_url': None,
    }


def _get_admin_student_account(student_id: str) -> dict | None:
    normalized = _normalize_student_login_id(student_id)
    if not normalized:
        return None

    if not os.path.isfile(ADMIN_DASHBOARD_BACKEND_DB_PATH):
        return None

    try:
        conn = sqlite3.connect(ADMIN_DASHBOARD_BACKEND_DB_PATH, timeout=10)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute(
            """
            SELECT *
            FROM students
            WHERE LOWER(student_id) = LOWER(?)
            """,
            (normalized,),
        )
        row = c.fetchone()
        conn.close()
        if not row:
            return None
        profile = _build_admin_student_profile(row)
        if not profile.get('grade'):
            profile['grade'] = _parse_student_grade(profile.get('class_name'), normalized)
        return profile
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return None


def _get_student_login_account(student_id: str) -> dict | None:
    normalized = _normalize_student_login_id(student_id)
    if not normalized:
        return None

    admin_account = _get_admin_student_account(normalized)
    if admin_account and admin_account.get('password'):
        return admin_account

    if normalized in STUDENT_LOGIN_ACCOUNTS:
        meta = STUDENT_LOGIN_ACCOUNTS[normalized]
        grade = int(meta.get('grade') or 0) or _parse_student_grade(None, normalized)
        theme = STUDENT_LOGIN_THEMES.get(grade, STUDENT_LOGIN_THEMES[1])
        return {
            'student_id': normalized,
            'grade': grade,
            'password': str(meta.get('password') or '').strip(),
            'name': normalized,
            'class_name': f'Std {grade}' if grade else 'Student',
            'division': '',
            'admissionNumber': '',
            'grNo': '',
            'parentName': '',
            'phone': '',
            'dob': '',
            'gender': 'Male',
            'bloodGroup': '',
            'address': '',
            'status': 'Active',
            'parentAccessKey': '',
            'profile_photo_url': None,
            'theme': theme,
        }

    return None


@app.route('/student-login', methods=['GET', 'POST'])
def student_login():
    student_login_cards = [
        {'grade': grade, 'login_page': grade in STUDENT_LOGIN_PAGE_GRADES, **STUDENT_LOGIN_THEMES[grade]}
        for grade in range(1, 7)
    ]

    if request.method == 'POST':
        selected_grade = request.form.get('grade') or request.form.get('selected_grade') or ''
        try:
            grade = int(str(selected_grade).strip())
        except (TypeError, ValueError):
            grade = None

        if grade is None or not (1 <= grade <= 6):
            response = make_response(render_template(
                'student_login.html',
                error='Please choose Std 1 to Std 6.',
                student_grades=range(1, 7),
                student_login_cards=student_login_cards,
            ))
            return _no_cache(response)

        if grade in STUDENT_LOGIN_PAGE_GRADES:
            return redirect(url_for('student_login_grade', grade=grade))

        demo_student_id = next(
            (
                sid
                for sid, meta in STUDENT_LOGIN_ACCOUNTS.items()
                if int(meta.get('grade') or 0) == grade
            ),
            f'STD{grade}',
        )
        theme = STUDENT_LOGIN_THEMES.get(grade, STUDENT_LOGIN_THEMES[1])
        session.clear()
        session['username'] = demo_student_id
        session['role'] = 'student'
        session['student_grade'] = grade
        session['student_id'] = demo_student_id
        session['student_app'] = 'portal'
        session['student_theme'] = {
            'grade': grade,
            'name': theme['name'],
            'badge': theme['badge'],
            'accent': theme['accent'],
            'accent_soft': theme['accent_soft'],
            'accent_deep': theme['accent_deep'],
            'bg_start': theme['bg_start'],
            'bg_end': theme['bg_end'],
        }
        if grade == 1:
            return _render_student_portal_html(grade, demo_student_id)
        return redirect(url_for('student_portal', grade=grade))

    response = make_response(render_template(
        'student_login.html',
        student_grades=range(1, 7),
        student_login_cards=student_login_cards,
    ))
    return _no_cache(response)


@app.route('/student-login/<int:grade>', methods=['GET', 'POST'])
def student_login_grade(grade: int):
    if grade not in STUDENT_LOGIN_PAGE_GRADES:
        return redirect(url_for('student_login'))

    theme = STUDENT_LOGIN_THEMES.get(grade, STUDENT_LOGIN_THEMES[1])
    demo_student_id = next(
        (
            sid
            for sid, meta in STUDENT_LOGIN_ACCOUNTS.items()
            if int(meta.get('grade') or 0) == grade
        ),
        f'STD{grade}',
    )

    def render_login(**kwargs):
        if grade == 3:
            return _no_cache(make_response(_render_std3_login(grade=grade, theme=theme, **kwargs)))
        return _no_cache(make_response(render_template('student_login_grade.html', grade=grade, theme=theme, **kwargs)))

    if request.method == 'POST':
        student_id = _normalize_student_login_id(request.form.get('student_id') or '')
        password = str(request.form.get('password') or '')

        account = _get_student_login_account(student_id)
        if not account or int(account.get('grade') or 0) != grade:
            return render_login(
                error=f'Use the Std {grade} Student ID and password assigned by the school.',
                student_id=student_id or demo_student_id,
            )

        expected_password = str(account.get('password') or '').strip()
        if not expected_password or password.strip() != expected_password:
            return render_login(
                error='Invalid Student ID or Password.',
                student_id=student_id or demo_student_id,
            )

        session.clear()
        session['username'] = account['student_id']
        session['role'] = 'student'
        session['student_grade'] = grade
        session['student_id'] = account['student_id']
        session['student_app'] = 'portal'
        session['student_theme'] = {
            'grade': grade,
            'name': theme['name'],
            'badge': theme['badge'],
            'accent': theme['accent'],
            'accent_soft': theme['accent_soft'],
            'accent_deep': theme['accent_deep'],
            'bg_start': theme['bg_start'],
            'bg_end': theme['bg_end'],
        }
        if grade == 1:
            return _render_student_portal_html(grade, account['student_id'])
        return redirect(url_for('student_portal', grade=grade))

    return render_login(student_id=demo_student_id)


@app.route('/api/students/login', methods=['POST'])
def api_students_login():
    data = request.get_json(silent=True) or {}
    student_id = _normalize_student_login_id(data.get('student_id') or data.get('username') or '')
    password = str(data.get('password') or '')
    if not student_id or not password:
        return {'error': 'Student ID and password are required.'}, 400

    account = _get_student_login_account(student_id)
    if not account:
        return {'error': 'Invalid Student ID or Password.'}, 401

    expected_password = str(account.get('password') or '').strip()
    if not expected_password or password.strip() != expected_password:
        return {'error': 'Invalid Student ID or Password.'}, 401

    grade = account.get('grade') or _parse_student_grade(account.get('class_name'), student_id)
    token, refresh_token, uid = _issue_api_tokens(student_id, 'student')
    profile = {
        'studentName': account.get('name') or student_id,
        'className': account.get('class_name') or (f'Std {grade}' if grade else 'Student'),
        'admissionNumber': account.get('admissionNumber') or '',
        'grNo': account.get('grNo') or '',
        'studentId': student_id,
        'password': expected_password,
        'parentName': account.get('parentName') or '',
        'phone': account.get('phone') or '',
        'dob': account.get('dob') or '',
        'gender': account.get('gender') or 'Male',
        'bloodGroup': account.get('bloodGroup') or '',
        'address': account.get('address') or '',
        'status': account.get('status') or 'Active',
        'parentAccessKey': account.get('parentAccessKey') or '',
        'grade': int(grade) if grade else 6,
    }
    return {
        'success': True,
        'token': token,
        'refresh_token': refresh_token,
        'uid': uid,
        'user': {
            'id': uid,
            'role': 'student',
            'name': profile['studentName'],
            'student_id': student_id,
            'class': profile['grade'],
            'section': account.get('division') or '',
        },
        'student': profile,
    }, 200


@app.route('/api/students/access-key-login', methods=['POST'])
def api_students_access_key_login():
    data = request.get_json(silent=True) or {}
    student_id = _normalize_student_login_id(data.get('student_id') or data.get('username') or '')
    access_key = str(data.get('access_key') or '').strip()
    if not student_id or not access_key:
        return {'error': 'Student ID and Access Key are required.'}, 400

    account = _get_student_login_account(student_id)
    if not account:
        return {'error': 'Invalid Student ID or Access Key.'}, 401

    expected_access_key = str(account.get('parentAccessKey') or '').strip()
    if not expected_access_key or access_key != expected_access_key:
        return {'error': 'Invalid Student ID or Access Key.'}, 401

    grade = account.get('grade') or _parse_student_grade(account.get('class_name'), student_id)
    token, refresh_token, uid = _issue_api_tokens(student_id, 'parent')
    profile = {
        'studentName': account.get('name') or student_id,
        'className': account.get('class_name') or (f'Std {grade}' if grade else 'Student'),
        'admissionNumber': account.get('admissionNumber') or '',
        'grNo': account.get('grNo') or '',
        'studentId': student_id,
        'password': account.get('password') or '',
        'parentName': account.get('parentName') or '',
        'phone': account.get('phone') or '',
        'dob': account.get('dob') or '',
        'gender': account.get('gender') or 'Male',
        'bloodGroup': account.get('bloodGroup') or '',
        'address': account.get('address') or '',
        'status': account.get('status') or 'Active',
        'parentAccessKey': expected_access_key,
        'grade': int(grade) if grade else 6,
    }
    return {
        'success': True,
        'token': token,
        'refresh_token': refresh_token,
        'uid': uid,
        'user': {
            'id': uid,
            'role': 'parent',
            'name': profile['parentName'] or 'Parent',
            'student_id': student_id,
            'class': profile['grade'],
            'section': account.get('division') or '',
        },
        'student': profile,
    }, 200


def _issue_api_tokens(username: str, role: str) -> tuple[str, str, str]:
    token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(32)
    uid = username

    conn = sqlite3.connect('school.db', timeout=10)
    c = conn.cursor()
    # Keep a single active token per user+role
    c.execute("DELETE FROM api_tokens WHERE username=? AND role=?", (username, role))
    c.execute(
        "INSERT INTO api_tokens (token, refresh_token, username, role, uid) VALUES (?, ?, ?, ?, ?)",
        (token, refresh_token, username, role, uid),
    )
    conn.commit()
    conn.close()
    return token, refresh_token, uid


def _get_bearer_token() -> str | None:
    auth = request.headers.get('Authorization') or ''
    if not auth.lower().startswith('bearer '):
        return None
    return auth.split(' ', 1)[1].strip() or None


def _get_api_token_row(token: str) -> tuple[str, str, str] | None:
    try:
        conn = sqlite3.connect('school.db', timeout=10)
        c = conn.cursor()
        c.execute("SELECT username, role, uid FROM api_tokens WHERE token=?", (token,))
        row = c.fetchone()
        conn.close()
        if not row:
            return None
        return row[0], row[1], row[2]
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return None


def _is_port_open(host: str, port: int, timeout_s: float = 0.3) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout_s):
            return True
    except Exception:
        return False


def _spawn_teacher_portal_process(command, cwd, extra_env=None):
    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)

    popen_kwargs = {
        'cwd': cwd,
        'env': env,
        'stdout': subprocess.DEVNULL,
        'stderr': subprocess.DEVNULL,
        'stdin': subprocess.DEVNULL,
        'close_fds': True,
    }

    if os.name == 'nt':
        popen_kwargs['creationflags'] = getattr(subprocess, 'CREATE_NEW_CONSOLE', 0)

    subprocess.Popen(command, **popen_kwargs)


def _start_teacher_portal_services():
    if os.path.isdir(TEACHER_PORTAL_SERVER_DIR) and not _is_port_open('127.0.0.1', TEACHER_PORTAL_SERVER_PORT):
        _spawn_teacher_portal_process(
            [NPM_EXECUTABLE, 'start'],
            TEACHER_PORTAL_SERVER_DIR,
            {'PORT': str(TEACHER_PORTAL_SERVER_PORT)}
        )

    if os.path.isdir(TEACHER_PORTAL_CLIENT_DIR) and not _is_port_open('127.0.0.1', TEACHER_PORTAL_CLIENT_PORT):
        _spawn_teacher_portal_process(
            [NPM_EXECUTABLE, 'start'],
            TEACHER_PORTAL_CLIENT_DIR,
            {
                'PORT': str(TEACHER_PORTAL_CLIENT_PORT),
                'BROWSER': 'none',
                'REACT_APP_API_BASE_URL': f'http://127.0.0.1:{TEACHER_PORTAL_SERVER_PORT}',
            }
        )


def _is_session_user(uid: str, role: str) -> bool:
    try:
        return session.get('username') == uid and session.get('role') == role
    except Exception:
        return False


def _normalize_teacher_class_key(value: str | None) -> str:
    text = re.sub(r'(?i)\bclass\b', '', str(value or ''))
    return re.sub(r'[^0-9A-Za-z]', '', text).upper()


def _lookup_admin_teacher_name(assigned_class: str, division: str = '') -> str | None:
    if not os.path.isfile(ADMIN_DASHBOARD_BACKEND_DB_PATH):
        return None

    assigned_key = _normalize_teacher_class_key(assigned_class)
    division_key = str(division or '').strip().upper()
    exact_key = assigned_key or ''

    if assigned_key and division_key and not assigned_key.endswith(division_key):
        exact_key = f'{assigned_key}{division_key}'

    grade_match = re.match(r'^(\d+)', exact_key or assigned_key)
    grade_key = grade_match.group(1) if grade_match else ''

    try:
        conn = sqlite3.connect(ADMIN_DASHBOARD_BACKEND_DB_PATH, timeout=10)
        c = conn.cursor()
        c.execute("""
            SELECT name, class, status, id
            FROM teachers
            WHERE status = 'Active'
            ORDER BY
              CASE WHEN class IS NULL OR TRIM(class) = '' THEN 1 ELSE 0 END,
              id ASC
        """)
        rows = c.fetchall()
        conn.close()
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return None

    normalized_rows = []
    for row in rows:
        teacher_name = str(row[0] or '').strip()
        teacher_class = str(row[1] or '').strip()
        normalized_rows.append((teacher_name, teacher_class, _normalize_teacher_class_key(teacher_class)))

    if exact_key:
        for teacher_name, _teacher_class, class_key in normalized_rows:
            if class_key == exact_key:
                return teacher_name or None

    if grade_key:
        for teacher_name, _teacher_class, class_key in normalized_rows:
            if class_key == grade_key:
                return teacher_name or None

    return None


def _build_teacher_identity(username: str) -> dict:
    identity = {
        'username': username,
        'name': username,
        'assigned_class': '',
        'division': '',
    }

    try:
        conn = sqlite3.connect('school.db', timeout=10)
        c = conn.cursor()
        c.execute("SELECT class_assigned FROM users WHERE username=? AND role='teacher'", (username,))
        row = c.fetchone()
        if row and row[0]:
            identity['assigned_class'] = str(row[0]).strip()
        conn.close()
    except Exception:
        try:
            conn.close()
        except Exception:
            pass

    if username.lower().startswith('teach') and len(username) >= 6:
        identity['division'] = username[-1].upper()

    teacher_name = _lookup_admin_teacher_name(identity['assigned_class'], identity['division'])
    if not teacher_name:
        class_key = _normalize_teacher_class_key(identity['assigned_class'])
        teacher_name = TEACHER_DEMO_NAME_FALLBACKS.get(class_key)
    if teacher_name:
        identity['name'] = teacher_name

    return identity


def _teacher_timetable_response(payload: dict, status: int = 200):
    response = Response(json.dumps(payload), status=status, mimetype='application/json')
    origin = request.headers.get('Origin', '')
    if origin in ('http://127.0.0.1:3000', 'http://localhost:3000'):
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Vary'] = 'Origin'
    return response


def _parse_teacher_timetable_request(std_raw, section_raw):
    match = re.search(r'\d+', str(std_raw or ''))
    std = int(match.group(0)) if match else None
    section = str(section_raw or 'A').strip().upper()

    if std is None or std < ADMIN_TIMETABLE_MIN_STANDARD or std > 7:
        return {'error': 'Class/standard must be between 1 and 7.'}
    if section not in TEACHER_DEMO_SECTIONS:
        return {'error': 'Section must be A, B, or C.'}

    return {'std': std, 'section': section}


def _build_admin_teacher_subject_map():
    subject_map = {}
    if not os.path.isfile(ADMIN_DASHBOARD_BACKEND_DB_PATH):
        return subject_map

    conn = None
    try:
        conn = sqlite3.connect(ADMIN_DASHBOARD_BACKEND_DB_PATH, timeout=10)
        c = conn.cursor()
        c.execute("SELECT name, subject FROM teachers WHERE status = 'Active' ORDER BY name")
        rows = c.fetchall()
        conn.close()
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return subject_map

    for teacher_name, subject in rows:
        normalized_subject = ADMIN_TIMETABLE_SUBJECT_MAP.get(str(subject or '').strip(), str(subject or '').strip())
        if not normalized_subject:
            continue
        subject_map.setdefault(normalized_subject, [])
        if teacher_name and teacher_name not in subject_map[normalized_subject]:
            subject_map[normalized_subject].append(teacher_name)

    return subject_map


def _generate_admin_timetable(std: int, section: str, teachers_by_subject: dict):
    subject_pool = (
        ADMIN_TIMETABLE_SUBJECTS_BY_STD['primary']
        if std <= ADMIN_TIMETABLE_PRIMARY_MAX
        else ADMIN_TIMETABLE_SUBJECTS_BY_STD['upper']
    )

    rng = random.Random(std * 1000 + ord(section))
    schedule = {}

    def get_teacher(subject_name: str) -> str:
        pool = teachers_by_subject.get(subject_name) or ['TBD']
        return pool[(std + ord(section)) % len(pool)]

    for day in ADMIN_TIMETABLE_DAYS:
        slots = ADMIN_TIMETABLE_SLOTS_SATURDAY if day == 'Saturday' else ADMIN_TIMETABLE_SLOTS_WEEKDAY
        shuffled_subjects = list(subject_pool)
        rng.shuffle(shuffled_subjects)
        subject_idx = 0
        day_slots = []

        for slot in slots:
            slot_copy = dict(slot)
            if slot_copy.get('isBreak'):
                slot_copy['subject'] = None
                slot_copy['teacher'] = None
            else:
                subject_name = shuffled_subjects[subject_idx % len(shuffled_subjects)]
                subject_idx += 1
                slot_copy['subject'] = subject_name
                slot_copy['teacher'] = get_teacher(subject_name)
            day_slots.append(slot_copy)

        schedule[day] = day_slots

    return schedule


def _build_schedule_from_admin_rows(rows):
    schedule = {}

    for day in ADMIN_TIMETABLE_DAYS:
        slots = ADMIN_TIMETABLE_SLOTS_SATURDAY if day == 'Saturday' else ADMIN_TIMETABLE_SLOTS_WEEKDAY
        schedule[day] = [
            {
                **slot,
                'subject': None,
                'teacher': None,
            }
            for slot in slots
        ]

    for day, _lecture, lecture_num, subject, teacher in rows:
        normalized_day = str(day or '').strip()
        if normalized_day not in schedule or lecture_num is None:
            continue

        for slot in schedule[normalized_day]:
            if slot.get('num') == lecture_num:
                slot['subject'] = subject
                slot['teacher'] = teacher
                break

    return schedule


def _get_teacher_timetable_payload(std_raw, section_raw):
    parsed = _parse_teacher_timetable_request(std_raw, section_raw)
    if parsed.get('error'):
        return parsed

    std = parsed['std']
    section = parsed['section']
    teachers_by_subject = _build_admin_teacher_subject_map()

    if std > ADMIN_TIMETABLE_MAX_STANDARD:
        return {
            'std': std,
            'section': section,
            'source': 'fallback',
            'note': f'Admin timetable is available for classes {ADMIN_TIMETABLE_MIN_STANDARD} to {ADMIN_TIMETABLE_MAX_STANDARD} only. Showing generated fallback for class {std}-{section}.',
            'schedule': _generate_admin_timetable(std, section, teachers_by_subject),
            'days': ADMIN_TIMETABLE_DAYS,
        }

    conn = None
    rows = []
    try:
        conn = sqlite3.connect(ADMIN_DASHBOARD_BACKEND_DB_PATH, timeout=10)
        c = conn.cursor()
        c.execute("""
            SELECT day, lecture, lecture_num, subject, teacher
            FROM timetable
            WHERE class = ? AND section = ?
            ORDER BY
              CASE day
                WHEN 'Monday' THEN 1
                WHEN 'Tuesday' THEN 2
                WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4
                WHEN 'Friday' THEN 5
                WHEN 'Saturday' THEN 6
                ELSE 99
              END,
              COALESCE(lecture_num, 999),
              lecture
        """, (std, section))
        rows = c.fetchall()
        conn.close()
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return {'error': 'Unable to read admin timetable data.'}

    return {
        'std': std,
        'section': section,
        'source': 'uploaded' if rows else 'generated',
        'schedule': _build_schedule_from_admin_rows(rows) if rows else _generate_admin_timetable(std, section, teachers_by_subject),
        'days': ADMIN_TIMETABLE_DAYS,
    }


def _build_student_profile(uid: str) -> dict | None:
    admin_profile = _get_admin_student_account(uid)
    if admin_profile:
        return {
            'uid': admin_profile.get('uid') or uid,
            'email': admin_profile.get('email') or uid,
            'name': admin_profile.get('name') or uid,
            'student_id': admin_profile.get('student_id') or uid,
            'class_name': admin_profile.get('class_name') or '',
            'class': admin_profile.get('class') or '',
            'student_class': admin_profile.get('student_class') or '',
            'grade': admin_profile.get('grade'),
            'division': admin_profile.get('division') or '',
            'reward_points': 0,
            'achievement_stars': 0,
            'games_played': 0,
            'high_score': 0,
            'current_level': 1,
            'profile_photo_url': admin_profile.get('profile_photo_url'),
        }

    try:
        conn = sqlite3.connect('school.db', timeout=10)
        c = conn.cursor()

        c.execute("SELECT student_id FROM users WHERE username=? AND role='student'", (uid,))
        row = c.fetchone()
        if not row or not row[0]:
            conn.close()
            return None
        student_id = str(row[0])

        c.execute("SELECT name, class FROM students WHERE student_id=?", (student_id,))
        row = c.fetchone()
        student_name = row[0] if row and row[0] else uid
        db_class_name = row[1] if row and row[1] else ''

        conn.close()

        grade = None
        section = ''
        m = re.match(r'^(\d{1,2})([A-Za-z])', student_id)
        if m:
            try:
                grade = int(m.group(1))
            except Exception:
                grade = None
            section = m.group(2).upper()

        # Prefer deriving class from the student_id (e.g. 08A001 => Class 8, Division A).
        # Some demo databases have incorrect "class" values for students.
        class_name = f'Class {grade}' if grade else (db_class_name or '')

        return {
            'uid': uid,
            'email': uid,
            'name': student_name,
            'student_id': student_id,
            'class_name': class_name,
            # Common aliases used by different frontend builds
            'class': class_name,
            'student_class': class_name,
            'grade': grade,
            'division': section,
            'reward_points': 0,
            'achievement_stars': 0,
            'games_played': 0,
            'high_score': 0,
            'current_level': 1,
            'profile_photo_url': None,
        }
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return None


def _is_authorized_for_uid(uid: str, role: str) -> bool:
    # Accept either bearer token OR current Flask session
    token = _get_bearer_token()
    if token:
        row = _get_api_token_row(token)
        if row:
            token_uid, token_role, _ = row
            if token_role == role and token_uid == uid:
                return True

    return _is_session_user(uid, role)


@app.route('/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json(silent=True) or {}
    username = (data.get('email') or data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return {'message': 'Invalid login credentials'}, 401

    normalized_username = _normalize_student_login_id(username)
    admin_student_account = _get_admin_student_account(normalized_username) if normalized_username.startswith('STU') else None
    if admin_student_account and str(admin_student_account.get('password') or '').strip() == str(password).strip():
        token, refresh_token, uid = _issue_api_tokens(normalized_username, 'student')
        return {'token': token, 'refresh_token': refresh_token, 'uid': uid}, 200

    try:
        conn = sqlite3.connect('school.db', timeout=10)
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username=? AND role='student'", (username,))
        user = c.fetchone()
        conn.close()
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return {'message': 'Login failed'}, 500

    if not user or not check_password_hash(user[2], password):
        return {'message': 'Invalid login credentials'}, 401

    token, refresh_token, uid = _issue_api_tokens(username, 'student')
    return {'token': token, 'refresh_token': refresh_token, 'uid': uid}, 200


@app.route('/auth/signup', methods=['POST'])
def auth_signup():
    # We use a single unified login page in Flask; disable dashboard-side signup.
    return {'message': 'Signup disabled'}, 403


@app.route('/auth/refresh', methods=['POST'])
def auth_refresh():
    data = request.get_json(silent=True) or {}
    refresh_token = (data.get('refresh_token') or '').strip()
    if not refresh_token:
        return {'message': 'Invalid refresh token'}, 401

    try:
        conn = sqlite3.connect('school.db', timeout=10)
        c = conn.cursor()
        c.execute("SELECT username, role, uid FROM api_tokens WHERE refresh_token=?", (refresh_token,))
        row = c.fetchone()
        if not row:
            conn.close()
            return {'message': 'Invalid refresh token'}, 401
        username, role, uid = row[0], row[1], row[2]

        new_token = secrets.token_urlsafe(32)
        c.execute("UPDATE api_tokens SET token=? WHERE refresh_token=?", (new_token, refresh_token))
        conn.commit()
        conn.close()
        return {'token': new_token, 'uid': uid}, 200
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return {'message': 'Refresh failed'}, 500


@app.route('/auth/me', methods=['GET'])
def auth_me():
    token = _get_bearer_token()
    if not token:
        return {'message': 'Unauthorized'}, 401

    row = _get_api_token_row(token)
    if not row:
        return {'message': 'Unauthorized'}, 401

    username, role, uid = row
    payload = {'uid': uid, 'email': username, 'name': username, 'role': role}

    if role == 'student':
        profile = _build_student_profile(uid)
        if profile:
            payload['name'] = profile.get('name') or payload['name']
            payload['student_id'] = profile.get('student_id')
            payload['class_name'] = profile.get('class_name')
            payload['class'] = profile.get('class')
            payload['student_class'] = profile.get('student_class')
            payload['grade'] = profile.get('grade')
            payload['division'] = profile.get('division')
            payload['profile_photo_url'] = profile.get('profile_photo_url')

    return payload, 200


@app.route('/holidays/2026')
@app.route('/api/holidays/2026')
def holidays_2026():
    # Minimal holidays list for the Std 8 dashboard.
    holidays = [
        {'date': '2026-01-26', 'name': 'Republic Day'},
        {'date': '2026-08-15', 'name': 'Independence Day'},
        {'date': '2026-10-02', 'name': 'Gandhi Jayanti'},
    ]
    return {'holidays': holidays}, 200


@app.route('/profile/check/<uid>')
@app.route('/api/profile/check/<uid>')
def student_profile_check(uid: str):
    uid = (uid or '').strip()
    if not uid:
        return {'detail': 'Invalid user ID'}, 400

    if not _is_authorized_for_uid(uid, 'student'):
        return {'detail': 'Unauthorized'}, 401

    profile = _build_student_profile(uid)
    if not profile:
        return {'exists': False}, 200

    return {'exists': True, 'profile': profile}, 200


@app.route('/api/dashboard/<uid>')
def student_dashboard_api(uid: str):
    uid = (uid or '').strip()
    if not uid:
        return {'detail': 'Invalid user ID'}, 400

    if not _is_authorized_for_uid(uid, 'student'):
        return {'detail': 'Unauthorized'}, 401

    profile = _build_student_profile(uid)
    if not profile:
        return {'detail': 'Student not found'}, 404

    # The React Std 8 dashboard expects the profile object directly.
    return profile, 200


@app.route('/dashboard/<uid>')
def student_dashboard_compat(uid: str):
    # Compatibility endpoint used by some parts of the Std 8 dashboard client.
    uid = (uid or '').strip()
    if not uid:
        return {'detail': 'Invalid user ID'}, 400

    if not _is_authorized_for_uid(uid, 'student'):
        return {'detail': 'Unauthorized'}, 401

    profile = _build_student_profile(uid)
    if not profile:
        return {'exists': False}, 200

    return {'exists': True, 'profile': profile}, 200


@app.route('/parent-portal')
def parent_portal_redirect():
    return redirect(url_for('index'))


def _serve_admin_portal_index():
    index_path = os.path.join(ADMIN_DASHBOARD_DIST_DIR, 'index.html')
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception:
        return redirect(url_for('index'))

    user = {
        'email': session.get('username'),
        'role': 'admin',
        'name': 'Admin',
        'loginTime': int(time.time() * 1000),
    }
    bootstrap = (
        "<script>(function(){try{"
        f"var u={json.dumps(user)};"
        "localStorage.setItem('ssms_auth', JSON.stringify(u));"
        "localStorage.setItem('userRole', u.role);"
        "localStorage.setItem('userName', u.name);"
        "}catch(e){}})();</script>"
    )

    if '</head>' in html:
        html = html.replace('</head>', bootstrap + '</head>', 1)
    return Response(html, mimetype='text/html')


@app.route('/admin')
@app.route('/admin/<path:path>')
def admin_portal_redirect(path=''):
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
    if not os.path.isfile(os.path.join(ADMIN_DASHBOARD_DIST_DIR, 'index.html')):
        return redirect(url_for('login'))
    return _serve_admin_portal_index()


@app.route('/admin-portal')
@app.route('/admin-portal/<path:path>')
def admin_portal_compat(path=''):
    return redirect(url_for('admin_portal_redirect'))


def _find_student_portal_dist_dir(grade: int) -> str | None:
    # Expected structure: student portal/Std N/Std N/dist
    root = os.path.join(STUDENT_PORTAL_ROOT_DIR, f"Std {grade}")
    candidates = [
        os.path.join(root, f"Std {grade}", "dist"),
        os.path.join(root, "dist"),
    ]

    for dist_dir in candidates:
        if os.path.isfile(os.path.join(dist_dir, 'index.html')):
            return dist_dir

    # Fallback: search one level down (handles odd folder names)
    try:
        if os.path.isdir(root):
            for entry in os.listdir(root):
                dist_dir = os.path.join(root, entry, 'dist')
                if os.path.isfile(os.path.join(dist_dir, 'index.html')):
                    return dist_dir
    except Exception:
        pass

    # Fallback: recursively find a dist/ folder (some portals have extra nesting)
    try:
        if os.path.isdir(root):
            skip_dirs = {'.git', '.venv', '__pycache__', 'node_modules'}
            max_depth = 5

            for dirpath, dirnames, filenames in os.walk(root):
                rel = os.path.relpath(dirpath, root)
                depth = 0 if rel == '.' else rel.count(os.sep) + 1

                # Prune deep walks and huge dirs
                dirnames[:] = [d for d in dirnames if d not in skip_dirs]
                if depth > max_depth:
                    dirnames[:] = []
                    continue

                if os.path.basename(dirpath).lower() == 'dist' and 'index.html' in filenames:
                    return dirpath
    except Exception:
        pass

    return None


def _find_any_student_portal_asset(filename: str) -> str | None:
    for grade in range(1, 8):
        dist_dir = _find_student_portal_dist_dir(grade)
        if not dist_dir:
            continue
        assets_dir = os.path.join(dist_dir, 'assets')
        if os.path.isfile(os.path.join(assets_dir, filename)):
            return assets_dir
    return None


@app.route('/student-portal')
def student_portal_home():
    if session.get('role') != 'student':
        return redirect(url_for('student_login'))
    grade = session.get('student_grade')
    if not grade:
        return redirect(url_for('student_login'))
    return redirect(url_for('student_portal', grade=grade))

@app.route('/student-portal/<int:grade>')
@app.route('/student-portal/<int:grade>/<path:path>')
def student_portal(grade: int, path: str = ''):
    if not (1 <= grade <= 7):
        return redirect(url_for('student_dashboard_portal'))
    if grade == 1:
        abort(404)

    demo_student_id = next(
        (
            sid
            for sid, meta in STUDENT_LOGIN_ACCOUNTS.items()
            if int(meta.get('grade') or 0) == grade
        ),
        f'STD{grade}',
    )

    if session.get('role') != 'student':
        if grade in STUDENT_LOGIN_PAGE_GRADES:
            return redirect(url_for('student_login_grade', grade=grade))
        return redirect(url_for('student_login'))

    if session.get('role') != 'student':
        if grade in STUDENT_LOGIN_PAGE_GRADES:
            return redirect(url_for('student_login_grade', grade=grade))
        return redirect(url_for('student_login'))

    session_grade = session.get('student_grade')
    if session_grade and int(session_grade) != grade:
        session.clear()
        return redirect(url_for('student_login_grade', grade=grade))

    dist_dir = _find_student_portal_dist_dir(grade)
    if not dist_dir:
        if grade in STUDENT_LOGIN_PAGE_GRADES:
            return redirect(url_for('student_login_grade', grade=grade))
        return redirect(url_for('student_login'))

    session['student_app'] = 'portal'
    session['student_grade'] = grade
    theme = STUDENT_LOGIN_THEMES.get(grade, STUDENT_LOGIN_THEMES[1])
    session['student_theme'] = {
        'grade': grade,
        'name': theme['name'],
        'badge': theme['badge'],
        'accent': theme['accent'],
        'accent_soft': theme['accent_soft'],
        'accent_deep': theme['accent_deep'],
        'bg_start': theme['bg_start'],
        'bg_end': theme['bg_end'],
    }

    index_path = os.path.join(dist_dir, 'index.html')
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception:
        if grade in STUDENT_LOGIN_PAGE_GRADES:
            return redirect(url_for('student_login_grade', grade=grade))
        return redirect(url_for('student_login'))

    theme_bootstrap = (
        "<script>(function(){try{"
        f"window.__SSMS_STUDENT_THEME__={json.dumps(session['student_theme'])};"
        f"localStorage.setItem('ssmsStudentTheme',{json.dumps(json.dumps(session['student_theme']))});"
        f"localStorage.setItem('ssmsStudentGrade',{json.dumps(str(grade))});"
        "}catch(e){}})();</script>"
    )

    auth_bootstrap = ""
    student_id = session.get('student_id') or demo_student_id
    student_profile_payload = None
    if grade in {1, 2, 3, 4, 5, 6}:
        account = _get_student_login_account(student_id)
        if account:
            account_grade = int(account.get('grade') or 0)
            effective_grade = grade if account_grade != grade else account_grade
            class_name = account.get('class_name') if account_grade == grade and account.get('class_name') else f"Std {grade}"
            student_profile_payload = {
                'studentName': account.get('name') or student_id,
                'className': class_name,
                'admissionNumber': account.get('admissionNumber') or '',
                'grNo': account.get('grNo') or '',
                'studentId': account.get('student_id') or student_id,
                'password': account.get('password') or '',
                'parentName': account.get('parentName') or '',
                'fatherName': account.get('parentName') or '',
                'phone': account.get('phone') or '',
                'dob': account.get('dob') or '',
                'gender': account.get('gender') or 'Male',
                'bloodGroup': account.get('bloodGroup') or '',
                'address': account.get('address') or '',
                'status': account.get('status') or 'Active',
                'parentAccessKey': account.get('parentAccessKey') or '',
                'grade': effective_grade or grade,
                'division': account.get('division') or 'A',
            }

    if grade in {1, 2, 3, 5, 6}:
        session_key = (
            'ssms_std1_student_session_v1' if grade == 1
            else 'ssms_std2_student_session_v1' if grade == 2
            else 'ssms_student_session_v1' if grade == 3
            else 'ssms_std5_student_session_v1' if grade == 5
            else 'ssms_std6_student_session_v1'
        )
        session_payload = {'studentId': student_id}
        if student_profile_payload:
            session_payload['studentProfile'] = student_profile_payload
        auth_bootstrap = (
            "<script>(function(){try{"
            f"localStorage.setItem({json.dumps(session_key)}, JSON.stringify({json.dumps(session_payload)}));"
            "}catch(e){}})();</script>"
        )

    if grade == 4:
        std4_payload = {
            'isAuthenticated': True,
            'user': {
                'role': 'student',
                'grade': grade,
                'name': student_profile_payload.get('studentName') if student_profile_payload else student_id,
                'username': student_id,
            },
            'studentProfile': student_profile_payload,
        }
        auth_bootstrap += (
            "<script>(function(){try{"
            f"localStorage.setItem('ssms_std4_auth_session_v1', JSON.stringify({json.dumps(std4_payload)}));"
            "}catch(e){}})();</script>"
        )

    marker = '<script type=\"module\"'
    if marker in html:
        html = html.replace(marker, theme_bootstrap + auth_bootstrap + marker, 1)
    elif '</head>' in html:
        html = html.replace('</head>', theme_bootstrap + auth_bootstrap + '</head>', 1)

    return Response(html, mimetype='text/html')


@app.route('/student-dashboard')
@app.route('/student-dashboard/<path:path>')
def student_dashboard_portal(path: str = ''):
    if session.get('role') != 'student':
        return redirect(url_for('student_login'))

    grade = session.get('student_grade') or 8
    if isinstance(grade, str) and grade.isdigit():
        grade = int(grade)
    if grade < 8:
        return redirect(url_for('student_portal', grade=grade))

    if not os.path.isfile(os.path.join(STUDENT_DASHBOARD_DIST_DIR, 'index.html')):
        return redirect(url_for('student_dashboard'))

    session['student_app'] = 'dashboard'
    session['student_grade'] = grade

    index_path = os.path.join(STUDENT_DASHBOARD_DIST_DIR, 'index.html')
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception:
        return redirect(url_for('student_login'))

    # SSO into the Std 8 dashboard (React app) so it doesn't show its own login screen
    username = session.get('username') or ''
    token, refresh_token, uid = _issue_api_tokens(username, 'student')

    base = '/student-dashboard'
    desired = f"{base}/dashboard/{uid}"
    bootstrap = (
        "<script>(function(){try{"
        f"localStorage.setItem('authToken',{json.dumps(token)});"
        f"localStorage.setItem('refreshToken',{json.dumps(refresh_token)});"
        f"var base={json.dumps(base)};"
        "var p=location.pathname||'';"
        f"var desired={json.dumps(desired)};"
        "if(p===base||p===base+'/'||p===base+'/login'||p===base+'/signup'){"
        "history.replaceState(null,'',desired);"
        "}"
        "}catch(e){}})();</script>"
    )

    marker = '<script type=\"module\"'
    if marker in html:
        html = html.replace(marker, bootstrap + marker, 1)
    elif '</head>' in html:
        html = html.replace('</head>', bootstrap + '</head>', 1)

    return Response(html, mimetype='text/html')


@app.route('/assets/<path:filename>')
def shared_assets(filename):
    # Student Portal (Std 1-7)
    if session.get('role') == 'student' and session.get('student_app') == 'portal':
        try:
            grade = int(session.get('student_grade') or 0)
        except Exception:
            grade = 0
        dist_dir = _find_student_portal_dist_dir(grade) if grade else None
        if dist_dir:
            assets_dir = os.path.join(dist_dir, 'assets')
            if os.path.isfile(os.path.join(assets_dir, filename)):
                return send_from_directory(assets_dir, filename)

    # Fallback: serve any matching student portal asset even if the
    # session cookie is not ready yet on the very first navigation.
    assets_dir = _find_any_student_portal_asset(filename)
    if assets_dir:
        return send_from_directory(assets_dir, filename)

    # Student Dashboard (Std 8+)
    if session.get('role') == 'student' and session.get('student_app') == 'dashboard':
        assets_dir = os.path.join(STUDENT_DASHBOARD_DIST_DIR, 'assets')
        if os.path.isfile(os.path.join(assets_dir, filename)):
            return send_from_directory(assets_dir, filename)

    # Admin Portal
    assets_dir = os.path.join(ADMIN_DASHBOARD_DIST_DIR, 'assets')
    if os.path.isfile(os.path.join(assets_dir, filename)):
        return send_from_directory(assets_dir, filename)

    return {'error': 'Not found'}, 404


def _render_student_portal_html(grade: int, demo_student_id: str, path: str = ''):
    if not (1 <= grade <= 7):
        return redirect(url_for('student_dashboard_portal'))

    dist_dir = _find_student_portal_dist_dir(grade)
    if not dist_dir:
        if grade in STUDENT_LOGIN_PAGE_GRADES:
            return redirect(url_for('student_login_grade', grade=grade))
        return redirect(url_for('student_login'))

    session['student_app'] = 'portal'
    session['student_grade'] = grade
    theme = STUDENT_LOGIN_THEMES.get(grade, STUDENT_LOGIN_THEMES[1])
    session['student_theme'] = {
        'grade': grade,
        'name': theme['name'],
        'badge': theme['badge'],
        'accent': theme['accent'],
        'accent_soft': theme['accent_soft'],
        'accent_deep': theme['accent_deep'],
        'bg_start': theme['bg_start'],
        'bg_end': theme['bg_end'],
    }

    index_path = os.path.join(dist_dir, 'index.html')
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception:
        if grade in STUDENT_LOGIN_PAGE_GRADES:
            return redirect(url_for('student_login_grade', grade=grade))
        return redirect(url_for('student_login'))

    theme_bootstrap = (
        "<script>(function(){try{"
        f"window.__SSMS_STUDENT_THEME__={json.dumps(session['student_theme'])};"
        f"localStorage.setItem('ssmsStudentTheme',{json.dumps(json.dumps(session['student_theme']))});"
        f"localStorage.setItem('ssmsStudentGrade',{json.dumps(str(grade))});"
        "}catch(e){}})();</script>"
    )

    auth_bootstrap = ""
    student_id = session.get('student_id') or demo_student_id
    student_profile_payload = None
    if grade in {1, 2, 3, 4, 5, 6}:
        account = _get_student_login_account(student_id)
        if account:
            account_grade = int(account.get('grade') or 0)
            effective_grade = grade if account_grade != grade else account_grade
            class_name = account.get('class_name') if account_grade == grade and account.get('class_name') else f"Std {grade}"
            student_profile_payload = {
                'studentName': account.get('name') or student_id,
                'className': class_name,
                'admissionNumber': account.get('admissionNumber') or '',
                'grNo': account.get('grNo') or '',
                'studentId': account.get('student_id') or student_id,
                'password': account.get('password') or '',
                'parentName': account.get('parentName') or '',
                'fatherName': account.get('parentName') or '',
                'phone': account.get('phone') or '',
                'dob': account.get('dob') or '',
                'gender': account.get('gender') or 'Male',
                'bloodGroup': account.get('bloodGroup') or '',
                'address': account.get('address') or '',
                'status': account.get('status') or 'Active',
                'parentAccessKey': account.get('parentAccessKey') or '',
                'grade': effective_grade or grade,
                'division': account.get('division') or 'A',
            }

    if grade in {1, 2, 3, 5, 6}:
        session_key = (
            'ssms_std1_student_session_v1' if grade == 1
            else 'ssms_std2_student_session_v1' if grade == 2
            else 'ssms_student_session_v1' if grade == 3
            else 'ssms_std5_student_session_v1' if grade == 5
            else 'ssms_std6_student_session_v1'
        )
        session_payload = {'studentId': student_id}
        if student_profile_payload:
            session_payload['studentProfile'] = student_profile_payload
        auth_bootstrap = (
            "<script>(function(){try{"
            f"localStorage.setItem({json.dumps(session_key)}, JSON.stringify({json.dumps(session_payload)}));"
            "}catch(e){}})();</script>"
        )

    if grade == 4:
        std4_payload = {
            'isAuthenticated': True,
            'user': {
                'role': 'student',
                'grade': grade,
                'name': student_profile_payload.get('studentName') if student_profile_payload else student_id,
                'username': student_id,
            },
            'studentProfile': student_profile_payload,
        }
        auth_bootstrap += (
            "<script>(function(){try{"
            f"localStorage.setItem('ssms_std4_auth_session_v1', JSON.stringify({json.dumps(std4_payload)}));"
            "}catch(e){}})();</script>"
        )

    marker = '<script type=\"module\"'
    if marker in html:
        html = html.replace(marker, theme_bootstrap + auth_bootstrap + marker, 1)
    elif '</head>' in html:
        html = html.replace('</head>', theme_bootstrap + auth_bootstrap + '</head>', 1)

    return Response(html, mimetype='text/html')


@app.route('/css/<path:filename>')
def admin_portal_css(filename):
    css_dir = os.path.join(ADMIN_DASHBOARD_DIST_DIR, 'css')
    return send_from_directory(css_dir, filename)


@app.route('/js/<path:filename>')
def admin_portal_js(filename):
    js_dir = os.path.join(ADMIN_DASHBOARD_DIST_DIR, 'js')
    return send_from_directory(js_dir, filename)


@app.route('/teacher-portal')
def teacher_portal_redirect():
    if session.get('role') != 'teacher':
        return redirect(url_for('login'))

    teacher_username = session.get('username') or ''
    teacher_identity = _build_teacher_identity(teacher_username)

    sso_params = {
        'ssms_sso': '1',
        'email': teacher_username,
        'teacherId': teacher_username,
        'name': teacher_identity['name'],
        'assignedClass': teacher_identity['assigned_class'],
        'division': teacher_identity['division'],
    }
    from urllib.parse import urlencode
    teacher_portal_url = f"http://127.0.0.1:{TEACHER_PORTAL_CLIENT_PORT}/?{urlencode(sso_params)}"
    client_ready = _is_port_open('127.0.0.1', TEACHER_PORTAL_CLIENT_PORT)
    server_ready = _is_port_open('127.0.0.1', TEACHER_PORTAL_SERVER_PORT)

    if client_ready and server_ready:
        return redirect(teacher_portal_url)

    global _teacher_portal_last_start_attempt
    now = int(time.time())
    if now - _teacher_portal_last_start_attempt > 10:
        _teacher_portal_last_start_attempt = now
        try:
            if request.remote_addr in ['127.0.0.1', '::1']:
                _start_teacher_portal_services()
        except Exception as e:
            print('Teacher portal start error:', e)

    html = f"""
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="3">
        <title>Starting Teacher Portal…</title>
        <style>
          body {{ font-family: Arial, sans-serif; padding: 24px; }}
          code {{ background:#f3f4f6; padding:2px 6px; border-radius:6px; }}
        </style>
      </head>
      <body>
        <h2>Starting Teacher Portal…</h2>
        <p>Wait 10–20 seconds. This page will auto-retry.</p>
        <p>Teacher Portal UI: <strong>{'Ready' if client_ready else 'Starting'}</strong> on port <code>{TEACHER_PORTAL_CLIENT_PORT}</code></p>
        <p>Teacher Portal API: <strong>{'Ready' if server_ready else 'Starting'}</strong> on port <code>{TEACHER_PORTAL_SERVER_PORT}</code></p>
        <p>If it doesn’t start, run: <code>{TEACHER_PORTAL_RUN_BAT}</code></p>
        <p>Then open: <a href="{teacher_portal_url}">{teacher_portal_url}</a></p>
      </body>
    </html>
    """
    return Response(html, mimetype='text/html')


@app.route('/api/teacher-portal/timetable', methods=['GET', 'OPTIONS'])
def teacher_portal_timetable_api():
    if request.method == 'OPTIONS':
        return _teacher_timetable_response({}, status=204)

    payload = _get_teacher_timetable_payload(
        request.args.get('std'),
        request.args.get('section'),
    )

    if payload.get('error'):
        return _teacher_timetable_response({'success': False, 'error': payload['error']}, status=400)

    return _teacher_timetable_response({'success': True, 'data': payload})


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('register.html')

    # POST - create visitor account
    username = request.form.get('username')
    password = request.form.get('password')
    full_name = request.form.get('full_name')
    email = request.form.get('email')

    if not username or not password or not full_name or not email:
        return render_template('register.html', error='Please fill all fields')

    try:
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM users WHERE username=?', (username,))
        if c.fetchone()[0] > 0:
            conn.close()
            return render_template('register.html', error='Username already exists')

        c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                  (username, generate_password_hash(password), 'visitor'))
        conn.commit()
        conn.close()
        # auto-login
        session['username'] = username
        session['role'] = 'visitor'
        return redirect(url_for('visitor_dashboard'))
    except Exception as e:
        print('Register error', e)
        return render_template('register.html', error='Registration failed')

@app.route('/logout')
def logout():
    global current_user
    current_user = None
    session.clear()  # Clear session as well
    return redirect(url_for('index'))

# Routes for the new features
@app.route('/hod/fee_management')
def manage_fees():
    if 'username' not in session or session['role'] != 'admin_hod':
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get all fee records with student information
    c.execute("""SELECT f.*, s.name as student_name, s.class as student_class 
                 FROM fees f 
                 JOIN students s ON f.student_id = s.student_id
                 ORDER BY f.due_date DESC""")
    fee_data = []
    for row in c.fetchall():
        fee_data.append({
            'id': row[0],
            'student_id': row[1],
            'amount': row[2],
            'due_date': row[3],
            'paid_date': row[4],
            'status': row[5],
            'description': row[6],
            'student_name': row[7],
            'student_class': row[8]
        })
    
    # Get statistics
    c.execute("SELECT COUNT(*) FROM students")
    total_students = c.fetchone()[0]
    
    c.execute("SELECT SUM(amount) FROM fees WHERE status='paid'")
    total_collected = c.fetchone()[0] or 0
    
    c.execute("SELECT SUM(amount) FROM fees WHERE status='pending'")
    total_pending = c.fetchone()[0] or 0
    
    c.execute("SELECT COUNT(*) FROM fees WHERE status='pending'")
    pending_count = c.fetchone()[0]
    
    # Get all unique classes
    c.execute("SELECT DISTINCT class FROM students ORDER BY class")
    classes = [row[0] for row in c.fetchall()]
    
    # Get all students for the dropdown
    c.execute("SELECT student_id, name, class FROM students ORDER BY class, name")
    all_students = []
    for row in c.fetchall():
        all_students.append({
            'student_id': row[0],
            'name': row[1],
            'class': row[2]
        })
    
    conn.close()
    
    return render_template('fee_management.html', 
                          fee_data=fee_data,
                          total_students=total_students,
                          total_collected=total_collected,
                          total_pending=total_pending,
                          pending_count=pending_count,
                          classes=classes,
                          all_students=all_students)

@app.route('/hod/mark_fee_paid/<int:fee_id>', methods=['POST'])
def mark_fee_paid(fee_id):
    if 'username' not in session or session['role'] != 'admin_hod':
        return {'success': False, 'message': 'Unauthorized'}, 401
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    try:
        # Update fee status to paid
        c.execute("UPDATE fees SET status='paid', paid_date=date('now') WHERE id=?", (fee_id,))
        conn.commit()
        conn.close()
        return {'success': True}
    except Exception as e:
        conn.close()
        return {'success': False, 'message': str(e)}

@app.route('/hod/add_fee', methods=['POST'])
def add_fee():
    if 'username' not in session or session['role'] != 'admin_hod':
        return {'success': False, 'message': 'Unauthorized'}, 401
    
    data = request.get_json()
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    try:
        c.execute("""INSERT INTO fees (student_id, amount, due_date, status, description) 
                     VALUES (?, ?, ?, ?, ?)""",
                  (data['student_id'], data['amount'], data['due_date'], 
                   data.get('status', 'pending'), data.get('description', '')))
        conn.commit()
        conn.close()
        return {'success': True}
    except Exception as e:
        conn.close()
        return {'success': False, 'message': str(e)}

@app.route('/hod/teacher_attendance')
def teacher_attendance():
    if 'username' not in session or session['role'] != 'admin_hod':
        return redirect(url_for('index'))
    
    selected_date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get all teachers
    c.execute("SELECT * FROM users WHERE role='teacher'")
    raw_teachers = c.fetchall()
    
    teachers = []
    for teacher in raw_teachers:
        # Get attendance for this teacher on selected date
        c.execute("SELECT status FROM teacher_attendance WHERE teacher_id=? AND date=?", 
                  (teacher[1], selected_date))
        attendance_result = c.fetchone()
        attendance_status = attendance_result[0] if attendance_result else 'absent'
        
        teachers.append({
            'username': teacher[1],
            'name': teacher[1],  # Using username as name since there's no separate name field
            'subject': teacher[4] or 'N/A',  # Using class_assigned as subject
            'class_assigned': teacher[4],
            'phone': 'N/A',
            'attendance_status': attendance_status
        })
    
    # Calculate statistics
    present_today = sum(1 for t in teachers if t['attendance_status'] == 'present')
    absent_today = len(teachers) - present_today
    total_teachers = len(teachers)
    attendance_rate = (present_today / total_teachers * 100) if total_teachers > 0 else 0
    
    # Get monthly summary for each teacher
    c.execute("""SELECT teacher_id, 
                 COUNT(*) as total_days,
                 SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present_count,
                 SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) as absent_count,
                 SUM(CASE WHEN status='leave' THEN 1 ELSE 0 END) as leave_count
                 FROM teacher_attendance 
                 WHERE date LIKE ? 
                 GROUP BY teacher_id""", (f"{selected_date[:7]}%",))
    
    monthly_summary = []
    for row in c.fetchall():
        attendance_rate = (row[1] / row[0] * 100) if row[0] > 0 else 0
        monthly_summary.append({
            'teacher_id': row[0],
            'teacher_name': row[0],  # Using ID as name
            'total_days': row[1],
            'present_count': row[2],
            'absent_count': row[3],
            'leave_count': row[4],
            'attendance_rate': attendance_rate
        })
    
    conn.close()
    
    return render_template('teacher_attendance.html',
                          teachers=teachers,
                          total_teachers=total_teachers,
                          present_today=present_today,
                          absent_today=absent_today,
                          attendance_rate=attendance_rate,
                          selected_date=selected_date,
                          today_date=datetime.now().strftime('%Y-%m-%d'),
                          monthly_summary=monthly_summary)

@app.route('/hod/save_teacher_attendance', methods=['POST'])
def save_teacher_attendance():
    if 'username' not in session or session['role'] != 'admin_hod':
        return {'success': False, 'message': 'Unauthorized'}, 401
    
    data = request.get_json()
    attendance_data = data['attendance_data']
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    try:
        for record in attendance_data:
            # Check if attendance already exists for this date
            c.execute("SELECT id FROM teacher_attendance WHERE teacher_id=? AND date=?", 
                      (record['teacher_id'], record['date']))
            existing = c.fetchone()
            
            if existing:
                c.execute("UPDATE teacher_attendance SET status=? WHERE teacher_id=? AND date=?", 
                          (record['status'], record['teacher_id'], record['date']))
            else:
                c.execute("INSERT INTO teacher_attendance (teacher_id, date, status) VALUES (?, ?, ?)",
                          (record['teacher_id'], record['date'], record['status']))
        
        conn.commit()
        conn.close()
        return {'success': True}
    except Exception as e:
        conn.close()
        return {'success': False, 'message': str(e)}

@app.route('/teacher/upload_exam_timetable', methods=['GET', 'POST'])
def upload_exam_timetable_teacher():
    if 'username' not in session or session['role'] not in ['teacher', 'admin_teacher']:
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get class assigned to the teacher
    c.execute("SELECT class_assigned FROM users WHERE username=?", (session['username'],))
    class_assigned_row = c.fetchone()
    class_assigned = class_assigned_row[0] if class_assigned_row else None
    
    if request.method == 'POST':
        # Process exam timetable upload
        exam_class = request.form['class']
        subject = request.form['subject']
        exam_date = request.form['exam_date']
        time_slot = request.form['time_slot']
        room_number = request.form.get('room_number', '')
        duration = request.form.get('duration', '120')
        description = request.form.get('description', '')
        
        c.execute("""INSERT INTO exam_timetables (class, subject, exam_date, time_slot, room_number, duration, description) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)""",
                  (exam_class, subject, exam_date, time_slot, room_number, duration, description))
        conn.commit()
        conn.close()
        
        flash('Exam timetable uploaded successfully!', 'success')
        return redirect(url_for('upload_exam_timetable_teacher'))
    
    # Get upcoming exams for the teacher's assigned class
    c.execute("""SELECT * FROM exam_timetables 
                 WHERE class=? AND exam_date >= date('now') 
                 ORDER BY exam_date, time_slot""", (class_assigned,))
    exams = c.fetchall()
    
    conn.close()
    
    return render_template('upload_exam_timetable_teacher.html', 
                          exams=exams, 
                          class_assigned=class_assigned,
                          today_date=datetime.now().strftime('%Y-%m-%d'))

@app.route('/debug_session')
def debug_session():
    return f"Session contents: {dict(session)}<br>Username in session: {session.get('username', 'Not set')}<br>Role in session: {session.get('role', 'Not set')}"

# HOD Dashboard
@app.route('/hod_dashboard')
def hod_dashboard():
    return redirect(url_for('admin_portal_redirect'))


# Visitor dashboard — shows bookings and inquiries for logged-in visitor
@app.route('/visitor_dashboard')
def visitor_dashboard():
    if 'username' not in session or session.get('role') != 'visitor':
        return redirect(url_for('index'))

    username = session.get('username')
    conn = sqlite3.connect('school.db')
    c = conn.cursor()

    # bookings linked to visitor_username
    c.execute("SELECT full_name, visit_date, visit_time, num_visitors, purpose, status FROM visitor_bookings WHERE visitor_username=? ORDER BY created_at DESC", (username,))
    bookings = [dict(full_name=r[0], visit_date=r[1], visit_time=r[2], num_visitors=r[3], purpose=r[4], status=r[5]) for r in c.fetchall()]

    # inquiries
    c.execute("SELECT inquiry_type, message, status, response FROM visitor_inquiries WHERE visitor_username=? ORDER BY created_at DESC", (username,))
    inquiries = [dict(inquiry_type=r[0], message=r[1], status=r[2], response=r[3]) for r in c.fetchall()]

    conn.close()
    return render_template('visitor_dashboard.html', bookings=bookings, inquiries=inquiries)

# Teacher Dashboard
@app.route('/teacher_dashboard')
def teacher_dashboard():
    if 'username' not in session or session.get('role') not in ['teacher', 'admin_teacher']:
        return redirect(url_for('index'))
    return render_template('teacher_dashboard.html')

# Student Dashboard
@app.route('/student_dashboard')
def student_dashboard():
    if 'username' not in session or session.get('role') != 'student':
        print("Student Dashboard access denied - redirecting to login")
        return redirect(url_for('student_login'))
    print(f"Student Dashboard access granted for {session['username']}")
    return render_template('student_dashboard.html')

# Parent Dashboard
@app.route('/parent_dashboard')
def parent_dashboard():
    return redirect(url_for('index'))

# HOD Features
@app.route('/upload_exam_timetable', methods=['GET', 'POST'])
def upload_exam_timetable():
    if 'username' not in session or session['role'] != 'admin_hod':
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        # Process exam timetable upload
        exam_class = request.form['class']
        subject = request.form['subject']
        exam_date = request.form['exam_date']
        time_slot = request.form['time_slot']
        description = request.form['description']
        
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        c.execute("INSERT INTO exams (class, subject, exam_date, time_slot, description) VALUES (?, ?, ?, ?, ?)",
                  (exam_class, subject, exam_date, time_slot, description))
        conn.commit()
        conn.close()
        
        flash('Exam timetable uploaded successfully!', 'success')
        return redirect(url_for('hod_dashboard'))
    
    return render_template('upload_exam_timetable.html')

@app.route('/teacher_progress')
def teacher_progress():
    if 'username' not in session or session['role'] != 'admin_hod':
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE role='teacher'")
    teachers = c.fetchall()
    conn.close()
    
    return render_template('teacher_progress.html', teachers=teachers)

@app.route('/class_progress')
def class_progress():
    if 'username' not in session or session['role'] != 'admin_hod':
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("""SELECT s.class, COUNT(*) as student_count, 
               AVG(m.marks_obtained * 100.0 / m.total_marks) as avg_score
               FROM students s 
               LEFT JOIN marks m ON s.student_id = m.student_id
               GROUP BY s.class""")
    class_stats = c.fetchall()
    conn.close()
    
    return render_template('class_progress.html', class_stats=class_stats)

# Teacher Features
@app.route('/profile')
def teacher_profile():
    if 'username' not in session or session['role'] not in ['teacher', 'admin_teacher']:
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=?", (session['username'],))
    teacher = c.fetchone()
    conn.close()
    teacher_identity = _build_teacher_identity(session['username'])
    
    return render_template('teacher_profile.html', teacher=teacher, teacher_identity=teacher_identity)

@app.route('/add_attendance', methods=['GET', 'POST'])
def add_attendance():
    if 'username' not in session or session['role'] not in ['teacher', 'admin_teacher']:
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    if request.method == 'POST':
        # Process attendance submission
        date = request.form['date']
        class_assigned = request.form['class_assigned']
        
        # Get all students in the class
        c.execute("SELECT student_id, name FROM students WHERE class=?", (class_assigned,))
        students = c.fetchall()
        
        for student in students:
            student_id = student[0]
            status = request.form.get(f'attendance_{student_id}', 'absent')
            
            # Check if attendance already exists for this date
            c.execute("SELECT id FROM attendance WHERE student_id=? AND date=?", (student_id, date))
            existing = c.fetchone()
            
            if existing:
                c.execute("UPDATE attendance SET status=? WHERE student_id=? AND date=?", (status, student_id, date))
            else:
                c.execute("INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)",
                         (student_id, date, status))
        
        conn.commit()
        conn.close()
        
        flash('Attendance marked successfully!', 'success')
        return redirect(url_for('teacher_dashboard'))
    
    # Get class assigned to the teacher
    c.execute("SELECT class_assigned FROM users WHERE username=?", (session['username'],))
    class_assigned = c.fetchone()[0]
    
    # Get students in the class
    c.execute("SELECT * FROM students WHERE class=?", (class_assigned,))
    students = c.fetchall()
    conn.close()
    
    return render_template('add_attendance.html', students=students, class_assigned=class_assigned)

@app.route('/today_homework', methods=['GET', 'POST'])
def today_homework():
    if 'username' not in session or session['role'] not in ['teacher', 'admin_teacher']:
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    if request.method == 'POST':
        homework_class = request.form['class']
        subject = request.form['subject']
        description = request.form['description']
        due_date = request.form['due_date']
        
        c.execute("INSERT INTO homework (class, subject, description, due_date) VALUES (?, ?, ?, ?)",
                  (homework_class, subject, description, due_date))
        conn.commit()
        conn.close()
        
        flash('Homework assigned successfully!', 'success')
        return redirect(url_for('teacher_dashboard'))
    
    # Get class assigned to the teacher
    c.execute("SELECT class_assigned FROM users WHERE username=?", (session['username'],))
    class_assigned = c.fetchone()[0]
    conn.close()
    
    return render_template('today_homework.html', class_assigned=class_assigned)

@app.route('/exam_mark_upload', methods=['GET', 'POST'])
def exam_mark_upload():
    if 'username' not in session or session['role'] not in ['teacher', 'admin_teacher']:
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get class assigned to the teacher
    c.execute("SELECT class_assigned FROM users WHERE username=?", (session['username'],))
    class_assigned = c.fetchone()[0]
    
    if request.method == 'POST':
        exam_name = request.form['exam_name']
        subject = request.form['subject']
        
        # Get all students in the class
        c.execute("SELECT student_id FROM students WHERE class=?", (class_assigned,))
        students = c.fetchall()
        
        for student in students:
            student_id = student[0]
            marks_obtained = request.form.get(f'marks_{student_id}')
            total_marks = request.form.get(f'total_{student_id}')
            
            if marks_obtained and total_marks:
                c.execute("INSERT INTO marks (student_id, subject, exam_name, marks_obtained, total_marks) VALUES (?, ?, ?, ?, ?)",
                         (student_id, subject, exam_name, float(marks_obtained), float(total_marks)))
        
        conn.commit()
        conn.close()
        
        flash('Marks uploaded successfully!', 'success')
        return redirect(url_for('teacher_dashboard'))
    
    # Get students in the class
    c.execute("SELECT * FROM students WHERE class=?", (class_assigned,))
    students = c.fetchall()
    conn.close()
    
    return render_template('exam_mark_upload.html', students=students, class_assigned=class_assigned)

# Student Features
@app.route('/student_homework')
def student_homework():
    global current_user
    if not current_user or current_user['role'] != 'student':
        return redirect(url_for('index'))
    
    # Get student's class
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT class FROM students WHERE student_id=?", (current_user['username'],))
    student_class = c.fetchone()[0]
    
    # Get homework for the class
    c.execute("SELECT * FROM homework WHERE class=? ORDER BY due_date DESC", (student_class,))
    homework = c.fetchall()
    conn.close()
    
    return render_template('student_homework.html', homework=homework)

@app.route('/student_exams')
def student_exams():
    global current_user
    if not current_user or current_user['role'] != 'student':
        return redirect(url_for('index'))
    
    # Get student's class
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT class FROM students WHERE student_id=?", (current_user['username'],))
    student_class = c.fetchone()[0]
    
    # Get upcoming exams for the class
    c.execute("SELECT * FROM exams WHERE class=? AND exam_date >= date('now') ORDER BY exam_date", (student_class,))
    exams = c.fetchall()
    conn.close()
    
    return render_template('upcoming_exams.html', exams=exams)

@app.route('/student_performance')
def student_performance():
    global current_user
    if not current_user or current_user['role'] != 'student':
        return redirect(url_for('index'))
    
    student_id = current_user['username']
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get attendance stats
    c.execute("""SELECT status, COUNT(*) as count FROM attendance 
               WHERE student_id=? GROUP BY status""", (student_id,))
    attendance_stats = dict(c.fetchall())
    total_days = sum(attendance_stats.values()) if attendance_stats else 1
    present_count = attendance_stats.get('present', 0)
    attendance_rate = round((present_count / total_days) * 100, 2) if total_days > 0 else 0
    
    # Get behavior stats
    c.execute("""SELECT behavior_type, COUNT(*) as count FROM behavior 
               WHERE student_id=? GROUP BY behavior_type""", (student_id,))
    behavior_stats = dict(c.fetchall())
    
    # Get exam performance
    c.execute("""SELECT AVG(marks_obtained * 100.0 / total_marks) as avg_percentage 
               FROM marks WHERE student_id=?""", (student_id,))
    avg_percentage = c.fetchone()[0]
    if avg_percentage:
        avg_percentage = round(avg_percentage, 2)
    else:
        avg_percentage = 0
    
    # Get student details
    c.execute("SELECT * FROM students WHERE student_id=?", (student_id,))
    student = c.fetchone()
    
    conn.close()
    
    return render_template('overall_performance.html', 
                           attendance_rate=attendance_rate,
                           behavior_stats=behavior_stats,
                           avg_percentage=avg_percentage,
                           student=student,
                           total_days=total_days,
                           present_count=present_count)

@app.route('/upcoming_exams')
def upcoming_exams():
    if 'username' not in session or session['role'] != 'student':
        return redirect(url_for('index'))
    
    # Get student's class
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT class FROM students WHERE student_id=?", (session['username'],))
    student_class = c.fetchone()[0]
    
    # Get upcoming exams for the class
    c.execute("SELECT * FROM exams WHERE class=? AND exam_date >= date('now') ORDER BY exam_date", (student_class,))
    exams = c.fetchall()
    conn.close()
    
    return render_template('upcoming_exams.html', exams=exams)

@app.route('/overall_performance')
def overall_performance():
    if 'username' not in session or session['role'] != 'student':
        return redirect(url_for('index'))
    
    student_id = session['username']
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get attendance stats
    c.execute("""SELECT status, COUNT(*) as count FROM attendance 
               WHERE student_id=? GROUP BY status""", (student_id,))
    attendance_stats = dict(c.fetchall())
    total_days = sum(attendance_stats.values()) if attendance_stats else 1
    present_count = attendance_stats.get('present', 0)
    attendance_rate = round((present_count / total_days) * 100, 2) if total_days > 0 else 0
    
    # Get behavior stats
    c.execute("""SELECT behavior_type, COUNT(*) as count FROM behavior 
               WHERE student_id=? GROUP BY behavior_type""", (student_id,))
    behavior_stats = dict(c.fetchall())
    
    # Get exam performance
    c.execute("""SELECT AVG(marks_obtained * 100.0 / total_marks) as avg_percentage 
               FROM marks WHERE student_id=?""", (student_id,))
    avg_percentage = c.fetchone()[0]
    if avg_percentage:
        avg_percentage = round(avg_percentage, 2)
    else:
        avg_percentage = 0
    
    # Get student details
    c.execute("SELECT * FROM students WHERE student_id=?", (student_id,))
    student = c.fetchone()
    
    conn.close()
    
    return render_template('overall_performance.html', 
                           attendance_rate=attendance_rate,
                           behavior_stats=behavior_stats,
                           avg_percentage=avg_percentage,
                           student=student,
                           total_days=total_days,
                           present_count=present_count)

# Parent Features
@app.route('/parent_attendance')
def parent_attendance():
    return redirect(url_for('index'))

@app.route('/parent_behavior')
def parent_behavior():
    return redirect(url_for('index'))

# AJAX endpoints for parent dashboard data
@app.route('/api/parent/attendance_data')
def parent_attendance_data():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT student_id FROM users WHERE username=?", (current_user['username'],))
    student_id = c.fetchone()[0]
    
    # Get attendance data for charts
    c.execute("""SELECT strftime('%Y-%m', date) as month, 
                 COUNT(*) as total_days,
                 SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present_days
                 FROM attendance 
                 WHERE student_id=? AND date >= date('now', '-6 months')
                 GROUP BY strftime('%Y-%m', date)
                 ORDER BY month""", (student_id,))
    
    attendance_data = c.fetchall()
    conn.close()
    
    # Format data for Chart.js
    months = [row[0] for row in attendance_data]
    attendance_rates = [round((row[2]/row[1])*100, 2) if row[1] > 0 else 0 for row in attendance_data]
    
    return {
        'months': months,
        'attendance_rates': attendance_rates,
        'total_records': len(attendance_data)
    }

@app.route('/api/parent/subject_performance')
def parent_subject_performance():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT student_id FROM users WHERE username=?", (current_user['username'],))
    student_id = c.fetchone()[0]
    
    # Get subject performance data
    c.execute("""SELECT subject, 
                 AVG(marks_obtained * 100.0 / total_marks) as percentage
                 FROM marks 
                 WHERE student_id=?
                 GROUP BY subject
                 ORDER BY percentage DESC""", (student_id,))
    
    subject_data = c.fetchall()
    conn.close()
    
    subjects = [row[0] for row in subject_data]
    percentages = [round(row[1], 2) for row in subject_data]
    
    return {
        'subjects': subjects,
        'percentages': percentages,
        'count': len(subjects)
    }

@app.route('/api/parent/exam_results')
def parent_exam_results():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT student_id FROM users WHERE username=?", (current_user['username'],))
    student_id = c.fetchone()[0]
    
    # Get recent exam results
    c.execute("""SELECT exam_name, subject, marks_obtained, total_marks,
                 (marks_obtained * 100.0 / total_marks) as percentage
                 FROM marks 
                 WHERE student_id=?
                 ORDER BY exam_name DESC
                 LIMIT 10""", (student_id,))
    
    exam_data = c.fetchall()
    conn.close()
    
    results = []
    for row in exam_data:
        results.append({
            'exam_name': row[0],
            'subject': row[1],
            'marks_obtained': row[2],
            'total_marks': row[3],
            'percentage': round(row[4], 2)
        })
    
    return {'results': results}

@app.route('/api/parent/homework_status')
def parent_homework_status():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT student_id FROM users WHERE username=?", (current_user['username'],))
    student_id = c.fetchone()[0]
    
    # Get student's class
    c.execute("SELECT class FROM students WHERE student_id=?", (student_id,))
    student_class = c.fetchone()[0]
    
    # Get recent homework
    c.execute("""SELECT subject, description, due_date,
                 CASE WHEN date(due_date) >= date('now') THEN 'pending' ELSE 'completed' END as status
                 FROM homework 
                 WHERE class=?
                 ORDER BY due_date DESC
                 LIMIT 10""", (student_class,))
    
    homework_data = c.fetchall()
    conn.close()
    
    homework_list = []
    for row in homework_data:
        homework_list.append({
            'subject': row[0],
            'description': row[1],
            'due_date': row[2],
            'status': row[3]
        })
    
    return {'homework': homework_list}

@app.route('/api/parent/behavior_stats')
def parent_behavior_stats():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT student_id FROM users WHERE username=?", (current_user['username'],))
    student_id = c.fetchone()[0]
    
    # Get behavior statistics
    c.execute("""SELECT behavior_type, COUNT(*) as count
                 FROM behavior 
                 WHERE student_id=?
                 GROUP BY behavior_type""", (student_id,))
    
    behavior_stats = c.fetchall()
    conn.close()
    
    stats_dict = dict(behavior_stats)
    
    return {
        'good_incidents': stats_dict.get('good', 0),
        'bad_incidents': stats_dict.get('bad', 0),
        'total_incidents': sum(stats_dict.values())
    }

@app.route('/api/parent/fees_status')
def parent_fees_status():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    # Mock fees data (in real system, this would come from fees table)
    return {
        'total_fees': 60000,
        'paid_amount': 60000,
        'pending_amount': 0,
        'status': 'All Clear',
        'last_payment_date': '2026-01-15'
    }

@app.route('/api/parent/notices')
def parent_notices():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    # Mock notices data (in real system, this would come from notices table)
    notices = [
        {
            'title': 'Parent-Teacher Meeting',
            'description': 'Scheduled for Jan 25, 2026 at 2:00 PM in Conference Room A',
            'date': '2026-01-10',
            'priority': 'high'
        },
        {
            'title': 'Annual Day Preparation',
            'description': 'Students required to practice from Jan 20. Costumes distributed.',
            'date': '2026-01-08',
            'priority': 'medium'
        },
        {
            'title': 'Exam Schedule Published',
            'description': 'Mid-term exam schedule now available. Please collect hall tickets.',
            'date': '2026-01-05',
            'priority': 'high'
        }
    ]
    
    return {'notices': notices}

@app.route('/api/parent/transport_info')
def parent_transport_info():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    # Mock transport data (in real system, this would come from transport table)
    return {
        'route_number': 'Route 15',
        'driver_name': 'Mr. Rajesh Kumar',
        'driver_contact': '+91 98765 43210',
        'pickup_time': '08:00 AM',
        'drop_time': '03:30 PM',
        'vehicle_number': 'DL 01 AB 1234',
        'status': 'Active'
    }

@app.route('/api/parent/exam_schedule')
def parent_exam_schedule():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT student_id FROM users WHERE username=?", (current_user['username'],))
    student_id = c.fetchone()[0]
    
    # Get student's class
    c.execute("SELECT class FROM students WHERE student_id=?", (student_id,))
    student_class = c.fetchone()[0]
    
    # Get upcoming exams
    c.execute("""SELECT subject, exam_date, time_slot, description
                 FROM exams 
                 WHERE class=? AND exam_date >= date('now')
                 ORDER BY exam_date""", (student_class,))
    
    exam_data = c.fetchall()
    conn.close()
    
    exams = []
    for row in exam_data:
        exams.append({
            'subject': row[0],
            'date': row[1],
            'time': row[2],
            'description': row[3]
        })
    
    return {'exams': exams}

@app.route('/api/parent/events')
def parent_events():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    # Mock events data (in real system, this would come from events table)
    events = [
        {
            'title': 'Republic Day',
            'date': '2026-01-26',
            'type': 'Holiday',
            'description': 'National Holiday - School Closed'
        },
        {
            'title': 'Annual Sports Day',
            'date': '2026-02-10',
            'type': 'Event',
            'description': 'Inter-class sports competition'
        },
        {
            'title': 'Parent-Teacher Meeting',
            'date': '2026-01-25',
            'type': 'Meeting',
            'description': 'Regular academic review meeting'
        }
    ]
    
    return {'events': events}

@app.route('/api/parent/projects')
def parent_projects():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    # Mock project data (in real system, this would come from projects table)
    projects = [
        {
            'title': 'Science Fair Project',
            'description': 'Solar Energy Model and Presentation',
            'status': 'In Progress',
            'progress': 75,
            'due_date': '2026-02-15'
        },
        {
            'title': 'Mathematics Exhibition',
            'description': 'Geometric Patterns and Mathematical Art',
            'status': 'Completed',
            'progress': 100,
            'due_date': '2025-12-20'
        }
    ]
    
    return {'projects': projects}

@app.route('/api/parent/activities')
def parent_activities():
    return {'error': 'Parent portal removed'}, 404
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return {'error': 'Unauthorized'}, 401
    
    # Mock activity data (in real system, this would come from activities table)
    activities = [
        {
            'name': 'Football Team',
            'role': 'Team Captain',
            'status': 'Active',
            'coach': 'Mr. Sharma'
        },
        {
            'name': 'Music Club',
            'role': 'Piano Player',
            'status': 'Active',
            'instructor': 'Ms. Priya'
        },
        {
            'name': 'Debate Society',
            'role': 'Member',
            'status': 'Active',
            'mentor': 'Mr. Verma'
        }
    ]
    
    return {'activities': activities}


@app.route('/api/class-data')
def get_class_data():
    """API endpoint to get class data with sample accounts for login page"""
    classes = [f'{grade}-A' for grade in TEACHER_DEMO_GRADES]
    
    class_data = {}
    
    for cls_format in classes:
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        
        # Parse class format: "1-A" -> grade="1", section="A"
        grade, section = cls_format.split('-')
        
        # Build search patterns
        teacher_pattern = f"teach{grade}{section}"  # e.g., "teach1A"
        student_pattern = f"stu{int(grade):02d}{section}%"
        
        # Get class teacher
        c.execute("SELECT username, password FROM users WHERE username=? AND role='teacher'", 
                  (teacher_pattern,))
        teacher = c.fetchone()
        
        # Get first 5 students in this class
        c.execute("""SELECT username FROM users WHERE role='student' AND username LIKE ? LIMIT 5""",
                  (student_pattern,))
        students = [row[0] for row in c.fetchall()]
        
        # Get parents for those students
        parents = []
        for student_username in students:
            c.execute("SELECT username FROM users WHERE username=? AND role='parent'",
                      (f"parent_{student_username}",))
            parent = c.fetchone()
            if parent:
                parents.append(parent[0])
        
        conn.close()
        
        class_data[cls_format] = {
            'students': students,
            'teacher': teacher[0] if teacher else None,
            'parents': parents
        }
    
    return class_data


# Initialize database when module is imported
init_db()
create_sample_data()

if __name__ == '__main__':
    app.run(debug=True)
