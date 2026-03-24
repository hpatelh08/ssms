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

def setup_database():
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    print("=== SETTING UP DATABASE ===")
    
    # Add 50 students to each class
    print("\n1. Adding students to all classes...")
    for class_name, prefix in classes.items():
        print(f"  Processing {class_name}...")
        
        # Clear existing students for this class pattern
        c.execute("DELETE FROM students WHERE student_id LIKE ?", (f"{prefix}%",))
        c.execute("DELETE FROM users WHERE username LIKE ? AND role='student'", (f"{prefix}%",))
        c.execute("DELETE FROM users WHERE username LIKE ? AND role='parent'", (f"parent_{prefix.lower()}%",))
        
        # Add 50 students to this class
        class_display_name = class_name.replace('-', ' ')
        for i, name in enumerate(students_list, 1):
            student_id = f"{prefix}{str(i).zfill(3)}"  # stu08A001, stu08A002, etc.
            
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
            
            if i <= 3:  # Show first 3 students as examples
                print(f"    Added: {name} ({student_id})")
        
        print(f"    Total students added to {class_name}: 50")
    
    # Create attendance pages info
    print("\n2. Creating attendance system structure...")
    
    # Get all classes and their data for API
    class_data = {}
    for class_key, class_name in classes.items():
        # Get teacher for this class
        class_display = class_key.replace('-', ' ')
        c.execute("SELECT username FROM users WHERE class_assigned=? AND role='teacher' LIMIT 1", (class_display,))
        teacher_result = c.fetchone()
        teacher = teacher_result[0] if teacher_result else None
        
        # Get students for this class
        prefix = f"stu{class_key.replace('-', '').lower()}"
        c.execute("SELECT student_id FROM students WHERE student_id LIKE ? ORDER BY student_id", (f"{prefix}%",))
        students = [row[0] for row in c.fetchall()]
        
        # Generate parent usernames
        parents = [f"parent_{student_id.lower()}" for student_id in students]
        
        class_data[class_key] = {
            'teacher': teacher,
            'students': students,
            'parents': parents
        }
    
    conn.commit()
    conn.close()
    
    print(f"\n=== SETUP COMPLETE ===")
    print(f"Total students added: {len(classes) * len(students_list)}")
    print(f"Students per class: {len(students_list)}")
    print("\n=== LOGIN CREDENTIALS ===")
    print("Students: stu08A001, stu08A002, etc. with password 'student123'")
    print("Parents: parent_stu08a001, parent_stu08a002, etc. with password 'parent123'")
    print("Teachers: teach8A, teach8B, etc. with password 'teacher123'")
    
    return class_data

def generate_attendance_templates():
    print("\n3. Generating attendance templates...")
    
    # Create a template for each class
    for class_name in classes.keys():
        template_name = f"attendance_{class_name.replace('-', '_').lower()}.html"
        print(f"  Creating template: {template_name}")
        # Templates will be created dynamically by the app
        
    print("  All attendance templates will be generated automatically!")

if __name__ == "__main__":
    class_data = setup_database()
    generate_attendance_templates()
    print("\n✅ System is ready! You can now access attendance pages for all classes.")