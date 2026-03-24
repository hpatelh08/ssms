import sqlite3

# Check what tables exist in the database
conn = sqlite3.connect('school.db')
c = conn.cursor()

print("Existing tables:")
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = c.fetchall()
for table in tables:
    print(f"  - {table[0]}")

print("\nChecking if users table exists:")
try:
    c.execute("SELECT COUNT(*) FROM users")
    count = c.fetchone()[0]
    print(f"Users table exists with {count} records")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")

conn.close()