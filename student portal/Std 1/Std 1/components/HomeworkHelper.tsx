
import React, { useState } from 'react';
import { aiService } from '../services/geminiService';
import { TextbookChunk } from '../types';
import { SUBJECT_COLORS } from '../constants';

interface HomeworkHelperProps {
  knowledgeBase: TextbookChunk[];
  onActionComplete: (xp: number) => void;
}

export const HomeworkHelper: React.FC<HomeworkHelperProps> = ({ knowledgeBase, onActionComplete }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ explanation: string; simplified: string; sources: TextbookChunk[] } | null>(null);
  const [showSimplified, setShowSimplified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await aiService.explainHomework(query, knowledgeBase);
      setResult(res);
      onActionComplete(10); // Reward XP for research
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-3xl card-shadow border border-blue-100">
        <h2 className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2">
          <span>📖</span> AI Homework Helper
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          Parents: Enter the homework topic or question. AI will explain it using school textbooks.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., How do I explain addition to my child?"
            className="w-full p-4 border-2 border-blue-50 rounded-2xl focus:border-blue-300 focus:outline-none transition-colors min-h-[100px] text-gray-700"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            {loading ? 'Thinking...' : 'Explain for Homework'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white p-6 rounded-3xl card-shadow border border-green-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-blue-900">Explanation</h3>
            <button 
              onClick={() => setShowSimplified(!showSimplified)}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-colors ${showSimplified ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              {showSimplified ? 'Kid View' : 'Parent View'}
            </button>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900 mb-4 leading-relaxed">
            {showSimplified ? result.simplified : result.explanation}
          </div>

          {result.sources.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Book References</p>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((src, i) => (
                  <div key={i} className={`text-xs px-3 py-1 rounded-lg border ${SUBJECT_COLORS[src.subject]}`}>
                    {src.subject} Book • Ch {src.chapter} • p.{src.page}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-100 italic text-[10px] text-gray-400 text-center">
            AI answers are generated strictly from approved school books.
          </div>
        </div>
      )}
    </div>
  );
};
