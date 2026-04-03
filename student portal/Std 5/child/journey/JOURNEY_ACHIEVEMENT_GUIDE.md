# Journey Achievement Guide

This guide helps you request Journey changes quickly and clearly.

## 1) Current Journey Behavior

- Journey shows **all sections in one continuous path**.
- Section cards at top are clickable and scroll to that section.
- Clicking an unlocked node opens the achievement popup.
- Node states:
  - `completed` -> complete badge image
  - `active` -> ring image + sparkle
  - `locked` -> locked badge image
- Each section has 11 milestones:
  - Bronze `3`
  - Silver `3`
  - Gold `3`
  - Crystal `1`
  - Master `1`
  - Champion `1 medal`

## 2) Files You Can Ask Me To Change

- `child/journey/journeyEngine.ts`
  - Section order and labels
  - League thresholds
  - Progress calculation weights
  - Unlock/state logic
- `child/journey/journeyAssets.ts`
  - Background/path images
  - Icons, medals, achievement state images, effects
- `child/journey/JourneyPage.tsx`
  - Map layout and path UI
  - Background repeat/extend behavior
  - Section cards and click behavior
  - Achievement popup UI

## 3) Important Edit Points

### A) Section order and names
- File: `journeyEngine.ts`
- Key constant: `SECTION_DEFS`

### B) League thresholds and milestone count
- File: `journeyEngine.ts`
- Key constant: `LEAGUE_LAYOUT`
- Current thresholds:
  - Bronze: `7, 14, 20`
  - Silver: `27, 34, 40`
  - Gold: `47, 54, 60`
  - Crystal: `75`
  - Master: `90`
  - Champion: `100` (medal)

### C) Progress weight formula
- File: `journeyEngine.ts`
- Current formula:
  - Levels/Tasks: `50%`
  - Subject Quizzes: `20%`
  - Videos: `15%`
  - Books: `15%`
- Code uses: `levelsTasks * 0.5 + subjectQuizzes * 0.2 + videos * 0.15 + books * 0.15`

### D) Background first image + repeat image
- File: `journeyAssets.ts` and `JourneyPage.tsx`
- `journeyAssets.background` = first tile image
- `journeyAssets.path` = repeated tiles image
- In `JourneyPage.tsx`, tiling is:
  - index `0` -> `journeyAssets.background`
  - index `1+` -> `journeyAssets.path`

### E) Background extension seam
- File: `JourneyPage.tsx`
- Key constant: `BACKGROUND_OVERLAP`
- Increase value to make overlap more smooth.
- Decrease value to make repeat start earlier.

## 4) Achievement Popup (When Open)

On node click, popup currently shows:
- Section name
- League name
- Milestone target percent
- Section progress total
- Levels/Tasks, Subject Quizzes, Videos, Books metrics

If you want popup redesign, tell me:
- which fields to keep/remove
- whether to add CTA button and where it should go

## 5) Reusable Change Request Format

Use this format anytime:

```md
Journey change:
1) What to change:
- ...

2) Keep same:
- ...

3) File focus (optional):
- journeyEngine.ts / journeyAssets.ts / JourneyPage.tsx

4) Visual target:
- ...
```

## 6) Quick Examples

```md
Journey change:
1) What to change:
- Use image A as first background.
- Use image B for repeated extension.
- Set overlap to 300.

2) Keep same:
- Node positions and unlock logic.
```

```md
Journey change:
1) What to change:
- Bronze thresholds to 5,10,20.
- Gold to 45,55,65.
- Champion medal only at 95.

2) Keep same:
- Popup design.
```
