// KnowledgeBasePanel.tsx — Enhanced book knowledge upload with preview, progress bar, knowledge index
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextbookChunk } from '../../types';
import type { FeedProgress } from './ParentEngine';

interface KnowledgeBasePanelProps {
  knowledgeBase: TextbookChunk[];
  feedProgress: FeedProgress;
  subjectFilter: 'All' | 'English' | 'Math';
  showPreview: boolean;
  onAddKnowledge: (chunk: TextbookChunk) => void;
  onSetFeedProgress: (progress: FeedProgress) => void;
  onSetSubjectFilter: (filter: 'All' | 'English' | 'Math') => void;
  onTogglePreview: () => void;
}

// ─── Knowledge Index Mini Panel ───────────────────────────────
const KnowledgeIndex: React.FC<{ knowledgeBase: TextbookChunk[]; filter: string }> = React.memo(({ knowledgeBase, filter }) => {
  const filtered = filter === 'All' ? knowledgeBase : knowledgeBase.filter(c => c.subject === filter);
  const englishCount = knowledgeBase.filter(c => c.subject === 'English').length;
  const mathCount = knowledgeBase.filter(c => c.subject === 'Math').length;
  const lastFeed = knowledgeBase.length > 0 ? 'Active' : 'No data';

  return (
    <motion.div
      className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 rounded-xl p-4 border border-indigo-100/30"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">📌</span>
        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Knowledge Index</h4>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Chunks', value: filtered.length, icon: '📄' },
          { label: 'English', value: englishCount, icon: '📖' },
          { label: 'Math', value: mathCount, icon: '🔢' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/50 rounded-xl p-2.5 text-center border border-white/40">
            <span className="text-sm block">{stat.icon}</span>
            <span className="text-lg font-black text-blue-900 block">{stat.value}</span>
            <span className="text-[8px] text-gray-400 font-semibold uppercase">{stat.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[9px] text-gray-400">Status: <span className="text-green-500 font-bold">{lastFeed}</span></span>
        <div className="flex items-center gap-1">
          <motion.div
            className="w-2 h-2 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[9px] text-green-500 font-bold">Indexed</span>
        </div>
      </div>
    </motion.div>
  );
});
KnowledgeIndex.displayName = 'KnowledgeIndex';

// ─── Animated Book Stack ──────────────────────────────────────
const BookStack: React.FC = React.memo(() => (
  <motion.div
    className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100/80 to-orange-50/60 flex items-center justify-center border border-amber-200/30"
    animate={{ y: [0, -2, 0], rotate: [0, 2, -2, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  >
    <span className="text-lg">📚</span>
  </motion.div>
));
BookStack.displayName = 'BookStack';

// ─── Chapter Suggestions ─────────────────────────────────────
const CHAPTER_SUGGESTIONS: Record<string, string[]> = {
  English: ['My Name', 'My Family', 'Colors Around Us', 'Animals We Know', 'Fruits and Vegetables', 'My School', 'Greetings', 'Rhymes'],
  Math: ['Numbers 1-9', 'Addition', 'Subtraction', 'Shapes', 'Patterns', 'Measurement', 'Money', 'Time'],
};

// ─── Main Panel ───────────────────────────────────────────────
export const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = React.memo(({
  knowledgeBase, feedProgress, subjectFilter, showPreview,
  onAddKnowledge, onSetFeedProgress, onSetSubjectFilter, onTogglePreview,
}) => {
  const [subject, setSubject] = useState<'English' | 'Math'>('English');
  const [chapter, setChapter] = useState('');
  const [page, setPage] = useState(1);
  const [content, setContent] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = CHAPTER_SUGGESTIONS[subject] || [];
  const filteredSuggestions = chapter.length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(chapter.toLowerCase()))
    : suggestions;

  const canFeed = chapter.trim() && content.trim();

  const handleFeed = useCallback(async () => {
    if (!canFeed) return;

    if (showPreview && feedProgress.status === 'idle') {
      onSetFeedProgress({ status: 'previewing', progress: 0 });
      return;
    }

    onSetFeedProgress({ status: 'feeding', progress: 0 });

    // Simulate progress bar
    for (let p = 0; p <= 100; p += 10) {
      await new Promise(r => setTimeout(r, 120));
      onSetFeedProgress({ status: 'feeding', progress: p });
    }

    onAddKnowledge({
      id: Math.random().toString(36).substr(2, 9),
      subject,
      chapter: chapter.trim(),
      page,
      content: content.trim(),
    });

    onSetFeedProgress({ status: 'success', progress: 100 });
    setChapter('');
    setContent('');
    setPage(1);

    setTimeout(() => onSetFeedProgress({ status: 'idle', progress: 0 }), 2500);
  }, [canFeed, chapter, content, page, subject, showPreview, feedProgress.status, onAddKnowledge, onSetFeedProgress]);

  return (
    <motion.div
      className="bg-white/60 backdrop-blur-xl rounded-[24px] p-6 lg:p-8 border border-white/50 shadow-lg shadow-blue-500/[0.03]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <BookStack />
          <div>
            <h3 className="text-lg font-bold text-blue-900">Book Knowledge Base</h3>
            <p className="text-[10px] text-gray-400 font-medium">Feed textbook content to AI assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Subject filter dropdown */}
          <select
            value={subjectFilter}
            onChange={(e) => onSetSubjectFilter(e.target.value as any)}
            className="text-[10px] font-bold bg-gray-50/60 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-100/40 outline-none"
          >
            <option value="All">All Subjects</option>
            <option value="English">English</option>
            <option value="Math">Math</option>
          </select>
        </div>
      </div>

      {/* Knowledge Index */}
      <div className="mb-5">
        <KnowledgeIndex knowledgeBase={knowledgeBase} filter={subjectFilter} />
      </div>

      {/* Feed Form */}
      <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100/20 space-y-3">
        <div className="flex gap-2">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as 'English' | 'Math')}
            className="px-3 py-2.5 bg-white/70 border border-blue-100/30 rounded-xl text-sm font-bold focus:border-blue-400 outline-none backdrop-blur-sm"
          >
            <option>English</option>
            <option>Math</option>
          </select>

          {/* Chapter with autocomplete */}
          <div className="flex-1 relative">
            <input
              placeholder="Chapter Topic"
              value={chapter}
              onChange={(e) => { setChapter(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full px-3 py-2.5 bg-white/70 border border-blue-100/30 rounded-xl text-sm focus:border-blue-400 outline-none backdrop-blur-sm"
            />
            <AnimatePresence>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <motion.div
                  className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 z-20 max-h-36 overflow-y-auto"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      onMouseDown={() => { setChapter(s); setShowSuggestions(false); }}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            type="number"
            placeholder="Pg"
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="w-16 px-3 py-2.5 bg-white/70 border border-blue-100/30 rounded-xl text-sm text-center focus:border-blue-400 outline-none backdrop-blur-sm"
          />
        </div>

        {/* Content textarea */}
        <textarea
          placeholder="Paste textbook page text here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 bg-white/70 border border-blue-100/30 rounded-xl text-sm min-h-[100px] focus:border-blue-400 outline-none backdrop-blur-sm resize-none"
        />

        {/* Preview toggle */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-8 h-5 rounded-full transition-colors ${showPreview ? 'bg-blue-500' : 'bg-gray-300'} flex items-center`}
              onClick={onTogglePreview}
            >
              <motion.div
                className="w-4 h-4 bg-white rounded-full shadow-sm mx-0.5"
                animate={{ x: showPreview ? 12 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
            </div>
            <span className="text-[11px] font-medium text-gray-500">Preview Before Feed</span>
          </label>
          <span className="text-[10px] text-gray-400">{content.length} characters</span>
        </div>

        {/* Preview area */}
        <AnimatePresence>
          {feedProgress.status === 'previewing' && content && (
            <motion.div
              className="bg-white/60 rounded-xl p-3 border border-blue-100/20 max-h-40 overflow-y-auto"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-blue-500 uppercase">Preview</span>
                <span className="text-[10px] text-gray-400">• {subject} • {chapter} • p.{page}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{content.slice(0, 300)}{content.length > 300 ? '...' : ''}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <AnimatePresence>
          {feedProgress.status === 'feeding' && (
            <motion.div
              className="h-2 bg-gray-100/60 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${feedProgress.progress}%` }}
                transition={{ duration: 0.15 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed button */}
        <motion.button
          onClick={handleFeed}
          disabled={!canFeed || feedProgress.status === 'feeding'}
          className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all text-sm ${
            feedProgress.status === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/20'
              : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-blue-500/15 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
          whileHover={canFeed ? { scale: 1.01 } : {}}
          whileTap={canFeed ? { scale: 0.98 } : {}}
          animate={feedProgress.status === 'success' ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          {feedProgress.status === 'feeding' ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⚡
              </motion.span>
              Feeding... {feedProgress.progress}%
            </span>
          ) : feedProgress.status === 'success' ? (
            <span className="flex items-center justify-center gap-2">✅ Successfully Fed!</span>
          ) : feedProgress.status === 'previewing' ? (
            'Confirm & Feed to AI Brain'
          ) : (
            '📤 Feed to AI Brain'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
});

KnowledgeBasePanel.displayName = 'KnowledgeBasePanel';
