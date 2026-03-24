import sqlite3

# Connect to database
conn = sqlite3.connect('school.db')
c = conn.cursor()

print("=== TEACHER ASSIGNMENTS ===")
c.execute("SELECT username, class_assigned FROM users WHERE role='teacher'")
teachers = c.fetchall()
for teacher in teachers:
    print(f"{teacher[0]}: {teacher[1]}")

print("\n=== STUDENT CLASSES ===")
c.execute("SELECT DISTINCT class FROM students")
classes = c.fetchall()
for cls in classes:
    c.execute("SELECT COUNT(*) FROM students WHERE class=?", (cls[0],))
    count = c.fetchone()[0]
    print(f"{cls[0]}: {count} students")

print("\n=== STUDENT PREFIXES ===")
prefixes = ['stu08a', 'stu08b', 'stu08c', 'stu09a', 'stu09b', 'stu09c', 'stu10a', 'stu10b', 'stu10c']
for prefix in prefixes:
    c.execute("SELECT COUNT(*) FROM students WHERE student_id LIKE ?", (f"{prefix}%",))
    count = c.fetchone()[0]
    print(f"{prefix}: {count} students")

conn.close()