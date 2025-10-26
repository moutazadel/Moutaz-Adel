
import React, { useMemo } from 'react';
import type { Trade } from '../types';

interface StockPerformanceChartProps {
  trades: Trade[];
  width?: number;
  height?: number;
  formatCurrency: (amount: number) => string;
  t: (key: string) => string;
}

const StockPerformanceChart: React.FC<StockPerformanceChartProps> = ({ trades, width = 300, height = 100, formatCurrency, t }) => {
  
  const chartData = useMemo(() => {
    if (trades.length === 0) {
      return null;
    }

    const sortedTrades = [...trades].sort((a, b) => (a.closeDate || 0) - (b.closeDate || 0));

    let cumulativePnl = 0;
    const dataPoints = sortedTrades.map(trade => {
        cumulativePnl += trade.pnl;
        return cumulativePnl;
    });

    const pointsWithStart = [0, ...dataPoints];

    const minDataPoint = Math.min(...pointsWithStart);
    const maxDataPoint = Math.max(...pointsWithStart);

    const minPnl = Math.min(0, minDataPoint);
    const maxPnl = Math.max(0, maxDataPoint);

    const yRange = (maxPnl - minPnl) === 0 ? 1 : (maxPnl - minPnl);
    const yPadding = height * 0.1;
    const availableHeight = height - (2 * yPadding);
    
    if (availableHeight <= 0) return null;

    const getCoords = (pnl: number, index: number) => {
      const x = (pointsWithStart.length > 1) 
        ? (index / (pointsWithStart.length - 1)) * width 
        : width / 2;
      const y = height - (yPadding + (((pnl - minPnl) / yRange) * availableHeight));
      return { x, y };
    };

    const linePath = pointsWithStart.map((pnl, index) => {
      const { x, y } = getCoords(pnl, index);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');

    const zeroLineY = getCoords(0, 0).y;

    let areaPath = linePath;
    const lastPoint = getCoords(pointsWithStart[pointsWithStart.length - 1], pointsWithStart.length - 1);
    const firstPoint = getCoords(pointsWithStart[0], 0);
    areaPath += ` L${lastPoint.x.toFixed(2)},${zeroLineY.toFixed(2)} L${firstPoint.x.toFixed(2)},${zeroLineY.toFixed(2)} Z`;
    
    const circles = pointsWithStart.map((pnl, index) => ({
        ...getCoords(pnl, index),
        pnl,
        index
    }));

    return {
      linePath,
      areaPath,
      circles,
      zeroLineY,
      finalPnl: cumulativePnl,
    };
  }, [trades, width, height]);


  if (!chartData) {
    return <div style={{ height: `${height}px` }} className="flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">{t('noChartData')}</div>;
  }

  const { linePath, areaPath, circles, zeroLineY, finalPnl } = chartData;
  const isOverallProfit = finalPnl >= 0;
  
  const strokeColor = isOverallProfit ? 'stroke-green-500 dark:stroke-green-400' : 'stroke-red-500 dark:stroke-red-400';
  const fillColor = isOverallProfit ? 'fill-green-500 dark:fill-green-400' : 'fill-red-500 dark:fill-red-400';

  const gradientId = `gradient-${trades[0]?.id}-${isOverallProfit ? 'profit' : 'loss'}`;
  const gradientStartColor = isOverallProfit ? 'rgba(22, 163, 74, 0.4)' : 'rgba(220, 38, 38, 0.4)'; // green-600, red-600
  const gradientEndColor = isOverallProfit ? 'rgba(22, 163, 74, 0.0)' : 'rgba(220, 38, 38, 0.0)';

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" aria-label={`رسم بياني للأداء التراكمي لـ ${trades[0]?.assetName}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientStartColor} />
            <stop offset="100%" stopColor={gradientEndColor} />
        </linearGradient>
      </defs>

      {/* Zero line */}
      <line x1="0" y1={zeroLineY} x2={width} y2={zeroLineY} className="stroke-gray-400 dark:stroke-gray-600" strokeWidth="1" strokeDasharray="2,2" />

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />

      {/* Main line */}
      <path d={linePath} className={strokeColor} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data point circles with tooltips */}
      {circles.map((circle) => (
        <g key={circle.index} className="group cursor-pointer">
          <circle cx={circle.x} cy={circle.y} r="8" className="fill-transparent" />
          <circle 
            cx={circle.x} 
            cy={circle.y} 
            r="3" 
            className={`${fillColor} stroke-2 stroke-gray-100 dark:stroke-gray-800 transition-transform duration-200 group-hover:scale-150`}
          />
          <title>{`${circle.index === 0 ? t('chartStart') : t('chartAfterTrade').replace('{tradeNumber}', circle.index.toString())}: ${formatCurrency(circle.pnl)}`}</title>
        </g>
      ))}
    </svg>
  );
};

export default StockPerformanceChart;
