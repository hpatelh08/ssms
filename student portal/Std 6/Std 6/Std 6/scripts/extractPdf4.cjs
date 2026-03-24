const fs = require('fs');
const zlib = require('zlib');
const content = fs.readFileSync('STD 06/class6_fill_in_the_blanks_1000_questions.pdf', 'latin1');

// ASCII85 decoder
function a85(s) {
  s = s.replace(/\s/g, '').replace(/~>$/, '');
  const out = [];
  for (let i = 0; i < s.length; ) {
    if (s[i] === 'z') { out.push(0,0,0,0); i++; continue; }
    const chunk = s.slice(i, i+5).padEnd(5, 'u');
    const codes = chunk.split('').map(c => c.charCodeAt(0) - 33);
    let v = codes[0];
    for (let j = 1; j < 5; j++) v = v * 85 + codes[j];
    const n = Math.min(s.length - i, 5);
    for (let j = 3; j >= 4-n; j--) out.push((v >> (j*8)) & 0xFF);
    i += 5;
  }
  return Buffer.from(out);
}

// Manually parse stream boundaries
let pos = 0;
const allText = [];
let streamCount = 0;

while (pos < content.length) {
  const si = content.indexOf('\nstream\n', pos);
  if (si === -1) break;
  
  // Find header (look backward for /Length and /Filter)
  const headerStart = content.lastIndexOf('<<', si);
  const header = content.substring(headerStart, si);
  
  // Find endstream
  const ei = content.indexOf('\nendstream', si + 8);
  if (ei === -1) break;
  
  const rawStream = content.substring(si + 8, ei);
  streamCount++;
  
  const isA85 = header.includes('ASCII85Decode');
  const isFlate = header.includes('FlateDecode');
  
  if (isA85 && isFlate) {
    try {
      const dec = a85(rawStream);
      const inflated = zlib.inflateSync(dec);
      const txt = inflated.toString('latin1');
      
      // Extract all text between () followed by Tj
      const re = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
      let m;
      while ((m = re.exec(txt)) !== null) {
        const t = m[1].replace(/\\\(/g,'(').replace(/\\\)/g,')').replace(/\\n/g,' ');
        if (t.trim().length > 2) allText.push(t.trim());
      }
    } catch(e) {}
  }
  
  pos = ei + 10;
}

console.log(`Streams: ${streamCount}, text pieces: ${allText.length}`);
const words = allText.filter(t => /[a-zA-Z]{3,}/.test(t));
console.log(`Word pieces: ${words.length}`);
words.slice(0, 200).forEach((t, i) => console.log(i + ': ' + t));
