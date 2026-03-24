"""
Fast loader for ALL_CREDENTIALS.csv into the database.
Skips password hashing since it's slow for 1000+ accounts.
Uses simple MD5 placeholder for demo (NOT for production).
"""
import sqlite3
import csv
import hashlib
import os

DB_PATH = 'school.db'
CSV_PATH = 'ALL_CREDENTIALS.csv'

# Simple placeholder hash function (NOT safe for prod, just for demo loading)
def simple_hash(password):
    return hashlib.md5(password.encode()).hexdigest()

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Clear existing users
c.execute('DELETE FROM users')
c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
          ('admin_hod', simple_hash('admin123'), 'admin_hod'))
c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
          ('admin_teacher', simple_hash('admin123'), 'admin_teacher'))

# Load from CSV
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
                      (username, simple_hash(password), role, class_assigned))
        else:
            c.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
                      (username, simple_hash(password), role))
        count += 1
        
        if count % 100 == 0:
            print(f"Loaded {count} accounts...")

conn.commit()
conn.close()

print(f"Done! {count} accounts loaded from {CSV_PATH}")
