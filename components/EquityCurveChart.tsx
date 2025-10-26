
import React, { useMemo } from 'react';
import type { Trade } from '../types';

interface EquityCurveChartProps {
  trades: Trade[];
  initialCapital: number;
  width?: number;
  height?: number;
  formatCurrency: (amount: number) => string;
  t: (key: string) => string;
}

const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ trades, initialCapital, width = 600, height = 250, formatCurrency, t }) => {
  
  const chartData = useMemo(() => {
    if (trades.length === 0) {
      return null;
    }

    const sortedTrades = [...trades].sort((a, b) => (a.closeDate || 0) - (b.closeDate || 0));

    let cumulativeCapital = initialCapital;
    const dataPoints = sortedTrades.map(trade => {
        cumulativeCapital += trade.pnl;
        return cumulativeCapital;
    });

    const pointsWithStart = [initialCapital, ...dataPoints];

    const minCapital = Math.min(...pointsWithStart);
    const maxCapital = Math.max(...pointsWithStart);

    const yRange = (maxCapital - minCapital) === 0 ? 1 : (maxCapital - minCapital);
    const yPadding = height * 0.1;
    const availableHeight = height - (2 * yPadding);
    
    if (availableHeight <= 0) return null;

    const getCoords = (capital: number, index: number) => {
      const x = (pointsWithStart.length > 1) 
        ? (index / (pointsWithStart.length - 1)) * width 
        : width / 2;
      const y = height - (yPadding + (((capital - minCapital) / yRange) * availableHeight));
      return { x, y };
    };

    const linePath = pointsWithStart.map((capital, index) => {
      const { x, y } = getCoords(capital, index);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
    
    const circles = pointsWithStart.map((capital, index) => ({
        ...getCoords(capital, index),
        capital,
        index
    }));

    return {
      linePath,
      circles,
      finalCapital: cumulativeCapital,
    };
  }, [trades, initialCapital, width, height]);


  if (!chartData) {
    return <div style={{ height: `${height}px` }} className="flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">{t('closeOneTradeForChart')}</div>;
  }

  const { linePath, circles, finalCapital } = chartData;
  const isOverallProfit = finalCapital >= initialCapital;
  
  const strokeColor = isOverallProfit ? 'stroke-cyan-500 dark:stroke-cyan-400' : 'stroke-red-500 dark:stroke-red-400';
  const fillColor = isOverallProfit ? 'fill-cyan-500 dark:fill-cyan-400' : 'fill-red-500 dark:fill-red-400';
  
  return (
    <div className="w-full h-full" dir="ltr">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" aria-label="رسم بياني لنمو رأس المال">
        
        {/* Main line */}
        <path d={linePath} className={strokeColor} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data point circles with tooltips */}
        {circles.map((circle) => (
            <g key={circle.index} className="group cursor-pointer">
            <circle cx={circle.x} cy={circle.y} r="10" className="fill-transparent" />
            <circle 
                cx={circle.x} 
                cy={circle.y} 
                r="4" 
                className={`${fillColor} stroke-2 stroke-white dark:stroke-gray-800 transition-transform duration-200 group-hover:scale-150`}
            />
            <title>{`${circle.index === 0 ? t('initialCapital') : t('chartAfterTrade').replace('{tradeNumber}', circle.index.toString())}: ${formatCurrency(circle.capital)}`}</title>
            </g>
        ))}
        </svg>
    </div>
  );
};

export default EquityCurveChart;
