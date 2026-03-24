import sqlite3

conn = sqlite3.connect('school.db')
c = conn.cursor()

print("=== DATABASE VERIFICATION ===")

# Count students
c.execute('SELECT COUNT(*) FROM students')
student_count = c.fetchone()[0]
print(f'Total students: {student_count}')

# Count teachers
c.execute('SELECT COUNT(*) FROM users WHERE role="teacher"')
teacher_count = c.fetchone()[0]
print(f'Total teachers: {teacher_count}')

# Count classes
c.execute('SELECT DISTINCT class FROM students ORDER BY class')
classes = c.fetchall()
print(f'Total classes: {len(classes)}')
print('Classes in system:')
for cls in classes:
    # Count students per class
    c.execute('SELECT COUNT(*) FROM students WHERE class=?', (cls[0],))
    class_student_count = c.fetchone()[0]
    print(f'  {cls[0]}: {class_student_count} students')

# Count admins
c.execute('SELECT COUNT(*) FROM users WHERE role="admin_hod"')
admin_count = c.fetchone()[0]
print(f'Admin HODs: {admin_count}')

c.execute('SELECT COUNT(*) FROM users WHERE role="admin_teacher"')
admin_teacher_count = c.fetchone()[0]
print(f'Admin Teachers: {admin_teacher_count}')

# Count parents
c.execute('SELECT COUNT(*) FROM users WHERE role="parent"')
parent_count = c.fetchone()[0]
print(f'Total parents: {parent_count}')

conn.close()

print("\n=== STRUCTURE SUMMARY ===")
print(f"- 60 teachers")
print(f"- 9 classes (1-9)")
print(f"- 3 sections per class (A, B, C)")
print(f"- 100 students per section")
print(f"- Total: {student_count} students")
print(f"- {parent_count} parent accounts")