"""
Fixed loader for ALL_CREDENTIALS.csv with proper werkzeug password hashing.
"""
import sqlite3
import csv
import os
from werkzeug.security import generate_password_hash

DB_PATH = 'school.db'
CSV_PATH = 'ALL_CREDENTIALS.csv'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Clear existing users
c.execute('DELETE FROM users')

# Add admin accounts with werkzeug hashing
c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
          ('admin_hod', generate_password_hash('admin123'), 'admin_hod'))
c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
          ('admin_teacher', generate_password_hash('admin123'), 'admin_teacher'))

# Load from CSV with werkzeug hashing
with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    count = 0
    for row in reader:
        username = row['username']
        role = row['role']
        password = row['password']
        
        if role == 'teacher':
            class_assigned = row['description']
            c.execute("INSERT OR IGNORE INTO users (username, password, role, class_assigned) VALUES (?, ?, ?, ?)",
                      (username, generate_password_hash(password), role, class_assigned))
        else:
            c.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
                      (username, generate_password_hash(password), role))
        count += 1
        
        if count % 100 == 0:
            print(f"Loaded {count} accounts...")

conn.commit()
conn.close()

print(f"Done! {count} accounts loaded with werkzeug hashing.")
print("Passwords now properly secured and compatible with login form.")
