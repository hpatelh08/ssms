import sqlite3

conn = sqlite3.connect('school.db')
c = conn.cursor()

print('=== TEACHER CLASS ASSIGNMENTS ===')
c.execute('SELECT username, class_assigned FROM users WHERE role="teacher" ORDER BY username')
teachers = c.fetchall()
for teacher in teachers:
    print(f'{teacher[0]}: {teacher[1]}')

print('\n=== ACTUAL STUDENT CLASSES ===')
c.execute('SELECT DISTINCT class FROM students ORDER BY class')
classes = c.fetchall()
for cls in classes:
    print(f'Class: {cls[0]}')

print('\n=== STUDENT COUNT BY CLASS ===')
for cls in classes:
    c.execute('SELECT COUNT(*) FROM students WHERE class=?', (cls[0],))
    count = c.fetchone()[0]
    print(f'{cls[0]}: {count} students')

conn.close()