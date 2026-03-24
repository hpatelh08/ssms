from flask import Flask
import sqlite3
from werkzeug.security import generate_password_hash

# Create a minimal Flask app just to initialize the database
app = Flask(__name__)

# Database initialization function (copied from app.py)
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

# Sample data creation function (copied from app.py with modifications)
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

    # Create sample teachers for each class and section
    teachers = []
    # Define classes from 1 to 9
    classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9']
    sections = ['A', 'B', 'C']
    
    # Create 60 teachers (approximately 6-7 per class, 2-3 per section)
    teacher_counter = 1
    for cls in classes:
        for section in sections:
            # Assign 2 teachers per section (this gives us 54 teachers total)
            for i in range(2):
                teachers.append((f'teacher_{cls.lower().replace(" ", "")}_{section.lower()}_{i+1}', 'teacher123', 'teacher', f'{cls}{section}'))
    
    # Add extra teachers to reach 60 total (6 more teachers)
    for i in range(54, 60):
        teachers.append((f'teacher_extra_{i+1}', 'teacher123', 'teacher', 'Class 1A'))

    for username, password, role, class_assigned in teachers:
        c.execute("SELECT COUNT(*) FROM users WHERE username=?", (username,))
        if c.fetchone()[0] == 0:
            c.execute("INSERT INTO users (username, password, role, class_assigned) VALUES (?, ?, ?, ?)",
                      (username, generate_password_hash(password), role, class_assigned))

    # Create sample students and parents for each class
    for cls in classes:
        for section in sections:
            for i in range(1, 101):  # 100 students per section
                # Generate student ID: ClassNumber + Section + StudentNumber (e.g., 1A001, 1B001, etc.)
                student_id = f"{cls.split()[1]}{section}{str(i).zfill(3)}"
                student_name = f"Student {cls} Section {section} {i}"
                
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

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Creating sample data...")
    create_sample_data()
    print("Database initialized with 9 classes (1-9), 3 sections each (A,B,C), 100 students per section, and 60 teachers.")