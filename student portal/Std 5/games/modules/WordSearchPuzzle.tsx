/**
 * 🔍 Word Search Puzzle Module
 * ==============================
 * Find hidden words in a letter grid for Standard 5.
 * - Age-appropriate vocabulary
 * - Horizontal, vertical, and diagonal words
 * - Casino-style animations and rewards
 * - Adaptive difficulty
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameModuleProps } from '../types';

// ─── Word Lists for Standard 5 ──────────────────────────

const WORD_POOLS = {
  easy: ['CAT', 'DOG', 'SUN', 'BAT', 'HAT', 'RAT', 'PEN', 'CUP', 'BUS', 'BOX'],
  intermediate: ['BOOK', 'STAR', 'MOON', 'TREE', 'BIRD', 'FISH', 'BALL', 'PLAY', 'JUMP', 'SING'],
  difficult: ['APPLE', 'HAPPY', 'WATER', 'SCHOOL', 'FRIEND', 'GARDEN', 'ANIMAL', 'FLOWER', 'PENCIL', 'RAINBOW'],
};

// ─── Grid Generator ──────────────────────────────────────

interface GridCell {
  letter: string;
  row: number;
  col: number;
  isPartOfWord: boolean;
  isFound: boolean;
  wordIndex?: number;
}

interface WordPosition {
  word: string;
  cells: { row: number; col: number }[];
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

function generateWordSearchGrid(words: string[], gridSize: number): {
  grid: GridCell[][];
  wordPositions: WordPosition[];
} {
  const grid: GridCell[][] = Array.from({ length: gridSize }, (_, row) =>
    Array.from({ length: gridSize }, (_, col) => ({
      letter: '',
      row,
      col,
      isPartOfWord: false,
      isFound: false,
    }))
  );

  const wordPositions: WordPosition[] = [];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Place each word
  for (const word of words) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 50;

    while (!placed && attempts < maxAttempts) {
      attempts++;
      
      // Random direction (0=horizontal, 1=vertical, 2=diagonal)
      const direction = Math.floor(Math.random() * 3);
      let row = Math.floor(Math.random() * gridSize);
      let col = Math.floor(Math.random() * gridSize);

      // Check if word fits
      let canPlace = true;
      const cells: { row: number; col: number }[] = [];

      for (let i = 0; i < word.length; i++) {
        const currentRow = direction === 1 || direction === 2 ? row + i : row;
        const currentCol = direction === 0 || direction === 2 ? col + i : col;

        if (
          currentRow >= gridSize ||
          currentCol >= gridSize ||
          (grid[currentRow][currentCol].letter !== '' &&
            grid[currentRow][currentCol].letter !== word[i])
        ) {
          canPlace = false;
          break;
        }

        cells.push({ row: currentRow, col: currentCol });
      }

      if (canPlace) {
        // Place the word
        cells.forEach((cell, i) => {
          grid[cell.row][cell.col].letter = word[i];
          grid[cell.row][cell.col].isPartOfWord = true;
          grid[cell.row][cell.col].wordIndex = wordPositions.length;
        });

        wordPositions.push({
          word,
          cells,
          direction: direction === 0 ? 'horizontal' : direction === 1 ? 'vertical' : 'diagonal',
        });

        placed = true;
      }
    }
  }

  // Fill empty cells with random letters
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col].letter === '') {
        grid[row][col].letter = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid, wordPositions };
}

// ─── Component ────────────────────────────────────────────

export const WordSearchPuzzleModule: React.FC<GameModuleProps> = React.memo(({
  state,
  onSelectAnswer,
  onSetCorrectAnswer,
  difficulty,
}) => {
  const roundRef = useRef(state.round);
  
  // Generate puzzle
  const puzzle = useMemo(() => {
    const wordPool = WORD_POOLS[difficulty];
    const numWords = difficulty === 'easy' ? 3 : difficulty === 'intermediate' ? 4 : 5;
    const gridSize = difficulty === 'easy' ? 6 : difficulty === 'intermediate' ? 8 : 10;
    
    const selectedWords = [...wordPool]
      .sort(() => Math.random() - 0.5)
      .slice(0, numWords);
    
    return generateWordSearchGrid(selectedWords, gridSize);
  }, [state.round, difficulty]); // Regenerate on round change

  const [grid, setGrid] = useState<GridCell[][]>(puzzle.grid);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Set correct answer (comma-separated words)
  useEffect(() => {
    if (state.status === 'playing' && state.correctAnswer === null) {
      const answer = puzzle.wordPositions.map(wp => wp.word).sort().join(',');
      onSetCorrectAnswer(answer);
    }
  }, [state.status, state.correctAnswer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if all words found
  useEffect(() => {
    if (foundWords.size === puzzle.wordPositions.length && foundWords.size > 0) {
      const answer = Array.from(foundWords).sort().join(',');
      onSelectAnswer(answer);
    }
  }, [foundWords, puzzle.wordPositions.length, onSelectAnswer]);

  // Reset on new round
  useEffect(() => {
    if (state.round !== roundRef.current) {
      roundRef.current = state.round;
      setFoundWords(new Set());
      setSelectedCells([]);
      setGrid(puzzle.grid);
    }
  }, [state.round, puzzle.grid]);

  // Reset on new game
  useEffect(() => {
    if (state.status === 'playing' && state.round === 1) {
      setFoundWords(new Set());
      setSelectedCells([]);
      setGrid(puzzle.grid);
      roundRef.current = 1;
    }
  }, [state.status, state.round, puzzle.grid]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (state.status !== 'playing') return;
    
    setIsDragging(true);
    setSelectedCells([{ row, col }]);
  }, [state.status]);

  const handleCellEnter = useCallback((row: number, col: number) => {
    if (!isDragging || state.status !== 'playing') return;
    
    setSelectedCells(prev => {
      // Only add if adjacent to last cell
      const last = prev[prev.length - 1];
      if (!last) return [{ row, col }];
      
      const rowDiff = Math.abs(row - last.row);
      const colDiff = Math.abs(col - last.col);
      
      // Adjacent if within 1 step (horizontal, vertical, or diagonal)
      if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
        return [...prev, { row, col }];
      }
      
      return prev;
    });
  }, [isDragging, state.status]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    // Check if selected cells form a valid word
    const selectedWord = selectedCells.map(cell => grid[cell.row][cell.col].letter).join('');
    
    const matchedWord = puzzle.wordPositions.find(wp => wp.word === selectedWord);
    
    if (matchedWord && !foundWords.has(matchedWord.word)) {
      // Mark cells as found
      setGrid(prev => {
        const newGrid = prev.map(row => row.map(cell => ({ ...cell })));
        matchedWord.cells.forEach(cell => {
          newGrid[cell.row][cell.col].isFound = true;
        });
        return newGrid;
      });
      
      setFoundWords(prev => new Set([...prev, matchedWord.word]));
    }
    
    setSelectedCells([]);
  }, [isDragging, selectedCells, grid, puzzle.wordPositions, foundWords]);

  const isCellSelected = useCallback((row: number, col: number) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  }, [selectedCells]);

  const gridSize = grid.length;
  const cellSize = gridSize <= 6 ? 'w-12 h-12 text-xl' : gridSize <= 8 ? 'w-10 h-10 text-lg' : 'w-8 h-8 text-base';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 py-6">
      {/* Header */}
      <motion.div
        className="mb-4"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3 bg-gradient-to-r from-green-900 via-lime-900 to-pink-900 px-6 py-2 rounded-full border-2 border-yellow-400/50 shadow-xl">
          <span className="text-2xl">🔍</span>
          <span className="text-lg font-black text-yellow-300 tracking-wide">
            WORD SEARCH
          </span>
        </div>
      </motion.div>

      {/* Words to find */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {puzzle.wordPositions.map((wp, i) => {
            const isFound = foundWords.has(wp.word);
            return (
              <motion.div
                key={wp.word}
                className={`px-3 py-1 rounded-lg font-black text-sm border-2 ${
                  isFound
                    ? 'bg-green-500 text-white border-green-300 line-through'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
              >
                {wp.word}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div
        className="bg-gradient-to-br from-lime-900 via-green-900 to-blue-900 p-4 rounded-2xl border-4 border-yellow-400/40 shadow-2xl mb-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        onMouseLeave={handleMouseUp}
      >
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isSelected = isCellSelected(rowIndex, colIndex);
              const isFound = cell.isFound;
              
              return (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  className={`${cellSize} font-black rounded-lg border-2 transition-all ${
                    isFound
                      ? 'bg-green-500 text-white border-green-300'
                      : isSelected
                      ? 'bg-yellow-400 text-gray-900 border-yellow-300 scale-110'
                      : 'bg-white/90 text-gray-800 border-white/50 hover:bg-yellow-100'
                  }`}
                  onMouseDown={() => handleCellClick(rowIndex, colIndex)}
                  onMouseEnter={() => handleCellEnter(rowIndex, colIndex)}
                  onMouseUp={handleMouseUp}
                  whileHover={{ scale: isFound ? 1 : 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {cell.letter}
                </motion.button>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.p
        className="text-sm text-gray-400 text-center max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Click and drag to select words!
      </motion.p>

      {/* Progress indicator */}
      <motion.div
        className="mt-4 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <span className="text-sm font-bold text-gray-300">Found:</span>
        <div className="flex gap-1">
          {Array.from({ length: puzzle.wordPositions.length }, (_, i) => (
            <motion.div
              key={i}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black ${
                i < foundWords.size
                  ? 'bg-green-500 border-green-300 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-400'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + i * 0.05 }}
            >
              {i < foundWords.size ? '✓' : '?'}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
});

WordSearchPuzzleModule.displayName = 'WordSearchPuzzleModule';

export default WordSearchPuzzleModule;
