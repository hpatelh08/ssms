/**
 * Build-Time PDF Parser & Chunker
 * ================================
 * Parses Std 3 NCERT PDFs (English, Mathematics, Science)
 * using pdfjs-dist, extracts text page-by-page, chunks it into
 * ~400-char segments with overlap, and writes the output to
 * data/knowledgeChunks.ts as a typed constant.
 *
 * Usage:  node scripts/buildKnowledgeBase.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Import pdfjs-dist (comes with pdf-parse)
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

// ─── Configuration ────────────────────────────────────────
const PDF_FILES = [
  { file: 'Std 3/English/NCERT_English.pdf', subject: 'English', skipPages: 12 },
  { file: 'Std 3/Mathematics/NCERT_Mathematics.pdf', subject: 'Math', skipPages: 12 },
  { file: 'Std 3/Science/NCERT_Science.pdf', subject: 'Science', skipPages: 12 },
];

const CHUNK_SIZE = 400;      // target chars per chunk
const CHUNK_OVERLAP = 80;    // overlap between consecutive chunks
const MIN_CHUNK_LEN = 50;    // discard very short chunks

// ─── Helpers ──────────────────────────────────────────────

/** Extract text from a single PDF page with memory cleanup */
async function getPageText(doc, pageNum) {
  const page = await doc.getPage(pageNum);
  const textContent = await page.getTextContent({ includeMarkedContent: false });
  
  // Reconstruct text with proper spacing
  let lastY = null;
  let text = '';
  for (const item of textContent.items) {
    if ('str' in item && item.str) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
        text += '\n';
      } else if (text.length > 0 && !text.endsWith(' ') && !text.endsWith('\n')) {
        text += ' ';
      }
      text += item.str;
      lastY = item.transform[5];
    }
  }
  
  // Aggressively cleanup page resources to free memory
  page.cleanup();
  
  return text;
}

/** Clean extracted text – collapse whitespace, trim junk */
function cleanText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')       // collapse horizontal whitespace
    .replace(/\n{3,}/g, '\n\n')    // max 2 consecutive newlines
    .replace(/Reprint \d{4}-?\d{0,2}/gi, '')  // Remove "Reprint 2025-26"
    .trim();
}

/**
 * Detect chapter/unit name from text.
 */
function detectChapter(text) {
  const patterns = [
    /(?:Unit|Chapter|Lesson)\s*(\d+)\s*[:.]\s*([^\n]{2,60})/i,
    /(?:Unit|Chapter|Lesson)\s*(\d+)\s*\n\s*([^\n]{2,60})/i,
    /^(\d+)\.\s*([A-Z][^\n]{2,50})/m,
  ];

  for (const pat of patterns) {
    const match = text.match(pat);
    if (match) {
      return match[0].trim().substring(0, 60);
    }
  }

  // Try to find a title-like line (short, capitalized)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3 && l.length < 60);
  for (const line of lines) {
    const words = line.split(' ');
    const capWords = words.filter(w => w[0] && w[0] === w[0].toUpperCase());
    if (words.length >= 2 && words.length <= 8 && capWords.length >= words.length * 0.6) {
      return line;
    }
  }

  return 'General';
}

/**
 * Split text into overlapping chunks of ~CHUNK_SIZE characters.
 */
function chunkText(text) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const slice = text.substring(start, Math.min(end + 80, text.length));
      let bestBreak = -1;
      for (let i = Math.floor(CHUNK_SIZE * 0.5); i < slice.length; i++) {
        if ('.!?\n'.includes(slice[i]) && (i + 1 >= slice.length || slice[i + 1] === ' ' || slice[i + 1] === '\n')) {
          bestBreak = i + 1;
          if (i >= CHUNK_SIZE * 0.8) break;
        }
      }
      if (bestBreak > 0) {
        end = start + bestBreak;
      }
    }

    const content = text.substring(start, end).trim();
    if (content.length >= MIN_CHUNK_LEN) {
      chunks.push(content);
    }

    start = end - CHUNK_OVERLAP;
    if (start >= text.length) break;
  }

  return chunks;
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log('📚  SSMS RAG Knowledge Base Builder');
  console.log('━'.repeat(50));

  const allChunks = [];
  let idCounter = 0;

  for (const { file, subject, skipPages } of PDF_FILES) {
    const filePath = path.join(ROOT, file);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠  PDF not found: ${filePath} – skipping.`);
      continue;
    }

    console.log(`\n📖  Processing: ${file}`);
    const dataBuffer = fs.readFileSync(filePath);
    const data = new Uint8Array(dataBuffer);

    let doc;
    try {
      doc = await pdfjsLib.getDocument({ 
        data,
        useSystemFonts: true,
        disableFontFace: true,
        isEvalSupported: false,
      }).promise;
    } catch (err) {
      console.error(`   ❌  Failed to open ${file}:`, err.message);
      continue;
    }

    const totalPages = doc.numPages;
    console.log(`   Total pages: ${totalPages}`);
    console.log(`   Skipping first ${skipPages} pages (front matter)`);

    let subjectChunkCount = 0;
    let currentChapter = 'General';

    // Process in batches of 5 pages to manage memory
    const BATCH_SIZE = 5;
    for (let batchStart = skipPages + 1; batchStart <= totalPages; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
      
      for (let pageNum = batchStart; pageNum <= batchEnd; pageNum++) {
        let pageText;
        try {
          pageText = await getPageText(doc, pageNum);
        } catch (err) {
          // Silently skip pages that fail (image-only, etc.)
          continue;
        }

        const cleaned = cleanText(pageText);
        if (cleaned.length < MIN_CHUNK_LEN) continue;

        const detectedChapter = detectChapter(cleaned);
        if (detectedChapter !== 'General') {
          currentChapter = detectedChapter;
        }

        const pageChunks = chunkText(cleaned);

        for (const content of pageChunks) {
          idCounter++;
          allChunks.push({
            id: `${subject.toLowerCase().charAt(0)}${idCounter}`,
            subject,
            page: pageNum,
            chapter: currentChapter,
            content,
          });
          subjectChunkCount++;
        }
      }
      
      // Allow GC between batches
      if (global.gc) global.gc();
    }

    console.log(`   ✅  Extracted ${subjectChunkCount} chunks for ${subject}`);
    
    // Destroy document to free memory before processing next PDF
    doc.destroy();
  }

  if (allChunks.length === 0) {
    console.log('\n⚠  No chunks extracted. Writing fallback.');
    writeFallback();
    return;
  }

  // ──────── Write output ────────
  const dataDir = path.join(ROOT, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const outputPath = path.join(dataDir, 'knowledgeChunks.ts');

  const tsContent = `// ═══════════════════════════════════════════════════════════
// AUTO-GENERATED by scripts/buildKnowledgeBase.mjs
// DO NOT EDIT MANUALLY — re-run the script after PDF changes.
// Generated: ${new Date().toISOString()}
// Total chunks: ${allChunks.length}
// ═══════════════════════════════════════════════════════════

import { TextbookChunk } from '../types';

/**
 * ${allChunks.length} chunks extracted from:
 *   - Std 3 English  (${allChunks.filter(c => c.subject === 'English').length} chunks)
 *   - Std 3 Mathematics  (${allChunks.filter(c => c.subject === 'Math').length} chunks)
 *   - Std 3 Science  (${allChunks.filter(c => c.subject === 'Science').length} chunks)
 */
export const PDF_KNOWLEDGE_BASE: TextbookChunk[] = ${JSON.stringify(allChunks, null, 2)};
`;

  fs.writeFileSync(outputPath, tsContent, 'utf-8');

  console.log(`\n✅  Written ${allChunks.length} chunks to data/knowledgeChunks.ts`);
  console.log(`    English chunks: ${allChunks.filter(c => c.subject === 'English').length}`);
  console.log(`    Math chunks:    ${allChunks.filter(c => c.subject === 'Math').length}`);
  console.log(`    File size:      ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
  console.log('━'.repeat(50));
}

function writeFallback() {
  const dataDir = path.join(ROOT, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const outputPath = path.join(dataDir, 'knowledgeChunks.ts');
  const ts = `// AUTO-GENERATED FALLBACK (no PDFs found)
import { TextbookChunk } from '../types';
export const PDF_KNOWLEDGE_BASE: TextbookChunk[] = [];
`;
  fs.writeFileSync(outputPath, ts, 'utf-8');
  console.log('   Written empty fallback to data/knowledgeChunks.ts');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
