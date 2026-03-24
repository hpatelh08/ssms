/**
 * parent/components/PDFViewerModal.tsx
 * ─────────────────────────────────────────────────────
 * In-dashboard PDF viewer — opens PDFs inside the app.
 *
 * Uses an iframe pointing at the local PDF served from /public/books/.
 * No external redirects. Fully contained.
 *
 * Features:
 *  - Glassmorphism modal overlay
 *  - Book title header bar
 *  - Full-screen iframe PDF viewer
 *  - Download button
 *  - Close button (X + click-outside)
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 220, damping: 24 };

interface Props {
  isOpen: boolean;
  title: string;
  pdfUrl: string;
  coverEmoji: string;
  gradient: string;
  onClose: () => void;
}

export const PDFViewerModal: React.FC<Props> = ({
  isOpen, title, pdfUrl, coverEmoji, gradient, onClose,
}) => {
  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = title.replace(/[^a-zA-Z0-9 ]/g, '') + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [pdfUrl, title]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            className="relative w-full h-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
            }}
            initial={{ scale: 0.88, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.88, y: 30 }}
            transition={spring}
            onClick={e => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}>
                  <span className="text-xl">{coverEmoji}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-black text-gray-800 truncate">{title}</h2>
                  <p className="text-[10px] text-gray-400 font-medium">Reading in dashboard</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Download */}
                <motion.button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold text-indigo-600 cursor-pointer"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.15)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⬇️ Download
                </motion.button>

                {/* Close */}
                <motion.button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100/80 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✕
                </motion.button>
              </div>
            </div>

            {/* PDF iframe viewer */}
            <div className="flex-1 relative bg-gray-50">
              <iframe
                src={pdfUrl}
                title={`${title} PDF Viewer`}
                className="absolute inset-0 w-full h-full border-0"
                style={{ background: '#f8fafc' }}
              />

              {/* Loading state hint */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="text-center"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: 2, duration: 0.5 }}
                >
                  <motion.span
                    className="text-4xl inline-block"
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    📖
                  </motion.span>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Loading book…</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
