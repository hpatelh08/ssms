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
    global current_user
    print(f"HOD Dashboard access attempt - Current user: {current_user}")
    if not current_user or current_user['role'] != 'admin_hod':
        print("HOD Dashboard access denied - redirecting to login")
        return redirect(url_for('index'))
    print("HOD Dashboard access granted")
    return render_template('hod_dashboard.html')

# Teacher Dashboard
@app.route('/teacher_dashboard')
def teacher_dashboard():
    global current_user
    if not current_user or (current_user['role'] != 'teacher' and current_user['role'] != 'admin_teacher'):
        return redirect(url_for('index'))
    return render_template('teacher_dashboard.html')

# Student Dashboard
@app.route('/student_dashboard')
def student_dashboard():
    global current_user
    print(f"Student Dashboard access attempt - Current user: {current_user}")
    if not current_user or current_user['role'] != 'student':
        print("Student Dashboard access denied - redirecting to login")
        print(f"Current user: {current_user}")
        return redirect(url_for('index'))
    print("Student Dashboard access granted")
    return render_template('student_dashboard.html')

# Parent Dashboard
@app.route('/parent_dashboard')
def parent_dashboard():
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return redirect(url_for('index'))
    
    # Get student info for the logged-in parent
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT student_id FROM users WHERE username=?", (current_user['username'],))
    student_id = c.fetchone()[0]
    
    # Get student details
    c.execute("SELECT * FROM students WHERE student_id=?", (student_id,))
    student = c.fetchone()
    
    # Get attendance
    c.execute("""SELECT status, COUNT(*) as count FROM attendance 
               WHERE student_id=? GROUP BY status""", (student_id,))
    attendance_stats = dict(c.fetchall())
    total_days = sum(attendance_stats.values()) if attendance_stats else 1
    present_count = attendance_stats.get('present', 0)
    attendance_rate = round((present_count / total_days) * 100, 2) if total_days > 0 else 0
    
    conn.close()
    
    return render_template('parent_dashboard.html', 
                           student=student, 
                           attendance_rate=attendance_rate,
                           total_days=total_days,
                           present_count=present_count)

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
    if 'username' not in session or session['role'] != 'parent':
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT student_id FROM users WHERE username=?", (session['username'],))
    student_id = c.fetchone()[0]
    
    # Get attendance for the student
    c.execute("SELECT * FROM attendance WHERE student_id=? ORDER BY date DESC LIMIT 10", (student_id,))
    attendance_records = c.fetchall()
    
    # Get attendance stats
    c.execute("""SELECT status, COUNT(*) as count FROM attendance 
               WHERE student_id=? GROUP BY status""", (student_id,))
    attendance_stats = dict(c.fetchall())
    total_days = sum(attendance_stats.values()) if attendance_stats else 1
    present_count = attendance_stats.get('present', 0)
    attendance_rate = round((present_count / total_days) * 100, 2) if total_days > 0 else 0
    
    conn.close()
    
    return render_template('parent_attendance.html', 
                           attendance_records=attendance_records,
                           attendance_rate=attendance_rate,
                           total_days=total_days,
                           present_count=present_count)

@app.route('/parent_behavior')
def parent_behavior():
    global current_user
    if not current_user or current_user['role'] != 'parent':
        return redirect(url_for('index'))
    
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    c.execute("SELECT student_id FROM users WHERE username=?", (current_user['username'],))
    student_id = c.fetchone()[0]
    
    # Get behavior records
    c.execute("SELECT * FROM behavior WHERE student_id=? ORDER BY date DESC", (student_id,))
    behavior_records = c.fetchall()
    
    # Get behavior stats
    c.execute("""SELECT behavior_type, COUNT(*) as count FROM behavior 
               WHERE student_id=? GROUP BY behavior_type""", (student_id,))
    behavior_stats = dict(c.fetchall())
    
    conn.close()
    
    return render_template('parent_behavior.html', 
                           behavior_records=behavior_records,
                           behavior_stats=behavior_stats)

# AJAX endpoints for parent dashboard data
@app.route('/api/parent/attendance_data')
def parent_attendance_data():
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

# Initialize database when module is imported
init_db()
create_sample_data()

if __name__ == '__main__':
    app.run(debug=True)