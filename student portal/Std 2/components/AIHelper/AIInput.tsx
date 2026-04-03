import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SuggestionChips } from './SuggestionChips';

interface AIInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  maxLength?: number;
}

export const AIInput: React.FC<AIInputProps> = React.memo(({
  value,
  onChange,
  onSubmit,
  loading,
  maxLength = 300,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading) onSubmit();
    }
  }, [value, loading, onSubmit]);

  const handleSuggestion = useCallback((text: string) => {
    onChange(text);
    textareaRef.current?.focus();
  }, [onChange]);

  return (
    <div className="space-y-4">
      {/* Input area with floating label */}
      <div className="relative group">
        {/* Animated border glow */}
        <motion.div
          className="absolute -inset-[2px] rounded-[18px] pointer-events-none z-0"
          style={{
            background: isFocused
              ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(6,182,212,0.3), rgba(168,85,247,0.2))'
              : 'transparent',
          }}
          animate={{ opacity: isFocused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="relative z-10">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Type your homework question here..."
            className={`w-full p-5 pt-7 bg-white/50 border-2 rounded-2xl focus:outline-none transition-all min-h-[110px] text-blue-900 placeholder-blue-300/60 resize-none text-sm leading-relaxed ${
              isFocused
                ? 'border-blue-300/60 bg-white/70 shadow-lg shadow-blue-100/30'
                : 'border-blue-100/30 hover:border-blue-200/50'
            }`}
            disabled={loading}
          />

          {/* Floating label */}
          <motion.label
            className="absolute left-5 text-[10px] font-bold uppercase tracking-wider pointer-events-none"
            animate={{
              top: isFocused || value ? '10px' : '20px',
              color: isFocused ? 'rgb(59,130,246)' : 'rgb(147,197,253)',
              fontSize: isFocused || value ? '9px' : '11px',
            }}
            transition={{ duration: 0.2 }}
          >
            Homework Question
          </motion.label>

          {/* Character counter */}
          <div className="absolute bottom-3 right-4 flex items-center gap-2">
            <span className={`text-[10px] font-medium ${
              value.length > maxLength * 0.9 ? 'text-red-400' : 'text-blue-300/50'
            }`}>
              {value.length}/{maxLength}
            </span>
            {value.trim() && !loading && (
              <motion.span
                className="text-[10px] text-green-500 font-medium"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
              >
                ✓ Ready
              </motion.span>
            )}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <motion.button
        type="button"
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        className="w-full relative overflow-hidden bg-gradient-to-r from-blue-500 via-blue-500 to-cyan-500 hover:from-blue-600 hover:via-blue-600 hover:to-cyan-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 disabled:shadow-none transition-all group"
        whileHover={!loading && value.trim() ? { scale: 1.01, y: -1 } : {}}
        whileTap={!loading && value.trim() ? { scale: 0.98 } : {}}
      >
        {/* Hover glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

        {loading ? (
          <span className="flex items-center justify-center gap-2 relative z-10">
            <motion.span
              className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <span>AI is thinking</span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ...
            </motion.span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2 relative z-10">
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨
            </motion.span>
            <span>Explain with AI</span>
          </span>
        )}
      </motion.button>

      {/* Suggestion chips */}
      {!value.trim() && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            💡 Try asking
          </p>
          <SuggestionChips onSelect={handleSuggestion} disabled={loading} />
        </motion.div>
      )}
    </div>
  );
});

AIInput.displayName = 'AIInput';
