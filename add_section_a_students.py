import sqlite3
from werkzeug.security import generate_password_hash

# List of students for Class 1A
students_1a = [
    "Aarav", "Ananya", "Vihaan", "Saanvi", "Reyansh", "Myra", "Advik", "Kiara", "Ishaan", "Avni",
    "Ayaan", "Navya", "Atharv", "Diya", "Kabir", "Riya", "Shaurya", "Ishani", "Aditya", "Neha",
    "Arjun", "Pooja", "Rahul", "Priya", "Rohan", "Sneha", "Abhishek", "Shreya", "Karan", "Kavya",
    "Aryan", "Aditi", "Yash", "Meera", "Akash", "Simran", "Rohit", "Tanvi", "Dhruv", "Aarohi",
    "Vedant", "Vedika", "Pranav", "Anika", "Devansh", "Siya", "Manav", "Jiya", "Tejas", "Prisha"
]

conn = sqlite3.connect('school.db')
c = conn.cursor()

print("Adding Class 1A students...")

# Clear existing Class 1A students if any
c.execute("DELETE FROM students WHERE class='Class 1' AND student_id LIKE '1A%'")
c.execute("DELETE FROM users WHERE username LIKE '1A%' AND role='student'")
c.execute("DELETE FROM users WHERE username LIKE 'parent_1a%'")

# Add the 50 students
for i, name in enumerate(students_1a, 1):
    student_id = f"1A{str(i).zfill(3)}"  # 1A001, 1A002, etc.
    roll_number = i
    
    # Insert student
    c.execute("INSERT INTO students (student_id, name, class) VALUES (?, ?, ?)",
              (student_id, name, 'Class 1'))
    
    # Create student login account
    c.execute("INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)",
              (student_id, generate_password_hash('student123'), 'student', student_id))
    
    # Create parent account
    parent_username = f"parent_{student_id.lower()}"
    c.execute("INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)",
              (parent_username, generate_password_hash('parent123'), 'parent', student_id))
    
    # Update student record to link parent
    c.execute("UPDATE students SET parent_username=? WHERE student_id=?", 
             (parent_username, student_id))
    
    print(f"Added: {roll_number}. {name} ({student_id})")

conn.commit()
conn.close()

print(f"\nSuccessfully added {len(students_1a)} students to Class 1A!")
print("Students can login with their ID and password 'student123'")
print("Parents can login with 'parent_{student_id}' and password 'parent123'")