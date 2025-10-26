
import React, { useState } from 'react';

interface CapitalPieChartProps {
  initialCapital: number;
  currentCapital: number;
  formatCurrency: (amount: number) => string;
  t: (key: string) => string;
}

const CapitalPieChart: React.FC<CapitalPieChartProps> = ({ initialCapital, currentCapital, formatCurrency, t }) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const netPnl = currentCapital - initialCapital;
  const isProfit = netPnl >= 0;

  if (initialCapital <= 0) return null;

  const chartData = isProfit
    ? [
        { label: t('pieInitialCapital'), value: initialCapital, color: '#3b82f6' }, // blue-500
        { label: t('pieNetProfit'), value: netPnl, color: '#14b8a6' }, // teal-500
      ]
    : [
        { label: t('pieRemainingCapital'), value: currentCapital > 0 ? currentCapital : 0, color: '#06b6d4' }, // cyan-500
        { label: t('pieTotalLoss'), value: Math.abs(netPnl), color: '#ef4444' }, // red-500
      ];
      
  const totalValue = isProfit ? currentCapital : initialCapital;
  
  if (totalValue <= 0) return null;

  let cumulativeAngle = -90; // Start from the top

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-center">{t('capitalAnalysisTitle')}</h3>
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {chartData.map((segment) => {
              if (segment.value <= 0) return null;
              
              const percentage = (segment.value / totalValue) * 100;
              const angle = (percentage / 100) * 360;
              const isHovered = hoveredSegment === segment.label;
              const strokeWidth = isHovered ? 18 : 15;
              const radius = 50 - strokeWidth / 2;

              const segmentPath = `
                M 50,50
                m -${radius},0
                a ${radius},${radius} 0 1,1 ${radius * 2},0
                a ${radius},${radius} 0 1,1 -${radius * 2},0
              `;

              const dashArray = 2 * Math.PI * radius;
              const dashOffset = dashArray - (dashArray * percentage) / 100;
              
              const rotation = cumulativeAngle;
              cumulativeAngle += angle;

              return (
                <path
                  key={segment.label}
                  d={segmentPath}
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  fill="none"
                  transform={`rotate(${rotation} 50 50)`}
                  className="transition-all duration-300"
                  onMouseEnter={() => setHoveredSegment(segment.label)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                    <title>{`${segment.label}: ${formatCurrency(segment.value)} (${percentage.toFixed(1)}%)`}</title>
                </path>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-gray-500 dark:text-gray-400 text-xs">{t('pieCurrentCapital')}</span>
              <span className="text-gray-900 dark:text-white font-bold text-lg">
                  {formatCurrency(currentCapital)}
              </span>
          </div>
        </div>
        <div className="w-full md:w-auto flex-grow">
          <ul className="space-y-2">
            {chartData.map((segment) => (
               segment.value > 0 &&
              <li key={segment.label} className="flex items-center text-sm justify-between">
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: segment.color }}
                  ></span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{segment.label}</span>
                </div>
                <span className="text-gray-600 dark:text-gray-300 font-mono">{formatCurrency(segment.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CapitalPieChart;
