const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('STD 06/class6_fill_in_the_blanks_1000_questions.pdf');
const str = buf.toString('latin1');

// ASCII85 decoder
function decodeAscii85(input) {
  // Remove whitespace and tilde-greater than terminator
  const clean = input.replace(/\s+/g, '').replace(/~>$/, '');
  const out = [];
  for (let i = 0; i < clean.length; i += 5) {
    const group = clean.slice(i, i + 5);
    if (group === 'z') { out.push(0,0,0,0); continue; }
    let val = 0;
    const chars = group.padEnd(5, 'u').split('').map(c => c.charCodeAt(0) - 33);
    val = ((((chars[0] * 85 + chars[1]) * 85 + chars[2]) * 85 + chars[3]) * 85 + chars[4]);
    const len = group.length;
    const bytes = [(val>>>24)&0xFF,(val>>>16)&0xFF,(val>>>8)&0xFF,val&0xFF];
    out.push(...bytes.slice(0, len === 5 ? 4 : len - 1));
  }
  return Buffer.from(out);
}

// Find all stream objects with ASCII85+Flate encoding
const objRe = /(\d+) 0 obj\s*<<([^>]*)>>\s*stream\n([\s\S]*?)\nendstream/g;
let m;
const allText = [];
let objCount = 0;

while ((m = objRe.exec(str)) !== null) {
  const header = m[2];
  const rawStream = m[3];
  objCount++;
  
  if (header.includes('ASCII85Decode') && header.includes('FlateDecode')) {
    try {
      const ascii85decoded = decodeAscii85(rawStream.trim());
      const inflated = zlib.inflateSync(ascii85decoded);
      const txt = inflated.toString('latin1');
      
      // Extract Tj text operations
      const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
      let t;
      while ((t = tjRe.exec(txt)) !== null) {
        const text = t[1].replace(/\\n/g,' ').replace(/\\r/g,' ').replace(/\\\(/g,'(').replace(/\\\)/g,')');
        if (text.length > 3) allText.push(text);
      }
      // TJ array form
      const tjArrRe = /\[([^\]]*)\]\s*TJ/g;
      while ((t = tjArrRe.exec(txt)) !== null) {
        const parts = t[1].match(/\(([^)]*)\)/g) || [];
        parts.forEach(p => {
          const text = p.slice(1,-1);
          if (text.length > 3) allText.push(text);
        });
      }
    } catch (e) {
      // ignore
    }
  }
}

console.log(`Parsed ${objCount} objects, got ${allText.length} text pieces`);
// Show first 100 meaningful pieces
const meaningful = allText.filter(t => /[a-zA-Z]{3,}/.test(t));
console.log(`Meaningful text: ${meaningful.length}`);
meaningful.slice(0, 150).forEach((t, i) => console.log(i + ': ' + t));
