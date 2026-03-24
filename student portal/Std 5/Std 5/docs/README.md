# 📚 Class 5 — Documentation Index

> All reference files for the AI Buddy knowledge base, chapter videos, RAG setup, and curriculum data.

---

## 📂 Subject Files

| File | Subject | Book | Chapters | RAG Status |
|------|---------|------|----------|------------|
| [ENGLISH_UNITS.md](ENGLISH_UNITS.md) | English | Santoor (NCERT) | 5 Units × 2 Chapters | ✅ 1,321 chunks |
| [MATHS_CHAPTERS.md](MATHS_CHAPTERS.md) | Mathematics | Maths Mela (NCERT Math-Magic) | 15 Chapters | ✅ 2,010 chunks |
| [HINDI_CHAPTERS.md](HINDI_CHAPTERS.md) | Hindi | Veena (NCERT) | 11 Chapters | ❌ Not yet added |
| [EVS_CHAPTERS.md](EVS_CHAPTERS.md) | EVS | Our Amazing World (NCERT) | 10 Chapters / 5 Units | ❌ Not yet added |
| [GUJARATI_CHAPTERS.md](GUJARATI_CHAPTERS.md) | Gujarati | કુકકુટ (GSEB) | 10 Chapters | ❌ Not yet added |

---

## 🧠 RAG Knowledge Base

| File | Description |
|------|-------------|
| [RAG_KNOWLEDGE_BASE.md](RAG_KNOWLEDGE_BASE.md) | Full RAG architecture, chunk counts, Q&A topic index, how to add new subjects |

### RAG Coverage Summary

| Subject | PDF Chunks | Q&A Pairs | Total | Source arrays |
|---------|-----------|-----------|-------|---------------|
| English | 1,271 | 50 | **1,321** | `PDF_KNOWLEDGE_BASE` + `ENGLISH_QA` |
| Maths | 1,960 | 50 | **2,010** | `PDF_KNOWLEDGE_BASE` + `MATHS_QA` |
| Hindi | — | — | **0** | _(add PDF + `HINDI_QA`)_ |
| EVS | — | — | **0** | _(add PDF + `EVS_QA`)_ |
| Gujarati | — | — | **0** | _(add PDF + `GUJARATI_QA`)_ |
| **TOTAL** | **3,231** | **100** | **3,331** | `INITIAL_KNOWLEDGE` in `constants.tsx` |

---

## 📝 Key Source Files

| File | Purpose |
|------|---------|
| `data/knowledgeChunks.ts` | Auto-generated PDF chunks (3,231 total) — **do not edit manually** |
| `data/qaData.ts` | Hand-curated Q&A pairs (100 total) — edit here to add new Q&As |
| `data/ncertChapters.ts` | NCERT chapter metadata used by the AI for context grounding |
| `data/englishUnits.ts` | English unit → YouTube video mapping |
| `data/mathsChapters.ts` | Maths chapter → YouTube video mapping |
| `data/videoConfig.ts` | All subject video entries (Veena, EVS, Bansuri, KhelYoga, Gujarati) |
| `data/bookConfig.ts` | PDF book entries shown in the Parent Library |
| `constants.tsx` | Merges all RAG sources → `INITIAL_KNOWLEDGE` |
| `scripts/buildKnowledgeBase.py` | Re-generates `knowledgeChunks.ts` from PDFs |

---

## 🔄 Quick Tasks

### Change a video link
1. Find the subject file in the table above
2. Note the `ID` column
3. Open the source file listed at the bottom of that MD
4. Find the matching `id:` entry → replace `url:`
5. Save — `embedId` auto-extracts

### Add a new Q&A to the AI
1. Open `data/qaData.ts`
2. Append to `ENGLISH_QA` or `MATHS_QA` (or create a new array for another subject)
3. See [RAG_KNOWLEDGE_BASE.md](RAG_KNOWLEDGE_BASE.md) for the format

### Add a new subject to RAG
1. Add the PDF path to `scripts/buildKnowledgeBase.py → PDF_FILES`
2. Run `python scripts/buildKnowledgeBase.py`
3. Add `QA` array in `data/qaData.ts` and spread into `QA_KNOWLEDGE_BASE`
4. See the subject's MD file for subject-specific instructions
