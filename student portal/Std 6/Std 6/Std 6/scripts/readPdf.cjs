const { PDFParse } = require('pdf-parse');
const fs = require('fs');
new PDFParse().parse(fs.readFileSync('STD 06/class6_fill_in_the_blanks_1000_questions.pdf')).then(d => {
  const lines = d.text.split('\n').filter(l => l.trim().length > 3);
  lines.slice(0, 150).forEach((l, i) => console.log(i + ':', l));
  console.log('\nTotal lines:', lines.length);
}).catch(e => console.error(e));
