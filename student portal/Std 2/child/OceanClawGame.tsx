import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getLevelConfig, type SaveOceanLevelConfig, type SaveOceanRunResult } from './saveTheOceanLevelSystem';

type ClawState = 'idle' | 'dropping' | 'returning';

interface GameObject {
  id: string;
  type: 'trash' | 'fish' | 'distraction';
  subType: string;
  x: number;
  y: number;
  emoji: string;
  collected: boolean;
  bobDuration: number;
  bobDelay: number;
  swayDistance: number;
  swayDuration: number;
}

interface Props {
  levelConfig?: SaveOceanLevelConfig;
  levelNumber?: number;
  onStatsUpdate: (stats: {
    score: number;
    trashCollected: number;
    mistakes: number;
  }) => void;
  onLevelComplete?: (result: SaveOceanRunResult) => void;
  onBackToMap?: () => void;
  onNavigateHome?: () => void;
}

const TRASH_ITEMS = [
  { subType: 'bottle', emoji: '🍾' },
  { subType: 'bag', emoji: '🛍️' },
  { subType: 'can', emoji: '🥫' },
  { subType: 'cup', emoji: '🥤' },
];

const ANIMALS = [
  { subType: 'fish', emoji: '🐟' },
  { subType: 'turtle', emoji: '🐢' },
  { subType: 'octopus', emoji: '🐙' },
  { subType: 'crab', emoji: '🦀' },
];

const DISTRACTIONS = [
  { subType: 'jellyfish', emoji: '🪼' },
  { subType: 'puffer', emoji: '🐡' },
  { subType: 'squid', emoji: '🦑' },
  { subType: 'anchor', emoji: '⚓' },
];

const MIN_OBJECT_DISTANCE = 15;
const SHIP_MIN_X = 6;
const SHIP_MAX_X = 94;
const BASE_SHIP_SPEED_PER_60FPS = 0.25;
const BASE_CLAW_DROP_SPEED_PER_60FPS = 4;
const BASE_CLAW_RETURN_SPEED_PER_60FPS = 5;
const DEFAULT_LEVEL_CONFIG = getLevelConfig(1);

const SceneCss = React.memo(function SceneCss() {
  return (
    <style>
      {`
        @keyframes ocgCloudDriftA {
          0% { transform: translateX(-16%); }
          100% { transform: translateX(116%); }
        }

        @keyframes ocgCloudDriftB {
          0% { transform: translateX(116%); }
          100% { transform: translateX(-16%); }
        }

        @keyframes ocgBirdDrift {
          0% { transform: translate(-10%, 0px); }
          25% { transform: translate(20%, -8px); }
          50% { transform: translate(50%, 0px); }
          75% { transform: translate(80%, 8px); }
          100% { transform: translate(110%, 0px); }
        }

        @keyframes ocgBirdDriftReverse {
          0% { transform: translate(110%, 0px); }
          25% { transform: translate(80%, 8px); }
          50% { transform: translate(50%, 0px); }
          75% { transform: translate(20%, -8px); }
          100% { transform: translate(-10%, 0px); }
        }

        @keyframes ocgSunPulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.05) rotate(7deg); }
        }

        @keyframes ocgSurfaceShimmer {
          0% { background-position-x: 0%; }
          100% { background-position-x: 220px; }
        }

        @keyframes ocgBubbleUp {
          0% { transform: translate(0px, 0px) scale(0.8); opacity: 0; }
          15% { opacity: 0.55; }
          100% { transform: translate(var(--drift), -340px) scale(1.2); opacity: 0; }
        }

        @keyframes ocgObjectBob {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          25% { transform: translate(-50%, -50%) translateY(-8px) rotate(3deg); }
          50% { transform: translate(-50%, -50%) translateY(-14px) rotate(0deg); }
          75% { transform: translate(-50%, -50%) translateY(-7px) rotate(-3deg); }
        }

        @keyframes ocgObjectSway {
          0%, 100% { margin-left: 0px; }
          50% { margin-left: var(--sway); }
        }

        @keyframes ocgSeaweedSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }

        @media (max-width: 900px) {
          .ocg-title { font-size: 24px !important; }
          .ocg-subtitle { font-size: 12px !important; }
          .ocg-drop-btn { padding: 14px 28px !important; font-size: 18px !important; }
          .ocg-kbd { font-size: 12px !important; }
          .ocg-object { font-size: 30px !important; }
        }
      `}
    </style>
  );
});

const SkyDecor = React.memo(function SkyDecor() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '6%',
          right: '8%',
          fontSize: '48px',
          opacity: 0.95,
          filter: 'drop-shadow(0 0 18px rgba(250,204,21,0.45))',
          animation: 'ocgSunPulse 6s ease-in-out infinite',
        }}
      >
        ☀️
      </div>

      <div style={{ position: 'absolute', top: '12%', left: 0, right: 0, fontSize: '32px', opacity: 0.8, animation: 'ocgCloudDriftA 55s linear infinite' }}>☁️</div>
      <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, fontSize: '28px', opacity: 0.7, animation: 'ocgCloudDriftB 70s linear infinite' }}>☁️</div>
      <div style={{ position: 'absolute', top: '34%', left: 0, right: 0, fontSize: '22px', opacity: 0.65, animation: 'ocgCloudDriftA 86s linear infinite' }}>☁️</div>

      <div style={{ position: 'absolute', top: '18%', left: 0, right: 0, fontSize: '18px', opacity: 0.8, animation: 'ocgBirdDrift 30s linear infinite' }}>🕊️</div>
      <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, fontSize: '16px', opacity: 0.75, animation: 'ocgBirdDriftReverse 36s linear infinite' }}>🕊️</div>
    </>
  );
});

const UnderwaterDecor = React.memo(function UnderwaterDecor() {
  const bubbles = useMemo(
    () =>
      new Array(10).fill(null).map((_, i) => ({
        id: i,
        left: 6 + i * 9,
        duration: 6 + (i % 5) * 1.2,
        delay: i * 0.7,
        drift: `${(i % 2 === 0 ? 1 : -1) * (8 + (i % 4) * 5)}px`,
      })),
    []
  );

  return (
    <>
      <div style={{ position: 'absolute', bottom: '4%', left: '8%', fontSize: '56px', opacity: 0.8, animation: 'ocgSeaweedSway 4s ease-in-out infinite' }}>🪸</div>
      <div style={{ position: 'absolute', bottom: '3%', right: '12%', fontSize: '50px', opacity: 0.8, animation: 'ocgSeaweedSway 5.2s ease-in-out infinite' }}>🌿</div>
      <div style={{ position: 'absolute', bottom: '8%', left: '27%', fontSize: '44px', opacity: 0.72, animation: 'ocgSeaweedSway 4.6s ease-in-out infinite' }}>🌿</div>
      <div style={{ position: 'absolute', bottom: '2%', right: '34%', fontSize: '48px', opacity: 0.78, animation: 'ocgSeaweedSway 5s ease-in-out infinite' }}>🪸</div>

      {bubbles.map((b) => (
        <div
          key={`bubble-${b.id}`}
          style={{
            '--drift': b.drift,
            position: 'absolute',
            left: `${b.left}%`,
            bottom: '-2%',
            fontSize: '20px',
            opacity: 0.5,
            animation: `ocgBubbleUp ${b.duration}s ease-in-out ${b.delay}s infinite`,
          } as React.CSSProperties}
        >
          🫧
        </div>
      ))}
    </>
  );
});

const ObjectSprite = React.memo(function ObjectSprite({ obj }: { obj: GameObject }) {
  if (obj.collected) {
    return null;
  }

  return (
    <div
      className="ocg-object"
      style={{
        position: 'absolute',
        left: `${obj.x}%`,
        top: `${obj.y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: '38px',
        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
        animation: `ocgObjectBob ${obj.bobDuration}s ease-in-out ${obj.bobDelay}s infinite, ocgObjectSway ${obj.swayDuration}s ease-in-out ${obj.bobDelay}s infinite`,
        '--sway': `${obj.swayDistance}px`,
      } as React.CSSProperties}
    >
      {obj.emoji}
    </div>
  );
});

const createInitialObjects = (levelConfig: SaveOceanLevelConfig): GameObject[] => {
  const initialObjects: GameObject[] = [];

  const isTooClose = (x: number, y: number, objects: GameObject[]) => {
    return objects.some((obj) => {
      const dx = Math.abs(obj.x - x);
      const dy = Math.abs(obj.y - y);
      return dx < MIN_OBJECT_DISTANCE && dy < MIN_OBJECT_DISTANCE;
    });
  };

  const wouldBlockTrash = (x: number, y: number, objects: GameObject[]) => {
    return objects.some((obj) => {
      if (obj.type !== 'trash') return false;
      const dx = Math.abs(obj.x - x);
      const isInSameLane = dx < 12;
      const isAboveTrash = y < obj.y - 10;
      return isInSameLane && isAboveTrash;
    });
  };

  const generateSafePosition = (type: 'trash' | 'fish' | 'distraction', attempts = 50): { x: number; y: number } | null => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const x = 10 + Math.random() * 80;
      const y = 20 + Math.random() * 70;

      if (!isTooClose(x, y, initialObjects)) {
        if (type !== 'trash' && wouldBlockTrash(x, y, initialObjects)) {
          continue;
        }
        return { x, y };
      }
    }

    return null;
  };

  for (let i = 0; i < levelConfig.trashSpawnCount; i += 1) {
    const template = TRASH_ITEMS[Math.floor(Math.random() * TRASH_ITEMS.length)];
    const position = generateSafePosition('trash');
    if (!position) continue;

    initialObjects.push({
      id: `trash-${i}`,
      type: 'trash',
      subType: template.subType,
      x: position.x,
      y: position.y,
      emoji: template.emoji,
      collected: false,
      bobDuration: 2.8 + Math.random() * 1.8,
      bobDelay: Math.random() * 2,
      swayDistance: (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 6),
      swayDuration: 4 + Math.random() * 2,
    });
  }

  for (let i = 0; i < levelConfig.fishCount; i += 1) {
    const template = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const position = generateSafePosition('fish');
    if (!position) continue;

    initialObjects.push({
      id: `fish-${i}`,
      type: 'fish',
      subType: template.subType,
      x: position.x,
      y: position.y,
      emoji: template.emoji,
      collected: false,
      bobDuration: 3 + Math.random() * 2,
      bobDelay: Math.random() * 2,
      swayDistance: (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 8),
      swayDuration: 4.2 + Math.random() * 2.2,
    });
  }

  for (let i = 0; i < levelConfig.obstacleCount; i += 1) {
    const template = DISTRACTIONS[Math.floor(Math.random() * DISTRACTIONS.length)];
    const position = generateSafePosition('distraction');
    if (!position) continue;

    initialObjects.push({
      id: `distraction-${i}`,
      type: 'distraction',
      subType: template.subType,
      x: position.x,
      y: position.y,
      emoji: template.emoji,
      collected: false,
      bobDuration: 3 + Math.random() * 2.2,
      bobDelay: Math.random() * 2,
      swayDistance: (Math.random() > 0.5 ? 1 : -1) * (7 + Math.random() * 9),
      swayDuration: 4.3 + Math.random() * 2.4,
    });
  }

  return initialObjects;
};

export const OceanClawGame: React.FC<Props> = ({
  levelConfig = DEFAULT_LEVEL_CONFIG,
  levelNumber = 1,
  onStatsUpdate,
  onLevelComplete,
  onBackToMap,
  onNavigateHome,
}) => {
  const [objects, setObjects] = useState<GameObject[]>(() => createInitialObjects(levelConfig));
  const [score, setScore] = useState(0);
  const [trashCollected, setTrashCollected] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState('');
  const [clawState, setClawState] = useState<ClawState>('idle');
  const [grabbedObject, setGrabbedObject] = useState<GameObject | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(levelConfig.timeLimitSec ?? null);
  const totalTrash = useMemo(() => objects.filter((o) => o.type === 'trash').length, [objects]);

  const shipRef = useRef<HTMLDivElement | null>(null);
  const cableRef = useRef<HTMLDivElement | null>(null);
  const clawRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const messageTimerRef = useRef<number | null>(null);
  const grabbedObjectRef = useRef<GameObject | null>(null);

  const objectsRef = useRef<GameObject[]>(objects);
  const phaseRef = useRef<ClawState>('idle');
  const completeRef = useRef(false);
  const timeUpRef = useRef(false);
  const completionReportedRef = useRef(false);
  const clawXRef = useRef(50);
  const clawYRef = useRef(0);
  const directionRef = useRef<1 | -1>(1);
  const lastFrameTimeRef = useRef<number>(0);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    phaseRef.current = clawState;
  }, [clawState]);

  useEffect(() => {
    completeRef.current = isGameComplete;
  }, [isGameComplete]);

  useEffect(() => {
    timeUpRef.current = isTimeUp;
  }, [isTimeUp]);

  useEffect(() => {
    onStatsUpdate({ score, trashCollected, mistakes });
  }, [score, trashCollected, mistakes, onStatsUpdate]);

  useEffect(() => {
    if (totalTrash > 0 && trashCollected >= totalTrash && !isGameComplete) {
      setIsGameComplete(true);
      completeRef.current = true;
    }
  }, [totalTrash, trashCollected, isGameComplete]);

  useEffect(() => {
    if (isGameComplete || isTimeUp || !levelConfig.timeLimitSec) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeftSec((prev) => {
        const next = typeof prev === 'number' ? prev - 1 : levelConfig.timeLimitSec ?? 0;
        if (next <= 0) {
          window.clearInterval(timer);
          setIsTimeUp(true);
          timeUpRef.current = true;
          phaseRef.current = 'idle';
          setClawState('idle');
          setMessage('⏰ Time up! Try again.');
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isGameComplete, isTimeUp, levelConfig.timeLimitSec]);

  useEffect(() => {
    if (!isGameComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onLevelComplete?.({
      score,
      mistakes,
      timeLeftSec: timeLeftSec ?? undefined,
    });
  }, [isGameComplete, mistakes, onLevelComplete, score, timeLeftSec]);

  const setMessageWithTimeout = useCallback((value: string) => {
    setMessage(value);
    if (messageTimerRef.current) {
      window.clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = window.setTimeout(() => {
      setMessage('');
    }, 1500);
  }, []);

  const applyHit = useCallback(
    (obj: GameObject) => {
      if (obj.type === 'trash') {
        setScore((prev) => prev + levelConfig.scoreValues.trashPoints);
        setTrashCollected((prev) => prev + 1);
        setMessageWithTimeout(`🎉 +${levelConfig.scoreValues.trashPoints} Trash collected!`);
        setObjects((prev) => prev.map((item) => (item.id === obj.id ? { ...item, collected: true } : item)));
      } else if (obj.type === 'fish') {
        setScore((prev) => Math.max(0, prev - levelConfig.scoreValues.fishPenalty));
        setMistakes((prev) => prev + 1);
        setMessageWithTimeout(`😢 -${levelConfig.scoreValues.fishPenalty} Protect sea friends!`);
      } else {
        setScore((prev) => Math.max(0, prev - levelConfig.scoreValues.distractionPenalty));
        setMistakes((prev) => prev + 1);
        setMessageWithTimeout(`⚠️ -${levelConfig.scoreValues.distractionPenalty} Avoid distractions!`);
      }
    },
    [levelConfig.scoreValues.distractionPenalty, levelConfig.scoreValues.fishPenalty, levelConfig.scoreValues.trashPoints, setMessageWithTimeout]
  );

  const setPhase = useCallback((next: ClawState) => {
    if (phaseRef.current !== next) {
      phaseRef.current = next;
      setClawState(next);
    }
  }, []);

  const syncVisuals = useCallback(() => {
    const x = clawXRef.current;
    const y = clawYRef.current;

    if (shipRef.current) {
      shipRef.current.style.left = `${x}%`;
    }

    if (cableRef.current) {
      cableRef.current.style.left = `${x}%`;
      cableRef.current.style.height = `${y * 0.64}%`;
      cableRef.current.style.opacity = y > 0 ? '0.92' : '0.82';
    }

    if (clawRef.current) {
      clawRef.current.style.left = `${x}%`;
      clawRef.current.style.top = `${35 + y * 0.64}%`;
    }
  }, []);

  const processDropCollision = useCallback(() => {
    const x = clawXRef.current;
    const y = clawYRef.current;

    const hitObject = objectsRef.current.find((obj) => {
      if (obj.collected) return false;
      const dx = Math.abs(obj.x - x);
      const dy = Math.abs(obj.y - y);
      return dx < 8 && dy < 8;
    });

    if (!hitObject) return false;

    grabbedObjectRef.current = hitObject;
    setGrabbedObject(hitObject);
    applyHit(hitObject);
    setPhase('returning');
    return true;
  }, [applyHit, setPhase]);

  const gameLoop = useCallback(
    (time: number) => {
      if (completeRef.current || timeUpRef.current) {
        rafRef.current = null;
        return;
      }

      const prev = lastFrameTimeRef.current || time;
      const delta = Math.min(40, Math.max(8, time - prev));
      const normalizedStep = delta / 16.666;
      lastFrameTimeRef.current = time;

      if (phaseRef.current === 'idle') {
        clawYRef.current = 0;
        clawXRef.current += directionRef.current * BASE_SHIP_SPEED_PER_60FPS * levelConfig.movementSpeed * normalizedStep;

        if (clawXRef.current >= SHIP_MAX_X) {
          clawXRef.current = SHIP_MAX_X;
          directionRef.current = -1;
        }

        if (clawXRef.current <= SHIP_MIN_X) {
          clawXRef.current = SHIP_MIN_X;
          directionRef.current = 1;
        }
      } else if (phaseRef.current === 'dropping') {
        clawYRef.current += BASE_CLAW_DROP_SPEED_PER_60FPS * levelConfig.movementSpeed * normalizedStep;

        if (!processDropCollision() && clawYRef.current >= 100) {
          setScore((prev) => Math.max(0, prev - levelConfig.scoreValues.missPenalty));
          setMistakes((prev) => prev + 1);
          setMessageWithTimeout(`🌊 Missed! -${levelConfig.scoreValues.missPenalty}`);
          setPhase('returning');
        }
      } else if (phaseRef.current === 'returning') {
        clawYRef.current -= BASE_CLAW_RETURN_SPEED_PER_60FPS * levelConfig.movementSpeed * normalizedStep;

        if (clawYRef.current <= 0) {
          clawYRef.current = 0;
          grabbedObjectRef.current = null;
          setGrabbedObject(null);
          setPhase('idle');
        }
      }

      syncVisuals();
      rafRef.current = window.requestAnimationFrame(gameLoop);
    },
    [
      levelConfig.movementSpeed,
      levelConfig.scoreValues.missPenalty,
      processDropCollision,
      setMessageWithTimeout,
      setPhase,
      syncVisuals,
    ]
  );

  const startGameLoop = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
    }

    lastFrameTimeRef.current = performance.now();
    rafRef.current = window.requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    syncVisuals();
    startGameLoop();

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [startGameLoop, syncVisuals]);

  const dropClaw = useCallback(() => {
    if (phaseRef.current !== 'idle' || completeRef.current || timeUpRef.current) return;

    grabbedObjectRef.current = null;
    setGrabbedObject(null);
    setPhase('dropping');
  }, [setPhase]);

  const restartGame = useCallback(() => {
    const resetObjects = createInitialObjects(levelConfig);

    if (messageTimerRef.current) {
      window.clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }

    setObjects(resetObjects);
    objectsRef.current = resetObjects;

    setScore(0);
    setTrashCollected(0);
    setMistakes(0);
    setMessage('');

    setIsGameComplete(false);
    completeRef.current = false;
    setIsTimeUp(false);
    timeUpRef.current = false;
    setTimeLeftSec(levelConfig.timeLimitSec ?? null);
    completionReportedRef.current = false;

    grabbedObjectRef.current = null;
    setGrabbedObject(null);

    clawXRef.current = 50;
    clawYRef.current = 0;
    directionRef.current = 1;

    setPhase('idle');
    syncVisuals();
    startGameLoop();
  }, [levelConfig, setPhase, startGameLoop, syncVisuals]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && phaseRef.current === 'idle' && !completeRef.current && !timeUpRef.current) {
        event.preventDefault();
        dropClaw();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dropClaw]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (messageTimerRef.current) {
        window.clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  const underwaterObjects = useMemo(() => {
    return objects.map((obj) => <ObjectSprite key={obj.id} obj={obj} />);
  }, [objects]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <SceneCss />

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{
              position: 'absolute',
              top: '-68px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '14px 28px',
              borderRadius: '16px',
              color: '#ffffff',
              fontSize: '19px',
              fontWeight: 800,
              fontFamily: 'Nunito, sans-serif',
              background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
              boxShadow: '0 10px 24px rgba(14,165,233,0.35)',
              zIndex: 100,
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
          boxShadow: '0 18px 50px rgba(6, 78, 124, 0.22), 0 2px 0 rgba(255,255,255,0.55) inset',
          border: '1px solid rgba(255,255,255,0.6)',
          background: 'linear-gradient(180deg, #95d6ff 0%, #8cd3fb 18%, #43a7df 34%, #2f89c8 48%, #24699f 66%, #1d5077 82%, #15354f 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '24%',
            background: 'linear-gradient(180deg, #bce7ff 0%, #9fdcff 56%, rgba(159,220,255,0.15) 100%)',
            zIndex: 1,
          }}
        >
          <SkyDecor />
        </div>

        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: 0,
            right: 0,
            height: '6%',
            background:
              'linear-gradient(180deg, rgba(224,247,255,0.75) 0%, rgba(153,215,245,0.42) 56%, rgba(75,161,214,0.08) 100%)',
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 22px, transparent 22px, transparent 56px)',
              backgroundSize: '220px 100%',
              animation: 'ocgSurfaceShimmer 2.8s linear infinite',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: '24%',
            left: 0,
            right: 0,
            height: '76%',
            zIndex: 1,
            background:
              'linear-gradient(180deg, rgba(70,167,221,0.32) 0%, rgba(49,131,188,0.45) 22%, rgba(35,98,143,0.72) 60%, rgba(20,58,87,0.92) 100%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(115deg, rgba(255,255,255,0.16) 2%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 100%)',
              pointerEvents: 'none',
            }}
          />
          <UnderwaterDecor />
          {underwaterObjects}
        </div>

        <div
          ref={shipRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: '24.2%',
            transform: 'translate(-50%, -50%)',
            width: '144px',
            height: '84px',
            zIndex: 5,
            filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.28))',
            animation: 'ocgObjectBob 3.4s ease-in-out infinite',
            willChange: 'transform,left',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '9%',
                right: '9%',
                height: '64%',
                borderRadius: '15px 15px 52% 52%',
                background: 'linear-gradient(135deg, #ff7058 0%, #ef4444 45%, #b91c1c 100%)',
                boxShadow: '0 7px 16px rgba(127,29,29,0.32), inset 0 1px 0 rgba(255,255,255,0.28)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '40%',
                left: '11%',
                right: '11%',
                height: '4px',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.28)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '44%',
                left: '24%',
                right: '24%',
                height: '50%',
                borderRadius: '10px 10px 0 0',
                background: 'linear-gradient(135deg, #fffde8 0%, #fde68a 100%)',
                boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '86%',
                left: '20%',
                right: '20%',
                height: '10%',
                borderRadius: '4px',
                background: 'linear-gradient(135deg, #f87171, #dc2626)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '58%',
                left: '32%',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #bae6fd, #60a5fa)',
                border: '2px solid #0284c7',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '58%',
                right: '32%',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #bae6fd, #60a5fa)',
                border: '2px solid #0284c7',
              }}
            />
            <span style={{ position: 'absolute', top: '-17px', left: '50%', transform: 'translateX(-50%)', fontSize: '30px' }}>⚓</span>
          </div>
        </div>

        <div
          ref={cableRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: '28.5%',
            width: '4px',
            height: '0%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #9ca3af 0%, #6b7280 100%)',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            zIndex: 6,
            willChange: 'height,left',
          }}
        />

        <div
          ref={clawRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: '35%',
            transform: 'translate(-50%, -50%)',
            width: '62px',
            height: '62px',
            zIndex: 7,
            willChange: 'top,left',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              animation: clawState === 'idle' ? 'ocgSeaweedSway 1.2s ease-in-out infinite' : 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #a5b4fc, #94a3b8)',
                boxShadow: '0 3px 8px rgba(0,0,0,0.26)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '8px',
                width: '18px',
                height: '36px',
                borderRadius: '0 0 11px 11px',
                transform: 'rotate(-18deg)',
                background: 'linear-gradient(135deg, #d1d5db, #9ca3af)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: '8px',
                width: '18px',
                height: '36px',
                borderRadius: '0 0 11px 11px',
                transform: 'rotate(18deg)',
                background: 'linear-gradient(135deg, #d1d5db, #9ca3af)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            />
          </div>

          {grabbedObject && (
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '110%',
                transform: 'translateX(-50%)',
                fontSize: '36px',
                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))',
              }}
            >
              {grabbedObject.emoji}
            </motion.div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: '26px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '18px 20px',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(248,250,252,0.95))',
          border: '1px solid rgba(226,232,240,0.8)',
          boxShadow: '0 10px 24px rgba(15,23,42,0.08)',
        }}
      >
        <motion.button
          className="ocg-drop-btn"
          onClick={dropClaw}
          disabled={clawState !== 'idle' || isTimeUp}
          whileHover={clawState === 'idle' && !isTimeUp ? { scale: 1.04, y: -2 } : {}}
          whileTap={clawState === 'idle' && !isTimeUp ? { scale: 0.97 } : {}}
          style={{
            padding: '17px 36px',
            borderRadius: '16px',
            border: 'none',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '20px',
            fontWeight: 900,
            letterSpacing: '0.3px',
            cursor: clawState === 'idle' && !isTimeUp ? 'pointer' : 'not-allowed',
            color: '#ffffff',
            background:
              clawState === 'idle' && !isTimeUp
                ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 55%, #c2410c 100%)'
                : 'linear-gradient(135deg, #94a3b8, #64748b)',
            opacity: clawState === 'idle' && !isTimeUp ? 1 : 0.72,
            boxShadow:
              clawState === 'idle' && !isTimeUp
                ? '0 8px 16px rgba(234,88,12,0.33), inset 0 1px 0 rgba(255,255,255,0.34)'
                : '0 4px 8px rgba(100,116,139,0.2)',
          }}
        >
          {clawState === 'dropping' && '⬇️ Dropping...'}
          {clawState === 'returning' && '⬆️ Returning...'}
          {clawState === 'idle' && !isTimeUp && '⬇️ Drop Claw'}
          {isTimeUp && '⏰ Time Up'}
        </motion.button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
            border: '1px solid rgba(203,213,225,0.75)',
            fontFamily: 'Nunito, sans-serif',
            color: '#334155',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          <span style={{ opacity: 0.78 }}>Press</span>
          <kbd
            className="ocg-kbd"
            style={{
              padding: '6px 10px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
              border: '1px solid #cbd5e1',
              boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
              fontSize: '13px',
              fontWeight: 900,
              letterSpacing: '0.8px',
            }}
          >
            SPACE
          </kbd>
          <span style={{ opacity: 0.78 }}>to drop</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #ecfeff, #cffafe)',
            border: '1px solid rgba(14,116,144,0.3)',
            fontFamily: 'Nunito, sans-serif',
            color: '#155e75',
            fontWeight: 800,
            fontSize: '13px',
          }}
        >
          <span>Level {levelNumber}</span>
          <span>•</span>
          <span>{levelConfig.difficulty.toUpperCase()}</span>
          <span>•</span>
          <span>Target {levelConfig.targetScore}</span>
          {typeof timeLeftSec === 'number' && (
            <>
              <span>•</span>
              <span>⏳ {timeLeftSec}s</span>
            </>
          )}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              background: 'rgba(2, 6, 23, 0.62)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.86, y: 28 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.86, y: 28 }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}
              style={{
                width: '100%',
                maxWidth: '520px',
                borderRadius: '30px',
                padding: '40px 30px',
                textAlign: 'center',
                background: 'linear-gradient(160deg, #ffffff 0%, #f0f9ff 100%)',
                boxShadow: '0 24px 60px rgba(2, 6, 23, 0.28)',
                border: '1px solid rgba(255,255,255,0.6)',
              }}
            >
              <div style={{ fontSize: '68px', marginBottom: '18px' }}>🎉</div>
              <h2
                className="ocg-title"
                style={{
                  margin: 0,
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 900,
                  fontSize: '34px',
                  letterSpacing: '-0.4px',
                  background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Congratulations!
              </h2>
              <p
                className="ocg-subtitle"
                style={{ marginTop: '8px', marginBottom: '28px', color: '#475569', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
              >
                You collected all ocean trash while protecting sea life.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '30px' }}>
                <div style={{ minWidth: '112px', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#a16207', fontFamily: 'Nunito, sans-serif' }}>{score}</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#92400e', fontFamily: 'Nunito, sans-serif', letterSpacing: '0.6px' }}>POINTS</div>
                </div>
                <div style={{ minWidth: '112px', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #bbf7d0, #86efac)' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#166534', fontFamily: 'Nunito, sans-serif' }}>{trashCollected}</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534', fontFamily: 'Nunito, sans-serif', letterSpacing: '0.6px' }}>TRASH</div>
                </div>
                <div style={{ minWidth: '112px', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #fecaca, #fca5a5)' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#991b1b', fontFamily: 'Nunito, sans-serif' }}>{mistakes}</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#991b1b', fontFamily: 'Nunito, sans-serif', letterSpacing: '0.6px' }}>MISTAKES</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <motion.button
                  onClick={restartGame}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    border: 'none',
                    padding: '14px 22px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 800,
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
                    boxShadow: '0 8px 18px rgba(14,165,233,0.32)',
                  }}
                >
                  🔄 Play Again
                </motion.button>

                {onBackToMap && (
                  <motion.button
                    onClick={onBackToMap}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      border: 'none',
                      padding: '14px 22px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      color: '#ffffff',
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 800,
                      fontSize: '16px',
                      background: 'linear-gradient(135deg, #0ea5a4, #0891b2)',
                      boxShadow: '0 8px 18px rgba(14,165,164,0.32)',
                    }}
                  >
                    🗺️ Level Map
                  </motion.button>
                )}

                {onNavigateHome && (
                  <motion.button
                    onClick={onNavigateHome}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      border: 'none',
                      padding: '14px 22px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      color: '#ffffff',
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 800,
                      fontSize: '16px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      boxShadow: '0 8px 18px rgba(99,102,241,0.32)',
                    }}
                  >
                    ↩️ Back
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {isTimeUp && !isGameComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              background: 'rgba(2, 6, 23, 0.62)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.86, y: 28 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.86, y: 28 }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}
              style={{
                width: '100%',
                maxWidth: '520px',
                borderRadius: '30px',
                padding: '34px 30px',
                textAlign: 'center',
                background: 'linear-gradient(160deg, #ffffff 0%, #f0f9ff 100%)',
                boxShadow: '0 24px 60px rgba(2, 6, 23, 0.28)',
                border: '1px solid rgba(255,255,255,0.6)',
              }}
            >
              <div style={{ fontSize: '58px', marginBottom: '12px' }}>⏰</div>
              <h2
                className="ocg-title"
                style={{
                  margin: 0,
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 900,
                  fontSize: '30px',
                  letterSpacing: '-0.4px',
                  color: '#0f172a',
                }}
              >
                Time's Up, Ocean Hero!
              </h2>
              <p
                className="ocg-subtitle"
                style={{ marginTop: '8px', marginBottom: '22px', color: '#475569', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}
              >
                You can retry this level and keep practicing your cleanup skills.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <motion.button
                  onClick={restartGame}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    border: 'none',
                    padding: '14px 22px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 800,
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
                    boxShadow: '0 8px 18px rgba(14,165,233,0.32)',
                  }}
                >
                  🔄 Try Again
                </motion.button>
                {onBackToMap && (
                  <motion.button
                    onClick={onBackToMap}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      border: 'none',
                      padding: '14px 22px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      color: '#ffffff',
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 800,
                      fontSize: '16px',
                      background: 'linear-gradient(135deg, #0ea5a4, #0891b2)',
                      boxShadow: '0 8px 18px rgba(14,165,164,0.32)',
                    }}
                  >
                    🗺️ Back to Map
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

export default OceanClawGame;
