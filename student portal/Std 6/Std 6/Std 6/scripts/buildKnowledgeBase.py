"""
Build-Time PDF Parser & Chunker
================================
Extracts text from English Class 6.pdf and Mathematics Class 6.pdf
using PyMuPDF, chunks it, and outputs data/knowledgeChunks.ts

Usage:  python scripts/buildKnowledgeBase.py
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF not installed. Run: pip install PyMuPDF")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent

# â”€â”€â”€ Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
PDF_FILES = [
    {"file": "English Class 6.pdf", "subject": "English", "skip_pages": 12},
    {"file": "Mathematics Class 6.pdf", "subject": "Math", "skip_pages": 12},
]

CHUNK_SIZE = 400       # target chars per chunk
CHUNK_OVERLAP = 80     # overlap between consecutive chunks
MIN_CHUNK_LEN = 50     # discard very short chunks


# â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def clean_text(raw: str) -> str:
    """Clean extracted text."""
    text = raw.replace('\r\n', '\n')
    text = re.sub(r'[ \t]+', ' ', text)         # collapse horizontal whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)       # max 2 newlines
    text = re.sub(r'Reprint \d{4}-?\d{0,2}', '', text, flags=re.IGNORECASE)
    return text.strip()


def detect_chapter(text: str) -> str:
    """Detect chapter/unit name from page text."""
    patterns = [
        r'(?:Unit|Chapter|Lesson)\s*(\d+)\s*[:.]\s*([^\n]{2,60})',
        r'(?:Unit|Chapter|Lesson)\s*(\d+)\s*\n\s*([^\n]{2,60})',
        r'^(\d+)\.\s*([A-Z][^\n]{2,50})',
    ]
    
    for pat in patterns:
        match = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(0).strip()[:60]
    
    # Try title-like lines (short, mostly capitalized)
    for line in text.split('\n'):
        line = line.strip()
        if 3 < len(line) < 60:
            words = line.split()
            if 2 <= len(words) <= 8:
                cap_count = sum(1 for w in words if w[0].isupper())
                if cap_count >= len(words) * 0.6:
                    return line
    
    return "General"


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks. Simple and robust."""
    if len(text) < MIN_CHUNK_LEN:
        return []
    if len(text) <= CHUNK_SIZE:
        return [text.strip()] if len(text.strip()) >= MIN_CHUNK_LEN else []
    
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = min(start + CHUNK_SIZE, text_len)
        
        # If not at the end, try to break at a sentence boundary
        if end < text_len:
            # Look for sentence-ending punctuation in the last 40% of the chunk
            look_start = start + int(CHUNK_SIZE * 0.6)
            look_end = min(end + 40, text_len)
            best = end  # default: just cut at CHUNK_SIZE
            for pos in range(look_start, look_end):
                ch = text[pos]
                if ch in '.!?\n':
                    best = pos + 1
                    if pos >= start + int(CHUNK_SIZE * 0.8):
                        break
            end = best
        
        segment = text[start:end].strip()
        if len(segment) >= MIN_CHUNK_LEN:
            chunks.append(segment)
        
        # Move forward, ensuring progress
        advance = max(end - CHUNK_OVERLAP, start + 1)
        start = advance
    
    return chunks


# â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def main():
    print("ðŸ“š  SSMS RAG Knowledge Base Builder")
    print("â”" * 50)
    
    all_chunks = []
    id_counter = 0
    
    for pdf_config in PDF_FILES:
        file_path = ROOT / pdf_config["file"]
        subject = pdf_config["subject"]
        skip_pages = pdf_config["skip_pages"]
        
        if not file_path.exists():
            print(f"âš   PDF not found: {file_path} â€“ skipping.")
            continue
        
        print(f"\nðŸ“–  Processing: {pdf_config['file']}")
        
        doc = fitz.open(str(file_path))
        total_pages = doc.page_count
        print(f"   Total pages: {total_pages}")
        print(f"   Skipping first {skip_pages} pages (front matter)")
        
        subject_chunk_count = 0
        current_chapter = "General"
        
        for page_num in range(skip_pages, total_pages):
            page = doc.load_page(page_num)
            raw_text = page.get_text("text")
            
            cleaned = clean_text(raw_text)
            if len(cleaned) < MIN_CHUNK_LEN:
                continue
            
            detected = detect_chapter(cleaned)
            if detected != "General":
                current_chapter = detected
            
            page_chunks = chunk_text(cleaned)
            
            for content in page_chunks:
                id_counter += 1
                prefix = subject[0].lower()
                all_chunks.append({
                    "id": f"{prefix}{id_counter}",
                    "subject": subject,
                    "page": page_num + 1,  # 1-based for display
                    "chapter": current_chapter,
                    "content": content,
                })
                subject_chunk_count += 1
        
        doc.close()
        print(f"   âœ…  Extracted {subject_chunk_count} chunks for {subject}")
    
    if not all_chunks:
        print("\nâš   No chunks extracted. Writing fallback.")
        write_fallback()
        return
    
    # â”€â”€â”€â”€â”€â”€â”€â”€ Write output â”€â”€â”€â”€â”€â”€â”€â”€
    data_dir = ROOT / "data"
    data_dir.mkdir(exist_ok=True)
    
    english_count = sum(1 for c in all_chunks if c["subject"] == "English")
    math_count = sum(1 for c in all_chunks if c["subject"] == "Math")
    
    ts_content = f"""// @ts-nocheck - Large auto-generated data file, skip type checking
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AUTO-GENERATED by scripts/buildKnowledgeBase.py
// DO NOT EDIT MANUALLY â€” re-run the script after PDF changes.
// Generated: {datetime.now().isoformat()}
// Total chunks: {len(all_chunks)}
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

import {{ TextbookChunk }} from '../types';

/**
 * {len(all_chunks)} chunks extracted from:
 *   - English Class 6.pdf  ({english_count} chunks)
 *   - Mathematics Class 6.pdf  ({math_count} chunks)
 */
export const PDF_KNOWLEDGE_BASE: TextbookChunk[] = {json.dumps(all_chunks, indent=2, ensure_ascii=False)} as TextbookChunk[];
"""
    
    output_path = data_dir / "knowledgeChunks.ts"
    output_path.write_text(ts_content, encoding="utf-8")
    
    file_size_kb = output_path.stat().st_size / 1024
    
    print(f"\nâœ…  Written {len(all_chunks)} chunks to data/knowledgeChunks.ts")
    print(f"    English chunks: {english_count}")
    print(f"    Math chunks:    {math_count}")
    print(f"    File size:      {file_size_kb:.1f} KB")
    print("â”" * 50)


def write_fallback():
    data_dir = ROOT / "data"
    data_dir.mkdir(exist_ok=True)
    
    output_path = data_dir / "knowledgeChunks.ts"
    output_path.write_text(
        "// AUTO-GENERATED FALLBACK (no PDFs found)\n"
        "import { TextbookChunk } from '../types';\n"
        "export const PDF_KNOWLEDGE_BASE: TextbookChunk[] = [];\n",
        encoding="utf-8"
    )
    print("   Written empty fallback to data/knowledgeChunks.ts")


if __name__ == "__main__":
    main()

