import React from 'react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) => (
  <motion.div
    className="card-premium p-8 text-center"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <motion.div
      className="text-5xl mb-4"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      😕
    </motion.div>
    <h3 className="font-bold text-blue-900 text-lg mb-2">Oops!</h3>
    <p className="text-sm text-blue-400 mb-6 max-w-sm mx-auto leading-relaxed">{message}</p>
    {onRetry && (
      <motion.button
        onClick={onRetry}
        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        🔄 Try Again
      </motion.button>
    )}
    <p className="text-[10px] text-gray-400 mt-4">
      If the problem persists, please check your internet connection or API key.
    </p>
  </motion.div>
);
