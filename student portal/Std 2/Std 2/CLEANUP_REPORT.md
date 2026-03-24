# 🧹 Cleanup Report — Unused & Unnecessary Files

> Generated: March 8, 2026  
> Project: Smart School System — Std 3

---

## ❌ CONFIRMED UNUSED FILES (Safe to Delete)

These files are **never imported** anywhere in the project. Deleting them will NOT break the app.

### child/ (Student Side)

| # | File | Reason |
|---|------|--------|
| 1 | `child/_solar_new_tail.tsx` | Old/backup version of SolarSystemPage. **0 imports found.** |
| 2 | `child/SoundTest.tsx` | Debug/test file for sound. **0 imports found.** |
| 3 | `child/solarSystemData.ts` | Old solar system planet data. Replaced by `spaceEducationData.ts`. **0 imports found.** |
| 4 | `child/BottomNav.tsx` | Old bottom navigation. Replaced by StudentNav/StudentNavGrade3. **0 imports found.** |
| 5 | `child/FloatingMascot.tsx` | Old mascot component. Replaced by FoxMascot. **0 imports found.** |
| 6 | `child/TreeDashboard.tsx` | Old tree dashboard. **0 imports from any layout/page.** |
| 7 | `child/TreeWorld.tsx` | Old tree world screen. **0 imports found.** |
| 8 | `child/ColorMagicPage.tsx` | Color magic entry page — **0 imports from any layout.** Not routed anywhere. |

### child/buddy/ (Empty Folder)

| # | File | Reason |
|---|------|--------|
| 9 | `child/buddy/` (entire folder) | **Empty folder.** No files inside. |

### child/motion/

| # | File | Reason |
|---|------|--------|
| 10 | `child/motion/useSoftMotion.ts` | Custom motion hook. **0 imports found** (only self-referencing comment). |

### components/ (Shared Components)

| # | File | Reason |
|---|------|--------|
| 11 | `components/HomeworkCard.tsx` | Old homework card. **0 imports found.** |
| 12 | `components/HomeworkHelper.tsx` | Old homework helper. **0 imports found.** |
| 13 | `components/HomeworkHelperNew.tsx` | Replacement homework helper — also **0 imports found.** |
| 14 | `components/Navigation.tsx` | Old navigation component. **0 imports found.** |
| 15 | `components/NavigationNew.tsx` | Replacement navigation — also **0 imports found.** |
| 16 | `components/ParentDashboard.tsx` | Old parent dashboard. **0 imports found.** |
| 17 | `components/ParentDashboardNew.tsx` | Replacement parent dashboard — also **0 imports found.** |
| 18 | `components/AttendanceTracker.tsx` | Old attendance tracker. **0 imports found.** |
| 19 | `components/AttendanceGarden.tsx` | Old attendance garden. **0 imports found.** |
| 20 | `components/TopBar.tsx` | Old top bar. **0 imports found** (child/TopBar.tsx and parent/ParentTopBar.tsx are used instead). |
| 21 | `components/layout/DashboardLayout.tsx` | Old dashboard layout. **0 imports found.** |
| 22 | `components/Games/GameCenterArcade.tsx` | Old game center version. **0 imports found.** |
| 23 | `components/Games/GameCenterNew.tsx` | Old game center version. **0 imports found.** |
| 24 | `components/Games/GameCenter.tsx` | Old game center. **0 imports found** (Games uses `games/GamesPage.tsx` now). |

### components/Parent/ (Entire Folder)

| # | File | Reason |
|---|------|--------|
| 25 | `components/Parent/` (entire folder — 13 files) | **0 imports from anywhere.** All parent pages are in `parent/pages/` now. Files: AuditTimeline, EngagementInsightsPanel, GameInsightsPanel, InsightPanel, KnowledgeBasePanel, ParentControlCenter, ParentEngine, ParentGatewayHero, ParentGrowthSummary, QualitativeProgressCard, SafeModeToggle, TreeOverviewCard, WeeklySnapshot |

### components/AIHelper/ (Entire Folder)

| # | File | Reason |
|---|------|--------|
| 26 | `components/AIHelper/` (entire folder — 7 files) | **0 imports from anywhere.** AI buddy uses different components now. Files: AIHelperContainer, AIInput, AIResponseCard, ErrorState, LoadingSkeleton, RetrievalPanel, SuggestionChips |

### scripts/

| # | File | Reason |
|---|------|--------|
| 27 | `scripts/buildKnowledgeBase.mjs` | Build script, not part of app runtime. **0 imports.** |
| 28 | `scripts/buildKnowledgeBase.py` | Python build script. **0 imports.** |

### Folders

| # | Folder | Reason |
|---|--------|--------|
| 29 | `Smart-School-Systum-Class-1/` | Contains only `.git/` and `.gitattributes`. **Old git repo artifact. Not used.** |
| 30 | `Std 3/` | Contains NCERT PDF textbooks (English, Hindi, Maths, Science, Gujarati, Arts, PE). **Reference material only — not imported by app code.** Keep if you want PDFs locally, otherwise safe to remove. |

---

## 📄 MD FILES (Documentation Only — Not Needed for App Runtime)

None of these are imported by the app. They are reference docs only.

| # | File | Purpose | Keep? |
|---|------|---------|-------|
| 1 | `README.md` | Project readme | ✅ Keep |
| 2 | `STD3_QUICK_LINKS.md` | Quick reference links for Std 3 | Optional |
| 3 | `STD3_RHYMES_LINKS.md` | Rhyme YouTube links reference | Optional |
| 4 | `STD3_SUBJECTS_CHAPTERS.md` | Subject & chapter mapping reference | Optional |

---

## 📊 SUMMARY

| Category | Count | Action |
|----------|-------|--------|
| Unused .tsx/.ts files | 24 files | Safe to delete |
| Unused empty folders | 1 (buddy/) | Safe to delete |
| Unused folders with files | 3 (Parent/, AIHelper/, Smart-School-Systum-Class-1/) | Safe to delete |
| Build scripts (not runtime) | 2 files | Safe to delete |
| PDF reference folder (Std 3/) | 7 PDFs | Optional delete |
| MD documentation files | 4 files | Optional (keep README.md) |
| **Total deletable** | **~30+ files & 4 folders** | |

---

## ✅ HOW TO DELETE

Run this in terminal to remove all confirmed unused files:

```powershell
# Unused child/ files
Remove-Item "child/_solar_new_tail.tsx"
Remove-Item "child/SoundTest.tsx"
Remove-Item "child/solarSystemData.ts"
Remove-Item "child/BottomNav.tsx"
Remove-Item "child/FloatingMascot.tsx"
Remove-Item "child/TreeDashboard.tsx"
Remove-Item "child/TreeWorld.tsx"
Remove-Item "child/ColorMagicPage.tsx"
Remove-Item -Recurse "child/buddy"
Remove-Item "child/motion/useSoftMotion.ts"

# Unused components/ files
Remove-Item "components/HomeworkCard.tsx"
Remove-Item "components/HomeworkHelper.tsx"
Remove-Item "components/HomeworkHelperNew.tsx"
Remove-Item "components/Navigation.tsx"
Remove-Item "components/NavigationNew.tsx"
Remove-Item "components/ParentDashboard.tsx"
Remove-Item "components/ParentDashboardNew.tsx"
Remove-Item "components/AttendanceTracker.tsx"
Remove-Item "components/AttendanceGarden.tsx"
Remove-Item "components/TopBar.tsx"
Remove-Item "components/layout/DashboardLayout.tsx"
Remove-Item "components/Games/GameCenter.tsx"
Remove-Item "components/Games/GameCenterArcade.tsx"
Remove-Item "components/Games/GameCenterNew.tsx"
Remove-Item -Recurse "components/Parent"
Remove-Item -Recurse "components/AIHelper"

# Build scripts
Remove-Item -Recurse "scripts"

# Old git artifact
Remove-Item -Recurse "Smart-School-Systum-Class-1"
```
