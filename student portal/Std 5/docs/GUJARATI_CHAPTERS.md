# 🔤 Gujarati — GSEB Class 5 Chapters & Video Links

> **Book:** કુકકુટ (ગુજરાતી) · **PDF:** `/books/std5/gseb/gujarati.pdf`
>
> To change a video link: open `data/videoConfig.ts`, find the matching `id:` entry under `gujaratiVideos`, and replace the `url:` value.

---

## Chapter List with YouTube Links

| ID | Chapter | Gujarati Title | Topic Summary | YouTube Link |
|----|---------|----------------|---------------|--------------|
| `guj_ch1` | **પાઠ ૧** | ઘૂઘવતો દરિયો | Poem about the roaring sea — sea vocabulary, poetic expressions, Gujarati reading | [▶ Watch](https://youtu.be/gYYCynLJvVA) |
| `guj_ch2` | **પાઠ ૨** | બે વરસાદ ને પાંચ પીપળ | Nature story about rain and trees — nature vocabulary, comprehension | [▶ Watch](https://youtu.be/ZMrxfXBvYzU) |
| `guj_ch3` | **પાઠ ૩** | સવારે સળવળ | Poem about the morning — time expressions, morning routines, Gujarati rhymes | [▶ Watch](https://youtu.be/h3LzD64jXtU) |
| `guj_ch4` | **પાઠ ૪** | તડકો અધમણ ડાંગર ઝરમર | Story about sunshine and paddy fields — agriculture vocabulary, comprehension | [▶ Watch](https://youtu.be/SoTvzNRvNd0) |
| `guj_ch5` | **પાઠ ૫** | ધોયો અને ખાધો | Story about hygiene and food — health habits, Gujarati vocabulary | [▶ Watch](https://youtu.be/EsAEG4tS-ys) |
| `guj_ch6` | **પાઠ ૬** | અખિયોં કી ડિબિયામાં | Poem about eyes — body part vocabulary, poetic language, emotions | [▶ Watch](https://youtu.be/dg-v5ycv6Fc) |
| `guj_ch7` | **પાઠ ૭** | ઢેબરાંનો ન્યાય | Moral story involving traditional food and justice — moral values, story analysis | [▶ Watch](https://youtu.be/HPQNtuhN1ac) |
| `guj_ch8` | **પાઠ ૮** | લીલાછમ ખેતરનો રખેવાળ | Farming guardian story — farming vocabulary, responsibility, comprehension | [▶ Watch](https://youtu.be/9gr7gxXZQ28) |
| `guj_ch9` | **પાઠ ૯** | મારે પણ આવો ભાઈ હોય | Story about sibling relationships and emotions — family values, expressive writing | [▶ Watch](https://youtu.be/Zq2yVbmsf5Y) |
| `guj_ch10` | **પાઠ ૧૦** | ડુંગરનો ભેરુ | Story about friendship in the mountains — friendship values, descriptive language | [▶ Watch](https://youtu.be/9ORWgVOWi7E) |

---

> **Source files:** `data/videoConfig.ts` · `data/ncertChapters.ts`

---

## 🧠 RAG Knowledge Base — Gujarati (GSEB)

> Current RAG coverage for Gujarati is **0 chunks** — the Gujarati PDF has not yet been processed.

| Source | File | Status |
|--------|------|--------|
| PDF extraction | `data/knowledgeChunks.ts` | ❌ Not yet added |
| Hand-curated Q&A | `data/qaData.ts` | ❌ Not yet added |

### How to Add Gujarati to the RAG Knowledge Base

**Step 1 — Add PDF chunks** (auto-generation):
1. Place the Gujarati PDF at the workspace root (e.g., `Gujarati Class 5.pdf`)
2. Open `scripts/buildKnowledgeBase.py` and add to `PDF_FILES`:
```python
{"file": "Gujarati Class 5.pdf", "subject": "Gujarati", "skip_pages": 8},
```
3. Run: `python scripts/buildKnowledgeBase.py`

**Step 2 — Add Q&A pairs** (manual):
Open `data/qaData.ts` and add a `GUJARATI_QA` array:
```ts
{
  id: 'qa-guj-1',
  subject: 'Gujarati',
  page: 1,
  chapter: 'ઘૂઘવતો દરિયો',
  content: 'Q: "ઘૂઘવતો દરિયો" પાઠ શું શીખવે છે?\nA: આ કવિતા સમુદ્ર વિશે છે...'
},
```
Then include `...GUJARATI_QA` in `QA_KNOWLEDGE_BASE` in `data/qaData.ts`.

> Full RAG documentation → [RAG_KNOWLEDGE_BASE.md](RAG_KNOWLEDGE_BASE.md)
