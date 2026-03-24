from flask import Flask, render_template, request, redirect, url_for, session, flash, send_from_directory, Response
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

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'


@app.errorhandler(404)
def _log_404(err):
    try:
        print("404:", request.method, request.path)
    except Exception:
        pass
    return err

# Admin Dashboard (React build) location
ADMIN_DASHBOARD_DIST_DIR = os.path.join(
    os.path.dirname(__file__),
    'Admin Dashboard',
    'Admin Dashboard',
    'frontend-react',
    'dist',
)

TEACHER_PORTAL_DIR = os.path.join(os.path.dirname(__file__), 'teacher portal')
TEACHER_PORTAL_RUN_BAT = os.path.join(TEACHER_PORTAL_DIR, 'run.bat')
_teacher_portal_last_start_attempt = 0

STUDENT_DASHBOARD_DIST_DIR = os.path.join(
    os.path.dirname(__file__),
    'student dashboard',
    'frontend',
    'dist',
)

STUDENT_PORTAL_ROOT_DIR = os.path.join(os.path.dirname(__file__), 'student portal')

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
            
            # Create class teachers and students for grades 8, 9, 10
            grades = [8, 9, 10]
            sections = ['A', 'B', 'C']
            
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
        
        conn.close()
    except Exception as e:
        print(f"Note: Sample data creation skipped: {e}")

@app.route('/')
def index():
    return render_template('login.html')

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
    if 'username' not in session or session['role'] != 'admin_hod':
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

# Admin: Respond to Inquiry
@app.route('/api/admin/inquiry/respond', methods=['POST'])
def respond_to_inquiry():
    if 'username' not in session or session['role'] != 'admin_hod':
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
    if request.method == 'GET':
        return render_template('login.html')

    username = (request.form.get('username') or '').strip()
    password = request.form.get('password') or ''
    role = (request.form.get('role') or '').strip().lower()

    if role in ['admin_hod', 'admin_teacher']:
        role = 'admin'

    if role not in ['admin', 'teacher', 'student']:
        return render_template('login.html', error='Invalid portal selected')

    try:
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username=? AND role=?", (username, role))
        user = c.fetchone()
        conn.close()
    except Exception as e:
        print('Login DB error', e)
        return render_template('login.html', error='Login failed')

    if not user or not check_password_hash(user[2], password):
        return render_template('login.html', error='Invalid ID or password')

    session['username'] = username
    session['role'] = role

    if role == 'admin':
        return redirect(url_for('admin_portal_redirect'))
    if role == 'teacher':
        return redirect(url_for('teacher_portal_redirect'))

    # Student: Std 1-7 -> Student Portal, Std 8+ -> Student Dashboard
    student_grade = None
    m = re.match(r'^stu(\d{2})', username.lower())
    if m:
        try:
            student_grade = int(m.group(1))
        except Exception:
            student_grade = None

    # Fallback to stored student_id (e.g. "8A001")
    if student_grade is None and user and len(user) >= 6 and user[5]:
        m2 = re.match(r'^(\d{1,2})', str(user[5]))
        if m2:
            try:
                student_grade = int(m2.group(1))
            except Exception:
                student_grade = None

    if student_grade is None:
        session['student_grade'] = 8
        session['student_app'] = 'dashboard'
        return redirect(url_for('student_dashboard_portal'))

    session['student_grade'] = student_grade
    if 1 <= student_grade <= 7:
        session['student_app'] = 'portal'
        return redirect(url_for('student_portal', grade=student_grade))

    session['student_app'] = 'dashboard'
    return redirect(url_for('student_dashboard_portal'))


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


def _is_session_user(uid: str, role: str) -> bool:
    try:
        return session.get('username') == uid and session.get('role') == role
    except Exception:
        return False


def _build_student_profile(uid: str) -> dict | None:
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


@app.route('/student-portal')
def student_portal_home():
    if session.get('role') != 'student':
        return redirect(url_for('login'))
    grade = session.get('student_grade')
    if not grade:
        return redirect(url_for('login'))
    return redirect(url_for('student_portal', grade=grade))


@app.route('/student-portal/<int:grade>')
@app.route('/student-portal/<int:grade>/<path:path>')
def student_portal(grade: int, path: str = ''):
    if session.get('role') != 'student':
        return redirect(url_for('login'))

    if not (1 <= grade <= 7):
        return redirect(url_for('student_dashboard_portal'))

    dist_dir = _find_student_portal_dist_dir(grade)
    if not dist_dir:
        return redirect(url_for('login'))

    session['student_app'] = 'portal'
    session['student_grade'] = grade
    return send_from_directory(dist_dir, 'index.html')


@app.route('/student-dashboard')
@app.route('/student-dashboard/<path:path>')
def student_dashboard_portal(path: str = ''):
    if session.get('role') != 'student':
        return redirect(url_for('login'))

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
        return redirect(url_for('login'))

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

    def is_port_open(host: str, port: int, timeout_s: float = 0.3) -> bool:
        try:
            with socket.create_connection((host, port), timeout=timeout_s):
                return True
        except Exception:
            return False

    teacher_username = session.get('username') or ''
    assigned_class = ''
    division = ''
    try:
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        c.execute("SELECT class_assigned FROM users WHERE username=? AND role='teacher'", (teacher_username,))
        row = c.fetchone()
        if row and row[0]:
            assigned_class = row[0]
        conn.close()
    except Exception:
        try:
            conn.close()
        except Exception:
            pass

    # Try to parse division from username like teach8A -> A
    if teacher_username.lower().startswith('teach') and len(teacher_username) >= 6:
        division = teacher_username[-1].upper()

    sso_params = {
        'ssms_sso': '1',
        'email': teacher_username,
        'name': teacher_username,
        'assignedClass': assigned_class,
        'division': division,
    }
    from urllib.parse import urlencode
    teacher_portal_url = f"http://localhost:3000/?{urlencode(sso_params)}"

    if is_port_open('127.0.0.1', 3000):
        return redirect(teacher_portal_url)

    global _teacher_portal_last_start_attempt
    now = int(time.time())
    if now - _teacher_portal_last_start_attempt > 10:
        _teacher_portal_last_start_attempt = now
        try:
            if request.remote_addr in ['127.0.0.1', '::1'] and os.path.isfile(TEACHER_PORTAL_RUN_BAT):
                subprocess.Popen(
                    ['cmd', '/c', 'start', '""', TEACHER_PORTAL_RUN_BAT],
                    cwd=TEACHER_PORTAL_DIR,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    stdin=subprocess.DEVNULL,
                    close_fds=True,
                )
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
        <p>If it doesn’t start, run: <code>{TEACHER_PORTAL_RUN_BAT}</code></p>
        <p>Then open: <a href="{teacher_portal_url}">{teacher_portal_url}</a></p>
      </body>
    </html>
    """
    return Response(html, mimetype='text/html')


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
        return redirect(url_for('index'))
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
    
    return render_template('teacher_profile.html', teacher=teacher)

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
    classes = ['8-A', '8-B', '8-C', '9-A', '9-B', '9-C', '10-A', '10-B', '10-C']
    
    class_data = {}
    
    for cls_format in classes:
        conn = sqlite3.connect('school.db')
        c = conn.cursor()
        
        # Parse class format: "8-A" -> grade="8", section="A"
        grade, section = cls_format.split('-')
        
        # Build search patterns
        teacher_pattern = f"teach{grade}{section}"  # e.g., "teach8A"
        student_pattern = f"stu0{grade}{section}%"   # e.g., "stu08A%"
        
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
