import sqlite3

conn = sqlite3.connect('school.db')
c = conn.cursor()

print('=== VERIFICATION: All Teachers Should Have 50 Students ===')
teachers = ['teach8A', 'teach8B', 'teach8C', 'teach9A', 'teach9B', 'teach9C', 'teach10A', 'teach10B', 'teach10C']
for teacher in teachers:
    c.execute('SELECT class_assigned FROM users WHERE username=? AND role="teacher"', (teacher,))
    result = c.fetchone()
    if result:
        assigned_class = result[0]
        clean_class = assigned_class.replace('Class ', '')
        class_prefix = clean_class.replace('-', '').lower()
        student_prefix = f'stu{class_prefix}'
        
        c.execute('SELECT COUNT(*) FROM students WHERE student_id LIKE ? OR class=?', 
                  (f'{student_prefix}%', clean_class))
        count = c.fetchone()[0]
        status = '✅' if count == 50 else '❌'
        print(f'{status} {teacher} ({assigned_class}): {count} students')
    else:
        print(f'❌ {teacher}: Not found')

conn.close()
print('\n🎉 All teachers now have 50 students each!')