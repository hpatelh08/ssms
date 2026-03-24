import csv
import os

BASE = os.path.dirname(os.path.abspath(__file__))
OUT_CSV = os.path.join(BASE, '..', 'ALL_CREDENTIALS.csv')

all_accounts = []
grades = [8, 9, 10]
sections = ['A', 'B', 'C']

for grade in grades:
    for section in sections:
        # Class teacher
        teacher_username = f'teach{grade}{section}'
        teacher_password = f'teach{grade}{section}123'
        all_accounts.append((teacher_username, 'teacher', teacher_password, f'Class {grade}-{section}'))
        
        # Students and parents
        for i in range(1, 51):
            new_username = f"stu{grade:02d}{section}{i:03d}"
            student_password = f"stu{i:03d}"
            all_accounts.append((new_username, 'student', student_password, f'Class {grade}'))
            
            # Parent
            parent_username = f"parent_{new_username}"
            parent_password = f"parent{i:03d}"
            all_accounts.append((parent_username, 'parent', parent_password, f'For {new_username}'))

# Write CSV
with open(OUT_CSV, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['username', 'role', 'password', 'description'])
    for e in all_accounts:
        w.writerow(e)

print(f"✓ CSV generated: {OUT_CSV}")
print(f"✓ Total accounts: {len(all_accounts)}")
print(f"  - Teachers: 9")
print(f"  - Students: 450 (50 each in 9 classes)")
print(f"  - Parents: 450 (1 per student)")
