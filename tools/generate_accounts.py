import sqlite3
import csv
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'school.db')
OUT_CSV = os.path.join(os.path.dirname(__file__), '..', 'generated_accounts.csv')

entries = []
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

grades = [8, 9, 10]
sections = ['A', 'B', 'C']

for grade in grades:
    for section in sections:
        # class teacher
        teacher_username = f'class_teacher_{grade}{section}'
        teacher_password = f'teach{grade}{section}123'
        c.execute('SELECT COUNT(*) FROM users WHERE username=?', (teacher_username,))
        if c.fetchone()[0] == 0:
            c.execute("INSERT INTO users (username, password, role, class_assigned) VALUES (?, ?, ?, ?)",
                      (teacher_username, generate_password_hash(teacher_password), 'teacher', f'Class {grade}-{section}'))
            entries.append((teacher_username, 'teacher', teacher_password))

        # students
        for i in range(1, 51):
            student_id = f"{grade}{section}{i:03d}"
            student_name = f"Student {grade}-{section} {i}"
            student_password = f'stud{student_id}'

            # insert student record if missing
            c.execute('SELECT COUNT(*) FROM students WHERE student_id=?', (student_id,))
            if c.fetchone()[0] == 0:
                c.execute('INSERT INTO students (student_id, name, class) VALUES (?, ?, ?)',
                          (student_id, student_name, f'Class {grade}'))

            # insert user account if missing
            c.execute('SELECT COUNT(*) FROM users WHERE username=?', (student_id,))
            if c.fetchone()[0] == 0:
                c.execute('INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)',
                          (student_id, generate_password_hash(student_password), 'student', student_id))
                entries.append((student_id, 'student', student_password))

conn.commit()
conn.close()

# write CSV
with open(OUT_CSV, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['username', 'role', 'password'])
    for e in entries:
        w.writerow(e)

print(f"Created {len(entries)} accounts. CSV: {OUT_CSV}")
