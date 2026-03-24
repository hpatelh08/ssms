import sqlite3

# Check current student distribution
conn = sqlite3.connect('school.db')
c = conn.cursor()

print("Current student distribution:")
c.execute('SELECT class, COUNT(*) FROM students GROUP BY class')
results = c.fetchall()
for row in results:
    print(f'{row[0]}: {row[1]} students')

print("\nCurrent users:")
c.execute('SELECT role, COUNT(*) FROM users GROUP BY role')
user_results = c.fetchall()
for row in user_results:
    print(f'{row[0]}: {row[1]} users')

conn.close()