import sqlite3
import csv
import os
from werkzeug.security import generate_password_hash

BASE = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE, '..', 'school.db')
OUT_CSV = os.path.join(BASE, '..', 'generated_accounts_full.csv')

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Create parent accounts for every student if missing
c.execute('SELECT student_id FROM students')
students = [row[0] for row in c.fetchall()]
created = []
for sid in students:
    parent_username = f'parent_{sid.lower()}'
    parent_password = f'parent{sid}'
    c.execute('SELECT COUNT(*) FROM users WHERE username=?', (parent_username,))
    if c.fetchone()[0] == 0:
        c.execute('INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)',
                  (parent_username, generate_password_hash(parent_password), 'parent', sid))
        created.append((parent_username, 'parent', parent_password))

# Collect students and teachers and parents into CSV (reconstruct deterministic plaintext passwords)
rows = []
# Students
for sid in students:
    student_password = f'stud{sid}'
    rows.append((sid, 'student', student_password))
# Parents (freshly created or existing)
for sid in students:
    parent_username = f'parent_{sid.lower()}'
    parent_password = f'parent{sid}'
    rows.append((parent_username, 'parent', parent_password))

# Class teachers following naming pattern class_teacher_{grade}{section}
c.execute("SELECT username FROM users WHERE role='teacher'")
for (username,) in c.fetchall():
    if username.startswith('class_teacher_'):
        # username format: class_teacher_{grade}{section}
        tail = username.replace('class_teacher_', '')
        # e.g. 8A or 10B
        # build password teach{tail}123
        pwd = f'teach{tail}123'
        rows.append((username, 'teacher', pwd))

# Remove duplicates while preserving order
seen = set()
final_rows = []
for r in rows:
    if r[0] not in seen:
        final_rows.append(r)
        seen.add(r[0])

conn.commit()
conn.close()

# write CSV
with open(OUT_CSV, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['username', 'role', 'password'])
    for e in final_rows:
        w.writerow(e)

print(f"Parent accounts created: {len(created)}. CSV: {OUT_CSV}")
