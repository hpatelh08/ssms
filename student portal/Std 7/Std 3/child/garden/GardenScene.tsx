/**
 * garden/GardenScene.tsx
 * ──────────────────────────────────────────────────
 * Main orchestrator for the Interactive Garden.
 *
 * Composes:  WeatherController + Tree + Birds + Sparkle
 *
 * Owns ALL state:
 *  - fruits[]       (attached to canopy anchors)
 *  - birds[]        (ambient + spawned)
 *  - weather        (rain, sun, rainbow)
 *  - XP / level     (drives growth)
 *  - sparkles[]
 *
 * Interactive features:
 *  1. Watering — rain + new fruit + canopy glow
 *  2. Sun — sky brightens + sway boost + sparkles
 *  3. Birds — spawn a new bird
 *  4. Fruits — tap existing fruit → shake + XP + sparkle
 *  5. Growth — XP drives stage/level, canopy + flowers grow
 *
 * Button bar at bottom — 5 action buttons + Clear.
 *
 * Performance:
 *  - React.memo on all sub-components
 *  - useCallback for every handler
 *  - No heavy re-renders (only relevant state slices update)
 *  - CSS transform & opacity only
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSoundPlay } from '../SoundProvider';
import { useCelebrate } from '../useCelebrationController';
import { useMascotTrigger } from '../useMascotController';
import { useXPSystem } from '../useXPSystem';

import { Tree, TREE_CSS } from './Tree';
import { type FruitData, CANOPY_ANCHORS, makeFruit, FRUIT_CSS } from './Fruit';
import { Birds, type BirdData, makeAmbientBird, makeSpawnedBird, makeAmbientButterfly, makeSpawnedButterfly, BIRDS_CSS } from './Birds';
import { WeatherController, WEATHER_CSS } from './WeatherController';
import { Sparkle, useSparkleManager, SPARKLE_CSS } from './Sparkle';

/* ── Types ───────────────────────────────────── */

export interface FlowerData {
  id: number;
  x: number;      // % from left within flower-zone
  bottom: number;  // px from bottom of flower-zone
  kind: string;    // emoji
}

/* ── Constants ───────────────────────────────── */

const MAX_SPAWNED_BIRDS = 5;
const MAX_SPAWNED_BUTTERFLIES = 4;
const MAX_FRUITS_PER_LAYER = [4, 7, 10]; // top, mid, bottom (expanded)
const FRUIT_XP = 5;
const WATER_XP = 8;
const SUN_XP   = 6;
const BIRD_XP  = 3;
const BUTTERFLY_XP = 4;
const FLOWER_XP = 4;
const MAGIC_XP = 10;
const MAX_FLOWERS = 12;

const FLOWER_EMOJIS = ['\uD83C\uDF3C', '\uD83C\uDF3B', '\uD83C\uDF37', '\uD83C\uDF3A', '\uD83C\uDF38', '\uD83C\uDFF5\uFE0F', '\uD83C\uDF39', '\uD83C\uDF3C'];

/* Flower anchor positions — avoid center trunk (40-60%) */
const FLOWER_ANCHORS = [
  { x: 5 },  { x: 12 }, { x: 19 }, { x: 26 }, { x: 33 },
  { x: 67 }, { x: 74 }, { x: 81 }, { x: 88 }, { x: 95 },
  { x: 10 }, { x: 85 },
];

/* Stage thresholds — 6 stages for Std 7 progression */
const stageFromLevel = (level: number): number => {
  if (level >= 12) return 6;  // Magical
  if (level >= 9)  return 5;  // Grand
  if (level >= 6)  return 4;  // Mature
  if (level >= 4)  return 3;  // Young
  if (level >= 2)  return 2;  // Sapling
  return 1;                   // Seedling
};

/* Garden title based on stage */
const GARDEN_TITLES = [
  '', // 0 unused
  '\uD83C\uDF31 Seedling Gardener',
  '\uD83C\uDF3F Sprout Keeper',
  '\uD83C\uDF33 Nature Friend',
  '\u2B50 Tree Master',
  '\uD83E\uDD8B Garden Guardian',
  '\u2728 Magical Gardener',
];

const STORAGE_KEY = 'ssms_garden_state';

/* ── Component ───────────────────────────────── */

export const GardenScene: React.FC = React.memo(() => {
  const play = useSoundPlay();
  const celebrate = useCelebrate();
  const triggerMascot = useMascotTrigger();

  /* XP system */
  const { state: xpState, addXP, justGained } = useXPSystem(
    useCallback((newLevel: number) => {
      celebrate('confetti');
      triggerMascot('celebrate', 3000);
    }, [celebrate, triggerMascot])
  );

  /* Derived */
  const treeStage = stageFromLevel(xpState.level);

  /* ── Flowers ─────────────────────────────────── */
  const [flowers, setFlowers] = useState<FlowerData[]>([]);
  const flowerSlotRef = useRef(0);

  /* ── Fruits ─────────────────────────────────── */
  const [fruits, setFruits] = useState<FruitData[]>([]);
  const fruitSlotRef = useRef<[number, number, number]>([0, 0, 0]);

  /** Add a fruit to the best available canopy layer */
  const addFruit = useCallback(() => {
    const layerOrder = [2, 1, 0];
    let targetLayer = -1;
    for (const l of layerOrder) {
      if (l === 0 && treeStage < 3) continue;
      if (l === 1 && treeStage < 2) continue;
      const currentCount = fruits.filter(f => f.layer === l).length;
      if (currentCount < MAX_FRUITS_PER_LAYER[l]) {
        targetLayer = l;
        break;
      }
    }
    if (targetLayer === -1) return;

    const anchors = CANOPY_ANCHORS[targetLayer];
    const idx = fruitSlotRef.current[targetLayer] % anchors.length;
    fruitSlotRef.current[targetLayer]++;
    const anchor = anchors[idx];

    const fruit = makeFruit(targetLayer, anchor.x, anchor.y);
    setFruits(prev => {
      const existing = prev.filter(f => !(f.layer === targetLayer && f.anchorX === anchor.x && f.anchorY === anchor.y));
      return [...existing, fruit];
    });
  }, [treeStage, fruits]);

  /* ── Birds ──────────────────────────────────── */
  const [ambientBirds] = useState<BirdData[]>(() => [
    makeAmbientBird(0),
    makeAmbientBird(1),
    makeAmbientBird(2),
  ]);
  const [spawnedBirds, setSpawnedBirds] = useState<BirdData[]>([]);

  /* ── Butterflies ────────────────────────────── */
  const [ambientButterflies] = useState<BirdData[]>(() => [
    makeAmbientButterfly(0),
    makeAmbientButterfly(1),
  ]);
  const [spawnedButterflies, setSpawnedButterflies] = useState<BirdData[]>([]);

  const allCreatures = useMemo(() => [
    ...ambientBirds, ...spawnedBirds,
    ...ambientButterflies, ...spawnedButterflies,
  ], [ambientBirds, spawnedBirds, ambientButterflies, spawnedButterflies]);

  /* ── Weather / interactions ─────────────────── */
  const [rainActive, setRainActive]   = useState(false);
  const [sunActive, setSunActive]     = useState(false);
  const [sunUsed, setSunUsed]         = useState(false);
  const [rainUsed, setRainUsed]       = useState(false);
  const [glowing, setGlowing]         = useState(false);
  const [swayBoost, setSwayBoost]     = useState(false);
  const [skyBrightness, setSkyBrightness] = useState(0);
  const [magicMode, setMagicMode]     = useState(false);
  const showRainbow = sunUsed && rainUsed;

  /* ── Sparkles ───────────────────────────────── */
  const { sparkles, spawn: spawnSparkle, remove: removeSparkle, burst: sparkBurst } = useSparkleManager();

  /* ── Celebration check ──────────────────────── */
  const [showMagical, setShowMagical] = useState(false);
  const gardenMagical = showRainbow && fruits.length >= 5 && (spawnedBirds.length > 0 || spawnedButterflies.length > 0);

  useEffect(() => {
    if (gardenMagical && !showMagical) {
      setShowMagical(true);
      celebrate('confetti');
      play('celebrate');
      triggerMascot('celebrate', 3500);
      setTimeout(() => setShowMagical(false), 4500);
    }
  }, [gardenMagical, showMagical, celebrate, play, triggerMascot]);

  /* ── Button bounce state ────────────────────── */
  const [btnBounce, setBtnBounce] = useState<string | null>(null);
  const bounceBtn = useCallback((name: string) => {
    setBtnBounce(name);
    setTimeout(() => setBtnBounce(null), 400);
  }, []);

  /* ── Clearing ───────────────────────────────── */
  const [clearing, setClearing] = useState(false);
  const handleClear = useCallback(() => {
    play('click');
    setClearing(true);
    setTimeout(() => {
      setFruits([]);
      setFlowers([]);
      setSpawnedBirds([]);
      setSpawnedButterflies([]);
      setSunUsed(false);
      setRainUsed(false);
      setSunActive(false);
      setRainActive(false);
      setGlowing(false);
      setSwayBoost(false);
      setSkyBrightness(0);
      setShowMagical(false);
      setMagicMode(false);
      fruitSlotRef.current = [0, 0, 0];
      flowerSlotRef.current = 0;
      setClearing(false);
    }, 500);
  }, [play]);

  /* ═══════════════════════════════════════════════
     BUTTON HANDLERS
     ═══════════════════════════════════════════════ */

  /** 1. Watering — rain + new fruit + canopy glow */
  const handleWater = useCallback(() => {
    if (rainActive) return;
    play('click');
    bounceBtn('water');
    triggerMascot('excited');
    setRainActive(true);
    setRainUsed(true);
    setGlowing(true);

    // grow a fruit after short delay
    setTimeout(() => addFruit(), 600);

    addXP(WATER_XP);

    // stop rain + glow after 2.8s
    setTimeout(() => { setRainActive(false); setGlowing(false); }, 2800);
  }, [rainActive, play, bounceBtn, triggerMascot, addFruit, addXP]);

  /** 2. Sun — sky brightens + sway boost + sparkles */
  const handleSun = useCallback(() => {
    play('correct');
    bounceBtn('sun');
    triggerMascot('happy');
    setSunActive(true);
    setSunUsed(true);
    setSkyBrightness(0.5);
    setSwayBoost(true);

    // sparkle particles
    const baseX = window.innerWidth * 0.82;
    spawnSparkle(baseX, 60, '#fde047', 28);
    spawnSparkle(baseX - 20, 40, '#fbbf24', 20);
    spawnSparkle(baseX + 15, 80, '#f59e0b', 24);

    addXP(SUN_XP);

    setTimeout(() => {
      setSunActive(false);
      setSwayBoost(false);
      setSkyBrightness(0);
    }, 3000);
  }, [play, bounceBtn, triggerMascot, spawnSparkle, addXP]);

  /** 3. Add fruit button */
  const handleAddFruit = useCallback(() => {
    play('correct');
    bounceBtn('fruit');
    triggerMascot('happy');
    addFruit();
    addXP(FRUIT_XP);
  }, [play, bounceBtn, triggerMascot, addFruit, addXP]);

  /** 4. Spawn bird */
  const handleSpawnBird = useCallback(() => {
    if (spawnedBirds.length >= MAX_SPAWNED_BIRDS) return;
    play('click');
    bounceBtn('bird');
    triggerMascot('excited');

    const bird = makeSpawnedBird();
    setSpawnedBirds(prev => [...prev, bird]);
    addXP(BIRD_XP);

    // auto-remove after flight
    setTimeout(() => {
      setSpawnedBirds(prev => prev.filter(b => b.id !== bird.id));
    }, bird.duration * 1000);
  }, [spawnedBirds.length, play, bounceBtn, triggerMascot, addXP]);

  /** 5. Add flower (new) */
  const handleAddFlower = useCallback(() => {
    if (flowers.length >= MAX_FLOWERS) return;
    play('correct');
    bounceBtn('flower');
    triggerMascot('happy');

    const idx = flowerSlotRef.current % FLOWER_ANCHORS.length;
    flowerSlotRef.current++;
    const anchor = FLOWER_ANCHORS[idx];
    const bottomOffset = 10 + (idx % 3) * 35;

    const flower: FlowerData = {
      id: Date.now() + Math.random(),
      x: anchor.x,
      bottom: bottomOffset,
      kind: FLOWER_EMOJIS[flowers.length % FLOWER_EMOJIS.length],
    };
    setFlowers(prev => [...prev, flower]);
    addXP(FLOWER_XP);
  }, [flowers.length, play, bounceBtn, triggerMascot, addXP]);

  /** 6. Spawn butterfly */
  const handleSpawnButterfly = useCallback(() => {
    if (spawnedButterflies.length >= MAX_SPAWNED_BUTTERFLIES) return;
    play('correct');
    bounceBtn('butterfly');
    triggerMascot('excited');

    const butterfly = makeSpawnedButterfly();
    setSpawnedButterflies(prev => [...prev, butterfly]);
    addXP(BUTTERFLY_XP);

    setTimeout(() => {
      setSpawnedButterflies(prev => prev.filter(b => b.id !== butterfly.id));
    }, butterfly.duration * 1000);
  }, [spawnedButterflies.length, play, bounceBtn, triggerMascot, addXP]);

  /** 7. Magic Wand — special particle burst */
  const handleMagic = useCallback(() => {
    if (magicMode) return;
    play('celebrate');
    bounceBtn('magic');
    triggerMascot('celebrate', 3000);
    setMagicMode(true);

    // sparkle burst from center
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.35;
    sparkBurst(cx, cy, 8, '#a78bfa');

    addXP(MAGIC_XP);

    setTimeout(() => setMagicMode(false), 4000);
  }, [magicMode, play, bounceBtn, triggerMascot, sparkBurst, addXP]);

  /** 8. Fruit clicked (existing fruit in tree) */
  const handleFruitClick = useCallback((fruit: FruitData, rect: DOMRect | null) => {
    play('correct');
    triggerMascot('happy');

    // sparkle near the fruit
    if (rect) {
      spawnSparkle(rect.left + rect.width / 2, rect.top - 6, '#fbbf24', 26);
    }

    addXP(FRUIT_XP);
  }, [play, triggerMascot, spawnSparkle, addXP]);

  /** 9. Bird/butterfly clicked */
  const handleBirdClick = useCallback((bird: BirdData, rect: DOMRect | null) => {
    play('click');
    triggerMascot('happy');

    if (rect) {
      spawnSparkle(rect.left + rect.width / 2, rect.top, '#ec4899', 22);
    }
  }, [play, triggerMascot, spawnSparkle]);

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <div style={{
      ...styles.wrapper,
      opacity: clearing ? 0 : 1,
      transition: 'opacity 0.5s ease',
    }}>
      {/* ─── SCENE ──────────────────────────────── */}
      <div style={styles.scene}>
        {/* Weather: sky, clouds, pollen, sun, rainbow, rain */}
        <WeatherController
          raining={rainActive}
          sunActive={sunActive}
          showRainbow={showRainbow}
          skyBrightness={skyBrightness}
          magicMode={magicMode}
        />

        {/* Horizon haze */}
        <div style={styles.horizonHaze} />

        {/* Birds & Butterflies */}
        <Birds birds={allCreatures} onBirdClick={handleBirdClick} />

        {/* GROUND */}
        <div style={styles.ground}>
          <div style={styles.groundHighlight} />
          {/* Grass blades */}
          <div style={styles.grassRow}>
            {GRASS.map((g, i) => (
              <div key={i} className="garden-grass-sway" style={{
                position: 'absolute', left: `${g.x}%`, top: `-${g.h - 3}px`,
                width: 5, height: g.h, borderRadius: '50% 50% 0 0',
                background: 'linear-gradient(180deg, #86efac, #4ade80)',
                opacity: 0.55, transform: `rotate(${g.r}deg)`,
                transformOrigin: 'bottom center', animationDelay: `${i * 0.3}s`,
              }} />
            ))}
          </div>

          {/* Grass shimmer highlights */}
          {GRASS_SHIMMER.map((gs, i) => (
            <div key={`gs-${i}`} className="garden-grass-shimmer" style={{
              position: 'absolute', left: `${gs.x}%`, top: `${gs.y}%`,
              width: gs.size, height: gs.size, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.45), transparent 70%)',
              animationDelay: `${gs.delay}s`, pointerEvents: 'none',
            }} />
          ))}

          {/* FLOWER ZONE — positioned in ground, never overlaps trunk/fruits */}
          <div style={styles.flowerZone}>
            {flowers.map(f => (
              <span
                key={f.id}
                className="garden-flower-grow"
                style={{
                  position: 'absolute',
                  left: `${f.x}%`,
                  bottom: f.bottom,
                  fontSize: 22,
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                {f.kind}
              </span>
            ))}
          </div>
        </div>

        {/* TREE (centered above ground) */}
        <div style={styles.treeContainer}>
          <Tree
            stage={treeStage}
            level={xpState.level}
            fruits={fruits}
            onFruitClick={handleFruitClick}
            glowing={glowing}
            swayBoost={swayBoost}
          />
        </div>

        {/* Sparkles overlay */}
        {sparkles.map(s => (
          <Sparkle key={s.id} sparkle={s} onDone={removeSparkle} />
        ))}

        {/* Progress dots / XP display + Garden Title */}
        <div style={styles.progressBar}>
          <div style={styles.progressLabel}>
            Lv {xpState.level}
          </div>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.min(100, (xpState.xp / xpState.xpToNext) * 100)}%`,
              }}
              className={justGained ? 'garden-xp-flash' : ''}
            />
          </div>
          <div style={styles.progressXP}>
            {xpState.xp}/{xpState.xpToNext}
          </div>
        </div>

        {/* Garden Title Badge */}
        <div style={styles.titleBadge}>
          {GARDEN_TITLES[treeStage] || GARDEN_TITLES[1]}
        </div>

        {/* Clear button */}
        <button onClick={handleClear} className="garden-btn-hover" style={styles.clearBtn}>
          {'\uD83D\uDDD1\uFE0F'} Clear
        </button>

        {/* Magical overlay */}
        {showMagical && (
          <div className="garden-magical-enter" style={styles.magicalOverlay}>
            <div className="garden-magical-pulse" style={styles.magicalCard}>
              <span style={{ fontSize: 52 }}>{'\uD83C\uDF1F'}</span>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed', marginTop: 6, textAlign: 'center' }}>
                WOW! Your Garden is Magical!
              </div>
              <div style={{ fontSize: 14, color: '#a78bfa', marginTop: 4, textAlign: 'center' }}>
                {GARDEN_TITLES[treeStage]}
              </div>
              <div style={{ fontSize: 32, marginTop: 6 }}>{'\uD83C\uDF89\uD83C\uDF08\u2728\uD83E\uDD8B\uD83C\uDF3A'}</div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 7 ACTION BUTTONS ────────────────────── */}
      <div style={styles.btnRow}>
        {BUTTONS.map(b => {
          const isDisabled =
            (b.key === 'water' && rainActive) ||
            (b.key === 'bird' && spawnedBirds.length >= MAX_SPAWNED_BIRDS) ||
            (b.key === 'flower' && flowers.length >= MAX_FLOWERS) ||
            (b.key === 'butterfly' && spawnedButterflies.length >= MAX_SPAWNED_BUTTERFLIES) ||
            (b.key === 'magic' && magicMode);

          const handler =
            b.key === 'water'     ? handleWater :
            b.key === 'sun'       ? handleSun :
            b.key === 'fruit'     ? handleAddFruit :
            b.key === 'bird'      ? handleSpawnBird :
            b.key === 'flower'    ? handleAddFlower :
            b.key === 'butterfly' ? handleSpawnButterfly :
            b.key === 'magic'     ? handleMagic :
            handleWater;

          return (
            <button
              key={b.key}
              className={`garden-btn-hover ${btnBounce === b.key ? 'garden-btn-bounce' : ''}`}
              onClick={handler}
              disabled={isDisabled}
              style={{
                ...styles.btn,
                background: isDisabled ? '#c8d0d8' : b.bg,
                boxShadow: isDisabled
                  ? '0 3px 0 #a0aab0'
                  : `${b.shadow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                color: b.color,
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="garden-btn-shine" />
              <span style={styles.btnEmoji}>{b.emoji}</span>
              <span style={styles.btnLabel}>{b.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── INJECT ALL CSS ──────────────────────── */}
      <style>{ALL_CSS}</style>
    </div>
  );
});

GardenScene.displayName = 'GardenScene';

/* ══════════════════════════════════════════════════
   STATIC DATA
   ══════════════════════════════════════════════════ */

const GRASS = [
  { x: 6, h: 12, r: -10 }, { x: 14, h: 9, r: 8 },   { x: 22, h: 14, r: -6 },
  { x: 30, h: 10, r: 12 }, { x: 38, h: 11, r: -8 },  { x: 46, h: 13, r: 5 },
  { x: 54, h: 9, r: -12 }, { x: 62, h: 14, r: 7 },   { x: 70, h: 10, r: -9 },
  { x: 78, h: 12, r: 10 }, { x: 86, h: 11, r: -5 },  { x: 93, h: 9, r: 8 },
];

const GRASS_SHIMMER = [
  { x: 15, y: 12, size: 8, delay: 0 },
  { x: 45, y: 18, size: 6, delay: 1.2 },
  { x: 72, y: 10, size: 7, delay: 2.5 },
  { x: 88, y: 22, size: 5, delay: 0.8 },
];

const BUTTONS = [
  {
    key: 'water', label: 'Water', emoji: '\uD83D\uDCA7',
    bg: 'linear-gradient(170deg, #cfe8ff, #93c5fd, #5ba8f0)',
    shadow: '0 5px 0 #4a90d0, 0 7px 18px rgba(147,197,253,0.3)',
    color: 'white',
  },
  {
    key: 'sun', label: 'Sun', emoji: '\u2600\uFE0F',
    bg: 'linear-gradient(170deg, #fff3c9, #fde68a, #f5c842)',
    shadow: '0 5px 0 #deb030, 0 7px 18px rgba(253,230,138,0.3)',
    color: '#7a5a10',
  },
  {
    key: 'fruit', label: 'Fruit', emoji: '\uD83C\uDF4E',
    bg: 'linear-gradient(170deg, #ffe0cc, #ffb088, #f09060)',
    shadow: '0 5px 0 #d07848, 0 7px 18px rgba(255,176,136,0.3)',
    color: 'white',
  },
  {
    key: 'bird', label: 'Bird', emoji: '\uD83D\uDC26',
    bg: 'linear-gradient(170deg, #e3d7ff, #b8a0ee, #9580d8)',
    shadow: '0 5px 0 #7860b8, 0 7px 18px rgba(184,160,238,0.3)',
    color: 'white',
  },
  {
    key: 'butterfly', label: 'Butterfly', emoji: '\uD83E\uDD8B',
    bg: 'linear-gradient(170deg, #fce7f3, #f9a8d4, #ec4899)',
    shadow: '0 5px 0 #be185d, 0 7px 18px rgba(236,72,153,0.3)',
    color: 'white',
  },
  {
    key: 'flower', label: 'Flower', emoji: '\uD83C\uDF3A',
    bg: 'linear-gradient(170deg, #ffe0f0, #ffb0d0, #f090b8)',
    shadow: '0 5px 0 #d06898, 0 7px 18px rgba(255,176,208,0.3)',
    color: 'white',
  },
  {
    key: 'magic', label: 'Magic', emoji: '\uD83E\uDE84',
    bg: 'linear-gradient(170deg, #ede9fe, #a78bfa, #7c3aed)',
    shadow: '0 5px 0 #5b21b6, 0 7px 18px rgba(167,139,250,0.3)',
    color: 'white',
  },
];

/* ══════════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════════ */

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex', flexDirection: 'column',
    width: '100%', height: 'calc(100vh - 88px)',
    overflow: 'hidden', userSelect: 'none',
    borderRadius: 30,
    willChange: 'transform',
  },
  scene: {
    flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0,
  },
  horizonHaze: {
    position: 'absolute', bottom: '26%', left: 0, right: 0, height: '8%',
    background: 'linear-gradient(180deg, transparent, rgba(200,244,220,0.35), rgba(180,234,200,0.15))',
    pointerEvents: 'none', zIndex: 3,
  },
  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
    background: 'linear-gradient(to top, #c9f5d6, #a7eec2, #dfffe9)',
    borderRadius: '50% 50% 0 0 / 22% 22% 0 0',
    zIndex: 4,
  },
  groundHighlight: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 14,
    background: 'linear-gradient(180deg, rgba(200,250,220,0.65), transparent)',
    borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
  },
  grassRow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 16, pointerEvents: 'none',
  },
  flowerZone: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    height: 120,
    pointerEvents: 'none',
    zIndex: 3,
  },
  treeContainer: {
    position: 'absolute',
    bottom: '24%',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 6,
    pointerEvents: 'auto',
  },
  progressBar: {
    position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: 8, zIndex: 10,
    background: 'rgba(255,255,255,0.35)',
    borderRadius: 20, padding: '5px 14px',
  },
  progressLabel: {
    fontSize: 12, fontWeight: 900, color: '#5b6cff',
    fontFamily: 'Nunito, sans-serif',
  },
  progressTrack: {
    width: 80, height: 8, borderRadius: 6,
    background: 'rgba(255,255,255,0.45)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 6,
    background: 'linear-gradient(90deg, #7c8cf8, #5b6cff)',
    transition: 'width 0.4s ease',
  },
  progressXP: {
    fontSize: 10, fontWeight: 700, color: '#5b6cff',
    fontFamily: 'Nunito, sans-serif',
  },
  clearBtn: {
    position: 'absolute', top: 10, right: 10, zIndex: 30,
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 30, padding: '8px 16px',
    fontSize: 12, fontWeight: 800, color: 'var(--text-soft, #6b7280)',
    cursor: 'pointer', transition: 'all 0.2s ease',
  },
  titleBadge: {
    position: 'absolute', top: 42, left: '50%', transform: 'translateX(-50%)',
    zIndex: 10,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0.25))',
    borderRadius: 16, padding: '4px 14px',
    fontSize: 11, fontWeight: 800, color: '#7c3aed',
    fontFamily: 'Nunito, sans-serif',
    whiteSpace: 'nowrap' as const,
  },
  btnRow: {
    display: 'flex', justifyContent: 'center', alignItems: 'stretch',
    gap: 10, padding: '14px 12px',
    background: 'linear-gradient(180deg, var(--pastel-green-soft, #e8fbe8), var(--pastel-green, #c9f5d6))',
    borderRadius: '0 0 30px 30px',
    flexShrink: 0, flexWrap: 'wrap' as const,
  },
  btn: {
    flex: '1 1 0', minWidth: 0, maxWidth: 90,
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    gap: 4, padding: '12px 6px 10px', borderRadius: 22,
    border: 'none', cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
    position: 'relative' as const, transition: 'transform 0.1s ease',
    overflow: 'hidden',
  },
  btnEmoji: {
    fontSize: 28, lineHeight: '1', pointerEvents: 'none' as const,
  },
  btnLabel: {
    fontSize: 11, fontWeight: 900, letterSpacing: '0.3px',
    pointerEvents: 'none' as const,
  },
  magicalOverlay: {
    position: 'absolute', inset: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 40%, rgba(255,243,201,0.25), rgba(200,180,240,0.20))',
    pointerEvents: 'none',
  },
  magicalCard: {
    background: 'linear-gradient(135deg, #fef9c3, #fde68a, #fbbf24)',
    borderRadius: 24, padding: '28px 40px',
    border: '3px solid rgba(255,255,255,0.6)',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
  },
};

/* ══════════════════════════════════════════════════
   COMBINED CSS
   ══════════════════════════════════════════════════ */

const ALL_CSS = `
${TREE_CSS}
${FRUIT_CSS}
${BIRDS_CSS}
${WEATHER_CSS}
${SPARKLE_CSS}

/* Grass sway */
@keyframes gardenGrassSway {
  0%, 100% { transform: rotate(var(--r, 0deg)); }
  50%      { transform: rotate(calc(var(--r, 0deg) + 4deg)); }
}
.garden-grass-sway {
  animation: gardenGrassSway 2.8s ease-in-out infinite;
}

/* Button bounce */
@keyframes gardenBtnBounce {
  0%   { transform: translateY(0); }
  25%  { transform: translateY(4px); }
  55%  { transform: translateY(-7px); }
  75%  { transform: translateY(-2px); }
  100% { transform: translateY(0); }
}
.garden-btn-bounce {
  animation: gardenBtnBounce 0.4s ease !important;
}

/* Button active press */
.garden-btn-hover:active {
  transform: translateY(4px) !important;
}

/* Button hover lift */
@media (hover: hover) {
  .garden-btn-hover:hover:not(:disabled) {
    transform: translateY(-3px);
  }
}

/* Button shine */
.garden-btn-shine {
  position: absolute; top: 0; left: 0; right: 0; height: 45%;
  border-radius: 30px 30px 50% 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.32), transparent);
  pointer-events: none;
}

/* XP bar flash */
@keyframes gardenXpFlash {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.65; transform: scaleX(1.03); }
}
.garden-xp-flash {
  animation: gardenXpFlash 0.4s ease;
}

/* Magical overlay entrance */
@keyframes gardenMagicalEnter {
  0%   { opacity: 0; transform: scale(0.5) rotate(-3deg); }
  50%  { opacity: 1; transform: scale(1.08) rotate(1deg); }
  75%  { transform: scale(0.97) rotate(-0.5deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
.garden-magical-enter {
  animation: gardenMagicalEnter 0.8s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes gardenMagicalPulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}
.garden-magical-pulse {
  animation: gardenMagicalPulse 1.5s ease-in-out infinite;
}

/* Flower grow-in with bounce */
@keyframes gardenFlowerGrow {
  0%   { transform: scale(0) translateY(10px); opacity: 0; }
  55%  { transform: scale(1.25) translateY(-4px); opacity: 1; }
  75%  { transform: scale(0.88) translateY(1px); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
.garden-flower-grow {
  animation: gardenFlowerGrow 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
  display: inline-block;
  will-change: transform, opacity;
}

/* Grass shimmer highlights */
@keyframes gardenGrassShimmer {
  0%, 100% { opacity: 0; transform: scale(0.6); }
  50%      { opacity: 0.7; transform: scale(1.3); }
}
.garden-grass-shimmer {
  animation: gardenGrassShimmer 3.5s ease-in-out infinite;
  will-change: transform, opacity;
  pointer-events: none;
}

/* Sun glow pulse (opacity only, perf-safe) */
@keyframes gardenSunGlowPulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.75; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .garden-grass-sway, .garden-btn-bounce,
  .garden-magical-enter, .garden-magical-pulse, .garden-xp-flash,
  .garden-flower-grow, .garden-grass-shimmer {
    animation: none !important;
  }
}
`;

