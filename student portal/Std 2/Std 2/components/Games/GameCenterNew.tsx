import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfettiEffect } from '../ui/ConfettiEffect';
import { XP_REWARDS } from '../../utils/xpEngine';
import { logAction } from '../../utils/auditLog';

interface GameCenterProps {
  onGameWin: (xp: number) => void;
}

export const GameCenter: React.FC<GameCenterProps> = ({ onGameWin }) => {
  const [activeGame, setActiveGame] = useState<'NONE' | 'MATH' | 'WORDS'>('NONE');

  return (
    <AnimatePresence mode="wait">
      {activeGame === 'MATH' ? (
        <motion.div
          key="math"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <MathPuzzle onExit={() => setActiveGame('NONE')} onWin={onGameWin} />
        </motion.div>
      ) : activeGame === 'WORDS' ? (
        <motion.div
          key="words"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <WordBuilder onExit={() => setActiveGame('NONE')} onWin={onGameWin} />
        </motion.div>
      ) : (
        <motion.div
          key="menu"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <GameTile
            icon="➕"
            title="Math Puzzle"
            desc="Solve addition challenges!"
            gradient="from-purple-500 via-purple-400 to-indigo-500"
            xpReward={XP_REWARDS.GAME_WIN}
            onClick={() => {
              setActiveGame('MATH');
              logAction('game_started', 'game', { game: 'math' });
            }}
            delay={0}
          />
          <GameTile
            icon="🔤"
            title="Word Builder"
            desc="Find the missing letters!"
            gradient="from-orange-500 via-amber-400 to-yellow-500"
            xpReward={XP_REWARDS.GAME_WIN}
            onClick={() => {
              setActiveGame('WORDS');
              logAction('game_started', 'game', { game: 'words' });
            }}
            delay={0.1}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── 3D Game Tile ─── */
const GameTile: React.FC<{
  icon: string;
  title: string;
  desc: string;
  gradient: string;
  xpReward: number;
  onClick: () => void;
  delay: number;
}> = ({ icon, title, desc, gradient, xpReward, onClick, delay }) => (
  <motion.button
    onClick={onClick}
    className="relative group text-left"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    whileHover={{ y: -8 }}
    whileTap={{ scale: 0.96 }}
    style={{ perspective: '1000px' }}
  >
    <motion.div
      className="bg-white/75 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
      whileHover={{ rotateY: -3, rotateX: 3 }}
      transition={{ type: 'spring', stiffness: 300 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Background glow blob */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full opacity-15 blur-3xl group-hover:opacity-25 transition-opacity duration-500`} />
      <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />

      <motion.div
        className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center text-5xl mb-5 shadow-2xl relative`}
        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
        <div className="absolute inset-0 rounded-3xl bg-white/10" />
      </motion.div>

      <h3 className="text-2xl font-bold text-blue-900 mb-2 relative z-10">{title}</h3>
      <p className="text-sm text-blue-400 mb-4 relative z-10">{desc}</p>

      <div className="flex items-center gap-1.5 bg-amber-100/60 px-4 py-2 rounded-xl relative z-10 border border-amber-200/30">
        <span className="text-amber-500 text-sm">✨</span>
        <span className="font-bold text-amber-600 text-sm">+{xpReward} XP per win</span>
      </div>
    </motion.div>
  </motion.button>
);

/* ─── Math Puzzle Game ─── */
const MathPuzzle: React.FC<{ onExit: () => void; onWin: (xp: number) => void }> = ({ onExit, onWin }) => {
  const [problem, setProblem] = useState(() => ({
    a: Math.floor(Math.random() * 10),
    b: Math.floor(Math.random() * 10)
  }));
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | 'IDLE'>('IDLE');
  const [confetti, setConfetti] = useState(false);

  const checkAnswer = () => {
    if (parseInt(answer) === problem.a + problem.b) {
      setFeedback('CORRECT');
      setConfetti(true);
      onWin(XP_REWARDS.GAME_WIN);
      logAction('game_won', 'game', { game: 'math', problem: `${problem.a}+${problem.b}` });
      setTimeout(() => {
        setProblem({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) });
        setAnswer('');
        setFeedback('IDLE');
        setConfetti(false);
      }, 1800);
    } else {
      setFeedback('WRONG');
      setTimeout(() => setFeedback('IDLE'), 1000);
    }
  };

  return (
    <>
      <ConfettiEffect trigger={confetti} />
      <div className="bg-white/75 backdrop-blur-2xl border border-white/40 p-8 sm:p-12 rounded-[2.5rem] text-center max-w-md mx-auto relative overflow-hidden shadow-xl">
        <motion.button
          onClick={onExit}
          className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-gray-100/60 hover:bg-gray-200/60 flex items-center justify-center text-gray-400 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>

        <div className="inline-block bg-purple-100/60 px-4 py-1.5 rounded-xl mb-6">
          <h3 className="text-purple-600 font-bold text-sm uppercase tracking-widest">Math Puzzle</h3>
        </div>

        <motion.div
          className="text-5xl sm:text-6xl font-bold text-blue-900 mb-10 flex justify-center items-center gap-3 sm:gap-4"
          key={`${problem.a}-${problem.b}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>{problem.a}</span>
          <span className="text-blue-300">+</span>
          <span>{problem.b}</span>
          <span className="text-blue-300">=</span>
          <span className="text-blue-500 border-b-4 border-blue-100 min-w-[60px] sm:min-w-[80px] inline-block">
            {answer || '?'}
          </span>
        </motion.div>

        <div className="grid grid-cols-3 gap-2 mb-6 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
            <motion.button
              key={n}
              onClick={() => setAnswer(prev => prev.length < 2 ? prev + n : prev)}
              className="bg-blue-50/60 hover:bg-blue-100/80 py-4 rounded-2xl font-bold text-xl transition-colors border border-blue-100/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9, backgroundColor: '#93c5fd' }}
            >
              {n}
            </motion.button>
          ))}
          <motion.button
            onClick={() => setAnswer('')}
            className="bg-red-50/60 text-red-500 py-4 rounded-2xl font-bold transition-colors border border-red-100/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            C
          </motion.button>
        </div>

        <motion.button
          onClick={checkAnswer}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Check Answer
        </motion.button>

        <AnimatePresence>
          {feedback === 'CORRECT' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-green-500/95 to-emerald-500/95 flex flex-col items-center justify-center text-white rounded-[24px]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.span
                className="text-7xl mb-4"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                🌟
              </motion.span>
              <span className="text-3xl font-bold">Amazing!</span>
              <motion.span
                className="text-xl mt-2 bg-white/20 px-4 py-1 rounded-full"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                +{XP_REWARDS.GAME_WIN} XP
              </motion.span>
            </motion.div>
          )}
          {feedback === 'WRONG' && (
            <motion.div
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 px-6 py-2 rounded-2xl font-bold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Try again! 💪
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

/* ─── Word Builder Game ─── */
const WordBuilder: React.FC<{ onExit: () => void; onWin: (xp: number) => void }> = ({ onExit, onWin }) => {
  const words = ['APPLE', 'BOOK', 'SCHOOL', 'FRIEND', 'PLAY', 'HELLO'];
  const [currentWord, setCurrentWord] = useState(() => words[Math.floor(Math.random() * words.length)]);
  const [guess, setGuess] = useState('');
  const [success, setSuccess] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const check = () => {
    if (guess.toUpperCase() === currentWord) {
      setSuccess(true);
      setConfetti(true);
      onWin(XP_REWARDS.GAME_WIN);
      logAction('game_won', 'game', { game: 'words', word: currentWord });
      setTimeout(() => {
        setCurrentWord(words[Math.floor(Math.random() * words.length)]);
        setGuess('');
        setSuccess(false);
        setConfetti(false);
      }, 1800);
    }
  };

  const hiddenWord = currentWord
    .split('')
    .map((char, i) => (i === 1 || i === 3) ? '_' : char)
    .join('');

  return (
    <>
      <ConfettiEffect trigger={confetti} />
      <div className="bg-white/75 backdrop-blur-2xl border border-white/40 p-8 sm:p-12 rounded-[24px] text-center max-w-md mx-auto relative overflow-hidden shadow-xl">
        <motion.button
          onClick={onExit}
          className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-gray-100/60 hover:bg-gray-200/60 flex items-center justify-center text-gray-400 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>

        <div className="inline-block bg-orange-100/60 px-4 py-1.5 rounded-xl mb-6">
          <h3 className="text-orange-600 font-bold text-sm uppercase tracking-widest">Word Builder</h3>
        </div>

        <motion.div
          className="text-4xl sm:text-5xl font-bold tracking-[0.4em] text-blue-900 mb-6 uppercase"
          key={currentWord}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {hiddenWord.split('').map((c, i) => (
            <motion.span
              key={i}
              className={c === '_' ? 'text-orange-300 border-b-4 border-orange-200 mx-0.5 inline-block min-w-[1ch]' : ''}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              {c}
            </motion.span>
          ))}
        </motion.div>

        <p className="text-blue-400 mb-6 text-sm">What word is this?</p>

        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          className="w-full p-4 bg-orange-50/40 border-2 border-orange-100/50 rounded-2xl text-center text-2xl font-bold uppercase focus:border-orange-300 outline-none mb-4 text-blue-900"
          placeholder="Type here..."
        />

        <motion.button
          onClick={check}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Submit Word
        </motion.button>

        <AnimatePresence>
          {success && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-orange-500/95 to-amber-500/95 flex flex-col items-center justify-center text-white rounded-[24px]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.span
                className="text-7xl mb-4"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                🎈
              </motion.span>
              <span className="text-3xl font-bold">Great Job!</span>
              <motion.span
                className="text-xl mt-2 bg-white/20 px-4 py-1 rounded-full"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                +{XP_REWARDS.GAME_WIN} XP
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
