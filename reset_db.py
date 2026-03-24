import sqlite3

# Clear existing data and recreate with new structure
conn = sqlite3.connect('school.db')
c = conn.cursor()

print("Clearing existing data...")
# Clear all data from tables
tables_to_clear = ['users', 'students', 'attendance', 'homework', 'exams', 'marks', 'behavior', 'assignments']
for table in tables_to_clear:
    c.execute(f'DELETE FROM {table}')

print("Data cleared. Recreating sample data...")
conn.commit()
conn.close()

print("Database reset complete. Now run the app to recreate data with new structure.")