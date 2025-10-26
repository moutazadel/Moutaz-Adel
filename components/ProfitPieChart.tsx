
import React, { useMemo, useState } from 'react';
import type { Trade } from '../types';

const COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

interface ProfitPieChartProps {
  trades: Trade[];
  formatCurrency: (amount: number) => string;
  t: (key: string) => string;
}

const ProfitPieChart: React.FC<ProfitPieChartProps> = ({ trades, formatCurrency, t }) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const profitsByStock: { [key: string]: number } = {};
    trades.forEach(trade => {
      if (trade.pnl > 0) {
        if (!profitsByStock[trade.assetName]) {
          profitsByStock[trade.assetName] = 0;
        }
        profitsByStock[trade.assetName] += trade.pnl;
      }
    });

    const totalProfit = Object.values(profitsByStock).reduce((sum, p) => sum + p, 0);

    if (totalProfit === 0) return null;

    return Object.entries(profitsByStock)
      .map(([assetName, profit]) => ({
        assetName,
        profit,
        percentage: (profit / totalProfit) * 100,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [trades]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
        <h3 className="text-xl font-bold mb-2">{t('profitDistributionTitle')}</h3>
        <p className="text-gray-500 dark:text-gray-400">{t('noProfitData')}</p>
      </div>
    );
  }

  let cumulativeAngle = -90; // Start from the top

  const totalProfit = chartData.reduce((sum, item) => sum + item.profit, 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-center">{t('profitDistributionByAssetTitle')}</h3>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {chartData.map((segment, index) => {
              const angle = (segment.percentage / 100) * 360;
              const isHovered = hoveredSegment === segment.assetName;
              const strokeWidth = isHovered ? 18 : 15;
              const radius = 50 - strokeWidth / 2;

              const segmentPath = `
                M 50,50
                m -${radius},0
                a ${radius},${radius} 0 1,1 ${radius * 2},0
                a ${radius},${radius} 0 1,1 -${radius * 2},0
              `;

              const dashArray = 2 * Math.PI * radius;
              const dashOffset = dashArray - (dashArray * segment.percentage) / 100;
              
              const rotation = cumulativeAngle;
              cumulativeAngle += angle;

              return (
                <path
                  key={segment.assetName}
                  d={segmentPath}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  fill="none"
                  transform={`rotate(${rotation} 50 50)`}
                  className="transition-all duration-300"
                  onMouseEnter={() => setHoveredSegment(segment.assetName)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                    <title>{`${segment.assetName}: ${formatCurrency(segment.profit)} (${segment.percentage.toFixed(1)}%)`}</title>
                </path>
              );
            })}
          </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">{t('netProfitLoss')}</span>
                <span className="text-gray-900 dark:text-white font-bold text-xl sm:text-2xl">
                    {formatCurrency(totalProfit)}
                </span>
            </div>
        </div>
        <div className="w-full md:w-auto">
          <ul className="space-y-2">
            {chartData.map((segment, index) => (
              <li key={segment.assetName} className="flex items-center text-sm">
                <span
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{segment.assetName}</span>
                <span className="mr-auto text-gray-600 dark:text-gray-400 font-mono">{segment.percentage.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfitPieChart;
