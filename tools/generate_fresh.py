import sqlite3
import csv
import os
from werkzeug.security import generate_password_hash
import time

BASE = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE, '..', 'school.db')
OUT_CSV = os.path.join(BASE, '..', 'generated_accounts_final.csv')

# Remove old DB
try:
    os.remove(DB_PATH)
    print("Old DB removed")
except:
    pass

time.sleep(1)

# Create fresh connection
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Create all tables
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

conn.commit()

all_accounts = []
grades = [8, 9, 10]
sections = ['A', 'B', 'C']

for grade in grades:
    for section in sections:
        # Class teacher
        teacher_username = f'teach{grade}{section}'
        teacher_password = f'teach{grade}{section}123'
        
        c.execute("INSERT INTO users (username, password, role, class_assigned) VALUES (?, ?, ?, ?)",
                  (teacher_username, generate_password_hash(teacher_password), 'teacher', f'Class {grade}-{section}'))
        
        all_accounts.append((teacher_username, 'teacher', teacher_password))
        
        # Students
        for i in range(1, 51):
            old_id = f"{grade}{section}{i:03d}"
            new_username = f"stu{grade:02d}{section}{i:03d}"
            student_password = f"stu{i:03d}"
            
            # Insert student record
            c.execute('INSERT OR IGNORE INTO students (student_id, name, class) VALUES (?, ?, ?)',
                      (old_id, f"Student {grade}-{section} {i}", f'Class {grade}'))
            
            # Insert student user
            c.execute("INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)",
                      (new_username, generate_password_hash(student_password), 'student', old_id))
            
            all_accounts.append((new_username, 'student', student_password))
            
            # Parent
            parent_username = f"parent_{new_username}"
            parent_password = f"parent{i:03d}"
            
            c.execute("INSERT INTO users (username, password, role, student_id) VALUES (?, ?, ?, ?)",
                      (parent_username, generate_password_hash(parent_password), 'parent', old_id))
            
            all_accounts.append((parent_username, 'parent', parent_password))

conn.commit()
conn.close()

# Write CSV
with open(OUT_CSV, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['username', 'role', 'password'])
    for e in all_accounts:
        w.writerow(e)

print(f"✓ Total accounts: {len(all_accounts)}")
print(f"✓ CSV: {OUT_CSV}")
