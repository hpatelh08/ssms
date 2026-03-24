import sqlite3

conn = sqlite3.connect('../school.db')
c = conn.cursor()

classes = [f'{grade}-{section}' for grade in range(8, 11) for section in ['A', 'B', 'C']]

for cls in classes:
    grade, section = cls.split('-')
    for i in range(1, 51):
        student_id = f'stu{int(grade):02d}{section}{i:03d}'
        name = f'Student {grade}-{section} {i}'
        roll_no = i
        # Insert if not exists
        c.execute('SELECT 1 FROM students WHERE student_id=?', (student_id,))
        if not c.fetchone():
            c.execute('INSERT INTO students (student_id, name, class) VALUES (?, ?, ?)', (student_id, name, cls))

conn.commit()
conn.close()
print('Added 50 students per class (8-A to 10-C)')
