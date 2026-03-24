import sqlite3

conn = sqlite3.connect('school.db')
c = conn.cursor()

print('=== AVAILABLE USERS ===')

print('\nAdmin Users:')
c.execute('SELECT username, role FROM users WHERE role IN ("admin_hod", "admin_teacher")')
admins = c.fetchall()
for user in admins:
    print(f'  {user[0]} - {user[1]}')

print('\nAll Teacher Users:')
c.execute('SELECT username, role, class_assigned FROM users WHERE role="teacher"')
teachers = c.fetchall()
for user in teachers:
    print(f'  {user[0]} - {user[1]} - {user[2]}')

print('\nSample Student IDs:')
c.execute('SELECT student_id, name FROM students WHERE student_id LIKE "1A%" LIMIT 5')
students = c.fetchall()
for student in students:
    print(f'  {student[0]} - {student[1]}')

print('\n=== LOGIN CREDENTIALS ===')
print('Admin HOD: admin_hod / admin123')
print('Admin Teacher: admin_teacher / admin123')
print('Teachers: teach8A, teach8B, teach8C, teach9A, teach9B, teach9C, teach10A, teach10B, teach10C / teacher123')
print('Students: 1A001, 1A002, etc. / student123')
print('Parents: parent_1a001, parent_1a002, etc. / parent123')

conn.close()