import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  onStatsUpdate: (stats: {
    score: number;
    level: number;
    round: number;
    mistakes: number;
  }) => void;
  onNavigateHome?: () => void;
}

interface FishConfig {
  id: string;
  y: number;
  direction: 1 | -1;
  emoji: string;
  speed: number;
  startX: number;
  bobDuration: number;
  bobDelay: number;
}

interface AnimalConfig {
  id: string;
  x: number;
  y: number;
  emoji: string;
  swayDuration: number;
  swayDelay: number;
}

interface RoundData {
  fish: FishConfig[];
  animals: AnimalConfig[];
  correctCount: number;
  options: number[];
}

type RoundState = 'playing' | 'feedback' | 'transitioning';

const TOTAL_LEVELS = 3;
const ROUNDS_PER_LEVEL = 5;
const ANSWER_FEEDBACK_MS = 1100;
const MIN_DISTANCE = 13;

const FISH_EMOJIS = ['🐟', '🐠', '🐡'];
const DISTRACTOR_EMOJIS = ['🐢', '🐙', '🦀'];

const InlineStyles = React.memo(function InlineStyles() {
  return (
    <style>
      {`
        @keyframes ctfCloudA {
          0% { transform: translateX(-16%); }
          100% { transform: translateX(116%); }
        }

        @keyframes ctfCloudB {
          0% { transform: translateX(116%); }
          100% { transform: translateX(-16%); }
        }

        @keyframes ctfBirdA {
          0% { transform: translate(-12%, 0px); }
          25% { transform: translate(20%, -6px); }
          50% { transform: translate(50%, 0px); }
          75% { transform: translate(80%, 6px); }
          100% { transform: translate(112%, 0px); }
        }

        @keyframes ctfSunFloat {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.06) rotate(6deg); }
        }

        @keyframes ctfSurfaceShimmer {
          0% { background-position-x: 0; }
          100% { background-position-x: 250px; }
        }

        @keyframes ctfBubbleRise {
          0% { transform: translate(0px, 0px) scale(0.8); opacity: 0; }
          15% { opacity: 0.6; }
          100% { transform: translate(var(--drift), -340px) scale(1.15); opacity: 0; }
        }

        @keyframes ctfSeaweed {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes ctfFishBob {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-8px); }
        }

        @keyframes ctfAnimalBob {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          25% { transform: translate(-50%, -50%) translateY(-4px) rotate(2deg); }
          50% { transform: translate(-50%, -50%) translateY(-6px) rotate(0deg); }
          75% { transform: translate(-50%, -50%) translateY(-4px) rotate(-2deg); }
        }

        @media (max-width: 900px) {
          .ctf-question { font-size: 20px !important; padding: 14px 20px !important; }
          .ctf-answer { min-width: 62px !important; padding: 12px 18px !important; font-size: 22px !important; }
        }
      `}
    </style>
  );
});

const SkyLayer = React.memo(function SkyLayer() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '6%',
          right: '9%',
          fontSize: '46px',
          filter: 'drop-shadow(0 0 14px rgba(245,158,11,0.35))',
          animation: 'ctfSunFloat 6s ease-in-out infinite',
        }}
      >
        ☀️
      </div>

      <div style={{ position: 'absolute', top: '12%', left: 0, right: 0, fontSize: '30px', opacity: 0.8, animation: 'ctfCloudA 56s linear infinite' }}>☁️</div>
      <div style={{ position: 'absolute', top: '28%', left: 0, right: 0, fontSize: '26px', opacity: 0.72, animation: 'ctfCloudB 70s linear infinite' }}>☁️</div>
      <div style={{ position: 'absolute', top: '19%', left: 0, right: 0, fontSize: '16px', opacity: 0.75, animation: 'ctfBirdA 30s linear infinite' }}>🕊️</div>
    </>
  );
});

const OceanDecor = React.memo(function OceanDecor() {
  const bubbles = useMemo(
    () =>
      new Array(9).fill(null).map((_, i) => ({
        id: i,
        left: 8 + i * 10,
        drift: `${(i % 2 === 0 ? 1 : -1) * (8 + (i % 4) * 4)}px`,
        duration: 5 + (i % 5) * 1.1,
        delay: i * 0.55,
      })),
    []
  );

  return (
    <>
      <div style={{ position: 'absolute', bottom: '3%', left: '7%', fontSize: '52px', opacity: 0.78, animation: 'ctfSeaweed 4.2s ease-in-out infinite' }}>🪸</div>
      <div style={{ position: 'absolute', bottom: '4%', right: '12%', fontSize: '50px', opacity: 0.78, animation: 'ctfSeaweed 4.8s ease-in-out infinite' }}>🌿</div>
      <div style={{ position: 'absolute', bottom: '2%', left: '28%', fontSize: '44px', opacity: 0.72, animation: 'ctfSeaweed 5s ease-in-out infinite' }}>🌿</div>
      <div style={{ position: 'absolute', bottom: '1%', right: '34%', fontSize: '46px', opacity: 0.72, animation: 'ctfSeaweed 4.5s ease-in-out infinite' }}>🪸</div>

      {bubbles.map((b) => (
        <div
          key={`ctf-bubble-${b.id}`}
          style={{
            '--drift': b.drift,
            position: 'absolute',
            left: `${b.left}%`,
            bottom: '-3%',
            fontSize: '20px',
            opacity: 0.5,
            animation: `ctfBubbleRise ${b.duration}s ease-in-out ${b.delay}s infinite`,
          } as React.CSSProperties}
        >
          🫧
        </div>
      ))}
    </>
  );
});

const FishSprite = React.memo(function FishSprite({ fish, register }: { fish: FishConfig; register: (id: string, node: HTMLDivElement | null) => void }) {
  return (
    <div
      ref={(node) => register(fish.id, node)}
      style={{
        position: 'absolute',
        left: `${fish.startX}%`,
        top: `${fish.y}%`,
        transform: `translate(-50%, -50%) scaleX(${fish.direction === -1 ? -1 : 1})`,
        fontSize: '46px',
        animation: `ctfFishBob ${fish.bobDuration}s ease-in-out ${fish.bobDelay}s infinite`,
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.28))',
        willChange: 'left,transform',
        zIndex: 5,
      }}
    >
      {fish.emoji}
    </div>
  );
});

const AnimalSprite = React.memo(function AnimalSprite({ animal }: { animal: AnimalConfig }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${animal.x}%`,
        top: `${animal.y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: '40px',
        opacity: 0.86,
        animation: `ctfAnimalBob ${animal.swayDuration}s ease-in-out ${animal.swayDelay}s infinite`,
        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.25))',
        zIndex: 4,
      }}
    >
      {animal.emoji}
    </div>
  );
});

const getLevelConfig = (level: number) => {
  if (level === 1) return { minFish: 2, maxFish: 5, distractors: 1, minSpeed: 0.11, maxSpeed: 0.16 };
  if (level === 2) return { minFish: 3, maxFish: 7, distractors: 2, minSpeed: 0.13, maxSpeed: 0.2 };
  return { minFish: 4, maxFish: 9, distractors: 3, minSpeed: 0.15, maxSpeed: 0.24 };
};

const randomInRange = (min: number, max: number) => min + Math.random() * (max - min);

const makeAnswerOptions = (correct: number) => {
  const options = new Set<number>([correct]);
  const nearDeltas = [-2, -1, 1, 2, 3, -3, 4];

  while (options.size < 4) {
    const delta = nearDeltas[Math.floor(Math.random() * nearDeltas.length)];
    const candidate = Math.max(1, correct + delta);
    options.add(candidate);

    if (options.size < 4) {
      options.add(Math.max(1, correct + (Math.random() > 0.5 ? 1 : -1) * (2 + Math.floor(Math.random() * 4))));
    }
  }

  return Array.from(options)
    .slice(0, 4)
    .sort(() => Math.random() - 0.5);
};

const getSafePosition = (
  occupied: Array<{ x: number; y: number }>,
  minDistance = MIN_DISTANCE,
  attempts = 100
): { x: number; y: number } => {
  for (let i = 0; i < attempts; i += 1) {
    const x = randomInRange(10, 90);
    const y = randomInRange(18, 82);

    const overlaps = occupied.some((pos) => {
      const dx = pos.x - x;
      const dy = pos.y - y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });

    if (!overlaps) {
      return { x, y };
    }
  }

  return { x: randomInRange(12, 88), y: randomInRange(20, 80) };
};

const buildRoundData = (level: number, round: number): RoundData => {
  const config = getLevelConfig(level);
  const fishCount = Math.floor(randomInRange(config.minFish, config.maxFish + 1));
  const occupied: Array<{ x: number; y: number }> = [];

  const fishDirections: Array<1 | -1> = new Array(fishCount)
    .fill(0)
    .map(() => (Math.random() > 0.5 ? 1 : -1) as 1 | -1);
  const hasRightDirection = fishDirections.some((d) => d === 1);
  const hasLeftDirection = fishDirections.some((d) => d === -1);
  if (fishCount > 1 && !hasLeftDirection) fishDirections[fishCount - 1] = -1;
  if (fishCount > 1 && !hasRightDirection) fishDirections[0] = 1;

  const fish: FishConfig[] = new Array(fishCount).fill(null).map((_, i) => {
    const pos = getSafePosition(occupied, Math.max(11, MIN_DISTANCE - level));
    occupied.push(pos);

    const direction = fishDirections[i];

    return {
      id: `fish-${level}-${round}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      y: pos.y,
      direction,
      emoji: FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)],
      speed: randomInRange(config.minSpeed, config.maxSpeed),
      startX: direction === 1 ? randomInRange(6, 40) : randomInRange(60, 94),
      bobDuration: randomInRange(2.2, 3.5),
      bobDelay: Math.random() * 1.2,
    };
  });

  const animals: AnimalConfig[] = new Array(config.distractors).fill(null).map((_, i) => {
    const pos = getSafePosition(occupied, MIN_DISTANCE + 1);
    occupied.push(pos);

    return {
      id: `animal-${level}-${round}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      x: pos.x,
      y: pos.y,
      emoji: DISTRACTOR_EMOJIS[Math.floor(Math.random() * DISTRACTOR_EMOJIS.length)],
      swayDuration: randomInRange(3.6, 5.2),
      swayDelay: Math.random() * 1.2,
    };
  });

  return {
    fish,
    animals,
    correctCount: fishCount,
    options: makeAnswerOptions(fishCount),
  };
};

const CountFishGame: React.FC<Props> = ({ onStatsUpdate, onNavigateHome }) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const [roundData, setRoundData] = useState<RoundData>(() => buildRoundData(1, 1));

  const [roundState, setRoundState] = useState<RoundState>('playing');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [isGameComplete, setIsGameComplete] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const fishNodeMapRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const fishMotionRef = useRef<Map<string, { x: number; speed: number; direction: 1 | -1 }>>(new Map());

  const answerLockedRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);

  const levelRef = useRef(1);
  const roundRef = useRef(1);
  const completeRef = useRef(false);

  useEffect(() => {
    levelRef.current = level;
    roundRef.current = round;
    completeRef.current = isGameComplete;
  }, [level, round, isGameComplete]);

  // Registering refs lets animation update only fish DOM nodes each frame without re-rendering React.
  const registerFishNode = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) {
      fishNodeMapRef.current.set(id, node);
    } else {
      fishNodeMapRef.current.delete(id);
    }
  }, []);

  const hydrateFishMotionRefs = useCallback((fishList: FishConfig[]) => {
    const nextMap = new Map<string, { x: number; speed: number; direction: 1 | -1 }>();
    fishList.forEach((fish) => {
      nextMap.set(fish.id, {
        x: fish.startX,
        speed: fish.speed,
        direction: fish.direction,
      });
    });
    fishMotionRef.current = nextMap;
  }, []);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const setupRound = useCallback(
    (nextLevel: number, nextRound: number) => {
      clearAdvanceTimer();
      answerLockedRef.current = false;
      setRoundState('transitioning');
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setMessage('');

      const data = buildRoundData(nextLevel, nextRound);
      setRoundData(data);
      hydrateFishMotionRefs(data.fish);

      // Tiny transition keeps UI smooth and avoids abrupt answer unlock while new round mounts.
      window.setTimeout(() => {
        if (!completeRef.current) {
          setRoundState('playing');
        }
      }, 80);
    },
    [clearAdvanceTimer, hydrateFishMotionRefs]
  );

  useEffect(() => {
    hydrateFishMotionRefs(roundData.fish);
  }, [roundData.fish, hydrateFishMotionRefs]);

  useEffect(() => {
    onStatsUpdate({ score, level, round, mistakes });
  }, [score, level, round, mistakes, onStatsUpdate]);

  const advanceGame = useCallback(() => {
    const currentLevel = levelRef.current;
    const currentRound = roundRef.current;

    if (currentRound >= ROUNDS_PER_LEVEL) {
      if (currentLevel >= TOTAL_LEVELS) {
        setIsGameComplete(true);
        completeRef.current = true;
        setRoundState('feedback');
        return;
      }

      const nextLevel = currentLevel + 1;
      setLevel(nextLevel);
      setRound(1);
      levelRef.current = nextLevel;
      roundRef.current = 1;
      setupRound(nextLevel, 1);
      return;
    }

    const nextRound = currentRound + 1;
    setRound(nextRound);
    roundRef.current = nextRound;
    setupRound(currentLevel, nextRound);
  }, [setupRound]);

  // Answer flow: lock immediately, score once, and schedule one safe transition.
  const handleAnswerClick = useCallback(
    (answer: number) => {
      if (roundState !== 'playing' || answerLockedRef.current || completeRef.current) {
        return;
      }

      answerLockedRef.current = true;
      setRoundState('feedback');
      setSelectedAnswer(answer);

      const correct = answer === roundData.correctCount;
      setIsAnswerCorrect(correct);

      if (correct) {
        setScore((prev) => prev + 10);
        setCorrectAnswers((prev) => prev + 1);
        setMessage('🎉 Correct! Great counting!');
      } else {
        setScore((prev) => prev - 5);
        setMistakes((prev) => prev + 1);
        setMessage(`❌ Oops! Correct answer is ${roundData.correctCount}`);
      }

      clearAdvanceTimer();
      advanceTimerRef.current = window.setTimeout(() => {
        advanceTimerRef.current = null;
        advanceGame();
      }, ANSWER_FEEDBACK_MS);
    },
    [advanceGame, clearAdvanceTimer, roundData.correctCount, roundState]
  );

  const restartGame = useCallback(() => {
    clearAdvanceTimer();
    answerLockedRef.current = false;

    setScore(0);
    setMistakes(0);
    setCorrectAnswers(0);
    setIsGameComplete(false);

    setLevel(1);
    setRound(1);
    levelRef.current = 1;
    roundRef.current = 1;
    completeRef.current = false;

    setupRound(1, 1);
  }, [clearAdvanceTimer, setupRound]);

  useEffect(() => {
    setupRound(1, 1);
  }, [setupRound]);

  useEffect(() => {
    const animateFish = (time: number) => {
      const prev = lastFrameTimeRef.current || time;
      const deltaMs = Math.min(34, Math.max(10, time - prev));
      const step = deltaMs / 16.666;
      lastFrameTimeRef.current = time;

      fishMotionRef.current.forEach((motion, id) => {
        const node = fishNodeMapRef.current.get(id);
        if (!node) return;

        motion.x += motion.direction * motion.speed * step;

        if (motion.direction === 1 && motion.x > 104) motion.x = -4;
        if (motion.direction === -1 && motion.x < -4) motion.x = 104;

        node.style.left = `${motion.x}%`;
      });

      rafRef.current = window.requestAnimationFrame(animateFish);
    };

    lastFrameTimeRef.current = performance.now();
    rafRef.current = window.requestAnimationFrame(animateFish);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      clearAdvanceTimer();
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [clearAdvanceTimer]);

  const fishNodes = useMemo(() => roundData.fish.map((fish) => <FishSprite key={fish.id} fish={fish} register={registerFishNode} />), [roundData.fish, registerFishNode]);
  const animalNodes = useMemo(() => roundData.animals.map((animal) => <AnimalSprite key={animal.id} animal={animal} />), [roundData.animals]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <InlineStyles />

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.92 }}
            style={{
              position: 'absolute',
              top: '-66px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 110,
              padding: '12px 22px',
              borderRadius: '14px',
              color: '#ffffff',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 800,
              fontSize: '18px',
              background:
                isAnswerCorrect === true
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 10px 24px rgba(15,23,42,0.22)',
              whiteSpace: 'nowrap',
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          borderRadius: '30px',
          overflow: 'hidden',
          position: 'relative',
          aspectRatio: '16 / 9',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 18px 48px rgba(6,78,124,0.2), inset 0 1px 0 rgba(255,255,255,0.55)',
          background: 'linear-gradient(180deg, #a7defc 0%, #90d2f7 20%, #4ea9df 36%, #3184bc 52%, #245f8e 70%, #173e5d 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '24%',
            zIndex: 1,
            background: 'linear-gradient(180deg, #c9ecff 0%, #afdefa 62%, rgba(175,222,250,0.2) 100%)',
          }}
        >
          <SkyLayer />
        </div>

        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: 0,
            right: 0,
            height: '7%',
            zIndex: 2,
            background: 'linear-gradient(180deg, rgba(224,246,255,0.82) 0%, rgba(153,214,244,0.45) 60%, rgba(88,169,220,0.08) 100%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 24px, transparent 24px, transparent 58px)',
              backgroundSize: '250px 100%',
              animation: 'ctfSurfaceShimmer 2.8s linear infinite',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: '29%',
            left: 0,
            right: 0,
            bottom: '22%',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(73,168,220,0.28) 0%, rgba(45,116,166,0.5) 48%, rgba(20,61,92,0.76) 100%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(120deg, rgba(255,255,255,0.15) 4%, rgba(255,255,255,0) 32%)',
            }}
          />
          <OceanDecor />
          {fishNodes}
          {animalNodes}
        </div>

        <motion.div
          key={`question-${level}-${round}`}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="ctf-question"
          style={{
            position: 'absolute',
            top: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 12,
            borderRadius: '18px',
            padding: '16px 28px',
            color: '#0f172a',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 900,
            fontSize: '28px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(241,245,249,0.96))',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 12px 28px rgba(15,23,42,0.14)',
          }}
        >
          🐟 How many fish can you count?
        </motion.div>

        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '5%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '14px',
            zIndex: 20,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {roundData.options.map((option) => {
            const disabled = roundState !== 'playing' || answerLockedRef.current;
            const isSelected = selectedAnswer === option;

            let background = 'linear-gradient(135deg, #f59e0b, #ea580c)';
            let shadow = '0 8px 16px rgba(234,88,12,0.28)';

            if (isSelected && isAnswerCorrect === true) {
              background = 'linear-gradient(135deg, #10b981, #059669)';
              shadow = '0 10px 18px rgba(16,185,129,0.35)';
            } else if (isSelected && isAnswerCorrect === false) {
              background = 'linear-gradient(135deg, #ef4444, #dc2626)';
              shadow = '0 10px 18px rgba(239,68,68,0.35)';
            }

            return (
              <motion.button
                key={`ans-${option}`}
                className="ctf-answer"
                onClick={() => handleAnswerClick(option)}
                disabled={disabled}
                whileHover={!disabled ? { scale: 1.06, y: -3 } : {}}
                whileTap={!disabled ? { scale: 0.97 } : {}}
                style={{
                  minWidth: '78px',
                  padding: '14px 24px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  color: '#ffffff',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 900,
                  fontSize: '28px',
                  background,
                  boxShadow: shadow,
                  opacity: disabled && !isSelected ? 0.68 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {option}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {isGameComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(2,6,23,0.62)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 24 }}
              transition={{ type: 'spring', damping: 18, stiffness: 250 }}
              style={{
                width: '100%',
                maxWidth: '540px',
                borderRadius: '28px',
                padding: '38px 28px',
                textAlign: 'center',
                background: 'linear-gradient(160deg, #ffffff, #f0f9ff)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 24px 56px rgba(2,6,23,0.28)',
              }}
            >
              <div style={{ fontSize: '70px', marginBottom: '14px' }}>🏆</div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '34px',
                  fontWeight: 900,
                  letterSpacing: '-0.4px',
                  background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Count the Fish Complete!
              </h2>
              <p style={{ marginTop: '8px', color: '#475569', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>
                Great work counting carefully through every round.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', margin: '24px 0 28px' }}>
                <div style={{ minWidth: '110px', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                  <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '24px', color: '#a16207' }}>{score}</div>
                  <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '11px', color: '#92400e' }}>SCORE</div>
                </div>
                <div style={{ minWidth: '110px', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #bbf7d0, #86efac)' }}>
                  <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '24px', color: '#166534' }}>{correctAnswers}</div>
                  <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '11px', color: '#166534' }}>CORRECT</div>
                </div>
                <div style={{ minWidth: '110px', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #fecaca, #fca5a5)' }}>
                  <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '24px', color: '#991b1b' }}>{mistakes}</div>
                  <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '11px', color: '#991b1b' }}>MISTAKES</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <motion.button
                  onClick={restartGame}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    border: 'none',
                    borderRadius: '14px',
                    padding: '13px 20px',
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 800,
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 8px 18px rgba(16,185,129,0.3)',
                  }}
                >
                  🔄 Play Again
                </motion.button>

                {onNavigateHome && (
                  <motion.button
                    onClick={onNavigateHome}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      border: 'none',
                      borderRadius: '14px',
                      padding: '13px 20px',
                      cursor: 'pointer',
                      color: '#ffffff',
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 800,
                      fontSize: '16px',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      boxShadow: '0 8px 18px rgba(59,130,246,0.3)',
                    }}
                  >
                    🏠 Home
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountFishGame;
