import { useEffect } from 'react';
import { useGlobalPlayTimer } from './GlobalPlayTimerProvider';

interface UseGameplayTimerOptions {
  isGameplayActive: boolean;
  onBlocked?: () => void;
}

export function useGameplayTimer({ isGameplayActive, onBlocked }: UseGameplayTimerOptions) {
  const { resumeTimer, pauseTimer } = useGlobalPlayTimer();

  useEffect(() => {
    if (!isGameplayActive) {
      pauseTimer();
      return;
    }

    const canPlay = resumeTimer();
    if (!canPlay) {
      onBlocked?.();
    }

    return () => {
      pauseTimer();
    };
  }, [isGameplayActive, onBlocked, pauseTimer, resumeTimer]);
}
