import React from 'react';
import { CheckCircleIcon } from './Icons';

interface ProgressBarProps {
  progress: number;
  t: (key: string) => string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, t }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const isComplete = clampedProgress >= 100;

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
      <div
        className={`h-4 rounded-full transition-all duration-500 ease-out ${
          isComplete
            ? 'bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600'
            : 'bg-gradient-to-r from-cyan-400 to-blue-500 dark:from-cyan-500 dark:to-blue-600'
        }`}
        style={{ width: `${clampedProgress}%` }}
      ></div>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold text-white ${isComplete ? '' : 'mix-blend-screen dark:mix-blend-lighten'}`}>
        {isComplete ? (
          <span className="flex items-center gap-1.5">
            <CheckCircleIcon />
            {t('progressBarTargetAchieved')}
          </span>
        ) : (
          `${clampedProgress.toFixed(1)}%`
        )}
      </span>
    </div>
  );
};

export default ProgressBar;