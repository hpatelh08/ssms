"""
Fast parallel password hasher using multiprocessing.
"""
import sqlite3
import csv
import os
from werkzeug.security import generate_password_hash
from multiprocessing import Pool
import sys

DB_PATH = 'school.db'
CSV_PATH = 'ALL_CREDENTIALS.csv'

def hash_password(item):
    """Hash a single password - runs in parallel."""
    username, role, password, description = item
    return (username, role, generate_password_hash(password), description)

def main():
    # Read CSV
    accounts = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            accounts.append((
                row['username'],
                row['role'],
                row['password'],
                row['description']
            ))

    print(f"Loaded {len(accounts)} accounts from CSV")
    print("Hashing passwords in parallel (8 workers)...")
    
    # Hash passwords in parallel
    with Pool(8) as pool:
        hashed = pool.map(hash_password, accounts)
    
    print(f"Hashed {len(hashed)} passwords")
    
    # Load into database
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Create tables if missing
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL,
                    class_assigned TEXT,
                    student_id TEXT
                )''')
    conn.commit()
    
    # Clear existing users
    c.execute('DELETE FROM users')
    
    # Add admin accounts
    c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
              ('admin_hod', generate_password_hash('admin123'), 'admin_hod'))
    c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
              ('admin_teacher', generate_password_hash('admin123'), 'admin_teacher'))
    
    # Batch insert all accounts
    for username, role, password_hash, description in hashed:
        if role == 'teacher':
            c.execute("INSERT INTO users (username, password, role, class_assigned) VALUES (?, ?, ?, ?)",
                      (username, password_hash, role, description))
        else:
            c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                      (username, password_hash, role))
    
    conn.commit()
    conn.close()
    
    print(f"\nSuccess! All {len(hashed) + 2} accounts loaded to database.")
    print("You can now login with any account from the CSV.")

if __name__ == '__main__':
    main()
