/**
 * child/SaveTheOcean.tsx
 * ─────────────────────────────────────────────────────
 * Save the Ocean — Ocean cleanup claw game page
 *
 * Page layout:
 *  • Stats bar (score, trash collected, mistakes, restart button)
 *  • Landscape game container with ship, claw, and underwater objects
 *
 * Styling: Soft pastel dashboard aesthetic with ocean-blue theme
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import OceanClawGame from './OceanClawGame';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
import type { ChildScreen } from './ChildLayout';
import SaveTheOceanLevelMap from './SaveTheOceanLevelMap';
import {
  applyLevelCompletion,
  canStartLevel,
  getDailyLimitMessage,
  getDailyRemainingNewLevels,
  getDifficultyLabel,
  getLevelConfig,
  hasReachedDailyLimit,
  isLevelCompleted,
  loadSaveOceanProgress,
  resetDailyIfNeeded,
  saveSaveOceanProgress,
  SAVE_OCEAN_DAILY_NEW_LEVEL_LIMIT,
  type SaveOceanProgress,
  type SaveOceanRunResult,
} from './saveTheOceanLevelSystem';
import { useGlobalPlayTimer } from './GlobalPlayTimerProvider';
import { useGameplayTimer } from './useGameplayTimer';

interface SaveTheOceanProps {
  onNavigate?: (screen: ChildScreen) => void;
}

const SaveTheOcean: React.FC<SaveTheOceanProps> = ({ onNavigate }) => {
  const [screen, setScreen] = useState<'map' | 'play'>('map');
  const [gameKey, setGameKey] = useState(0);
  const [progress, setProgress] = useState<SaveOceanProgress>(() => loadSaveOceanProgress());
  const [selectedLevel, setSelectedLevel] = useState(() => Math.max(1, loadSaveOceanProgress().lastPlayedLevel || 1));
  const [notice, setNotice] = useState('');
  const [gameStats, setGameStats] = useState({
    score: 0,
    trashCollected: 0,
    mistakes: 0,
  });
  const { canEnterGameplay, isTimeUp, timeUpMessage } = useGlobalPlayTimer();

  const safeProgress = useMemo(() => resetDailyIfNeeded(progress), [progress]);
  const currentConfig = useMemo(() => getLevelConfig(selectedLevel), [selectedLevel]);
  const dailyRemaining = getDailyRemainingNewLevels(safeProgress);
  const dailyLimitHit = hasReachedDailyLimit(safeProgress);
  const waterButtonBase = {
    color: '#174f5a',
    boxShadow: '0 10px 24px rgba(104,186,202,0.22), inset 0 1px 0 rgba(255,255,255,0.82)',
  } as const;

  useEffect(() => {
    saveSaveOceanProgress(safeProgress);
  }, [safeProgress]);

  useEffect(() => {
    if (safeProgress.daily.date !== progress.daily.date || safeProgress.daily.newLevelCompletions !== progress.daily.newLevelCompletions) {
      setProgress(safeProgress);
    }
  }, [safeProgress, progress.daily.date, progress.daily.newLevelCompletions]);

  useEffect(() => {
    setSelectedLevel(Math.max(1, safeProgress.lastPlayedLevel || 1));
  }, [safeProgress.lastPlayedLevel]);

  useGameplayTimer({
    isGameplayActive: screen === 'play',
    onBlocked: () => {
      setScreen('map');
      setNotice(timeUpMessage);
    },
  });

  useEffect(() => {
    if (!isTimeUp || screen !== 'play') return;
    setScreen('map');
    setNotice(timeUpMessage);
  }, [isTimeUp, screen, timeUpMessage]);

  const handleRestart = useCallback(() => {
    setGameKey(prev => prev + 1);
    setGameStats({ score: 0, trashCollected: 0, mistakes: 0 });
  }, []);

  const handleStatsUpdate = useCallback((stats: {
    score: number;
    trashCollected: number;
    mistakes: number;
  }) => {
    setGameStats(stats);
  }, []);

  const handleSelectLevel = useCallback((levelNumber: number) => {
    if (!canEnterGameplay()) {
      setNotice(timeUpMessage);
      return;
    }

    if (!canStartLevel(safeProgress, levelNumber)) {
      if (dailyLimitHit && levelNumber === safeProgress.highestUnlockedLevel && !isLevelCompleted(safeProgress, levelNumber)) {
        setNotice(getDailyLimitMessage());
      } else {
        setNotice('Complete previous levels first to unlock this one.');
      }
      return;
    }

    setNotice('');
    setSelectedLevel(levelNumber);
    setProgress((prev) => ({
      ...prev,
      lastPlayedLevel: levelNumber,
    }));
    setGameStats({ score: 0, trashCollected: 0, mistakes: 0 });
    setGameKey(prev => prev + 1);
    setScreen('play');
  }, [safeProgress, dailyLimitHit, canEnterGameplay, timeUpMessage]);

  const handleLevelSuccess = useCallback((result: SaveOceanRunResult) => {
    const applyResult = applyLevelCompletion(safeProgress, selectedLevel, result, currentConfig);
    if (applyResult.dailyLimitBlocked) {
      setNotice(getDailyLimitMessage());
      setScreen('map');
      return;
    }

    setProgress(applyResult.progress);
    if (applyResult.newlyCompleted) {
      if (applyResult.unlockedNextLevel) {
        setNotice(`Amazing work! Level ${selectedLevel} complete. Level ${selectedLevel + 1} is now unlocked.`);
      } else {
        setNotice(`Fantastic! You completed level ${selectedLevel}.`);
      }
    } else {
      setNotice(`Great replay! Level ${selectedLevel} score updated.`);
    }
    setScreen('map');
  }, [safeProgress, selectedLevel, currentConfig]);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 28px',
        background: 'radial-gradient(circle at 14% 12%, rgba(255,255,255,0.72) 0, rgba(255,255,255,0.18) 8%, transparent 9%), radial-gradient(circle at 84% 16%, rgba(255,255,255,0.54) 0, rgba(255,255,255,0.12) 6%, transparent 7%), linear-gradient(180deg, #f3fdff 0%, #e8fbff 20%, #def7f6 55%, #eefcf8 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(120% 54% at 50% -8%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 44%, transparent 45%), radial-gradient(90% 36% at 22% 100%, rgba(165,227,236,0.16) 0%, rgba(165,227,236,0.06) 52%, transparent 53%), radial-gradient(90% 36% at 78% 100%, rgba(149,222,212,0.16) 0%, rgba(149,222,212,0.06) 52%, transparent 53%)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: '1500px',
          margin: '0 auto',
        }}
      >
        {/* ── Polished Stats Bar with Title ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(235,249,252,0.95) 58%, rgba(239,252,247,0.94) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: '28px',
            padding: '28px 36px',
            marginBottom: '28px',
            boxShadow: '0 14px 40px rgba(97,170,183,0.16), 0 0 0 1px rgba(255,255,255,0.84), inset 0 1px 0 rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            border: '1px solid rgba(170,223,232,0.55)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 18,
              right: 18,
              top: 8,
              height: 26,
              borderRadius: 999,
              pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.46), rgba(255,255,255,0.04))',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap', flex: 1 }}>
            {/* Game Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <motion.span 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '48px' }}
              >
                🌊
              </motion.span>
              <div>
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #1e7481 0%, #4abccf 55%, #79d3c7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'Nunito, sans-serif',
                    margin: 0,
                    lineHeight: 1.2,
                    letterSpacing: '-0.8px',
                  }}
                >
                  Save the Ocean
                </h1>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#6f8d98',
                    margin: 0,
                    marginTop: '4px',
                    fontFamily: 'Nunito, sans-serif',
                    letterSpacing: '0.3px',
                  }}
                >
                  🐠 1000-Level Ocean Journey • Clean, protect, and grow daily!
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <StatCard label="Level" value={selectedLevel} icon="🧩" color="#0284c7" />
              <StatCard label="Score" value={gameStats.score} icon="⭐" color="#f59e0b" />
              <StatCard label="Trash" value={gameStats.trashCollected} icon="🗑️" color="#10b981" />
              <StatCard label="Mistakes" value={gameStats.mistakes} icon="❌" color="#ef4444" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {screen === 'play' && (
              <motion.button
                onClick={handleRestart}
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.94 }}
                style={{
                  padding: '14px 24px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(221,247,251,0.98) 55%, rgba(216,246,239,0.98))',
                  ...waterButtonBase,
                  fontSize: '15px',
                  fontWeight: 900,
                  fontFamily: 'Nunito, sans-serif',
                  cursor: 'pointer',
                }}
              >
                🔄 Restart
              </motion.button>
            )}

            <motion.button
              onClick={() => {
                if (screen === 'map' && !canEnterGameplay()) {
                  setNotice(timeUpMessage);
                  return;
                }
                setScreen(screen === 'map' ? 'play' : 'map');
              }}
              whileHover={{ scale: 1.06, y: -3 }}
              whileTap={{ scale: 0.94 }}
              style={{
                padding: '14px 24px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(224,250,247,0.98) 52%, rgba(213,241,252,0.98))',
                ...waterButtonBase,
                fontSize: '15px',
                fontWeight: 900,
                fontFamily: 'Nunito, sans-serif',
                cursor: 'pointer',
              }}
            >
              {screen === 'map' ? '▶️ Continue Level' : '🗺️ Level Map'}
            </motion.button>

            <motion.button
              onClick={() => onNavigate?.('home')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '14px 24px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(247,241,255,0.98), rgba(226,241,255,0.98) 52%, rgba(219,249,250,0.98))',
                ...waterButtonBase,
                fontSize: '15px',
                fontWeight: 900,
                fontFamily: 'Nunito, sans-serif',
                cursor: 'pointer',
              }}
            >
              ↩️ Home
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 20,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <Badge text={`Difficulty: ${getDifficultyLabel(selectedLevel)}`} bg="rgba(221,246,251,0.82)" color="#245f6f" />
          <Badge text={`Target: ${currentConfig.targetScore}`} bg="rgba(255,244,213,0.8)" color="#a06b35" />
          <Badge text={`Daily New Levels: ${SAVE_OCEAN_DAILY_NEW_LEVEL_LIMIT - dailyRemaining}/${SAVE_OCEAN_DAILY_NEW_LEVEL_LIMIT}`} bg="rgba(226,250,244,0.82)" color="#2f7168" />
          {dailyLimitHit && (
            <Badge text="Daily cap reached for new levels" bg="rgba(255,235,207,0.84)" color="#8d613d" />
          )}
        </motion.div>

        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 18,
              borderRadius: 14,
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'Nunito, sans-serif',
              color: '#204e59',
              background: dailyLimitHit
                ? 'linear-gradient(135deg, rgba(255,241,222,0.96), rgba(255,226,196,0.95))'
                : 'linear-gradient(135deg, rgba(245,254,255,0.97), rgba(223,246,252,0.96), rgba(228,250,244,0.95))',
              border: '1px solid rgba(168,220,229,0.48)',
              boxShadow: '0 10px 24px rgba(97,170,183,0.12)',
            }}
          >
            {notice}
          </motion.div>
        )}

        {/* ── Game Container ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {screen === 'map' ? (
            <SaveTheOceanLevelMap progress={safeProgress} onSelectLevel={handleSelectLevel} />
          ) : (
            <OceanClawGame
              key={gameKey}
              levelConfig={currentConfig}
              levelNumber={selectedLevel}
              onStatsUpdate={handleStatsUpdate}
              onLevelComplete={handleLevelSuccess}
              onBackToMap={() => setScreen('map')}
              onNavigateHome={() => onNavigate?.('home')}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

const Badge: React.FC<{ text: string; bg: string; color: string }> = ({ text, bg, color }) => (
  <span
    style={{
      fontSize: 13,
      fontWeight: 800,
      borderRadius: 999,
      padding: '6px 10px',
      background: bg,
      color,
      border: '1px solid rgba(166,219,229,0.42)',
      fontFamily: 'Nunito, sans-serif',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
    }}
  >
    {text}
  </span>
);

/** Stat card component - Polished and modern */
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: string;
}> = ({ label, value, icon, color }) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.02 }}
    style={{
      padding: '12px 20px',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(238,249,252,0.96) 62%, rgba(239,251,247,0.95))',
      boxShadow: '0 8px 18px rgba(97,170,183,0.14), inset 0 1px 0 rgba(255,255,255,0.85)',
      border: '1px solid rgba(174,223,232,0.62)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '130px',
      transition: 'all 0.2s ease',
    }}
  >
    <span style={{ fontSize: '26px', lineHeight: 1 }}>{icon}</span>
    <div>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#82a1ab',
          marginBottom: '3px',
          fontFamily: 'Nunito, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '24px',
          fontWeight: 900,
          color: color,
          fontFamily: 'Nunito, sans-serif',
          lineHeight: 1,
          textShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {value}
      </p>
    </div>
  </motion.div>
);

export default SaveTheOcean;
