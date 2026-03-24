import sqlite3

conn = sqlite3.connect('school.db')
c = conn.cursor()

print('=== DATABASE CONTENTS ===')

print('\nTeachers:')
c.execute('SELECT username, class_assigned FROM users WHERE role="teacher"')
teachers = c.fetchall()
for t in teachers:
    print(f'  {t[0]} - {t[1]}')

print('\nStudents sample:')
c.execute('SELECT student_id, class FROM students LIMIT 10')
students = c.fetchall()
for s in students:
    print(f'  {s[0]} - {s[1]}')

print('\nClass 1A students:')
c.execute('SELECT student_id, name FROM students WHERE class="Class 1" AND student_id LIKE "1A%"')
class1a_students = c.fetchall()
print(f'Found {len(class1a_students)} Class 1A students')
for s in class1a_students[:5]:
    print(f'  {s[0]} - {s[1]}')

conn.close()