from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

# Global variable to store current user (for testing)
current_user = None

# Database initialization
def init_db():
    conn = sqlite3.connect('school.db')
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
    
    conn.commit()
    conn.close()

# Sample data creation
def create_sample_data():
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Check if data already exists
    c.execute("SELECT COUNT(*) FROM users WHERE role='admin_hod'")
    if c.fetchone()[0] == 0:
        # Create admin accounts
        c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                  ('admin_hod', generate_password_hash('admin123'), 'admin_hod'))
        c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                  ('admin_teacher', generate_password_hash('admin123'), 'admin_teacher'))
    
    # Create sample teachers
    teachers = [
        ('teacher_math', 'teacher123', 'teacher', 'Class 8'),
        ('teacher_science', 'teacher123', 'teacher', 'Class 9'),
        ('teacher_english', 'teacher123', 'teacher', 'Class 10'),
    ]
    
    for username, password, role, class_assigned in teachers:
        c.execute("SELECT COUNT(*) FROM users WHERE username=?", (username,))
        if c.fetchone()[0] == 0:
            c.execute("INSERT INTO users (username, password, role, class_assigned) VALUES (?, ?, ?, ?)",
                      (username, generate_password_hash(password), role, class_assigned))
    
    # Create sample students and parents for each class
    classes = ['Class 8', 'Class 9', 'Class 10']
    for cls in classes:
        for i in range(1, 31):  # 30 students per class
            student_id = f"{cls.split()[1]}{str(i).zfill(2)}"  # e.g., 801, 802, ..., 830
            student_name = f"Student {cls} {i}"
            
            # Insert student
            c.execute("SELECT COUNT(*) FROM students WHERE student_id=?", (student_id,))
            if c.fetchone()[0] == 0:
                c.execute("INSERT INTO students (student_id, name, class) VALUES (?, ?, ?)",
                          (student_id, student_name, cls))
            
            # Create student login account
            c.execute("SELECT COUNT(*) FROM users WHERE username=? AND role='student'", (student_id,))
            if c.fetchone()[0] == 0:
                c.execute("INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)",
                          (student_id, generate_password_hash('student123'), 'student', student_id))
            
            # Create parent account
            parent_username = f"parent_{student_id.lower()}"
            c.execute("SELECT COUNT(*) FROM users WHERE username=?", (parent_username,))
            if c.fetchone()[0] == 0:
                c.execute("INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)",
                          (parent_username, generate_password_hash('parent123'), 'parent', student_id))
                
                # Update student record to link parent
                c.execute("UPDATE students SET parent_username=? WHERE student_id=?", 
                         (parent_username, student_id))
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    print(f"Form data received: {dict(request.form)}")
    username = request.form['username']
    password = request.form['password']
    role = request.form['role']
    print(f"Username: {username}, Password: {password}, Role: {role}")
    
    # Temporary test: allow any login with hardcoded credentials
    if username == 'test' and password == 'test' and role == 'admin_hod':
        session['username'] = username
        session['role'] = role
        print("Test login successful")
        return redirect(url_for('hod_dashboard'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=? AND role=?", (username, role))
    user = c.fetchone()
    
    if user and check_password_hash(user[2], password):
        # Store login info in a global variable for this simple test
        global current_user
        current_user = {'username': username, 'role': role}
        print(f"Login successful: {username} with role {role}")
        print(f"Current user set: {current_user}")
        
        if role == 'admin_hod':
            return redirect(url_for('hod_dashboard'))
        elif role == 'admin_teacher':
            return redirect(url_for('teacher_dashboard'))
        elif role == 'student':
            return redirect(url_for('student_dashboard'))
        elif role == 'parent':
            return redirect(url_for('parent_dashboard'))
        elif role == 'teacher':
            return redirect(url_for('teacher_dashboard'))
    else:
        # Debug: Print what went wrong
        if not user:
            print("User not found in database")
        elif not check_password_hash(user[2], password):
            print("Password doesn't match")
        conn.close()
        return render_template('login.html', error='Invalid credentials or role mismatch')

@app.route('/logout')
def logout():
    global current_user
    current_user = None
    session.clear()  # Clear session as well
    return redirect(url_for('index'))

# Routes for the new features
@app.route('/hod/fee_management')
def manage_fees():
