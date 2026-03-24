import sqlite3
from werkzeug.security import generate_password_hash

# List of 50 students to add to each class
students_list = [
    "Aarav", "Ananya", "Vihaan", "Saanvi", "Reyansh", "Myra", "Advik", "Kiara", "Ishaan", "Avni",
    "Ayaan", "Navya", "Atharv", "Diya", "Kabir", "Riya", "Shaurya", "Ishani", "Aditya", "Neha",
    "Arjun", "Pooja", "Rahul", "Priya", "Rohan", "Sneha", "Abhishek", "Shreya", "Karan", "Kavya",
    "Aryan", "Aditi", "Yash", "Meera", "Akash", "Simran", "Rohit", "Tanvi", "Dhruv", "Aarohi",
    "Vedant", "Vedika", "Pranav", "Anika", "Devansh", "Siya", "Manav", "Jiya", "Tejas", "Prisha"
]

# Class mappings
classes = {
    '8-A': 'stu08A',
    '8-B': 'stu08B', 
    '8-C': 'stu08C',
    '9-A': 'stu09A',
    '9-B': 'stu09B',
    '9-C': 'stu09C',
    '10-A': 'stu10A',
    '10-B': 'stu10B',
    '10-C': 'stu10C'
}

conn = sqlite3.connect('school.db')
c = conn.cursor()

print("Adding 50 students to all classes...")

# Process each class
for class_name, prefix in classes.items():
    print(f"\nProcessing {class_name}...")
    
    # Clear existing students for this class pattern
    c.execute("DELETE FROM students WHERE student_id LIKE ?", (f"{prefix}%",))
    c.execute("DELETE FROM users WHERE username LIKE ? AND role='student'", (f"{prefix}%",))
    c.execute("DELETE FROM users WHERE username LIKE ? AND role='parent'", (f"parent_{prefix.lower()}%",))
    
    # Add 50 students to this class
    for i, name in enumerate(students_list, 1):
        student_id = f"{prefix}{str(i).zfill(3)}"  # stu08A001, stu08A002, etc.
        roll_number = i
        class_display_name = class_name.replace('-', ' ')
        
        # Insert student
        c.execute("INSERT INTO students (student_id, name, class) VALUES (?, ?, ?)",
                  (student_id, name, class_display_name))
        
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
        
        if i <= 5:  # Show first 5 students as examples
            print(f"  Added: {roll_number}. {name} ({student_id})")
    
    print(f"  Total students added to {class_name}: 50")

conn.commit()
conn.close()

print(f"\nSuccessfully added 50 students to each of {len(classes)} classes!")
print(f"Total students added: {len(classes) * len(students_list)}")
print("\nLogin credentials:")
print("- Students: stu08A001, stu08A002, etc. with password 'student123'")
print("- Parents: parent_stu08a001, parent_stu08a002, etc. with password 'parent123'")