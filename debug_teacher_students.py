import sqlite3

def test_teacher_student_mapping():
    conn = sqlite3.connect('school.db')
    c = conn.cursor()
    
    print("=== Testing Teacher-Student Mapping ===")
    
    # Test for teach8A specifically
    teacher_username = 'teach8A'
    
    # Get teacher's assigned class
    c.execute("SELECT class_assigned FROM users WHERE username=? AND role='teacher'", (teacher_username,))
    result = c.fetchone()
    if result:
        assigned_class = result[0]
        print(f"Teacher {teacher_username} is assigned to: {assigned_class}")
        
        # Test our new query logic
        clean_class = assigned_class.replace('Class ', '')
        class_prefix = clean_class.replace('-', '').lower()
        student_prefix = f"stu{class_prefix}"
        
        print(f"Clean class: {clean_class}")
        print(f"Class prefix: {class_prefix}")
        print(f"Student prefix: {student_prefix}")
        
        # Test the actual query
        c.execute("SELECT student_id, name FROM students WHERE student_id LIKE ? OR class=? ORDER BY student_id", 
                  (f"{student_prefix}%", clean_class))
        students = c.fetchall()
        
        print(f"Found {len(students)} students")
        if students:
            print("First 5 students:")
            for i, (student_id, name) in enumerate(students[:5], 1):
                print(f"  {i}. {student_id} - {name}")
        else:
            print("No students found!")
            
            # Let's debug by checking what students exist
            print("\n=== DEBUGGING: Checking student data ===")
            c.execute("SELECT student_id, name, class FROM students WHERE student_id LIKE ? ORDER BY student_id LIMIT 10", 
                      (f"{student_prefix}%",))
            debug_students = c.fetchall()
            print(f"Students with prefix {student_prefix}: {len(debug_students)}")
            for student in debug_students:
                print(f"  {student[0]} - {student[1]} - {student[2]}")
                
            # Check what class names exist in student table
            print(f"\nChecking class values:")
            c.execute("SELECT DISTINCT class FROM students WHERE student_id LIKE ?", (f"{student_prefix}%",))
            classes = c.fetchall()
            for cls in classes:
                print(f"  Class: {cls[0]}")
    else:
        print(f"Teacher {teacher_username} not found or not a teacher")
    
    conn.close()

if __name__ == "__main__":
    test_teacher_student_mapping()