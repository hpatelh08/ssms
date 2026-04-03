const fs = require('fs');
const zlib = require('zlib');
const content = fs.readFileSync('STD 06/class6_fill_in_the_blanks_1000_questions.pdf', 'latin1');

function a85(s) {
  s = s.replace(/\s/g, '').replace(/~>$/, '');
  const out = [];
  for (let i = 0; i < s.length; ) {
    if (s[i] === 'z') { out.push(0,0,0,0); i++; continue; }
    const n = Math.min(s.length - i, 5);
    const chunk = s.slice(i, i+5).padEnd(5, 'u');
    const codes = chunk.split('').map(c => c.charCodeAt(0) - 33);
    let v = codes[0];
    for (let j = 1; j < 5; j++) v = v * 85 + codes[j];
    const outBytes = n < 5 ? n - 1 : 4;
    for (let j = 3; j >= 4 - outBytes; j--) out.push((v >>> (j*8)) & 0xFF);
    i += n < 5 ? n : 5;
  }
  return Buffer.from(out);
}

let pos = 0;
const allText = [];
let streamCount = 0;

// Look for stream\n (not stream\r\n)
while (pos < content.length) {
  const si = content.indexOf('stream\n', pos);
  if (si === -1) break;
  
  const headerStart = content.lastIndexOf('<<', si);
  if (headerStart === -1) { pos = si + 7; continue; }
  const header = content.substring(headerStart, si);
  
  const ei = content.indexOf('endstream', si + 7);
  if (ei === -1) break;
  
  const rawStream = content.substring(si + 7, ei).trimEnd();
  streamCount++;
  
  if (header.includes('ASCII85') && header.includes('FlateDecode')) {
    try {
      const dec = a85(rawStream);
      const inflated = zlib.inflateSync(dec);
      const txt = inflated.toString('latin1');
      
      // Extract Tj
      const re1 = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
      let m;
      while ((m = re1.exec(txt)) !== null) {
        const t = m[1].replace(/\\\(/g,'(').replace(/\\\)/g,')');
        if (t.trim().length > 2) allText.push(t.trim());
      }
      // Extract TJ array
      const re2 = /\[([^\]]+)\]\s*TJ/g;
      while ((m = re2.exec(txt)) !== null) {
        const parts = m[1].match(/\(([^)]*)\)/g) || [];
        parts.forEach(p => {
          const t = p.slice(1,-1).trim();
          if (t.length > 2) allText.push(t);
        });
      }
    } catch(e) {
      console.error('stream', streamCount, 'error:', e.message);
    }
  }
  
  pos = si + 7;
}

console.log(`Streams: ${streamCount}, text pieces: ${allText.length}`);
const words = allText.filter(t => /[a-zA-Z]{3,}/.test(t));
console.log(`Word-containing pieces: ${words.length}`);
words.slice(0, 200).forEach((t, i) => console.log(i + ': ' + t));
