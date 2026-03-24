import sqlite3
from werkzeug.security import generate_password_hash

# List of 50 students
students_list = [
    "Aarav", "Ananya", "Vihaan", "Saanvi", "Reyansh", "Myra", "Advik", "Kiara", "Ishaan", "Avni",
    "Ayaan", "Navya", "Atharv", "Diya", "Kabir", "Riya", "Shaurya", "Ishani", "Aditya", "Neha",
    "Arjun", "Pooja", "Rahul", "Priya", "Rohan", "Sneha", "Abhishek", "Shreya", "Karan", "Kavya",
    "Aryan", "Aditi", "Yash", "Meera", "Akash", "Simran", "Rohit", "Tanvi", "Dhruv", "Aarohi",
    "Vedant", "Vedika", "Pranav", "Anika", "Devansh", "Siya", "Manav", "Jiya", "Tejas", "Prisha"
]

# Class information
classes = {
    '8-A': ('stu08A', '8-A'),
    '8-B': ('stu08B', '8-B'),
    '8-C': ('stu08C', '8-C'),
    '9-A': ('stu09A', '9-A'),
    '9-B': ('stu09B', '9-B'),
    '9-C': ('stu09C', '9-C'),
    '10-A': ('stu10A', '10-A'),
    '10-B': ('stu10B', '10-B'),
    '10-C': ('stu10C', '10-C')
}

conn = sqlite3.connect('school.db')
c = conn.cursor()

print("Adding students to all classes...")

# Add students to each class
for class_code, (prefix, class_name) in classes.items():
    print(f"Processing {class_code}...")
    
    # Clear existing students for this class
    c.execute("DELETE FROM students WHERE student_id LIKE ?", (f"{prefix}%",))
    c.execute("DELETE FROM users WHERE username LIKE ? AND role='student'", (f"{prefix}%",))
    c.execute("DELETE FROM users WHERE username LIKE ? AND role='parent'", (f"parent_{prefix.lower()}%",))
    
    # Add 50 students
    for i, name in enumerate(students_list, 1):
        student_id = f"{prefix}{str(i).zfill(3)}"  # stu08A001, stu08A002, etc.
        
        # Insert student
        c.execute("INSERT INTO students (student_id, name, class) VALUES (?, ?, ?)",
                  (student_id, name, class_name))
        
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
        
        if i <= 3:
            print(f"  Added: {name} ({student_id})")
    
    print(f"  Added 50 students to {class_code}")

conn.commit()
conn.close()

print(f"\n✅ Successfully added students to all classes!")
print(f"Total students: {len(classes) * len(students_list)}")
print("\n=== Login Credentials ===")
print("Students: stu08A001, stu08A002, etc. (password: student123)")
print("Parents: parent_stu08a001, parent_stu08a002, etc. (password: parent123)")
print("Teachers: teach8A, teach8B, etc. (password: teacher123)")
print("\n=== Access Attendance Pages ===")
print("URL format: /attendance/8-A, /attendance/8-B, /attendance/9-A, etc.")