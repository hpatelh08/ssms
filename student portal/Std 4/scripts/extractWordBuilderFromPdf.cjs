/* Extracts Word Builder examples from the provided PDF into JSON.
 *
 * Input : STD 04/1000_word_builder_examples.pdf
 * Output: STD 04/word_builder_1000.json
 *
 * Run:
 *   node scripts/extractWordBuilderFromPdf.cjs
 */

const fs = require('node:fs');
const path = require('node:path');
const { PDFParse } = require('pdf-parse');

const ROOT = path.resolve(__dirname, '..');
const INPUT_PDF = path.join(ROOT, 'STD 04', '1000_word_builder_examples.pdf');
const OUTPUT_JSON = path.join(ROOT, 'STD 04', 'word_builder_1000.json');

function parseEntries(text) {
  const normalized = String(text).replace(/\r/g, '');
  const re = /(\d+)\.\s*Letters:\s*([A-Z ]+)\nAnswers:\s*([^\n]+)/g;
  const out = [];
  let match;
  while ((match = re.exec(normalized))) {
    const letters = match[2].trim().split(/\s+/).filter(Boolean);
    const answers = match[3].split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    out.push({ letters, answers });
  }
  return out;
}

async function main() {
  if (!fs.existsSync(INPUT_PDF)) {
    console.error(`Missing input PDF: ${INPUT_PDF}`);
    process.exit(1);
  }
  const data = fs.readFileSync(INPUT_PDF);
  const parser = new PDFParse({ data });
  const res = await parser.getText();
  await parser.destroy();

  const entries = parseEntries(res.text);
  if (!entries.length) {
    console.error('No entries parsed from PDF text.');
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(entries, null, 2), 'utf8');
  console.log(`Wrote ${entries.length} entries to: ${OUTPUT_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

