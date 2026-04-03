
import React, { useState } from 'react';

interface GameCenterProps {
  onGameWin: (xp: number) => void;
}

export const GameCenter: React.FC<GameCenterProps> = ({ onGameWin }) => {
  const [activeGame, setActiveGame] = useState<'NONE' | 'MATH' | 'WORDS'>('NONE');

  if (activeGame === 'MATH') {
    return <MathPuzzle onExit={() => setActiveGame('NONE')} onWin={onGameWin} />;
  }

  if (activeGame === 'WORDS') {
    return <WordBuilder onExit={() => setActiveGame('NONE')} onWin={onGameWin} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <GameCard 
        icon="➕" 
        title="Math Puzzle" 
        desc="Solve basic addition & subtraction!" 
        color="bg-purple-500" 
        onClick={() => setActiveGame('MATH')}
      />
      <GameCard 
        icon="🔤" 
        title="Word Builder" 
        desc="Find the missing letters!" 
        color="bg-orange-500" 
        onClick={() => setActiveGame('WORDS')}
      />
    </div>
  );
};

const GameCard: React.FC<{ icon: string; title: string; desc: string; color: string; onClick: () => void }> = ({ icon, title, desc, color, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white p-8 rounded-3xl card-shadow border border-gray-50 flex flex-col items-center text-center group transition-all hover:-translate-y-2 active:scale-95"
  >
    <div className={`${color} w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-lg`}>{icon}</div>
    <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500">{desc}</p>
  </button>
);

const MathPuzzle: React.FC<{ onExit: () => void; onWin: (xp: number) => void }> = ({ onExit, onWin }) => {
  const [problem, setProblem] = useState(() => ({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) }));
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | 'IDLE'>('IDLE');

  const checkAnswer = () => {
    if (parseInt(answer) === problem.a + problem.b) {
      setFeedback('CORRECT');
      onWin(20);
      setTimeout(() => {
        setProblem({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) });
        setAnswer('');
        setFeedback('IDLE');
      }, 1500);
    } else {
      setFeedback('WRONG');
      setTimeout(() => setFeedback('IDLE'), 1000);
    }
  };

  return (
    <div className="bg-white p-12 rounded-3xl card-shadow text-center max-w-md mx-auto relative overflow-hidden">
      <button onClick={onExit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
      <h3 className="text-blue-500 font-bold mb-8 uppercase tracking-widest">Math Puzzle</h3>
      <div className="text-6xl font-bold text-gray-800 mb-12 flex justify-center gap-4">
        <span>{problem.a}</span>
        <span className="text-blue-300">+</span>
        <span>{problem.b}</span>
        <span className="text-blue-300">=</span>
        <span className="text-blue-500 border-b-4 border-blue-100 min-w-[80px]">{answer || '?'}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-8">
        {[1,2,3,4,5,6,7,8,9,0].map(n => (
          <button key={n} onClick={() => setAnswer(prev => prev.length < 2 ? prev + n : prev)} className="bg-gray-50 hover:bg-blue-50 py-4 rounded-xl font-bold text-xl active:bg-blue-100 transition-colors">
            {n}
          </button>
        ))}
        <button onClick={() => setAnswer('')} className="bg-red-50 text-red-500 py-4 rounded-xl font-bold transition-colors">C</button>
      </div>
      <button 
        onClick={checkAnswer}
        className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
      >
        Check
      </button>

      {feedback === 'CORRECT' && (
        <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center text-white animate-in zoom-in">
          <span className="text-7xl mb-4">🌟</span>
          <span className="text-3xl font-bold">Amazing!</span>
          <span className="text-xl">+20 XP</span>
        </div>
      )}
    </div>
  );
};

const WordBuilder: React.FC<{ onExit: () => void; onWin: (xp: number) => void }> = ({ onExit, onWin }) => {
  const words = ['APPLE', 'BOOK', 'SCHOOL', 'FRIEND', 'PLAY', 'HELLO'];
  const [currentWord, setCurrentWord] = useState(() => words[Math.floor(Math.random() * words.length)]);
  const [guess, setGuess] = useState('');
  const [success, setSuccess] = useState(false);

  const check = () => {
    if (guess.toUpperCase() === currentWord) {
      setSuccess(true);
      onWin(20);
      setTimeout(() => {
        setCurrentWord(words[Math.floor(Math.random() * words.length)]);
        setGuess('');
        setSuccess(false);
      }, 1500);
    }
  };

  const hiddenWord = currentWord.split('').map((char, i) => i === 1 || i === 3 ? '_' : char).join('');

  return (
    <div className="bg-white p-12 rounded-3xl card-shadow text-center max-w-md mx-auto relative overflow-hidden">
      <button onClick={onExit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
      <h3 className="text-orange-500 font-bold mb-8 uppercase tracking-widest">Word Builder</h3>
      <div className="text-5xl font-bold tracking-[0.5em] text-gray-800 mb-8 uppercase">
        {hiddenWord.split('').map((c, i) => (
          <span key={i} className={c === '_' ? 'text-orange-200' : ''}>{c}</span>
        ))}
      </div>
      <p className="text-gray-500 mb-8">What word is this?</p>
      <input 
        type="text" 
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        className="w-full p-4 border-2 border-orange-50 rounded-2xl text-center text-2xl font-bold uppercase focus:border-orange-200 outline-none mb-4"
        placeholder="Type here..."
      />
      <button 
        onClick={check}
        className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
      >
        Submit Word
      </button>

      {success && (
        <div className="absolute inset-0 bg-orange-500/90 flex flex-col items-center justify-center text-white animate-in zoom-in">
          <span className="text-7xl mb-4">🎈</span>
          <span className="text-3xl font-bold">Great Job!</span>
          <span className="text-xl">+20 XP</span>
        </div>
      )}
    </div>
  );
};
