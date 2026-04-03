const fs = require('fs');
const path = require('path');

function patchTeacherBackendData() {
  const file = path.join('d:/smart_school_system', 'teacher portal', 'client', 'src', 'services', 'teacherBackendData.js');
  let text = fs.readFileSync(file, 'utf8');

  text = text.replace(
    "import {\r\n  buildMockTeacherClass,\r\n  getAssignedTeacherClassNumber,\r\n  getAssignedTeacherSection,\r\n} from '../config/teacherClasses';",
    "import {\r\n  buildMockTeacherClass,\r\n  getAssignedTeacherClassNumber,\r\n  getAssignedTeacherSection,\r\n} from '../config/teacherClasses';\r\nimport { getCanonicalStudentName } from '../data/studentRoster';"
  );

  text = text.replace(
    /const MOCK_SECTIONS = \['A', 'B', 'C'\];\r?\nconst MOCK_FIRST_NAMES = [\s\S]*?const MOCK_STREETS = /,
    "const MOCK_SECTIONS = ['A', 'B', 'C'];\r\nconst MOCK_STREETS = "
  );

  text = text.replace(
    /        const first = MOCK_FIRST_NAMES\[\(id - 1\) % MOCK_FIRST_NAMES.length\];\r?\n        const last = MOCK_LAST_NAMES\[\(id - 1\) % MOCK_LAST_NAMES.length\];/,
    "        const name = getCanonicalStudentName(id - 1);"
  );

  text = text.replace(
    /          name: `\$\{first\} \$\{last\}`,/,
    "          name,"
  );

  text = text.replace(
    /          parent: `\$\{MOCK_FIRST_NAMES\[id % MOCK_FIRST_NAMES.length\]\} \$\{last\}`,/,
    "          parent: `${getCanonicalStudentName(id)} Parent`,"
  );

  text = text.replace(
    /    name: student\.name \|\| '',/,
    "    name: student.name || getCanonicalStudentName(index),"
  );

  fs.writeFileSync(file, text, 'utf8');
}

function patchClassroomStudents() {
  const file = path.join('d:/smart_school_system', 'teacher portal', 'client', 'src', 'data', 'classroomStudents.js');
  let text = fs.readFileSync(file, 'utf8');

  text = text.replace(
    /const FIRST_NAMES = \[[\s\S]*?\];\r?\n\r?\nconst LAST_NAMES = \[[\s\S]*?\];/,
    "const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Krish', 'Ishaan', 'Rohan', 'Dev', 'Ananya', 'Diya', 'Myra', 'Aisha', 'Siya', 'Meera', 'Ritika', 'Kavya', 'Priyansh', 'Yash', 'Dhruv', 'Tanvi', 'Kiara'];\r\nconst LAST_NAME = 'Sharma';"
  );

  text = text.replace(
    /function getNameByIndex\(globalIndex\) \{\r?\n  const firstName = FIRST_NAMES\[Math\.floor\(globalIndex \/ LAST_NAMES.length\) % FIRST_NAMES.length\];\r?\n  const lastName = LAST_NAMES\[globalIndex % LAST_NAMES.length\];\r?\n  return `\$\{firstName\} \$\{lastName\}`;\r?\n\}/,
    "function getNameByIndex(globalIndex) {\r\n  const firstName = FIRST_NAMES[Math.floor(globalIndex / FIRST_NAMES.length) % FIRST_NAMES.length];\r\n  return `${firstName} ${LAST_NAME}`;\r\n}"
  );

  text = text.replace(
    /    const surname = name\.split\(' '\)\[1\] \|\| 'Parent';/,
    "    const surname = 'Sharma';"
  );

  fs.writeFileSync(file, text, 'utf8');
}

patchTeacherBackendData();
patchClassroomStudents();
console.log('patched teacher portal roster files');
