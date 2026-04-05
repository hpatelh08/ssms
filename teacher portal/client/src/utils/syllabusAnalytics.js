export function normalizeSubjectKey(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function normalizeChapterStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'complete' || normalized === 'completed' || normalized === 'done') return 'complete';
  if (normalized === 'half' || normalized === 'half complete' || normalized === 'half-complete' || normalized === 'in progress' || normalized === 'partial') {
    return 'half';
  }
  return 'start';
}

export function computeChapterProgress(chapters = []) {
  const chapterList = Array.isArray(chapters) ? chapters : [];
  let totalChapters = 0;
  let completedChapters = 0;
  let halfChapters = 0;
  let startChapters = 0;

  chapterList.forEach((chapter) => {
    totalChapters += 1;
    const status = normalizeChapterStatus(chapter?.status);

    if (status === 'complete') {
      completedChapters += 1;
      return;
    }

    if (status === 'half') {
      halfChapters += 1;
      return;
    }

    startChapters += 1;
  });

  const percent = totalChapters > 0
    ? Math.round(((completedChapters * 100) + (halfChapters * 50)) / totalChapters)
    : 0;

  return {
    totalChapters,
    completedChapters,
    halfChapters,
    startChapters,
    percent
  };
}

export function buildSyllabusAnalyticsFromMap(syllabusMap = {}) {
  const results = [];

  Object.entries(syllabusMap || {}).forEach(([subjectKey, chapters]) => {
    const subjectName = String(subjectKey || '').replace(/-\d+$/, '').trim();
    const progress = computeChapterProgress(chapters);
    results.push({
      subjectKey,
      subjectName,
      ...progress
    });
  });

  return results;
}

export function readSyllabusAnalyticsForClass(className, section) {
  if (typeof window === 'undefined') return [];

  const classKey = `${String(className || '').trim()}-${String(section || '').trim()}`;
  const saved = localStorage.getItem(`syllabus-data-${classKey}`);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return buildSyllabusAnalyticsFromMap(parsed);
  } catch {
    return [];
  }
}
