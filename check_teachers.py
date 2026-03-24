import sqlite3

conn = sqlite3.connect('school.db')
c = conn.cursor()

print('Teachers and their assigned classes:')
c.execute('SELECT username, class_assigned FROM users WHERE role="teacher"')
results = c.fetchall()
for row in results:
    print(f'{row[0]}: {row[1]}')

print('\nSample students from each section:')
c.execute('SELECT student_id, name, class FROM students WHERE student_id LIKE "8A%" LIMIT 3')
section_8a = c.fetchall()
print('Class 8A samples:')
for student in section_8a:
    print(f'  {student[0]}: {student[1]}')

c.execute('SELECT student_id, name, class FROM students WHERE student_id LIKE "8B%" LIMIT 3')
section_8b = c.fetchall()
print('Class 8B samples:')
for student in section_8b:
    print(f'  {student[0]}: {student[1]}')

c.execute('SELECT student_id, name, class FROM students WHERE student_id LIKE "8C%" LIMIT 3')
section_8c = c.fetchall()
print('Class 8C samples:')
for student in section_8c:
    print(f'  {student[0]}: {student[1]}')

conn.close()