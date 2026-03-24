import sqlite3

# List of 50 names for class 8-A
names = [
    "Aarav", "Ananya", "Vihaan", "Saanvi", "Reyansh", "Myra", "Advik", "Kiara", "Ishaan", "Avni",
    "Ayaan", "Navya", "Atharv", "Diya", "Kabir", "Riya", "Shaurya", "Ishani", "Aditya", "Neha",
    "Arjun", "Pooja", "Rahul", "Priya", "Rohan", "Sneha", "Abhishek", "Shreya", "Karan", "Kavya",
    "Aryan", "Aditi", "Yash", "Meera", "Akash", "Simran", "Rohit", "Tanvi", "Dhruv", "Aarohi",
    "Vedant", "Vedika", "Pranav", "Anika", "Devansh", "Siya", "Manav", "Jiya", "Tejas", "Prisha"
]

conn = sqlite3.connect('../school.db')
c = conn.cursor()

# Update names for class 8-A
for i, name in enumerate(names, 1):
    student_id = f'stu08A{i:03d}'
    c.execute('UPDATE students SET name=? WHERE student_id=? AND class=?', (name, student_id, '8-A'))

conn.commit()
conn.close()
print('Updated 8-A student names.')
