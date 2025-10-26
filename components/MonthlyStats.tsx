import React, { useMemo } from 'react';
import type { Trade } from '../types';

interface MonthlyStatsProps {
  trades: Trade[];
  t: (key: string) => string;
  language: 'ar' | 'en';
  formatCurrency: (amount: number) => string;
}

interface MonthlyStat {
  monthYear: string; // e.g., "2024-7"
  displayDate: string; // e.g., "يوليو 2024"
  wins: number;
  losses: number;
  netProfit: number;
}

const MonthlyStats: React.FC<MonthlyStatsProps> = ({ trades, t, language, formatCurrency }) => {
  const monthlyData = useMemo(() => {
    const stats: { [key: string]: Omit<MonthlyStat, 'monthYear' | 'displayDate'> } = {};
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';

    trades.forEach(trade => {
      const date = new Date(trade.closeDate || parseInt(trade.id));
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed
      const key = `${year}-${month}`;

      if (!stats[key]) {
        stats[key] = { wins: 0, losses: 0, netProfit: 0 };
      }

      if (trade.pnl > 0) stats[key].wins++;
      else if (trade.pnl < 0) stats[key].losses++;
      stats[key].netProfit += trade.pnl;
    });

    return Object.keys(stats)
      .map(key => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month);
        return {
          monthYear: key,
          displayDate: date.toLocaleString(locale, { month: 'long', year: 'numeric' }),
          ...stats[key],
        };
      })
      .sort((a, b) => {
          const [yearA, monthA] = a.monthYear.split('-').map(Number);
          const [yearB, monthB] = b.monthYear.split('-').map(Number);
          if (yearB !== yearA) return yearB - yearA;
          return monthB - monthA;
      });
  }, [trades, language]);

  if (trades.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4">{t('monthlyPerformance')}</h3>
      <div className="max-h-[300px] overflow-y-auto">
        {monthlyData.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('noMonthlyData')}</p>
        ) : (
          <div className="flex flex-col">
            <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="text-right">{t('monthHeader')}</div>
              <div className="text-center">{t('winsHeader')}</div>
              <div className="text-center">{t('lossesHeader')}</div>
              <div className="text-left">{t('netProfitHeader')}</div>
            </div>
            <ul className="space-y-2 mt-2 pe-2">
              {monthlyData.map((stat) => {
                const isProfit = stat.netProfit >= 0;
                return (
                  <li key={stat.monthYear} className="grid grid-cols-4 gap-4 items-center p-3 rounded-lg bg-gray-100 dark:bg-gray-900/40">
                    <div className="font-semibold text-gray-800 dark:text-gray-200 text-right">{stat.displayDate}</div>
                    <div className="font-mono text-green-600 dark:text-green-400 text-center">{stat.wins}</div>
                    <div className="font-mono text-red-600 dark:text-red-400 text-center">{stat.losses}</div>
                    <div className={`font-bold text-left ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(stat.netProfit)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyStats;