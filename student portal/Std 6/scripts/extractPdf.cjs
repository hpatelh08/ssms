const zlib = require('zlib');
const fs = require('fs');
const buf = fs.readFileSync('STD 06/class6_fill_in_the_blanks_1000_questions.pdf');
// Try to decode each stream with binary encoding
const str = buf.toString('binary');
const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let m, count = 0, textCount = 0;
const allText = [];
while ((m = re.exec(str)) !== null) {
  count++;
  const raw = m[1];
  try {
    const d = zlib.inflateSync(Buffer.from(raw, 'binary'));
    const txt = d.toString('latin1');
    // Look for readable text (BT/ET are PDF text operators)
    if (txt.includes('BT') || txt.includes('Tf')) {
      textCount++;
      // Extract text from PDF content stream
      const textRe = /\(((?:[^)\\]|\\[\\()]|\\[0-9]{3})*)\)\s*Tj/g;
      let tm;
      const parts = [];
      while ((tm = textRe.exec(txt)) !== null) {
        parts.push(tm[1].replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8))));
      }
      if (parts.length) allText.push(...parts);
    }
  } catch (e) {}
}
console.log(`Total streams: ${count}, text streams: ${textCount}`);
console.log(`Extracted ${allText.length} text fragments`);
// Filter relevant ones
const questions = allText.filter(t => t.includes('_') || /^\d+\./.test(t));
console.log(`\nQuestion-like fragments: ${questions.length}`);
questions.slice(0, 50).forEach((t, i) => console.log(i + ':', t));
// Also show all text
console.log('\n--- ALL TEXT (first 200) ---');
allText.slice(0, 200).forEach((t, i) => console.log(i + ':', t));
