import sqlite3
from werkzeug.security import generate_password_hash

def create_students_and_parents():
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9']
    sections = ['A', 'B', 'C']
    
    total_students = 0
    for cls in classes:
        for section in sections:
            print(f"Creating students for {cls}{section}...")
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
                
                # Commit every 100 students to prevent locking issues
                if total_students % 100 == 0:
                    conn.commit()
                    print(f"Created {total_students} students so far...")
    
    conn.commit()
    conn.close()
    print(f"Successfully created {total_students} students and parents!")

if __name__ == "__main__":
    print("Creating students and parents...")
    create_students_and_parents()
    print("Student creation complete!")