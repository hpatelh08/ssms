import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ChildScreen } from './ChildLayout';

type DifficultyKey = 'easy' | 'intermediate' | 'difficult';

interface MiniLevelProgress {
  completed?: boolean;
}

interface DifficultyProgress {
  miniLevels?: Record<string, MiniLevelProgress>;
}

interface GameProgress {
  easy?: DifficultyProgress;
  intermediate?: DifficultyProgress;
  difficult?: DifficultyProgress;
}

type GameMasteryStore = Record<string, GameProgress>;

interface JourneySection {
  id: 'arcade' | 'maths' | 'english' | 'fillblanks';
  title: string;
  totalLevels: number;
  completedLevels: number;
  achievements: number;
  maxAchievements: number;
}

interface JourneyPageProps {
  onNavigate?: (screen: ChildScreen) => void;
}

const LEVELS_PER_ACHIEVEMENT = 50;
const BOX_IMAGES = Array.from({ length: 5 }, (_, idx) => `/assets/journey/5 box/${idx + 1}-box.png`);
const OPEN_BOX_IMAGES = Array.from({ length: 5 }, (_, idx) => `/assets/journey/open-5-box/${idx + 1}-box-open.png`);
const OPENED_BOXES_KEY = 'journey_opened_boxes';
const ACHIEVEMENT_UNLOCKED_KEY = 'journey_achievement_unlocked';
const GAME_SECTION_REDIRECT_KEY = 'ssms_navigate_to_game_section';
const GAME_LEVEL_REDIRECT_KEY = 'ssms_navigate_to_game_level_v1';
const PENDING_ACHIEVEMENT_KEY = 'journey_pending_achievement_v1';
const JOURNEY_PROGRESS_KEY = 'journey_achievement_progress_v1';

type SubjectType = 'arcade' | 'maths' | 'english' | 'fillblanks';

interface PendingAchievementState {
  user_id: string;
  achievement_no: number;
  subject_type: SubjectType;
  required_levels: number;
  levels_completed: number;
  boxes_opened: number;
  achievement_unlocked: boolean;
  created_at: number;
}

interface JourneyGameRedirectPayload {
  subject_type: SubjectType;
  achievement_no: number;
  box_no: number;
}

interface AchievementTitleStore {
  arcade: string[];
  maths: string[];
  english: string[];
  fillblanks: string[];
}

const ARCADE_ACHIEVEMENT_COUNT = 10;
const MATHS_ACHIEVEMENT_COUNT = 60;
const ENGLISH_ACHIEVEMENT_COUNT = 96;
const FILLBLANKS_ACHIEVEMENT_COUNT = 4;

const ARCADE_START = 1;
const MATHS_START = ARCADE_START + ARCADE_ACHIEVEMENT_COUNT;
const ENGLISH_START = MATHS_START + MATHS_ACHIEVEMENT_COUNT;
const FILLBLANKS_START = ENGLISH_START + ENGLISH_ACHIEVEMENT_COUNT;

const ARCADE_ACHIEVEMENT_IMAGES = [
  'arcade-beginner.png',
  'arcade-explorer.png',
  'arcade-learner.png',
  'arcade-player.png',
  'arcade-challenger.png',
  'arcade-skilled.png',
  'arcade-expert.png',
  'arcade-master.png',
  'arcade-champion.png',
  'arcade-Legend.png',
];

function resolveTargetGameSection(achievementNo: number | null): SubjectType {
  if (achievementNo === null) return 'arcade';
  if (achievementNo >= ARCADE_START && achievementNo < MATHS_START) return 'arcade';
  if (achievementNo >= MATHS_START && achievementNo < ENGLISH_START) return 'maths';
  if (achievementNo >= ENGLISH_START && achievementNo < FILLBLANKS_START) return 'english';
  return 'fillblanks';
}

function getSubjectChapterNo(achievementNo: number | null, subject?: SubjectType): number {
  const section = subject ?? resolveTargetGameSection(achievementNo);
  const value = achievementNo ?? 1;

  if (section === 'arcade') return Math.max(1, value - (ARCADE_START - 1));
  if (section === 'maths') return Math.max(1, value - (MATHS_START - 1));
  if (section === 'english') return Math.max(1, value - (ENGLISH_START - 1));
  return Math.max(1, value - (FILLBLANKS_START - 1));
}

function requiredLevelsForAchievement(achievementNo: number | null, subject?: SubjectType): number {
  return getSubjectChapterNo(achievementNo, subject) * LEVELS_PER_ACHIEVEMENT;
}

function requiredLevelsForBox(achievementNo: number | null, boxNo: number, subject?: SubjectType): number {
  const chapterNo = getSubjectChapterNo(achievementNo, subject);
  const chapterBase = (chapterNo - 1) * LEVELS_PER_ACHIEVEMENT;
  return chapterBase + (boxNo * 10);
}

function parseAchievementTitleFile(raw: string): AchievementTitleStore {
  const parsed: AchievementTitleStore = { arcade: [], maths: [], english: [], fillblanks: [] };
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  let section: keyof AchievementTitleStore | null = null;

  lines.forEach(line => {
    if (/arcade achievements/i.test(line)) {
      section = 'arcade';
      return;
    }
    if (/math achievements/i.test(line)) {
      section = 'maths';
      return;
    }
    if (/english achievements/i.test(line)) {
      section = 'english';
      return;
    }
    if (/fill in the blanks achievements/i.test(line)) {
      section = 'fillblanks';
      return;
    }

    if (/^[-\s>]+/.test(line) || /^(arcade|math|english|total)\s*=\s*\d+/i.test(line)) {
      return;
    }

    if (!section) return;
    parsed[section].push(line);
  });

  return parsed;
}

function getAchievementDisplayTitle(
  subject: SubjectType,
  chapterNo: number,
  titles: AchievementTitleStore,
): string {
  if (subject === 'fillblanks') {
    if (titles.fillblanks[chapterNo - 1]) return titles.fillblanks[chapterNo - 1];
    return `Fill in the Blanks Achievement ${chapterNo}`;
  }

  const list = titles[subject];
  if (list[chapterNo - 1]) return list[chapterNo - 1];

  const prefix = subject === 'arcade' ? 'Arcade' : subject === 'maths' ? 'Math' : 'English';
  return `${prefix} Achievement ${chapterNo}`;
}

function getAchievementImageSrc(subject: SubjectType, chapterNo: number): string {
  if (subject === 'arcade') {
    const file = ARCADE_ACHIEVEMENT_IMAGES[chapterNo - 1] ?? ARCADE_ACHIEVEMENT_IMAGES[0];
    return `/assets/journey/buttons/arcade game/${file}`;
  }
  if (subject === 'maths') {
    return '/assets/journey/buttons/math game/math-jouney-button.png';
  }
  if (subject === 'english') {
    return '/assets/journey/buttons/english game/english-journey-game.png';
  }
  return '/assets/journey/buttons/fill in the blanks/fill-in-the-blank-jouney-button.png';
}

function getCompletedLevelsForSubjectType(subject: SubjectType): number {
  if (subject === 'fillblanks') {
    return countCompletedFillBlanksLevels();
  }

  const gameStore = safeParse<GameMasteryStore>(localStorage.getItem('gameMastery_v2'), {});
  return countCompletedLevelsForSubject(gameStore, subject);
}

const SECTION_TARGETS = {
  arcade: { boxes: 5, levelsPerBox: 100, title: 'Arcade Game' },
  maths: { boxes: 30, levelsPerBox: 100, title: 'Math Game' },
  english: { boxes: 48, levelsPerBox: 100, title: 'English Game' },
  fillblanks: { levels: FILLBLANKS_ACHIEVEMENT_COUNT * LEVELS_PER_ACHIEVEMENT, title: 'Fill in the Blanks' },
} as const;

const DIFFICULTIES: DifficultyKey[] = ['easy', 'intermediate', 'difficult'];

const MENU_ITEMS: Array<{ id: string; label: string; icon: string }> = [
  { id: 'my-journey', label: 'My Journey', icon: '🗺️' },
  { id: 'arcade-game', label: 'Arcade Game', icon: '🕹️' },
  { id: 'math-game', label: 'Math Game', icon: '📐' },
  { id: 'english-game', label: 'English Game', icon: '📘' },
  { id: 'fill-blanks', label: 'Fill in the Blanks', icon: '✍️' },
];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function countCompletedMiniLevels(dp?: DifficultyProgress): number {
  if (!dp?.miniLevels) return 0;
  return Object.values(dp.miniLevels).filter(level => level?.completed).length;
}

function countCompletedLevelsForSubject(store: GameMasteryStore, subject: 'arcade' | 'maths' | 'english'): number {
  const prefix = `${subject}_`;
  let total = 0;

  Object.entries(store).forEach(([key, game]) => {
    if (!key.startsWith(prefix)) return;

    DIFFICULTIES.forEach(difficulty => {
      total += countCompletedMiniLevels(game?.[difficulty]);
    });
  });

  return total;
}

function countCompletedFillBlanksLevels(): number {
  const progress = safeParse<Array<{ level?: number }>>(localStorage.getItem('ssms_fillblanks_progress'), []);
  const unique = new Set<number>();

  progress.forEach(entry => {
    if (typeof entry?.level === 'number' && entry.level > 0) {
      unique.add(entry.level);
    }
  });

  return unique.size;
}

function buildJourneySections(): JourneySection[] {
  const gameStore = safeParse<GameMasteryStore>(localStorage.getItem('gameMastery_v2'), {});

  const arcadeTotalLevels = SECTION_TARGETS.arcade.boxes * SECTION_TARGETS.arcade.levelsPerBox;
  const mathsTotalLevels = SECTION_TARGETS.maths.boxes * SECTION_TARGETS.maths.levelsPerBox;
  const englishTotalLevels = SECTION_TARGETS.english.boxes * SECTION_TARGETS.english.levelsPerBox;
  const fillBlanksTotalLevels = SECTION_TARGETS.fillblanks.levels;

  const arcadeCompleted = Math.min(arcadeTotalLevels, countCompletedLevelsForSubject(gameStore, 'arcade'));
  const mathsCompleted = Math.min(mathsTotalLevels, countCompletedLevelsForSubject(gameStore, 'maths'));
  const englishCompleted = Math.min(englishTotalLevels, countCompletedLevelsForSubject(gameStore, 'english'));
  const fillBlanksCompleted = Math.min(fillBlanksTotalLevels, countCompletedFillBlanksLevels());

  const sections: Omit<JourneySection, 'achievements' | 'maxAchievements'>[] = [
    { id: 'arcade', title: SECTION_TARGETS.arcade.title, totalLevels: arcadeTotalLevels, completedLevels: arcadeCompleted },
    { id: 'maths', title: SECTION_TARGETS.maths.title, totalLevels: mathsTotalLevels, completedLevels: mathsCompleted },
    { id: 'english', title: SECTION_TARGETS.english.title, totalLevels: englishTotalLevels, completedLevels: englishCompleted },
    { id: 'fillblanks', title: SECTION_TARGETS.fillblanks.title, totalLevels: fillBlanksTotalLevels, completedLevels: fillBlanksCompleted },
  ];

  return sections.map(section => ({
    ...section,
    achievements: Math.floor(section.completedLevels / LEVELS_PER_ACHIEVEMENT),
    maxAchievements: Math.floor(section.totalLevels / LEVELS_PER_ACHIEVEMENT),
  }));
}

type OpenedBoxesByAchievement = Record<string, number[]>;
type UnlockedAchievementMap = Record<string, boolean>;

function extractTitleParts(title: string): { emoji: string; name: string } {
  const emojiRegex = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]+/gu;
  const emojis = title.match(emojiRegex) ?? [];
  const name = title.replace(emojiRegex, '').trim();
  return { emoji: emojis.join(''), name };
}

const CELEBRATION_SYMBOLS = ['🎊', '🎉', '⭐', '✨', '🌟', '💫', '🎈', '🥳', '🏆', '👑'];

const CelebrationParticles: React.FC = () => {
  const particles = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 5 + (i * 5.5) % 90,
      delay: (i * 0.18) % 1.4,
      duration: 1.8 + (i % 4) * 0.5,
      symbol: CELEBRATION_SYMBOLS[i % CELEBRATION_SYMBOLS.length],
      size: 18 + (i % 3) * 10,
    })),
  []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      {particles.map(p => (
        <motion.span
          key={p.id}
          className="absolute select-none"
          style={{ left: `${p.x}%`, top: '-8%', fontSize: p.size }}
          animate={{ y: ['0vh', '115vh'], rotate: [0, 360], opacity: [1, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        >
          {p.symbol}
        </motion.span>
      ))}
    </div>
  );
};

interface RewardBoxesModalProps {
  open: boolean;
  achievementNo: number | null;
  achievementTitle: string;
  achievementImageSrc: string;
  chapterName: string;
  openedBoxes: number[];
  unlocked: boolean;
  completedLevelsForSubject: number;
  boxLevelInfo: Array<{ boxNo: number; name: string; chapterName: string; difficulty: 'Easy' | 'Intermediate' | 'Difficult'; rangeLabel: string }>;
  onClose: () => void;
  onOpenBox: (boxNo: number) => void;
  onClaim: () => void;
  targetGameLabel: string;
  onGoToGame: () => void;
  onRouteToBoxLevel: (boxNo: number) => void;
}

const RewardBoxesModal: React.FC<RewardBoxesModalProps> = ({
  open,
  achievementNo,
  achievementTitle,
  achievementImageSrc,
  chapterName,
  openedBoxes,
  unlocked,
  completedLevelsForSubject,
  boxLevelInfo,
  onClose,
  onOpenBox,
  onClaim,
  targetGameLabel,
  onGoToGame,
  onRouteToBoxLevel,
}) => {
  const openedCount = openedBoxes.length;
  const canClaim = openedCount === 5 && !unlocked;
  const nextBoxToOpen = Math.min(5, openedCount + 1);
  const requiredForNextBox = requiredLevelsForBox(achievementNo, nextBoxToOpen);
  const levelsRemainingForNextBox = Math.max(0, requiredForNextBox - completedLevelsForSubject);
  const titleParts = useMemo(() => extractTitleParts(achievementTitle), [achievementTitle]);

  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (openedCount === 5 && !unlocked) {
      const t = setTimeout(() => setShowCelebration(true), 600);
      return () => clearTimeout(t);
    }
  }, [openedCount, unlocked]);

  useEffect(() => {
    if (!open) setShowCelebration(false);
  }, [open]);

  return (
    <AnimatePresence>
      {open && achievementNo !== null && (
        <motion.div
          className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-[92vw] max-w-[860px] rounded-3xl border border-purple-200/60 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 shadow-2xl p-5 sm:p-7 overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            <AnimatePresence>
              {showCelebration && (
                <motion.div
                  className="absolute inset-0 z-30 rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-4 px-6 py-8"
                  style={{ background: 'linear-gradient(135deg, #1e003d 0%, #3b006e 40%, #0d1b5e 100%)' }}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <CelebrationParticles />

                  <motion.div
                    className="relative z-10 flex flex-col items-center gap-3 text-center"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.45, type: 'spring', bounce: 0.45 }}
                  >
                    <div className="relative mb-1">
                      <div className="absolute inset-0 rounded-full blur-3xl opacity-60" style={{ background: 'radial-gradient(circle, #facc15 0%, #f59e0b 50%, transparent 80%)' }} />
                      <img
                        src={achievementImageSrc}
                        alt={achievementTitle}
                        className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-2xl mx-auto"
                      />
                    </div>

                    {titleParts.emoji && (
                      <motion.span
                        className="text-7xl sm:text-8xl select-none drop-shadow-2xl leading-none"
                        animate={{ scale: [1, 1.18, 1], rotate: [0, -8, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {titleParts.emoji}
                      </motion.span>
                    )}

                    <h2 className="text-2xl sm:text-4xl font-black text-white drop-shadow-lg leading-tight">
                      {titleParts.name || achievementTitle}
                    </h2>

                    <motion.p
                      className="text-yellow-300 font-black text-lg sm:text-xl"
                      animate={{ opacity: [1, 0.55, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      🎉 Achievement Unlocked! 🎉
                    </motion.p>

                    <p className="text-white/60 text-sm font-bold">{chapterName}</p>
                  </motion.div>

                  <motion.button
                    type="button"
                    onClick={() => { setShowCelebration(false); onClaim(); }}
                    className="relative z-10 mt-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black text-xl shadow-2xl"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.96 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    🏆 Claim Achievement!
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-purple-800">Open 5 Boxes to Unlock Achievement</h3>
                <p className="mt-1 text-sm font-semibold text-purple-600">Complete your reward sequence to earn the achievement</p>
                <p className="mt-1 text-xs font-bold text-purple-500">{achievementTitle}</p>
                <p className="mt-1 text-xs font-bold text-indigo-500">{chapterName}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/80 border border-purple-200 text-purple-700 font-black hover:bg-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {BOX_IMAGES.map((src, idx) => {
                const boxNo = idx + 1;
                const opened = openedBoxes.includes(boxNo);
                const displayedImage = opened ? OPEN_BOX_IMAGES[idx] : src;
                const nextBox = openedBoxes.length + 1;
                const locked = !opened && boxNo !== nextBox;
                const disabled = unlocked || opened;
                const info = boxLevelInfo.find(item => item.boxNo === boxNo);
                const requiredForBox = requiredLevelsForBox(achievementNo, boxNo);
                const boxReadyByProgress = completedLevelsForSubject >= requiredForBox;
                const primaryLabel = opened ? `Box ${boxNo} Opened` : info?.name;
                const handleBoxClick = () => {
                  if (opened || unlocked) return;
                  if (!locked && boxReadyByProgress) {
                    onOpenBox(boxNo);
                    return;
                  }
                  onRouteToBoxLevel(boxNo);
                };

                return (
                  <motion.button
                    key={boxNo}
                    type="button"
                    onClick={handleBoxClick}
                    disabled={disabled}
                    whileHover={disabled ? {} : { scale: 1.04 }}
                    whileTap={disabled ? {} : { scale: 0.97 }}
                    className={`relative rounded-2xl border p-2 transition ${
                      opened
                        ? 'bg-green-50 border-green-300'
                        : disabled
                          ? 'bg-gray-100/70 border-gray-200 opacity-70'
                          : 'bg-white border-purple-200 shadow-lg shadow-purple-200/40 hover:shadow-purple-300/60'
                    }`}
                  >
                      <img src={displayedImage} alt={opened ? `Opened box ${boxNo}` : `Box ${boxNo}`} className="h-20 sm:h-24 w-auto mx-auto" />
                    {info && (
                      <>
                        <p className="text-[10px] font-extrabold text-indigo-600 leading-tight">{primaryLabel}</p>
                        <p className="text-[10px] font-bold text-violet-600">{info.chapterName}</p>
                        {!opened && <p className="text-[10px] font-bold text-slate-600">{info.difficulty} • {info.rangeLabel}</p>}
                      </>
                    )}
                    {!opened && !unlocked && locked && <p className="text-[10px] font-black text-gray-500">Locked</p>}
                    {!opened && !unlocked && !boxReadyByProgress && <p className="text-[10px] font-black text-amber-600">Tap to play required level</p>}
                    {!opened && !unlocked && !locked && <p className="text-[10px] font-black text-purple-500">Tap to open</p>}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-bold text-purple-700">Opened: {openedCount}/5</p>
              {unlocked ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-4 py-2 rounded-xl bg-green-100 border border-green-300 text-green-700 font-black"
                >
                  🎉 Achievement Unlocked!
                </motion.div>
              ) : canClaim ? (
                <div className="px-4 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 font-black">
                  All 5 boxes opened! Claim your achievement.
                </div>
              ) : levelsRemainingForNextBox > 0 ? (
                <div className="px-4 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 font-black">
                  Complete {levelsRemainingForNextBox} more levels to open Box {nextBoxToOpen}.
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end">
              {canClaim ? (
                <button
                  type="button"
                  onClick={onClaim}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black shadow-lg hover:scale-[1.02] transition"
                >
                  Claim Achievement
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-white border border-purple-200 text-purple-700 font-black hover:bg-purple-50 transition"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={onGoToGame}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black shadow-lg hover:scale-[1.02] transition"
                  >
                    {targetGameLabel} Button
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface CategoryAchievementListModalProps {
  open: boolean;
  subject: SubjectType | null;
  achievements: Array<{ id: number; title: string; unlocked: boolean }>;
  onClose: () => void;
  onSelectAchievement: (achievementNo: number) => void;
}

const CategoryAchievementListModal: React.FC<CategoryAchievementListModalProps> = ({
  open,
  subject,
  achievements,
  onClose,
  onSelectAchievement,
}) => {
  const heading = subject === 'arcade'
    ? 'Arcade Achievements'
    : subject === 'maths'
      ? 'Math Achievements'
      : subject === 'english'
        ? 'English Achievements'
        : 'Fill in the Blanks Achievements';

  return (
    <AnimatePresence>
      {open && subject && (
        <motion.div
          className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-[96vw] max-w-[1500px] max-h-[90vh] overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-purple-100 bg-purple-50/60">
              <h3 className="text-lg sm:text-xl font-black text-purple-700">{heading}</h3>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white border border-purple-200 text-purple-700 font-black hover:bg-purple-50"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(90vh-72px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {achievements.map(item => {
                  const parts = extractTitleParts(item.title);
                  const icon = parts.emoji || (subject === 'arcade' ? '🎮' : subject === 'maths' ? '🧮' : subject === 'english' ? '📚' : '✍️');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectAchievement(item.id)}
                      className={`rounded-3xl border px-4 py-5 text-center transition ${
                        item.unlocked
                          ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70'
                          : 'bg-white border-purple-200 hover:bg-purple-50'
                      }`}
                    >
                      <div className="text-2xl leading-none">{icon}</div>
                      <p className="mt-3 text-xl font-black text-purple-600 leading-tight">{parts.name || item.title}</p>
                      <p className={`mt-2 text-[28px] font-black ${item.unlocked ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {item.unlocked ? 'Unlocked' : 'Locked'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const JourneyPage: React.FC<JourneyPageProps> = ({ onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string>('my-journey');
  const [activeSubjectCategory, setActiveSubjectCategory] = useState<SubjectType | null>(null);
  const [activeAchievement, setActiveAchievement] = useState<number | null>(null);
  const [openedBoxesByAchievement, setOpenedBoxesByAchievement] = useState<OpenedBoxesByAchievement>(() =>
    safeParse<OpenedBoxesByAchievement>(localStorage.getItem(OPENED_BOXES_KEY), {})
  );
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievementMap>(() =>
    safeParse<UnlockedAchievementMap>(localStorage.getItem(ACHIEVEMENT_UNLOCKED_KEY), {})
  );
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);
  const [achievementTitles, setAchievementTitles] = useState<AchievementTitleStore>({ arcade: [], maths: [], english: [], fillblanks: [] });
  const sections = useMemo(buildJourneySections, []);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({
    'my-journey': null,
    'arcade-game': null,
    'math-game': null,
    'english-game': null,
    'fill-blanks': null,
  });

  useEffect(() => {
    localStorage.setItem(OPENED_BOXES_KEY, JSON.stringify(openedBoxesByAchievement));
  }, [openedBoxesByAchievement]);

  useEffect(() => {
    localStorage.setItem(ACHIEVEMENT_UNLOCKED_KEY, JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements]);

  useEffect(() => {
    let cancelled = false;

    fetch('/assets/journey/archivement%20name.txt')
      .then(response => (response.ok ? response.text() : ''))
      .then(text => {
        if (!text || cancelled) return;
        setAchievementTitles(parseAchievementTitleFile(text));
      })
      .catch(() => {
        // ignore and use fallback titles
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const progressPayload = Object.keys({ ...openedBoxesByAchievement, ...unlockedAchievements }).reduce<Record<string, PendingAchievementState>>((acc, achievementKey) => {
      const achievementNo = Number(achievementKey);
      if (!Number.isFinite(achievementNo) || achievementNo <= 0) return acc;
      const subjectType = resolveTargetGameSection(achievementNo);
      const levelsCompleted = getCompletedLevelsForSubjectType(subjectType);
      const boxesOpened = (openedBoxesByAchievement[achievementKey] ?? []).length;
      const achievementUnlocked = Boolean(unlockedAchievements[achievementKey]);

      acc[achievementKey] = {
        user_id: 'student',
        achievement_no: achievementNo,
        subject_type: subjectType,
        required_levels: requiredLevelsForAchievement(achievementNo, subjectType),
        levels_completed: levelsCompleted,
        boxes_opened: boxesOpened,
        achievement_unlocked: achievementUnlocked,
        created_at: Date.now(),
      };

      return acc;
    }, {});

    localStorage.setItem(JOURNEY_PROGRESS_KEY, JSON.stringify(progressPayload));
  }, [openedBoxesByAchievement, unlockedAchievements]);

  const totals = useMemo(() => {
    const completedLevels = sections.reduce((sum, section) => sum + section.completedLevels, 0);
    const achievementsUnlocked = sections.reduce((sum, section) => sum + section.achievements, 0);
    const achievementsMax = sections.reduce((sum, section) => sum + section.maxAchievements, 0);

    return {
      completedLevels,
      achievementsUnlocked,
      achievementsMax,
    };
  }, [sections]);

  const pathTopOffset = 140;
  const badgeSpacing = 140;
  const mapHeight = Math.max(1400, pathTopOffset + ((totals.achievementsMax - 1) * badgeSpacing) + 260);
  const bgSliceHeight = 320;
  const bgSliceCount = Math.ceil(mapHeight / bgSliceHeight);

  const achievementBadges = useMemo(() => {
    const curvePattern = [50, 58, 42, 57, 43, 56, 44, 55];

    return Array.from({ length: totals.achievementsMax }, (_, index) => {
      const achievementNo = index + 1;
      const top = pathTopOffset + (index * badgeSpacing);
      const leftPct = curvePattern[index % curvePattern.length];
      const completed = Boolean(unlockedAchievements[String(achievementNo)]);

      return {
        achievementNo,
        completed,
        top,
        leftPct,
      };
    });
  }, [totals.achievementsMax, unlockedAchievements, pathTopOffset, badgeSpacing]);

  const connectorPaths = useMemo(() => {
    if (achievementBadges.length < 2) return [];

    const svgWidth = 1000;
    const badgeStartYOffset = 98;
    const badgeEndYOffset = 10;

    return achievementBadges.slice(0, -1).map((badge, index) => {
      const next = achievementBadges[index + 1];
      const x1 = (badge.leftPct / 100) * svgWidth;
      const y1 = badge.top + badgeStartYOffset;
      const x2 = (next.leftPct / 100) * svgWidth;
      const y2 = next.top + badgeEndYOffset;
      const midY = (y1 + y2) / 2;
      const c1x = x1;
      const c1y = midY - 24;
      const c2x = x2;
      const c2y = midY + 24;
      const active = badge.completed && next.completed;

      return {
        id: `${badge.achievementNo}-${next.achievementNo}`,
        d: `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`,
        active,
      };
    });
  }, [achievementBadges]);

  const openAchievementFlowFromMenu = (achievementNo: number, menuId: string) => {
    const boundedAchievement = Math.max(1, Math.min(achievementNo, totals.achievementsMax));
    setActiveAchievement(boundedAchievement);
    setActiveSubjectCategory(null);
    setActiveMenuId(menuId);
    setSidebarOpen(false);

    const root = scrollContainerRef.current;
    if (!root) return;
    const targetTop = Math.max(0, pathTopOffset + ((boundedAchievement - 1) * badgeSpacing) - 200);
    root.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  const openCategoryListFromMenu = (subject: SubjectType, menuId: string) => {
    setActiveMenuId(menuId);
    setActiveSubjectCategory(subject);
    setActiveAchievement(null);
    setSidebarOpen(false);
  };

  const scrollToSection = (id: string) => {
    const target = sectionRefs.current[id];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveMenuId(id);
    setSidebarOpen(false);
  };

  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveMenuId(visible[0].target.id);
        }
      },
      {
        root,
        threshold: [0.2, 0.45, 0.7],
      }
    );

    MENU_ITEMS.forEach(item => {
      const el = sectionRefs.current[item.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const openedForActive = activeAchievement !== null
    ? openedBoxesByAchievement[String(activeAchievement)] ?? []
    : [];

  const activeUnlocked = activeAchievement !== null
    ? Boolean(unlockedAchievements[String(activeAchievement)])
    : false;

  const targetGameSection = resolveTargetGameSection(activeAchievement);
  const subjectChapterNo = getSubjectChapterNo(activeAchievement, targetGameSection);
  const completedLevelsForActive = getCompletedLevelsForSubjectType(targetGameSection);
  const activeAchievementTitle = getAchievementDisplayTitle(targetGameSection, subjectChapterNo, achievementTitles);
  const activeAchievementImageSrc = getAchievementImageSrc(targetGameSection, subjectChapterNo);
  const chapterName = `${targetGameSection === 'arcade' ? 'Arcade' : targetGameSection === 'maths' ? 'Math' : targetGameSection === 'english' ? 'English' : 'Fill in the Blanks'} Chapter ${subjectChapterNo}`;
  const boxLevelInfo = useMemo(() => {
    const chapterNo = getSubjectChapterNo(activeAchievement, targetGameSection);
    const base = (chapterNo - 1) * LEVELS_PER_ACHIEVEMENT;
    const sectionLabel = targetGameSection === 'arcade'
      ? 'Arcade'
      : targetGameSection === 'maths'
        ? 'Math'
        : targetGameSection === 'english'
          ? 'English'
          : 'Fill in the Blanks';
    const perBoxChapterName = `${sectionLabel} Chapter ${chapterNo}`;
    return [
      { boxNo: 1, name: 'Box 1', chapterName: perBoxChapterName, difficulty: 'Easy' as const, rangeLabel: `L${base + 1}–L${base + 10}` },
      { boxNo: 2, name: 'Box 2', chapterName: perBoxChapterName, difficulty: 'Easy' as const, rangeLabel: `L${base + 11}–L${base + 20}` },
      { boxNo: 3, name: 'Box 3', chapterName: perBoxChapterName, difficulty: 'Intermediate' as const, rangeLabel: `L${base + 21}–L${base + 30}` },
      { boxNo: 4, name: 'Box 4', chapterName: perBoxChapterName, difficulty: 'Intermediate' as const, rangeLabel: `L${base + 31}–L${base + 40}` },
      { boxNo: 5, name: 'Box 5', chapterName: perBoxChapterName, difficulty: 'Difficult' as const, rangeLabel: `L${base + 41}–L${base + 50}` },
    ];
  }, [activeAchievement, targetGameSection]);
  const targetGameLabel = targetGameSection === 'arcade'
    ? 'Arcade'
    : targetGameSection === 'maths'
      ? 'Math'
      : targetGameSection === 'english'
        ? 'English'
        : 'Fill in the Blanks';

  const navigateToMappedGameSection = (section: SubjectType) => {
    if (activeAchievement !== null) {
      const nextBoxToOpen = Math.min(5, openedForActive.length + 1);
      const pendingPayload: PendingAchievementState = {
        user_id: 'student',
        achievement_no: activeAchievement,
        subject_type: section,
        required_levels: requiredLevelsForBox(activeAchievement, nextBoxToOpen, section),
        levels_completed: getCompletedLevelsForSubjectType(section),
        boxes_opened: openedForActive.length,
        achievement_unlocked: activeUnlocked,
        created_at: Date.now(),
      };
      localStorage.setItem(PENDING_ACHIEVEMENT_KEY, JSON.stringify(pendingPayload));
    }

    if (section === 'fillblanks') {
      onNavigate?.('fillblanks');
      return;
    }

    try {
      localStorage.setItem(GAME_SECTION_REDIRECT_KEY, section);
    } catch {
      // ignore
    }
    onNavigate?.('play');
  };

  const handleGoToMappedGame = () => {
    navigateToMappedGameSection(targetGameSection);
  };

  const handleRouteToBoxLevel = (boxNo: number) => {
    if (activeAchievement === null) {
      navigateToMappedGameSection(targetGameSection);
      return;
    }

    const payload: JourneyGameRedirectPayload = {
      subject_type: targetGameSection,
      achievement_no: activeAchievement,
      box_no: boxNo,
    };

    try {
      localStorage.setItem(GAME_LEVEL_REDIRECT_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }

    navigateToMappedGameSection(targetGameSection);
  };

  useEffect(() => {
    const pending = safeParse<PendingAchievementState | null>(localStorage.getItem(PENDING_ACHIEVEMENT_KEY), null);
    if (!pending) return;

    const achievementKey = String(pending.achievement_no);
    if (unlockedAchievements[achievementKey]) {
      localStorage.removeItem(PENDING_ACHIEVEMENT_KEY);
      return;
    }

    const nowCompleted = getCompletedLevelsForSubjectType(pending.subject_type);
    const nextPendingBox = Math.min(5, (pending.boxes_opened ?? 0) + 1);
    const requiredForPending = requiredLevelsForBox(pending.achievement_no, nextPendingBox, pending.subject_type);
    if (nowCompleted < requiredForPending) {
      return;
    }

    localStorage.removeItem(PENDING_ACHIEVEMENT_KEY);
    const boundedAchievement = Math.max(1, Math.min(pending.achievement_no, totals.achievementsMax));
    setActiveAchievement(boundedAchievement);
    const openedCount = (openedBoxesByAchievement[String(boundedAchievement)] ?? []).length;
    const unlockedBoxNo = Math.min(5, openedCount + 1);
    setUnlockNotice(`🎉 You unlocked Box ${unlockedBoxNo} for Achievement #${boundedAchievement}!`);

    const root = scrollContainerRef.current;
    if (!root) return;
    const targetTop = Math.max(0, pathTopOffset + ((boundedAchievement - 1) * badgeSpacing) - 200);
    root.scrollTo({ top: targetTop, behavior: 'smooth' });
  }, [badgeSpacing, openedBoxesByAchievement, pathTopOffset, totals.achievementsMax, unlockedAchievements]);

  useEffect(() => {
    if (!unlockNotice) return;
    const timer = window.setTimeout(() => setUnlockNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [unlockNotice]);

  const handleNextAchievementClick = (achievementNo: number, completed: boolean) => {
    if (completed) return;
    setActiveAchievement(achievementNo);
  };

  const handleOpenBox = (boxNo: number) => {
    if (activeAchievement === null) return;

    const key = String(activeAchievement);
    const existing = openedBoxesByAchievement[key] ?? [];
    if (existing.includes(boxNo)) return;

    const nextBoxToOpen = existing.length + 1;
    if (boxNo !== nextBoxToOpen) return;

    const requiredForThisBox = requiredLevelsForBox(activeAchievement, boxNo, targetGameSection);
    if (completedLevelsForActive < requiredForThisBox) return;

    setOpenedBoxesByAchievement(prev => ({
      ...prev,
      [key]: [...existing, boxNo],
    }));
  };

  const handleClaimAchievement = () => {
    if (activeAchievement === null) return;
    const key = String(activeAchievement);
    const opened = openedBoxesByAchievement[key] ?? [];
    if (opened.length < 5) return;

    setUnlockedAchievements(prev => ({
      ...prev,
      [key]: true,
    }));

    const nextAchievementNo = activeAchievement + 1;
    if (nextAchievementNo <= totals.achievementsMax) {
      setActiveAchievement(nextAchievementNo);
    } else {
      setActiveAchievement(null);
    }
  };

  const categoryAchievementCards = useMemo(() => {
    if (!activeSubjectCategory) return [] as Array<{ id: number; title: string; unlocked: boolean }>;

    const config = activeSubjectCategory === 'arcade'
      ? { start: ARCADE_START, count: ARCADE_ACHIEVEMENT_COUNT }
      : activeSubjectCategory === 'maths'
        ? { start: MATHS_START, count: MATHS_ACHIEVEMENT_COUNT }
        : activeSubjectCategory === 'english'
          ? { start: ENGLISH_START, count: ENGLISH_ACHIEVEMENT_COUNT }
          : { start: FILLBLANKS_START, count: FILLBLANKS_ACHIEVEMENT_COUNT };

    const completedByProgress = Math.floor(getCompletedLevelsForSubjectType(activeSubjectCategory) / LEVELS_PER_ACHIEVEMENT);

    return Array.from({ length: config.count }, (_, idx) => {
      const achievementNo = config.start + idx;
      const chapterNo = idx + 1;
      const unlockedByClaim = Boolean(unlockedAchievements[String(achievementNo)]);
      const unlockedByProgress = chapterNo <= completedByProgress;

      return {
        id: achievementNo,
        title: getAchievementDisplayTitle(activeSubjectCategory, chapterNo, achievementTitles),
        unlocked: unlockedByClaim || unlockedByProgress,
      };
    });
  }, [activeSubjectCategory, achievementTitles, unlockedAchievements]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="flex min-h-screen">
        <div
          className={`fixed inset-0 bg-black/30 z-30 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed z-40 top-0 left-0 h-screen w-[240px] p-4 bg-gradient-to-b from-purple-100/95 via-indigo-50/95 to-pink-50/95 shadow-xl rounded-r-3xl transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-lg font-black text-purple-700">Journey Menu</h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-purple-600 font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-2">
            {MENU_ITEMS.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'arcade-game') {
                    openCategoryListFromMenu('arcade', 'arcade-game');
                    return;
                  }
                  if (item.id === 'math-game') {
                    openCategoryListFromMenu('maths', 'math-game');
                    return;
                  }
                  if (item.id === 'english-game') {
                    openCategoryListFromMenu('english', 'english-game');
                    return;
                  }
                  if (item.id === 'fill-blanks') {
                    openCategoryListFromMenu('fillblanks', 'fill-blanks');
                    return;
                  }
                  scrollToSection(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-bold text-left transition-all ${
                  activeMenuId === item.id
                    ? 'bg-white/80 text-purple-700 shadow-sm border border-purple-200'
                    : 'text-purple-600 hover:bg-white/60 hover:text-purple-700'
                }`}
              >
                <span className="text-lg" aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => onNavigate?.('home')}
            className="mt-5 w-full px-3 py-3 rounded-2xl bg-white/85 text-purple-700 font-extrabold border border-purple-200 hover:bg-white transition"
          >
            ← Back to Home
          </button>
        </aside>

        <main className="flex-1 lg:ml-[240px] p-4 sm:p-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 border border-purple-200 text-purple-700 text-sm font-extrabold shadow-sm"
          >
            ☰ Menu
          </button>

          <div ref={scrollContainerRef} className="rounded-3xl border border-purple-100 shadow-lg overflow-y-auto h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] scroll-smooth bg-white/40">
            <div id="my-journey" ref={el => { sectionRefs.current['my-journey'] = el; }} className="relative overflow-hidden rounded-3xl" style={{ minHeight: `${mapHeight}px` }}>
              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden
                style={{
                  backgroundImage: 'url(/assets/journey/background/background.png)',
                  backgroundSize: '100% auto',
                  backgroundRepeat: 'repeat-y',
                  backgroundPosition: 'top center',
                }}
              />

              <div className="absolute inset-0 bg-black/10" />

              <svg
                className="absolute inset-0 z-[15] pointer-events-none"
                viewBox={`0 0 1000 ${mapHeight}`}
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="journeyConnectorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#facc15" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.92" />
                  </linearGradient>
                  <linearGradient id="journeyConnectorLocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.45" />
                  </linearGradient>
                  <filter id="journeyConnectorGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {connectorPaths.map(path => (
                  <g key={path.id}>
                    <path
                      d={path.d}
                      fill="none"
                      stroke={path.active ? 'url(#journeyConnectorActive)' : 'url(#journeyConnectorLocked)'}
                      strokeWidth={8}
                      strokeLinecap="round"
                      filter={path.active ? 'url(#journeyConnectorGlow)' : undefined}
                      opacity={path.active ? 0.95 : 0.55}
                    />
                    <path
                      d={path.d}
                      fill="none"
                      stroke={path.active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.18)'}
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeDasharray={path.active ? undefined : '4 8'}
                      opacity={path.active ? 0.9 : 0.6}
                    />
                  </g>
                ))}
              </svg>

              <div className="absolute left-1/2 -translate-x-1/2 top-6 z-10 text-center">
                <h1 className="text-white text-3xl font-black drop-shadow-md">My Journey</h1>
                <p className="text-white/90 text-sm font-bold mt-1">Achievement Path</p>
              </div>

              {/* Invisible anchors for sidebar smooth-scroll targets */}
              <div id="arcade-game" ref={el => { sectionRefs.current['arcade-game'] = el; }} className="absolute left-0 right-0" style={{ top: '45%' }} />
              <div id="math-game" ref={el => { sectionRefs.current['math-game'] = el; }} className="absolute left-0 right-0" style={{ top: '60%' }} />
              <div id="english-game" ref={el => { sectionRefs.current['english-game'] = el; }} className="absolute left-0 right-0" style={{ top: '75%' }} />
              <div id="fill-blanks" ref={el => { sectionRefs.current['fill-blanks'] = el; }} className="absolute left-0 right-0" style={{ top: '90%' }} />

              <div className="absolute inset-0 z-20">
                {achievementBadges.map(badge => (
                  <button
                    key={badge.achievementNo}
                    type="button"
                    className="absolute -translate-x-1/2 text-center transition-transform hover:scale-105"
                    style={{
                      left: `${badge.leftPct}%`,
                      top: `${badge.top}px`,
                    }}
                    onClick={() => {
                      handleNextAchievementClick(badge.achievementNo, badge.completed);
                    }}
                  >
                    <img
                      src={badge.completed ? '/assets/journey/buttons/archivement button/complete-achivement.png' : '/assets/journey/buttons/archivement button/next-archivement.png'}
                      alt={`Achievement ${badge.achievementNo}`}
                      className="w-[150px] sm:w-[180px] h-auto mx-auto drop-shadow-lg"
                    />
                    <p className="mt-1 text-white text-xs sm:text-sm font-extrabold drop-shadow-md whitespace-nowrap">
                      Achievement {badge.achievementNo}/{totals.achievementsMax}
                    </p>
                    <p className="text-white text-[11px] sm:text-xs font-bold drop-shadow-md mt-0.5">
                      {(() => {
                        const subject = resolveTargetGameSection(badge.achievementNo);
                        if (subject === 'arcade') return 'Arcade';
                        if (subject === 'maths') return 'Math';
                        if (subject === 'english') return 'English';
                        return 'Fill in the Blanks';
                      })()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <RewardBoxesModal
            open={activeAchievement !== null}
            achievementNo={activeAchievement}
            achievementTitle={activeAchievementTitle}
            achievementImageSrc={activeAchievementImageSrc}
            chapterName={chapterName}
            openedBoxes={openedForActive}
            unlocked={activeUnlocked}
            completedLevelsForSubject={completedLevelsForActive}
            boxLevelInfo={boxLevelInfo}
            onClose={() => setActiveAchievement(null)}
            onOpenBox={handleOpenBox}
            onClaim={handleClaimAchievement}
            targetGameLabel={targetGameLabel}
            onGoToGame={handleGoToMappedGame}
            onRouteToBoxLevel={handleRouteToBoxLevel}
          />

          <CategoryAchievementListModal
            open={activeSubjectCategory !== null}
            subject={activeSubjectCategory}
            achievements={categoryAchievementCards}
            onClose={() => setActiveSubjectCategory(null)}
            onSelectAchievement={(achievementNo) => {
              setActiveSubjectCategory(null);
              openAchievementFlowFromMenu(achievementNo, activeMenuId);
            }}
          />

          <AnimatePresence>
            {unlockNotice && (
              <motion.div
                className="fixed right-4 top-4 z-[130] rounded-2xl border border-green-300 bg-green-100 px-4 py-3 text-sm font-black text-green-700 shadow-xl"
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
              >
                {unlockNotice}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default JourneyPage;
