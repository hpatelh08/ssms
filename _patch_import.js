const fs = require('fs');
const path = require('path');
const file = path.join('d:/smart_school_system', 'teacher portal', 'client', 'src', 'services', 'teacherBackendData.js');
let text = fs.readFileSync(file, 'utf8');
if (!text.includes("import { getCanonicalStudentName } from '../data/studentRoster';")) {
  text = text.replace(
    "} from '../config/teacherClasses';\r\n",
    "} from '../config/teacherClasses';\r\nimport { getCanonicalStudentName } from '../data/studentRoster';\r\n"
  );
}
fs.writeFileSync(file, text, 'utf8');
console.log('import patched');
