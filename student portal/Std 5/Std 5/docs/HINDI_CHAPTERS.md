# 🌿 Hindi — Veena Class 5 Chapters & Video Links

> **Book:** Veena (हिंदी) · **PDF:** `/books/std5/ncert/hindi.pdf`
>
> To change a video link: open `data/videoConfig.ts`, find the matching `id:` entry under `veenaVideos`, and replace the `url:` value.

---

## Chapter List with YouTube Links

| ID | Chapter | Title | Topic Summary | YouTube Link |
|----|---------|-------|---------------|--------------|
| `veena_ch1` | **Ch 1** | किरण | Story about a girl named Kiran — character traits, descriptive writing, reading comprehension | [▶ Watch](https://youtu.be/5OLhbq2ot84) |
| `veena_ch2` | **Ch 2** | न्याय की कुर्सी | Moral story about justice — values, dialogue, story retelling | [▶ Watch](https://youtu.be/wlskl_YiRuM) |
| `veena_ch3` | **Ch 3** | चाँद का कुरता | Poem about the moon requesting a shirt — poetic language, metaphor, rhyme | [▶ Watch](https://youtu.be/cMUb6VdxKfQ) |
| `veena_ch4` | **Ch 4** | साङकेन | Story about the Sangken festival of the Thai community — cultural awareness, comprehension | [▶ Watch](https://youtu.be/2L1gOXgohtE) |
| `veena_ch5` | **Ch 5** | सुंदरीया | Story about a beautiful girl and nature — adjectives, nature vocabulary | [▶ Watch](https://youtu.be/dX4gGCwc1MY) |
| `veena_ch6` | **Ch 6** | चतुर चित्रकार | Story about a clever painter — clever thinking, narrative writing, vocabulary | [▶ Watch](https://youtu.be/5Rx2nBkmDuM) |
| `veena_ch7` | **Ch 7** | मेरा बचपन | Autobiography-style story about childhood memories — past tense, personal writing | [▶ Watch](https://youtu.be/1crls-5aU6A) |
| `veena_ch8` | **Ch 8** | काजीरंगा राष्ट्रीय उद्यान की यात्रा | Travel story about Kaziranga National Park — travel writing, wildlife vocabulary | [▶ Watch](https://youtu.be/VEwS1daT7dc) |
| `veena_ch9` | **Ch 9** | न्याय | Story about fairness and moral judgement — moral values, comprehension, discussion | [▶ Watch](https://youtu.be/9G_Cq04Md0Q) |
| `veena_ch10` | **Ch 10** | तीन मछलियाँ | Folk tale about three fish and a fisherman — wisdom, planning, moral lessons | [▶ Watch](https://youtu.be/Z2uZIVJ-oe8) |
| `veena_ch11` | **Ch 11** | हमारे ये कलामंदिर | Story about art temples and cultural heritage — art appreciation, passive voice | [▶ Watch](https://youtu.be/DGUiIPtN7Qg) |

---

> **Source files:** `data/videoConfig.ts` · `data/ncertChapters.ts`

---

## 🧠 RAG Knowledge Base — Hindi (Veena)

> Current RAG coverage for Hindi is **0 chunks** — the Hindi PDF has not yet been processed.

| Source | File | Status |
|--------|------|--------|
| PDF extraction | `data/knowledgeChunks.ts` | ❌ Not yet added |
| Hand-curated Q&A | `data/qaData.ts` | ❌ Not yet added |

### How to Add Hindi to the RAG Knowledge Base

**Step 1 — Add PDF chunks** (auto-generation):
1. Place the Hindi PDF at the workspace root (e.g., `Hindi Class 5.pdf`)
2. Open `scripts/buildKnowledgeBase.py` and add to `PDF_FILES`:
```python
{"file": "Hindi Class 5.pdf", "subject": "Veena", "skip_pages": 8},
```
3. Run: `python scripts/buildKnowledgeBase.py`

**Step 2 — Add Q&A pairs** (manual):
Open `data/qaData.ts` and add a `HINDI_QA` array:
```ts
{
  id: 'qa-hi-1',
  subject: 'Veena',
  page: 1,
  chapter: 'किरण',
  content: 'Q: किरण कहानी का मुख्य पात्र कौन है?\nA: किरण एक छोटी लड़की है...'
},
```
Then include `...HINDI_QA` in `QA_KNOWLEDGE_BASE` in `data/qaData.ts`.

> Full RAG documentation → [RAG_KNOWLEDGE_BASE.md](RAG_KNOWLEDGE_BASE.md)
