const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('STD 06/class6_fill_in_the_blanks_1000_questions.pdf');
const str = buf.toString('latin1');

// Try to find stream boundaries with proper PDF parsing
// ReportLab uses FlateDecode compression
const objRe = /(\d+) 0 obj([\s\S]*?)endobj/g;
let m;
const allText = [];

while ((m = objRe.exec(str)) !== null) {
  const objContent = m[2];
  if (objContent.includes('/FlateDecode') || objContent.includes('/Filter')) {
    const streamMatch = objContent.match(/stream\r?\n([\s\S]*?)\r?\nendstream/);
    if (streamMatch) {
      try {
        const compressed = Buffer.from(streamMatch[1], 'binary');
        const decompressed = zlib.inflateSync(compressed);
        const txt = decompressed.toString('latin1');
        // Extract text operations
        const tjRe = /\(([^)]*)\)\s*Tj/g;
        let t;
        while ((t = tjRe.exec(txt)) !== null) {
          allText.push(t[1]);
        }
        // Also TJ (array form)
        const tjArrRe = /\[((?:[^[\]]*(?:\([^)]*\)[^[\]]*)*)*)\]\s*TJ/g;
        while ((t = tjArrRe.exec(txt)) !== null) {
          const inner = t[1];
          const parts = inner.match(/\(([^)]*)\)/g) || [];
          parts.forEach(p => allText.push(p.slice(1,-1)));
        }
      } catch (e) {
        // not compressed or wrong format
      }
    }
  }
}

console.log(`Total text pieces: ${allText.length}`);
// Filter for question-like content
const questions = allText.filter(t => t.length > 8 && /[a-zA-Z]/.test(t));
console.log(`Text pieces with letters: ${questions.length}`);
questions.slice(0, 100).forEach((t, i) => {
  const clean = t.replace(/\\n/g, ' ').replace(/\\r/g, ' ');
  console.log(i + ':', clean);
});
