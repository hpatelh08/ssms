const fs = require('fs');
const file = 'd:/smart_school_system/teacher portal/client/src/services/teacherBackendData.js';
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
const marker = "} from '../config/teacherClasses';";
const helperImport = "import { getCanonicalStudentName } from '../data/studentRoster';";
if (!lines.includes(helperImport)) {
  const idx = lines.findIndex((line) => line === marker);
  if (idx === -1) throw new Error('marker not found');
  lines.splice(idx + 1, 0, helperImport);
}
fs.writeFileSync(file, lines.join('\r\n'), 'utf8');
console.log('teacherBackendData import inserted');
