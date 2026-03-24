import sqlite3
import csv
import os
from werkzeug.security import generate_password_hash

BASE = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE, '..', 'school.db')
OUT_CSV = os.path.join(BASE, '..', 'generated_accounts_final.csv')

conn = sqlite3.connect(DB_PATH, timeout=30)
c = conn.cursor()

# Create users table if missing
c.execute('''CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                class_assigned TEXT,
                student_id TEXT
            )''')

c.execute('''CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                class TEXT NOT NULL,
                parent_username TEXT
            )''')

# Map existing student_id (e.g., 8A001, 9B050) to new username format (e.g., stu08A001)
# and update users table

grades = [8, 9, 10]
sections = ['A', 'B', 'C']

all_accounts = []

for grade in grades:
    for section in sections:
        # Class teacher username and password
        teacher_username = f'teach{grade}{section}'
        teacher_password = f'teach{grade}{section}123'
        
        # Check if teacher exists in DB; if not, insert
        c.execute('SELECT COUNT(*) FROM users WHERE username=?', (teacher_username,))
        if c.fetchone()[0] == 0:
            c.execute("INSERT INTO users (username, password, role, class_assigned) VALUES (?, ?, ?, ?)",
                      (teacher_username, generate_password_hash(teacher_password), 'teacher', f'Class {grade}-{section}'))
        
        all_accounts.append((teacher_username, 'teacher', teacher_password))
        
        # Students
        for i in range(1, 51):
            # old student ID: {grade}{section}{i:03d} (e.g., 8A001)
            # new student username: stu{grade:02d}{section}{i:03d} (e.g., stu08A001)
            old_id = f"{grade}{section}{i:03d}"
            new_username = f"stu{grade:02d}{section}{i:03d}"
            student_password = f"stu{i:03d}"
            
            # Update user if exists, or insert new
            c.execute('SELECT COUNT(*) FROM users WHERE username=?', (old_id,))
            exists = c.fetchone()[0] > 0
            
            if exists:
                # Update to new username
                c.execute('UPDATE users SET username=?, password=? WHERE username=?',
                          (new_username, generate_password_hash(student_password), old_id))
            else:
                # Insert new
                c.execute('INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)',
                          (new_username, generate_password_hash(student_password), 'student', old_id))
            
            all_accounts.append((new_username, 'student', student_password))
            
            # Parent: username parent_{student_username}, password parent{i:03d}
            parent_username = f"parent_{new_username}"
            parent_password = f"parent{i:03d}"
            
            c.execute('SELECT COUNT(*) FROM users WHERE username=? AND role=?', (parent_username, 'parent'))
            parent_exists = c.fetchone()[0] > 0
            
            if not parent_exists:
                c.execute('INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)',
                          (parent_username, generate_password_hash(parent_password), 'parent', old_id))
            
            all_accounts.append((parent_username, 'parent', parent_password))

conn.commit()
conn.close()

# Remove duplicates (keep first occurrence)
seen = set()
final = []
for acc in all_accounts:
    key = (acc[0], acc[1])  # username + role
    if key not in seen:
        final.append(acc)
        seen.add(key)

# Write CSV
with open(OUT_CSV, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['username', 'role', 'password'])
    for e in final:
        w.writerow(e)

print(f"Total accounts: {len(final)}. CSV: {OUT_CSV}")
