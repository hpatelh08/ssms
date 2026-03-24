from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

# Global variable to store current user (for testing)
current_user = None

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    role = request.form['role']
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=? AND role=?", (username, role))
    user = c.fetchone()
    
    if user and check_password_hash(user[2], password):
        global current_user
        current_user = {'username': username, 'role': role}
        
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
        conn.close()
        return render_template('login.html', error='Invalid credentials or role mismatch')

@app.route('/logout')
def logout():
    global current_user
    current_user = None
    session.clear()
    return redirect(url_for('index'))

# HOD Dashboard
@app.route('/hod_dashboard')
def hod_dashboard():
    global current_user
    if not current_user or current_user['role'] != 'admin_hod':
        return redirect(url_for('index'))
    return render_template('hod_dashboard.html')

# Teacher Dashboard
@app.route('/teacher_dashboard')
def teacher_dashboard():
    global current_user
    if not current_user or (current_user['role'] != 'teacher' and current_user['role'] != 'admin_teacher'):
        return redirect(url_for('index'))
    
    # Get teacher's assigned class
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    c.execute("SELECT class_assigned FROM users WHERE username=? AND (role='teacher' OR role='admin_teacher')", 
              (current_user['username'],))
    result = c.fetchone()
    assigned_class = result[0] if result else 'Class 8-A'
    
    # Get students for the assigned class
    # Handle both "Class 8-A" and "8-A" formats
    clean_class = assigned_class.replace('Class ', '')
    class_prefix = clean_class.replace('-', '').lower()
    student_prefix = f"stu{class_prefix}"
    
    # Also try to match by class name directly
    c.execute("SELECT student_id, name FROM students WHERE student_id LIKE ? OR class=? ORDER BY student_id", 
              (f"{student_prefix}%", clean_class))
    students = c.fetchall()
    
    # Format students with roll numbers
    student_list = []
    for i, (student_id, name) in enumerate(students, 1):
        student_list.append({
            'roll_number': i,
            'student_id': student_id,
            'name': name
        })
    
    conn.close()
    
    return render_template('teacher_dashboard.html', 
                         assigned_class=assigned_class,
                         students=student_list,
                         teacher_name=current_user['username'])

# Student Dashboard
@app.route('/student_dashboard')
def student_dashboard():
    global current_user
    if not current_user or current_user['role'] != 'student':
        return redirect(url_for('index'))
    return render_template('student_dashboard.html')

# Parent Dashboard
@app.route('/parent_dashboard')
def parent_dashboard():
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return redirect(url_for('index'))
    return render_template('parent_dashboard.html')

# Dynamic attendance page for any class
@app.route('/attendance/<class_name>')
def attendance_class(class_name):
    global current_user
    if not current_user or (current_user['role'] != 'teacher' and current_user['role'] != 'admin_teacher'):
        return redirect(url_for('index'))
    
    # Validate class name format
    valid_classes = ['8-A', '8-B', '8-C', '9-A', '9-B', '9-C', '10-A', '10-B', '10-C']
    if class_name not in valid_classes:
        return "Invalid class", 404
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get students for this class
    class_prefix = f"stu{class_name.replace('-', '').lower()}"  # stu08a, stu08b, etc.
    c.execute("SELECT student_id, name FROM students WHERE student_id LIKE ? ORDER BY student_id", (f"{class_prefix}%",))
    students_data = c.fetchall()
    
    # Format students with roll numbers
    students = []
    for i, (student_id, name) in enumerate(students_data, 1):
        students.append({
            'roll_number': i,
            'student_id': student_id,
            'name': name
        })
    
    conn.close()
    
    # Class display name
    class_display = class_name.replace('-', ' ')
    
    return render_template('attendance_page.html', 
                         students=students, 
                         class_name=class_display,
                         class_code=class_name,
                         today_date=datetime.now().strftime('%Y-%m-%d'))

# API endpoint for class data
@app.route('/api/class-data')
def api_class_data():
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get all classes and their data
    class_data = {}
    
    # Define the class mappings
    classes = {
        '8-A': 'Class 8-A',
        '8-B': 'Class 8-B', 
        '8-C': 'Class 8-C',
        '9-A': 'Class 9-A',
        '9-B': 'Class 9-B',
        '9-C': 'Class 9-C',
        '10-A': 'Class 10-A',
        '10-B': 'Class 10-B',
        '10-C': 'Class 10-C'
    }
    
    for class_key, class_name in classes.items():
        # Get teacher for this class
        c.execute("SELECT username FROM users WHERE class_assigned=? AND role='teacher' LIMIT 1", (class_name,))
        teacher_result = c.fetchone()
        teacher = teacher_result[0] if teacher_result else None
        
        # Get sample students for this class (limit to 5 for demo)
        if class_key == '8-A':
            student_pattern = 'stu08A%'
        elif class_key == '8-B':
            student_pattern = 'stu08B%'
        elif class_key == '8-C':
            student_pattern = 'stu08C%'
        elif class_key == '9-A':
            student_pattern = 'stu09A%'
        elif class_key == '9-B':
            student_pattern = 'stu09B%'
        elif class_key == '9-C':
            student_pattern = 'stu09C%'
        elif class_key == '10-A':
            student_pattern = 'stu10A%'
        elif class_key == '10-B':
            student_pattern = 'stu10B%'
        elif class_key == '10-C':
            student_pattern = 'stu10C%'
        else:
            student_pattern = f"{class_key}%"
        
        c.execute("SELECT student_id FROM students WHERE student_id LIKE ? ORDER BY student_id LIMIT 5", (student_pattern,))
        students = [row[0] for row in c.fetchall()]
        
        # Generate parent usernames
        parents = [f"parent_{student_id.lower()}" for student_id in students]
        
        class_data[class_key] = {
            'teacher': teacher,
            'students': students,
            'parents': parents
        }
    
    conn.close()
    return class_data

# API endpoint for Class 1A specific data (for attendance)
@app.route('/api/class-1a-data')
def api_class_1a_data():
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Get Class 1A students
    c.execute("SELECT student_id, name FROM students WHERE class='Class 1' AND student_id LIKE '1A%' ORDER BY student_id")
    students_data = c.fetchall()
    
    # Format students with roll numbers
    students = []
    for i, (student_id, name) in enumerate(students_data, 1):
        students.append({
            'roll_number': i,
            'student_id': student_id,
            'name': name
        })
    
    conn.close()
    return {'students': students}

# Submit Attendance for any class
@app.route('/submit_attendance/<class_name>', methods=['POST'])
def submit_attendance(class_name):
    global current_user
    if not current_user or (current_user['role'] != 'teacher' and current_user['role'] != 'admin_teacher'):
        return redirect(url_for('index'))
    
    # Validate class name
    valid_classes = ['8-A', '8-B', '8-C', '9-A', '9-B', '9-C', '10-A', '10-B', '10-C']
    if class_name not in valid_classes:
        return "Invalid class", 404
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Process each attendance record
    for key, value in request.form.items():
        if key.startswith('attendance_'):
            student_id = key.replace('attendance_', '')
            status = value
            
            # Check if attendance already exists for today
            c.execute("SELECT id FROM attendance WHERE student_id=? AND date=?", (student_id, today))
            existing = c.fetchone()
            
            if existing:
                # Update existing record
                c.execute("UPDATE attendance SET status=? WHERE student_id=? AND date=?", 
                         (status, student_id, today))
            else:
                # Insert new record
                c.execute("INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)",
                         (student_id, today, status))
    
    conn.commit()
    conn.close()
    
    flash('Attendance submitted successfully!', 'success')
    return redirect(url_for('attendance_class', class_name=class_name))

# Submit Attendance from Teacher Dashboard
@app.route('/submit_attendance_teacher', methods=['POST'])
def submit_attendance_teacher():
    global current_user
    if not current_user or (current_user['role'] != 'teacher' and current_user['role'] != 'admin_teacher'):
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Process each attendance record
    for key, value in request.form.items():
        if key.startswith('attendance_'):
            student_id = key.replace('attendance_', '')
            # Convert checkbox value to Present/Absent
            status = 'Present' if value == 'on' else 'Absent'
            
            # Check if attendance already exists for today
            c.execute("SELECT id FROM attendance WHERE student_id=? AND date=?", (student_id, today))
            existing = c.fetchone()
            
            if existing:
                # Update existing record
                c.execute("UPDATE attendance SET status=? WHERE student_id=? AND date=?", 
                         (status, student_id, today))
            else:
                # Insert new record
                c.execute("INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)",
                         (student_id, today, status))
    
    conn.commit()
    conn.close()
    
    flash('Attendance submitted successfully!', 'success')
    return redirect(url_for('teacher_dashboard'))

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)