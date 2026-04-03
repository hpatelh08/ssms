# 🌍 EVS — Looking Around Class 5 Chapters & Video Links

> **Book:** Our Amazing World (NCERT) · **PDF:** `/books/std5/ncert/science.pdf`
>
> To change a video link: open `data/videoConfig.ts`, find the matching `id:` entry under `evsVideos`, and replace the `url:` value.

---

## Units & Chapters with YouTube Links

### Unit 1 — Life Around Us 🌊

| ID | Chapter | Topic Summary | YouTube Link |
|----|---------|---------------|--------------|
| `evs_ch1` | **Ch 1 — Water: The Essence of Life** | Sources of water, water cycle, importance of water, conservation and scarcity | [▶ Watch](https://youtu.be/0vvWmjEdTxU) |
| `evs_ch2` | **Ch 2 — Journey of a River** | How rivers form, tributaries, river plains, deltas, human dependence on rivers | [▶ Watch](https://youtu.be/Yye2_nUWmII) |

---

### Unit 2 — Health and Well-being 🥗

| ID | Chapter | Topic Summary | YouTube Link |
|----|---------|---------------|--------------|
| `evs_ch3` | **Ch 3 — The Mystery of Food** | Nutrients: carbs, proteins, fats, vitamins, minerals; balanced diet & digestion | [▶ Watch](https://youtu.be/KFQ3xOYnzpM) |
| `evs_ch4` | **Ch 4 — Our School: A Happy Place** | School environment, cleanliness, cooperation, inclusivity & well-being | [▶ Watch](https://youtu.be/SKg0MKLm-gI) |

---

### Unit 3 — Incredible India 🇮🇳

| ID | Chapter | Topic Summary | YouTube Link |
|----|---------|---------------|--------------|
| `evs_ch5` | **Ch 5 — Our Vibrant Country** | Diversity of India: languages, cultures, festivals, geography, unity | [▶ Watch](https://youtu.be/dbniKiwT6dA) |
| `evs_ch6` | **Ch 6 — Some Unique Places** | Heritage and geographical/cultural landmarks of India, monuments, natural wonders | [▶ Watch](https://youtu.be/X7lm8_uGgSI) |

---

### Unit 4 — Things Around Us 🔌

| ID | Chapter | Topic Summary | YouTube Link |
|----|---------|---------------|--------------|
| `evs_ch7` | **Ch 7 — Energy: How Things Work** | Sources of energy, how machines use energy, renewable vs non-renewable | [▶ Watch](https://youtu.be/V9tQxm71qQg) |
| `evs_ch8` | **Ch 8 — Clothes: How Things are Made** | Types of fibres, spinning, weaving, natural vs synthetic fibres | [▶ Watch](https://youtu.be/PjAyz8KB7VY) |

---

### Unit 5 — Our Amazing Planet 🪐

| ID | Chapter | Topic Summary | YouTube Link |
|----|---------|---------------|--------------|
| `evs_ch9` | **Ch 9 — Rhythms of Nature** | Seasons, day & night cycle, moon phases, tides, natural rhythms | [▶ Watch](https://youtu.be/jlgFqdX1KUk) |
| `evs_ch10` | **Ch 10 — Earth: Our Shared Home** | Environment, pollution, conservation, global warming, shared responsibility | [▶ Watch](https://youtu.be/I_A6DrZ--nM) |

---

## Quick Reference: All 10 Chapters

| Chapter | Unit | Name |
|---------|------|------|
| Ch 1 | Unit 1 — Life Around Us | Water: The Essence of Life |
| Ch 2 | Unit 1 — Life Around Us | Journey of a River |
| Ch 3 | Unit 2 — Health and Well-being | The Mystery of Food |
| Ch 4 | Unit 2 — Health and Well-being | Our School: A Happy Place |
| Ch 5 | Unit 3 — Incredible India | Our Vibrant Country |
| Ch 6 | Unit 3 — Incredible India | Some Unique Places |
| Ch 7 | Unit 4 — Things Around Us | Energy: How Things Work |
| Ch 8 | Unit 4 — Things Around Us | Clothes: How Things are Made |
| Ch 9 | Unit 5 — Our Amazing Planet | Rhythms of Nature |
| Ch 10 | Unit 5 — Our Amazing Planet | Earth: Our Shared Home |

---

> **Source files:** `data/videoConfig.ts` · `data/ncertChapters.ts`

---

## 🧠 RAG Knowledge Base — EVS (Looking Around)

> Current RAG coverage for EVS is **0 chunks** — the EVS PDF has not yet been processed.

| Source | File | Status |
|--------|------|--------|
| PDF extraction | `data/knowledgeChunks.ts` | ❌ Not yet added |
| Hand-curated Q&A | `data/qaData.ts` | ❌ Not yet added |

### How to Add EVS to the RAG Knowledge Base

**Step 1 — Add PDF chunks** (auto-generation):
1. Place the EVS PDF at the workspace root (e.g., `EVS Class 5.pdf`)
2. Open `scripts/buildKnowledgeBase.py` and add to `PDF_FILES`:
```python
{"file": "EVS Class 5.pdf", "subject": "LookingAround", "skip_pages": 8},
```
3. Run: `python scripts/buildKnowledgeBase.py`

**Step 2 — Add Q&A pairs** (manual):
Open `data/qaData.ts` and add an `EVS_QA` array following this format:
```ts
{
  id: 'qa-evs-1',
  subject: 'LookingAround',
  page: 1,
  chapter: 'Water—The Essence of Life',
  content: 'Q: What is the water cycle?\nA: The water cycle is the continuous movement of water...'
},
```
Then include `...EVS_QA` in `QA_KNOWLEDGE_BASE` in `data/qaData.ts`.

> Full RAG documentation → [RAG_KNOWLEDGE_BASE.md](RAG_KNOWLEDGE_BASE.md)
