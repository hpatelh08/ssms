import journeyBackgroundImg from '../../assets2/path/journey-zigzag-path1.png';
import journeyPathImg from '../../assets2/path/journey-zigzag-path.png';

import achievementRingImg from '../../assets2/achievements/achievement-ring.png';
import achievementLockedImg from '../../assets2/achievements/achievement-locked.png';
import achievementCompleteImg from '../../assets2/achievements/achievement-complete.png';

import medalGamesImg from '../../assets2/medals/medal-games.png';
import medalMathsImg from '../../assets2/medals/medal-maths.png';
import medalEnglishImg from '../../assets2/medals/medal-english.png';
import medalBrainImg from '../../assets2/medals/medal-brain.png';
import medalPuzzleImg from '../../assets2/medals/medal-puzzle.png';
import medalArenaImg from '../../assets2/medals/medal-arena.png';

import iconControllerImg from '../../assets2/icons/icon-controller.png';
import iconMathImg from '../../assets2/icons/icon-math.png';
import iconBookImg from '../../assets2/icons/icon-book.png';
import iconBrainImg from '../../assets2/icons/icon-brain.png';
import iconPuzzleImg from '../../assets2/icons/icon-puzzle.png';

import sparkleImg from '../../assets2/effects/sparkle.png';
import confettiImg from '../../assets2/effects/confetti.png';

export const journeyAssets = {
  background: journeyBackgroundImg,
  path: journeyPathImg,
  achievements: {
    available: achievementRingImg,
    locked: achievementLockedImg,
    completed: achievementCompleteImg,
  },
  effects: {
    sparkle: sparkleImg,
    confetti: confettiImg,
  },
} as const;

export const journeySectionVisuals = {
  gamesArena: {
    icon: iconControllerImg,
    medal: medalGamesImg,
  },
  maths: {
    icon: iconMathImg,
    medal: medalMathsImg,
  },
  english: {
    icon: iconBookImg,
    medal: medalEnglishImg,
  },
  ncertLearning: {
    icon: iconBookImg,
    medal: medalArenaImg,
  },
  brainBooster: {
    icon: iconBrainImg,
    medal: medalBrainImg,
  },
  puzzleSolver: {
    icon: iconPuzzleImg,
    medal: medalPuzzleImg,
  },
} as const;

export type JourneySectionVisualKey = keyof typeof journeySectionVisuals;

export function getJourneyIcon(key: JourneySectionVisualKey): string {
  return journeySectionVisuals[key].icon;
}

export function getJourneyMedal(key: JourneySectionVisualKey): string {
  return journeySectionVisuals[key].medal;
}
