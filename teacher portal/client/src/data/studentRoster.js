const CANONICAL_FIRST_NAMES = [
  'Aarav',
  'Vivaan',
  'Aditya',
  'Krish',
  'Ishaan',
  'Rohan',
  'Dev',
  'Ananya',
  'Diya',
  'Myra',
  'Aisha',
  'Siya',
  'Meera',
  'Ritika',
  'Kavya',
  'Priyansh',
  'Yash',
  'Dhruv',
  'Tanvi',
  'Kiara',
];

const CANONICAL_SURNAME = 'Sharma';

export function getCanonicalStudentName(index) {
  const safeIndex = Math.max(0, Number(index) || 0);
  const firstName = CANONICAL_FIRST_NAMES[safeIndex % CANONICAL_FIRST_NAMES.length];
  return `${firstName} ${CANONICAL_SURNAME}`;
}

