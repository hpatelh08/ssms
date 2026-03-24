import sqlite3
from werkzeug.security import generate_password_hash

def init_db():
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Drop existing tables to start fresh
    tables = ['users', 'students', 'attendance', 'homework', 'exams', 'marks', 'behavior', 'assignments']
    for table in tables:
        try:
            c.execute(f'DROP TABLE IF EXISTS {table}')
        except:
            pass
    
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

def create_admin_accounts():
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Create admin accounts if they don't exist
    c.execute("SELECT COUNT(*) FROM users WHERE username='admin_hod'")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                  ('admin_hod', generate_password_hash('admin123'), 'admin_hod'))
    
    c.execute("SELECT COUNT(*) FROM users WHERE username='admin_teacher'")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                  ('admin_teacher', generate_password_hash('admin123'), 'admin_teacher'))
    
    conn.commit()
    conn.close()

def create_teachers():
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    # Create 60 teachers for 9 classes with 3 sections each
    teachers = []
    classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9']
    sections = ['A', 'B', 'C']
    
    # Create 2 teachers per section (54 total) + 6 extra teachers = 60
    teacher_idx = 1
    for cls in classes:
        for section in sections:
            for i in range(2):  # 2 teachers per section
                username = f'teacher_{cls.lower().replace(" ", "_")[1:]}_{section.lower()}_{i+1}'
                teachers.append((username, 'teacher123', 'teacher', f'{cls}{section}'))
                teacher_idx += 1
    
    # Add 6 more teachers
    for i in range(54, 60):
        username = f'teacher_extra_{i+1}'
        teachers.append((username, 'teacher123', 'teacher', 'Class 1A'))
    
    # Insert teachers
    for username, password, role, class_assigned in teachers:
        c.execute("SELECT COUNT(*) FROM users WHERE username=?", (username,))
        if c.fetchone()[0] == 0:
            c.execute("INSERT INTO users (username, password, role, class_assigned) VALUES (?, ?, ?, ?)",
                      (username, generate_password_hash(password), role, class_assigned))
    
    conn.commit()
    conn.close()
    print(f"Created {len(teachers)} teachers")

def create_students_and_parents():
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9']
    sections = ['A', 'B', 'C']
    
    total_students = 0
    for cls in classes:
        for section in sections:
            for i in range(1, 101):  # 100 students per section
                student_id = f"{cls.split()[1]}{section}{str(i).zfill(3)}"
                student_name = f"Student {cls} Section {section} {i}"
                
                # Insert student
                c.execute("INSERT OR IGNORE INTO students (student_id, name, class) VALUES (?, ?, ?)",
                          (student_id, student_name, cls))
                
                # Create student login account
                c.execute("INSERT OR IGNORE INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)",
                          (student_id, generate_password_hash('student123'), 'student', student_id))
                
                # Create parent account
                parent_username = f"parent_{student_id.lower()}"
                c.execute("INSERT OR IGNORE INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)",
                          (parent_username, generate_password_hash('parent123'), 'parent', student_id))
                
                # Update student record to link parent
                c.execute("UPDATE students SET parent_username=? WHERE student_id=?", 
                         (parent_username, student_id))
                
                total_students += 1
                
                # Print progress every 500 students
                if total_students % 500 == 0:
                    print(f"Created {total_students} students so far...")
    
    conn.commit()
    conn.close()
    print(f"Created {total_students} students and parents")

if __name__ == "__main__":
    print("Initializing database structure...")
    init_db()
    
    print("Creating admin accounts...")
    create_admin_accounts()
    
    print("Creating teachers...")
    create_teachers()
    
    print("Creating students and parents...")
    create_students_and_parents()
    
    print("Database initialization complete!")
    print("Final structure:")
    print("- 60 teachers")
    print("- 9 classes (1-9)")
    print("- 3 sections per class (A, B, C)")
    print("- 100 students per section")
    print("- Total: 2,700 students (9 classes × 3 sections × 100 students)")
    print("- 2,700 parent accounts")