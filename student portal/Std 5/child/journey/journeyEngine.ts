import { ALL_BOOKS } from '../../data/bookConfig';
import { ALL_VIDEOS, VIDEO_DATA } from '../../data/videoConfig';
import type { JourneySectionVisualKey } from './journeyAssets';

export type JourneySectionId =
  | 'gamesArena'
  | 'maths'
  | 'english'
  | 'ncertLearning'
  | 'brainBooster'
  | 'puzzleSolver';

export type JourneyLeagueId = 'bronze' | 'silver' | 'gold' | 'crystal' | 'master' | 'champion';
export type JourneyNodeState = 'locked' | 'active' | 'completed';

export interface SectionMetrics {
  levelsTasks: number;
  subjectQuizzes: number;
  videos: number;
  books: number;
  total: number;
}

export interface JourneySectionSnapshot {
  id: JourneySectionId;
  label: string;
  visualKey: JourneySectionVisualKey;
  gradient: string;
  metrics: SectionMetrics;
  currentLeague: JourneyLeagueId;
  completedMilestones: number;
  totalMilestones: number;
}

export interface JourneyNodeSnapshot {
  id: string;
  sectionId: JourneySectionId;
  sectionLabel: string;
  sectionVisualKey: JourneySectionVisualKey;
  sectionGradient: string;
  leagueId: JourneyLeagueId;
  leagueLabel: string;
  milestoneIndexInSection: number;
  globalIndex: number;
  nodeType: 'achievement' | 'medal';
  threshold: number;
  state: JourneyNodeState;
  isNewlyUnlocked: boolean;
  showSectionTag: boolean;
  showLeagueTag: boolean;
}

export interface JourneySnapshot {
  sections: JourneySectionSnapshot[];
  nodes: JourneyNodeSnapshot[];
  totalMilestones: number;
  completedMilestones: number;
  overallProgress: number;
  activeNodeId: string | null;
  newlyUnlockedIds: string[];
}

interface SectionDef {
  id: JourneySectionId;
  label: string;
  visualKey: JourneySectionVisualKey;
  gradient: string;
}

interface LeagueLayout {
  id: JourneyLeagueId;
  label: string;
  thresholds: number[];
  nodeType: 'achievement' | 'medal';
}

interface MasteryMiniLevel {
  completed?: boolean;
  score?: number;
  total?: number;
}

interface MasteryDifficulty {
  miniLevels?: Record<string, MasteryMiniLevel>;
}

interface MasteryGameProgress {
  easy?: MasteryDifficulty;
  intermediate?: MasteryDifficulty;
  difficult?: MasteryDifficulty;
}

interface GP2Difficulty {
  totalAttempts?: number;
  correctAnswers?: number;
}

interface VideoProgressEntry {
  status?: string;
  watchTimeMs?: number;
}

interface ReadingQuizEntry {
  score?: number;
  total?: number;
}

interface ChapterProgressEntry {
  completionPercent?: number;
  quiz?: number;
  subject?: string;
}

type MasteryDifficultyKey = 'easy' | 'intermediate' | 'difficult';

interface ParsedMasteryEntry {
  subject: string;
  chapter: string;
  gameType: string;
  progress: MasteryGameProgress;
}

const UNLOCKED_NODE_KEY = 'journey_unlocked_nodes_v3';

const MASTERY_DIFFICULTIES: MasteryDifficultyKey[] = ['easy', 'intermediate', 'difficult'];
const DEFAULT_LEVEL_CONFIG: Record<MasteryDifficultyKey, number> = {
  easy: 5,
  intermediate: 5,
  difficult: 5,
};
const EXTENDED_LEVEL_CONFIG: Record<MasteryDifficultyKey, number> = {
  easy: 40,
  intermediate: 30,
  difficult: 30,
};
const EXTENDED_LEVEL_SUBJECTS = new Set(['brain-boost', 'puzzle-zone']);

const BRAIN_GAME_IDS = ['missingNumber', 'memoryCards', 'hiddenObject'] as const;
const PUZZLE_GAME_IDS = ['findThePair', 'brainMaze', 'logicPuzzle'] as const;
const ALL_ARCADE_GAME_IDS = [
  'colorMatch',
  'missingNumber',
  'biggerOrSmaller',
  'oppositeWords',
  'animalSound',
  'pictureMemory',
  'wordLadder',
  'quickCompare',
  'shapeMemory',
  'findThePair',
  'speedMath',
  'brainMaze',
  'hiddenObject',
  'logicPuzzle',
  'memoryCards',
] as const;

const GAMES_ARENA_IDS = ALL_ARCADE_GAME_IDS.filter(
  (id) => !BRAIN_GAME_IDS.includes(id as (typeof BRAIN_GAME_IDS)[number]) && !PUZZLE_GAME_IDS.includes(id as (typeof PUZZLE_GAME_IDS)[number]),
);

const SECTION_DEFS: SectionDef[] = [
  {
    id: 'gamesArena',
    label: 'Games Arena',
    visualKey: 'gamesArena',
    gradient: 'linear-gradient(135deg,#3f8f3a,#6ba85b)',
  },
  {
    id: 'maths',
    label: 'Maths',
    visualKey: 'maths',
    gradient: 'linear-gradient(135deg,#4d7a38,#3f8f3a)',
  },
  {
    id: 'english',
    label: 'English',
    visualKey: 'english',
    gradient: 'linear-gradient(135deg,#4d7a38,#7aa344)',
  },
  {
    id: 'ncertLearning',
    label: 'NCERT Learning',
    visualKey: 'ncertLearning',
    gradient: 'linear-gradient(135deg,#2f6f3d,#4f8a50)',
  },
  {
    id: 'brainBooster',
    label: 'Brain Booster',
    visualKey: 'brainBooster',
    gradient: 'linear-gradient(135deg,#547f3b,#8fb168)',
  },
  {
    id: 'puzzleSolver',
    label: 'Puzzle Solver',
    visualKey: 'puzzleSolver',
    gradient: 'linear-gradient(135deg,#16a34a,#22c55e)',
  },
];

const LEAGUE_LAYOUT: LeagueLayout[] = [
  { id: 'bronze', label: 'Bronze', thresholds: [7, 14, 20], nodeType: 'achievement' },
  { id: 'silver', label: 'Silver', thresholds: [27, 34, 40], nodeType: 'achievement' },
  { id: 'gold', label: 'Gold', thresholds: [47, 54, 60], nodeType: 'achievement' },
  { id: 'crystal', label: 'Crystal', thresholds: [75], nodeType: 'achievement' },
  { id: 'master', label: 'Master', thresholds: [90], nodeType: 'achievement' },
  { id: 'champion', label: 'Champion', thresholds: [100], nodeType: 'medal' },
];

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function hasWindow(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readStars(): Record<string, number> {
  if (!hasWindow()) return {};
  return parseJSON<Record<string, number>>(localStorage.getItem('arcade_game_stars'), {});
}

function readMastery(): Record<string, MasteryGameProgress> {
  if (!hasWindow()) return {};
  return parseJSON<Record<string, MasteryGameProgress>>(localStorage.getItem('gameMastery'), {});
}

function readVideoProgress(): Record<string, VideoProgressEntry> {
  if (!hasWindow()) return {};
  return parseJSON<Record<string, VideoProgressEntry>>(localStorage.getItem('ssms_video_progress'), {});
}

function readReadingQuizzes(): ReadingQuizEntry[] {
  if (!hasWindow()) return [];
  return parseJSON<ReadingQuizEntry[]>(localStorage.getItem('ssms_reading_quizzes'), []);
}

function readChapterProgress(): Record<string, ChapterProgressEntry> {
  if (!hasWindow()) return {};
  return parseJSON<Record<string, ChapterProgressEntry>>(localStorage.getItem('ssms_chapter_progress'), {});
}

function readGP2(gameId: string): Record<string, GP2Difficulty> {
  if (!hasWindow()) return {};
  return parseJSON<Record<string, GP2Difficulty>>(localStorage.getItem(`ssms_gp2_${gameId}`), {});
}

function readGP2GameIds(): string[] {
  if (!hasWindow()) return [];
  const ids: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith('ssms_gp2_')) continue;
    ids.push(key.slice('ssms_gp2_'.length));
  }
  return ids;
}

function computeArcadeLevelPercent(gameIds: readonly string[], stars: Record<string, number>): number {
  if (!gameIds.length) return 0;
  let total = 0;
  for (const id of gameIds) {
    const star = Math.max(0, Math.min(3, stars[id] ?? 0));
    total += (star / 3) * 100;
  }
  return clampPercent(total / gameIds.length);
}

function computeArcadeAccuracyPercent(gameIds: readonly string[]): number {
  let attempts = 0;
  let correct = 0;
  for (const gameId of gameIds) {
    const gp2 = readGP2(gameId);
    for (const diff of ['easy', 'intermediate', 'difficult']) {
      const data = gp2[diff];
      if (!data) continue;
      attempts += data.totalAttempts ?? 0;
      correct += data.correctAnswers ?? 0;
    }
  }
  if (attempts <= 0) return 0;
  return clampPercent((correct / attempts) * 100);
}

function parseMasteryKey(key: string): { subject: string; chapter: string; gameType: string } | null {
  const first = key.indexOf('_');
  const last = key.lastIndexOf('_');
  if (first <= 0 || last <= first) return null;
  return {
    subject: key.slice(0, first),
    chapter: key.slice(first + 1, last),
    gameType: key.slice(last + 1),
  };
}

function selectMasteryEntries(
  mastery: Record<string, MasteryGameProgress>,
  subjects: readonly string[],
  allowedGameIds?: readonly string[],
): ParsedMasteryEntry[] {
  const subjectSet = new Set(subjects);
  const gameIdSet = allowedGameIds?.length ? new Set(allowedGameIds) : null;
  const entries: ParsedMasteryEntry[] = [];

  for (const [key, progress] of Object.entries(mastery)) {
    if (!progress) continue;
    const parsed = parseMasteryKey(key);
    if (!parsed) continue;
    if (!subjectSet.has(parsed.subject)) continue;
    if (gameIdSet && !gameIdSet.has(parsed.gameType)) continue;
    entries.push({
      subject: parsed.subject,
      chapter: parsed.chapter,
      gameType: parsed.gameType,
      progress,
    });
  }

  return entries;
}

function levelConfigForSubject(subject: string): Record<MasteryDifficultyKey, number> {
  return EXTENDED_LEVEL_SUBJECTS.has(subject) ? EXTENDED_LEVEL_CONFIG : DEFAULT_LEVEL_CONFIG;
}

function expectedLevelsForEntry(
  subject: string,
  diff: MasteryDifficultyKey,
  miniLevels: Record<string, MasteryMiniLevel> | undefined,
): number {
  const baseExpected = levelConfigForSubject(subject)[diff];
  if (!miniLevels) return baseExpected;

  const numericLevels = Object.keys(miniLevels)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  const observedMax = numericLevels.length ? Math.max(...numericLevels) : 0;
  return Math.max(baseExpected, observedMax);
}

function computeMasteryLevelPercent(entries: ParsedMasteryEntry[]): number {
  if (!entries.length) return 0;

  let totalExpectedLevels = 0;
  let completedLevels = 0;

  for (const entry of entries) {
    for (const diff of MASTERY_DIFFICULTIES) {
      const miniLevels = entry.progress[diff]?.miniLevels;
      totalExpectedLevels += expectedLevelsForEntry(entry.subject, diff, miniLevels);
      if (!miniLevels) continue;
      completedLevels += Object.values(miniLevels).filter((item) => item?.completed).length;
    }
  }

  if (totalExpectedLevels <= 0) return 0;
  return clampPercent((completedLevels / totalExpectedLevels) * 100);
}

function computeMasteryQuizPercent(entries: ParsedMasteryEntry[]): number {
  if (!entries.length) return 0;

  let totalQuestions = 0;
  let totalCorrect = 0;

  for (const entry of entries) {
    for (const diff of MASTERY_DIFFICULTIES) {
      const miniLevels = entry.progress[diff]?.miniLevels;
      if (!miniLevels) continue;
      for (const mini of Object.values(miniLevels)) {
        if (!mini) continue;
        totalQuestions += mini.total ?? 0;
        totalCorrect += mini.score ?? 0;
      }
    }
  }

  if (totalQuestions <= 0) return 0;
  return clampPercent((totalCorrect / totalQuestions) * 100);
}

function extractArcadeGameIdsFromMastery(mastery: Record<string, MasteryGameProgress>): string[] {
  const ids: string[] = [];
  for (const key of Object.keys(mastery)) {
    if (!key.startsWith('arcade_')) continue;
    const parsed = parseMasteryKey(key);
    if (!parsed) continue;
    ids.push(parsed.gameType);
  }
  return dedupe(ids);
}

function computeVideosPercent(videoIds: string[], videoProgress: Record<string, VideoProgressEntry>): number {
  if (!videoIds.length) return 0;
  let completed = 0;
  for (const id of videoIds) {
    const entry = videoProgress[id];
    if (!entry) continue;
    const done = entry.status === 'completed' || (entry.watchTimeMs ?? 0) >= 30_000;
    if (done) completed += 1;
  }
  return clampPercent((completed / videoIds.length) * 100);
}

function computeBooksPercent(bookFilter: (book: (typeof ALL_BOOKS)[number]) => boolean, chapterProgress: Record<string, ChapterProgressEntry>): number {
  const books = ALL_BOOKS.filter(bookFilter);
  let totalChapters = 0;
  let completedChapters = 0;

  for (const book of books) {
    totalChapters += book.chapters.length;
    for (const chapter of book.chapters) {
      const key = `${book.id}::${chapter.id}`;
      const progress = chapterProgress[key];
      if ((progress?.completionPercent ?? 0) >= 80) completedChapters += 1;
    }
  }

  if (totalChapters <= 0) return 0;
  return clampPercent((completedChapters / totalChapters) * 100);
}

function computeChapterQuizPercent(
  chapterProgress: Record<string, ChapterProgressEntry>,
  subjectMatcher: (subject: string) => boolean,
): number {
  let total = 0;
  let count = 0;
  for (const entry of Object.values(chapterProgress)) {
    const subject = (entry.subject ?? '').toLowerCase();
    if (!subjectMatcher(subject)) continue;
    const quiz = entry.quiz ?? 0;
    if (quiz <= 0) continue;
    total += quiz;
    count += 1;
  }
  if (count <= 0) return 0;
  return clampPercent(total / count);
}

function computeReadingQuizPercent(readingQuizzes: ReadingQuizEntry[]): number {
  if (!readingQuizzes.length) return 0;
  let total = 0;
  let count = 0;
  for (const quiz of readingQuizzes) {
    const score = quiz.score ?? 0;
    const max = quiz.total ?? 0;
    if (max <= 0) continue;
    total += (score / max) * 100;
    count += 1;
  }
  if (count <= 0) return 0;
  return clampPercent(total / count);
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function getSectionMetrics(
  sectionId: JourneySectionId,
  stars: Record<string, number>,
  mastery: Record<string, MasteryGameProgress>,
  videoProgress: Record<string, VideoProgressEntry>,
  chapterProgress: Record<string, ChapterProgressEntry>,
  readingQuizzes: ReadingQuizEntry[],
): SectionMetrics {
  const globalVideoIds = ALL_VIDEOS.map((video) => video.id);

  const videosBySection: Record<JourneySectionId, string[]> = {
    gamesArena: globalVideoIds,
    maths: VIDEO_DATA.Maths.map((video) => video.id),
    english: VIDEO_DATA.English.map((video) => video.id),
    ncertLearning: dedupe([...VIDEO_DATA.English, ...VIDEO_DATA.Maths, ...VIDEO_DATA.Science].map((video) => video.id)),
    brainBooster: globalVideoIds,
    puzzleSolver: globalVideoIds,
  };

  const booksBySection: Record<JourneySectionId, (book: (typeof ALL_BOOKS)[number]) => boolean> = {
    gamesArena: () => true,
    maths: (book) => ['mathematics', 'maths'].includes(book.subject.toLowerCase()),
    english: (book) => book.subject.toLowerCase() === 'english',
    ncertLearning: (book) => book.board === 'ncert',
    brainBooster: () => true,
    puzzleSolver: () => true,
  };

  const puzzleIdSet = new Set<string>(PUZZLE_GAME_IDS);
  const brainIdSet = new Set<string>(BRAIN_GAME_IDS);
  const discoveredArcadeIds = dedupe([
    ...ALL_ARCADE_GAME_IDS,
    ...Object.keys(stars),
    ...readGP2GameIds(),
    ...extractArcadeGameIdsFromMastery(mastery),
  ]);
  const gamesArenaIds = discoveredArcadeIds.filter((id) => !brainIdSet.has(id) && !puzzleIdSet.has(id));
  const brainIds = dedupe([...BRAIN_GAME_IDS, ...discoveredArcadeIds.filter((id) => brainIdSet.has(id))]);
  const puzzleIds = dedupe([...PUZZLE_GAME_IDS, ...discoveredArcadeIds.filter((id) => puzzleIdSet.has(id))]);

  let levelsTasks = 0;
  let subjectQuizzes = 0;

  if (sectionId === 'gamesArena') {
    const masteryEntries = selectMasteryEntries(mastery, ['arcade'], gamesArenaIds);
    levelsTasks = Math.max(
      computeArcadeLevelPercent(gamesArenaIds, stars),
      computeMasteryLevelPercent(masteryEntries),
    );
    subjectQuizzes = Math.max(
      computeArcadeAccuracyPercent(gamesArenaIds),
      computeMasteryQuizPercent(masteryEntries),
    );
  }

  if (sectionId === 'maths') {
    const masteryEntries = selectMasteryEntries(mastery, ['maths']);
    levelsTasks = computeMasteryLevelPercent(masteryEntries);
    subjectQuizzes = Math.max(
      computeMasteryQuizPercent(masteryEntries),
      computeChapterQuizPercent(chapterProgress, (subject) => subject.includes('math')),
    );
  }

  if (sectionId === 'english') {
    const masteryEntries = selectMasteryEntries(mastery, ['english']);
    levelsTasks = computeMasteryLevelPercent(masteryEntries);
    subjectQuizzes = Math.max(
      computeMasteryQuizPercent(masteryEntries),
      computeChapterQuizPercent(chapterProgress, (subject) => subject.includes('english')),
    );
  }

  if (sectionId === 'ncertLearning') {
    levelsTasks = computeBooksPercent((book) => book.board === 'ncert', chapterProgress);
    subjectQuizzes = Math.max(
      computeReadingQuizPercent(readingQuizzes),
      computeChapterQuizPercent(chapterProgress, (subject) => subject.length > 0),
    );
  }

  if (sectionId === 'brainBooster') {
    const masteryEntries = selectMasteryEntries(mastery, ['brain-boost', 'arcade'], brainIds);
    levelsTasks = Math.max(
      computeArcadeLevelPercent(brainIds, stars),
      computeMasteryLevelPercent(masteryEntries),
    );
    subjectQuizzes = Math.max(
      computeArcadeAccuracyPercent(brainIds),
      computeMasteryQuizPercent(masteryEntries),
    );
  }

  if (sectionId === 'puzzleSolver') {
    const masteryEntries = selectMasteryEntries(mastery, ['puzzle-zone', 'arcade'], puzzleIds);
    levelsTasks = Math.max(
      computeArcadeLevelPercent(puzzleIds, stars),
      computeMasteryLevelPercent(masteryEntries),
    );
    subjectQuizzes = Math.max(
      computeArcadeAccuracyPercent(puzzleIds),
      computeMasteryQuizPercent(masteryEntries),
    );
  }

  const videos = computeVideosPercent(videosBySection[sectionId], videoProgress);
  const books = computeBooksPercent(booksBySection[sectionId], chapterProgress);

  const total = clampPercent(levelsTasks * 0.5 + subjectQuizzes * 0.2 + videos * 0.15 + books * 0.15);

  return {
    levelsTasks: clampPercent(levelsTasks),
    subjectQuizzes: clampPercent(subjectQuizzes),
    videos,
    books,
    total,
  };
}

function getLeagueByProgress(progress: number): JourneyLeagueId {
  if (progress < 20) return 'bronze';
  if (progress < 40) return 'silver';
  if (progress < 60) return 'gold';
  if (progress < 75) return 'crystal';
  if (progress < 90) return 'master';
  return 'champion';
}

function loadUnlockedNodeSet(): Set<string> {
  if (!hasWindow()) return new Set<string>();
  const saved = parseJSON<string[]>(localStorage.getItem(UNLOCKED_NODE_KEY), []);
  return new Set(saved);
}

function saveUnlockedNodeSet(set: Set<string>): void {
  if (!hasWindow()) return;
  localStorage.setItem(UNLOCKED_NODE_KEY, JSON.stringify([...set]));
}

export function computeJourneySnapshot(): JourneySnapshot {
  const stars = readStars();
  const mastery = readMastery();
  const videoProgress = readVideoProgress();
  const chapterProgress = readChapterProgress();
  const readingQuizzes = readReadingQuizzes();

  const sections: JourneySectionSnapshot[] = SECTION_DEFS.map((section) => {
    const metrics = getSectionMetrics(section.id, stars, mastery, videoProgress, chapterProgress, readingQuizzes);
    return {
      id: section.id,
      label: section.label,
      visualKey: section.visualKey,
      gradient: section.gradient,
      metrics,
      currentLeague: getLeagueByProgress(metrics.total),
      completedMilestones: 0,
      totalMilestones: 11,
    };
  });

  const unlockedFromStorage = loadUnlockedNodeSet();
  const nodes: JourneyNodeSnapshot[] = [];
  const completedIdsNow: string[] = [];

  let globalIndex = 0;
  for (const section of sections) {
    const sectionNodes: JourneyNodeSnapshot[] = [];
    let milestoneIndexInSection = 0;
    let activeAssignedForSection = false;

    for (const league of LEAGUE_LAYOUT) {
      for (let indexInLeague = 0; indexInLeague < league.thresholds.length; indexInLeague += 1) {
        milestoneIndexInSection += 1;
        const threshold = league.thresholds[indexInLeague];
        const achieved = section.metrics.total >= threshold;

        let state: JourneyNodeState = 'locked';
        if (achieved) {
          state = 'completed';
        } else if (!activeAssignedForSection) {
          state = 'active';
          activeAssignedForSection = true;
        }

        const nodeId = `${section.id}-${league.id}-${indexInLeague + 1}`;
        const isNewlyUnlocked = state === 'completed' && !unlockedFromStorage.has(nodeId);
        if (state === 'completed') completedIdsNow.push(nodeId);

        sectionNodes.push({
          id: nodeId,
          sectionId: section.id,
          sectionLabel: section.label,
          sectionVisualKey: section.visualKey,
          sectionGradient: section.gradient,
          leagueId: league.id,
          leagueLabel: league.label,
          milestoneIndexInSection,
          globalIndex,
          nodeType: league.nodeType,
          threshold,
          state,
          isNewlyUnlocked,
          showSectionTag: milestoneIndexInSection === 1,
          showLeagueTag: indexInLeague === 0,
        });
        globalIndex += 1;
      }
    }

    section.completedMilestones = sectionNodes.filter((node) => node.state === 'completed').length;
    nodes.push(...sectionNodes);
  }

  const mergedUnlocks = new Set<string>([...unlockedFromStorage, ...completedIdsNow]);
  saveUnlockedNodeSet(mergedUnlocks);

  const completedMilestones = nodes.filter((node) => node.state === 'completed').length;
  const totalMilestones = nodes.length;
  const overallProgress = clampPercent(
    sections.reduce((sum, section) => sum + section.metrics.total, 0) / Math.max(1, sections.length),
  );
  const activeNode = nodes.find((node) => node.state === 'active');
  const newlyUnlockedIds = nodes.filter((node) => node.isNewlyUnlocked).map((node) => node.id);

  return {
    sections,
    nodes,
    totalMilestones,
    completedMilestones,
    overallProgress,
    activeNodeId: activeNode?.id ?? null,
    newlyUnlockedIds,
  };
}
