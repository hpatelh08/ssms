import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SafeYouTubeEmbedProps {
  embedId: string;
  title: string;
  autoPlay?: boolean;
  onError?: () => void;
}

const SafeYouTubeEmbed: React.FC<SafeYouTubeEmbedProps> = ({ embedId, title, autoPlay = true, onError }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const embedSrc = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(embedId)}?${autoPlay ? 'autoplay=1&' : ''}rel=0&modestbranding=1&controls=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&fs=1&disablekb=0&iv_load_policy=3`;

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleIframeError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // Fallback timeout — if iframe doesn't fire onLoad within 15s, show error
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setIsLoading(false);
        onError?.();
      }
    }, 15000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [embedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when embedId changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [embedId]);

  return (
    <div className="w-full max-w-[900px] mx-auto">
      {/* Safe Learning Mode Label */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[11px] font-bold text-green-700 tracking-wide">
          Now Playing — Safe Learning Mode
        </span>
      </div>

      {/* Player Container */}
      <div
        className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #f0f0ff 0%, #e8e0ff 100%)' }}
      >
        <AnimatePresence mode="wait">
          {hasError ? (
            /* ── Error Fallback ── */
            <motion.div
              key="error"
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <span className="text-2xl">📺</span>
              </div>
              <p className="text-[14px] font-bold text-gray-700 mb-2">
                Video Unavailable
              </p>
              <p className="text-[12px] text-gray-500 max-w-xs leading-relaxed">
                This video cannot be embedded right now. Please choose another educational video from the list.
              </p>
              <motion.button
                onClick={() => { setHasError(false); setIsLoading(true); }}
                className="mt-4 px-5 py-2 rounded-xl text-[11px] font-bold text-indigo-600 cursor-pointer"
                style={{ background: 'rgba(238,242,255,0.8)', border: '1px solid rgba(99,102,241,0.2)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 Retry
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* ── Loading spinner ── */}
              {isLoading && (
                <motion.div
                  key="loader"
                  className="absolute inset-0 flex flex-col items-center justify-center z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-3" />
                  <p className="text-[11px] font-medium text-gray-400">Loading video…</p>
                </motion.div>
              )}

              {/* ── Iframe ── */}
              <iframe
                ref={iframeRef}
                src={embedSrc}
                title={title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 'none' }}
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                onLoad={handleLoad}
                onError={handleIframeError}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Footer badge */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <span className="text-[10px] text-gray-400 font-medium">
          Safe viewing · No external links · Privacy-enhanced mode
        </span>
      </div>
    </div>
  );
};

export default SafeYouTubeEmbed;
