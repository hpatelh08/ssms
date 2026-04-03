-- Teacher directory seed for the Admin Dashboard
-- Fields included:
-- name, class, division, email, teacher_id, password, subject
--
-- This is safe to re-run because INSERT OR IGNORE avoids duplicates on
-- teacher_id and email.

CREATE TABLE IF NOT EXISTS teacher_directory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  division TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  teacher_id TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  subject TEXT NOT NULL
);

INSERT OR IGNORE INTO teacher_directory (name, class, division, email, teacher_id, password, subject) VALUES
  ('Krish Mehta',    '1', 'A', 'teach1A', 'TCH2026001', 'teach1A123', 'Mathematics'),
  ('Kiara Mehta',    '1', 'B', 'teach1B', 'TCH2026002', 'teach1B123', 'English'),
  ('Siya Tiwari',    '1', 'C', 'teach1C', 'TCH2026003', 'teach1C123', 'EVS'),

  ('Meera Chauhan',  '2', 'A', 'teach2A', 'TCH2026004', 'teach2A123', 'Mathematics'),
  ('Ishaan Kapoor',  '2', 'B', 'teach2B', 'TCH2026005', 'teach2B123', 'English'),
  ('Aarav Kapoor',   '2', 'C', 'teach2C', 'TCH2026006', 'teach2C123', 'EVS'),

  ('Vivaan Singh',   '3', 'A', 'teach3A', 'TCH2026007', 'teach3A123', 'Mathematics'),
  ('Ritika Rao',     '3', 'B', 'teach3B', 'TCH2026008', 'teach3B123', 'Science'),
  ('Rohan Singh',    '3', 'C', 'teach3C', 'TCH2026009', 'teach3C123', 'English'),

  ('Dev Desai',      '4', 'A', 'teach4A', 'TCH2026010', 'teach4A123', 'Mathematics'),
  ('Aditya Desai',   '4', 'B', 'teach4B', 'TCH2026011', 'teach4B123', 'Science'),
  ('Kavya Sharma',   '4', 'C', 'teach4C', 'TCH2026012', 'teach4C123', 'English'),

  ('Priyansh Patel', '5', 'A', 'teach5A', 'TCH2026013', 'teach5A123', 'Mathematics'),
  ('Ananya Nair',    '5', 'B', 'teach5B', 'TCH2026014', 'teach5B123', 'Science'),
  ('Krish Nair',     '5', 'C', 'teach5C', 'TCH2026015', 'teach5C123', 'English'),

  ('Ishaan Yadav',   '6', 'A', 'teach6A', 'TCH2026016', 'teach6A123', 'Mathematics'),
  ('Yash Verma',     '6', 'B', 'teach6B', 'TCH2026017', 'teach6B123', 'Science'),
  ('Diya Yadav',     '6', 'C', 'teach6C', 'TCH2026018', 'teach6C123', 'English'),

  ('Teacher 7A',     '7', 'A', 'teach7A', 'TCH2026019', 'teach7A123', 'Mathematics'),
  ('Teacher 7B',     '7', 'B', 'teach7B', 'TCH2026020', 'teach7B123', 'Science'),
  ('Teacher 7C',     '7', 'C', 'teach7C', 'TCH2026021', 'teach7C123', 'English');

