

import React, { useMemo } from 'react';
import type { Trade } from '../types';
import { ChartIcon, DollarIcon, TargetIcon, TrendingDownIcon, TrendingUpIcon } from './Icons';
import StockPerformanceChart from './StockPerformanceChart';
import ProfitPieChart from './ProfitPieChart';
import CapitalPieChart from './CapitalPieChart';
import EquityCurveChart from './EquityCurveChart';

interface StockAnalyticsProps {
  trades: Trade[];
  onNavigateToDashboard: () => void;
  initialCapital: number;
  currentCapital: number;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
}

interface StockStat {
  assetName: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfit: number;
  avgWin: number;
  avgLoss: number;
}

// A small local component for displaying a single stat, matching the screenshot style.
const StatItem: React.FC<{ title: string; value: string; icon: React.ReactNode; isPositive?: boolean }> = ({ title, value, icon, isPositive }) => {
  const valueColor = isPositive === undefined
    ? 'text-cyan-400'
    : isPositive
    ? 'text-green-400'
    : 'text-red-400';

  return (
    <div className="flex items-center justify-between">
      <div className="text-right">
        <h4 className="text-sm text-gray-400">{title}</h4>
        <p className={`text-lg font-bold ${valueColor}`} dir="ltr">{value}</p>
      </div>
      <div className="bg-gray-700/50 p-3 rounded-lg">
        {icon}
      </div>
    </div>
  );
};


const StockAnalytics: React.FC<StockAnalyticsProps> = ({ trades, onNavigateToDashboard, initialCapital, currentCapital, t, formatCurrency }) => {

  const stockStats = useMemo<StockStat[]>(() => {
    const statsByStock: { [key: string]: Omit<StockStat, 'assetName'> & { totalProfit: number, totalLoss: number } } = {};

    trades.forEach(trade => {
      const { assetName, pnl } = trade;
      if (!statsByStock[assetName]) {
        statsByStock[assetName] = {
          totalTrades: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          netProfit: 0,
          avgWin: 0,
          avgLoss: 0,
          totalProfit: 0,
          totalLoss: 0,
        };
      }
      
      const stock = statsByStock[assetName];
      stock.totalTrades++;
      stock.netProfit += pnl;

      if (pnl > 0) {
        stock.wins++;
        stock.totalProfit += pnl;
      } else if (pnl < 0) {
        stock.losses++;
        stock.totalLoss += pnl;
      }
    });

    return Object.keys(statsByStock).map(assetName => {
      const stock = statsByStock[assetName];
      const winRate = stock.totalTrades > 0 ? (stock.wins / stock.totalTrades) * 100 : 0;
      const avgWin = stock.wins > 0 ? stock.totalProfit / stock.wins : 0;
      const avgLoss = stock.losses > 0 ? Math.abs(stock.totalLoss) / stock.losses : 0;
      
      return {
        assetName,
        totalTrades: stock.totalTrades,
        wins: stock.wins,
        losses: stock.losses,
        winRate,
        netProfit: stock.netProfit,
        avgWin,
        avgLoss,
      };
    }).sort((a, b) => b.netProfit - a.netProfit); // Sort by most profitable
  }, [trades]);

  const tradesByStock = useMemo(() => {
    return trades.reduce((acc, trade) => {
        if (!acc[trade.assetName]) {
            acc[trade.assetName] = [];
        }
        acc[trade.assetName].push(trade);
        return acc;
    }, {} as Record<string, Trade[]>);
  }, [trades]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{t('performanceAnalysis')}</h2>
        <button
          onClick={onNavigateToDashboard}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          {t('returnToDashboard')}
        </button>
      </div>

      {stockStats.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <p className="text-gray-500 dark:text-gray-400">{t('noClosedTradesToAnalyze')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg lg:col-span-1">
              <h3 className="text-xl font-bold mb-4 text-center">{t('equityCurveTitle')}</h3>
              <EquityCurveChart trades={trades} initialCapital={initialCapital} formatCurrency={formatCurrency} t={t} />
            </div>
            <div className="space-y-6 lg:col-span-1">
              <CapitalPieChart initialCapital={initialCapital} currentCapital={currentCapital} formatCurrency={formatCurrency} t={t} />
              <ProfitPieChart trades={trades} formatCurrency={formatCurrency} t={t} />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 pt-4 border-t border-gray-200 dark:border-gray-700">{t('stockPerformanceAnalysisTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stockStats.map(stock => (
              <div key={stock.assetName} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg flex flex-col">
                <div>
                  <h3 className="text-2xl font-bold text-center text-yellow-500 dark:text-yellow-400 border-b-2 border-gray-200 dark:border-gray-700 pb-2">{stock.assetName}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 mt-4">
                    <StatItem title={t('netProfitLoss')} value={formatCurrency(stock.netProfit)} icon={<DollarIcon />} isPositive={stock.netProfit >= 0} />
                    <StatItem title={t('totalClosedTrades')} value={stock.totalTrades.toString()} icon={<ChartIcon />} />
                    <StatItem title={t('winRate')} value={`${stock.winRate.toFixed(1)}%`} icon={<TargetIcon />} />
                    <StatItem title={t('winsLosses')} value={`${stock.wins} / ${stock.losses}`} icon={stock.wins >= stock.losses ? <TrendingUpIcon/> : <TrendingDownIcon/>} isPositive={stock.wins >= stock.losses}/>
                    <StatItem title={t('avgWin')} value={formatCurrency(stock.avgWin)} icon={<TrendingUpIcon />} isPositive={true} />
                    <StatItem title={t('avgLoss')} value={formatCurrency(stock.avgLoss)} icon={<TrendingDownIcon />} isPositive={false} />
                  </div>
                </div>

                <div className="mt-auto pt-4">
                    <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">{t('tradePerformanceOldestNewest')}</h4>
                    <div className="bg-gray-100 dark:bg-gray-900/50 p-2 rounded-lg">
                        <StockPerformanceChart trades={tradesByStock[stock.assetName] || []} height={80} formatCurrency={formatCurrency} t={t} />
                    </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StockAnalytics;