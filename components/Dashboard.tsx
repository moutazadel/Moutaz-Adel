import React, { useMemo, useState } from 'react';
import type { Portfolio, Trade, Target } from '../types';
import AddTradeForm from './AddTradeForm';
import TradeList from './TradeList';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';
import { ChartIcon, DollarIcon, TargetIcon, TrendingDownIcon, TrendingUpIcon, FinishLineIcon, DownloadIcon, EditIcon, HomeIcon } from './Icons';
import MonthlyStats from './MonthlyStats';
import NotificationManager from './NotificationManager';
import ManageTargetsModal from './ManageTargetsModal';
import EditCapitalModal from './EditCapitalModal';
import StockAnalytics from './StockAnalytics';
import ConfirmModal from './ConfirmModal';

interface DashboardProps {
  portfolio: Portfolio;
  currentCapital: number;
  closedTrades: Trade[];
  historicalAssets: string[];
  onAddTrade: (tradeData: Omit<Trade, 'id' | 'capitalBeforeTrade' | 'status' | 'pnl' | 'openDate' | 'closeDate'>) => void;
  onCloseTrade: (tradeId: string, finalPnl: number) => void;
  onUpdateTrade: (tradeId: string, updates: Partial<Pick<Trade, 'entryPrice' | 'tradeValue' | 'takeProfitPrice' | 'stopLossPrice' | 'notes'>>) => void;
  onDeleteTrade: (tradeId: string) => void;
  onDeletePortfolio: () => void;
  onExportCSV: () => void;
  onUpdateTargets: (newTargets: Target[]) => void;
  onUpdateInitialCapital: (newCapital: number) => void;
  onGoHome: () => void;
  t: (key: string) => string;
  language: 'ar' | 'en';
  formatCurrency: (amount: number) => string;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { portfolio, currentCapital, closedTrades, onDeletePortfolio, onExportCSV, onUpdateTargets, onUpdateInitialCapital, onGoHome, t, language, formatCurrency } = props;
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [isEditCapitalModalOpen, setIsEditCapitalModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'trades' | 'analysis'>('trades');

  const activeTarget = useMemo(() => {
    const sortedTargets = portfolio.targets.slice().sort((a, b) => a.amount - b.amount);
    const nextUnachievedTarget = sortedTargets.find(t => currentCapital < t.amount);
    return nextUnachievedTarget || sortedTargets[sortedTargets.length - 1] || null;
  }, [portfolio.targets, currentCapital]);

  const { progress, progressStartAmount, progressEndAmount } = useMemo(() => {
    const sortedTargets = portfolio.targets.slice().sort((a, b) => a.amount - b.amount);
    const achievedTargets = sortedTargets.filter(t => currentCapital >= t.amount);
    
    const startAmount = achievedTargets.length > 0 
        ? achievedTargets[achievedTargets.length - 1].amount 
        : portfolio.initialCapital;

    const endAmount = activeTarget?.amount || startAmount;

    const segmentTotal = endAmount - startAmount;
    const segmentProgress = currentCapital - startAmount;

    let progressPercentage = 0;
    if (segmentTotal > 0) {
        progressPercentage = (segmentProgress / segmentTotal) * 100;
    } else if (currentCapital >= endAmount && endAmount > 0) {
        progressPercentage = 100;
    }
    
    return {
        progress: Math.max(0, Math.min(progressPercentage, 100)),
        progressStartAmount: startAmount,
        progressEndAmount: endAmount,
    };
  }, [portfolio.targets, portfolio.initialCapital, currentCapital, activeTarget]);

  const stats = useMemo(() => {
    const winningTrades = closedTrades.filter(t => t.pnl > 0);
    const losingTrades = closedTrades.filter(t => t.pnl < 0);
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = losingTrades.reduce((sum, t) => sum + t.pnl, 0);
    const netProfit = totalProfit + totalLoss;
    const growthRates = closedTrades.map(t => t.capitalBeforeTrade > 0 ? t.pnl / t.capitalBeforeTrade : 0);
    const avgGrowthRate = growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0;
    let estimatedTradesToTarget = Infinity;
    if (activeTarget && avgGrowthRate > 0 && currentCapital > 0 && activeTarget.amount > currentCapital) {
        estimatedTradesToTarget = Math.log(activeTarget.amount / currentCapital) / Math.log(1 + avgGrowthRate);
    }
    return {
      totalTrades: closedTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      avgWin: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? Math.abs(totalLoss) / losingTrades.length : 0,
      netProfit,
      estimatedTradesToTarget,
    };
  }, [closedTrades, currentCapital, activeTarget]);
  
  const targetAmount = activeTarget?.amount || 0;
  const amountToTarget = targetAmount - currentCapital;

  const tradesToTargetDisplay = useMemo(() => {
    if (activeTarget && currentCapital >= activeTarget.amount) return t('targetAchieved');
    if (closedTrades.length < 5) return t('insufficientData');
    if (!isFinite(stats.estimatedTradesToTarget) || stats.estimatedTradesToTarget <= 0) return t('improvePerformance');
    return `~ ${Math.ceil(stats.estimatedTradesToTarget)} ${t('trades')}`;
  }, [currentCapital, activeTarget, closedTrades.length, stats.estimatedTradesToTarget, t]);

  const filteredTrades = useMemo(() => {
    if (filter === 'open') return portfolio.trades.filter(trade => trade.status === 'open');
    if (filter === 'closed') return portfolio.trades.filter(trade => trade.status === 'closed');
    return portfolio.trades;
  }, [portfolio.trades, filter]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="bg-yellow-400 p-6 rounded-xl shadow-lg">
           <div className="flex justify-between items-start">
              <div className="text-right">
                  <h3 className="text-lg text-black/80">{t('initialCapital')}</h3>
                  <p className="text-3xl font-bold text-black">{formatCurrency(portfolio.initialCapital)}</p>
              </div>
              <button onClick={() => setIsEditCapitalModalOpen(true)} className="p-2 -mr-2 -mt-2 rounded-full text-black/60 hover:bg-black/10 transition" aria-label={t('editInitialCapital')} title={t('editInitialCapital')}>
                  <EditIcon />
              </button>
            </div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-xl shadow-2xl shadow-cyan-500/20 transform md:scale-110">
          <h3 className="text-lg text-cyan-100">{t('currentCapital')}</h3>
          <p className="text-4xl font-extrabold text-white">{formatCurrency(currentCapital)}</p>
        </div>
        <div className="bg-green-500 p-6 rounded-xl shadow-lg">
           <div className="flex justify-between items-start">
              <div className="text-right">
                <h3 className="text-lg text-white/90">{activeTarget?.name || t('target')}</h3>
                <p className="text-3xl font-bold text-white">{formatCurrency(targetAmount)}</p>
              </div>
              <button onClick={() => setIsTargetsModalOpen(true)} className="p-2 -mr-2 -mt-2 rounded-full text-white/80 hover:bg-white/20 transition" aria-label={t('editTargets')} title={t('editTargets')}>
                  <EditIcon />
              </button>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{t('progressToTarget')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('remaining')}: <span className="font-bold text-yellow-500 dark:text-yellow-400">{formatCurrency(Math.max(0, amountToTarget))}</span>
            </p>
        </div>
        <ProgressBar progress={progress} t={t} />
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium" title={t('progressStartPoint')}>{formatCurrency(progressStartAmount)}</span>
            <span className="font-medium text-green-500 dark:text-green-400" title={t('nextTarget')}>{formatCurrency(progressEndAmount)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title={t('totalClosedTrades')} value={stats.totalTrades.toString()} icon={<ChartIcon />} />
        <StatCard title={t('winRate')} value={`${stats.winRate.toFixed(1)}%`} icon={<TargetIcon />} />
        <StatCard title={t('estimatedTradesToTarget')} value={tradesToTargetDisplay} icon={<FinishLineIcon />} />
        <StatCard title={t('netProfitLoss')} value={formatCurrency(stats.netProfit)} icon={<DollarIcon />} isPositive={stats.netProfit >= 0} />
        <StatCard title={t('avgWin')} value={formatCurrency(stats.avgWin)} icon={<TrendingUpIcon />} isPositive={true} />
        <StatCard title={t('avgLoss')} value={formatCurrency(stats.avgLoss)} icon={<TrendingDownIcon />} isPositive={false} />
      </div>

      <MonthlyStats trades={closedTrades} t={t} language={language} formatCurrency={formatCurrency} />

      <div className="mb-6 flex justify-center border-b border-gray-300 dark:border-gray-700">
        <button 
          onClick={() => setActiveTab('trades')} 
          className={`px-6 py-3 text-lg font-bold transition-colors duration-300 ${activeTab === 'trades' ? 'border-b-4 border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 hover:text-cyan-500'}`}
        >
          {t('newTradeTab')}
        </button>
        <button 
          onClick={() => setActiveTab('analysis')} 
          className={`px-6 py-3 text-lg font-bold transition-colors duration-300 ${activeTab === 'analysis' ? 'border-b-4 border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400 hover:text-cyan-500'}`}
        >
          {t('performanceAnalysis')}
        </button>
      </div>

      {activeTab === 'trades' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1 space-y-4">
            <AddTradeForm onAddTrade={props.onAddTrade} historicalAssets={props.historicalAssets} t={t} />
            <div className="space-y-2">
              <NotificationManager t={t} />
               <div className="flex items-stretch gap-2">
                 <button onClick={onGoHome} className="flex-grow bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 text-sm rounded-md transition duration-300 flex items-center justify-center gap-2" title={t('goHome')}>
                   <HomeIcon />
                   <span>{t('goHome')}</span>
                 </button>
                 <button onClick={onExportCSV} className="flex-shrink-0 bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-md transition duration-300 flex items-center justify-center gap-2" title={t('exportCSV')}>
                   <DownloadIcon />
                 </button>
                 <button onClick={() => setIsDeleteConfirmOpen(true)} className="flex-shrink-0 bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-3 text-sm rounded-md transition duration-300">
                   {t('deletePortfolio')}
                 </button>
               </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="mb-4 flex justify-center sm:justify-start items-center gap-2 p-2 bg-gray-200 dark:bg-gray-900 rounded-lg">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${filter === 'all' ? 'bg-cyan-600 text-white' : 'bg-gray-600 dark:bg-gray-700 text-gray-100 dark:text-gray-300 hover:bg-gray-500 dark:hover:bg-gray-600'}`}>{t('all')}</button>
              <button onClick={() => setFilter('open')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${filter === 'open' ? 'bg-cyan-600 text-white' : 'bg-gray-600 dark:bg-gray-700 text-gray-100 dark:text-gray-300 hover:bg-gray-500 dark:hover:bg-gray-600'}`}>{t('open')}</button>
              <button onClick={() => setFilter('closed')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${filter === 'closed' ? 'bg-cyan-600 text-white' : 'bg-gray-600 dark:bg-gray-700 text-gray-100 dark:text-gray-300 hover:bg-gray-500 dark:hover:bg-gray-600'}`}>{t('closed')}</button>
            </div>
            <TradeList trades={filteredTrades} onDeleteTrade={props.onDeleteTrade} onCloseTrade={props.onCloseTrade} onUpdateTrade={props.onUpdateTrade} t={t} language={language} formatCurrency={formatCurrency} />
          </div>
        </div>
      )}
       {activeTab === 'analysis' && (
        <StockAnalytics 
          trades={closedTrades} 
          onNavigateToDashboard={() => setActiveTab('trades')} 
          initialCapital={portfolio.initialCapital} 
          currentCapital={currentCapital} 
          t={t} 
          formatCurrency={formatCurrency}
        />
      )}

      <ManageTargetsModal isOpen={isTargetsModalOpen} onClose={() => setIsTargetsModalOpen(false)} currentTargets={portfolio.targets} onSave={onUpdateTargets} t={t} />
      <EditCapitalModal isOpen={isEditCapitalModalOpen} onClose={() => setIsEditCapitalModalOpen(false)} currentCapital={portfolio.initialCapital} onSave={onUpdateInitialCapital} t={t} />
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDeletePortfolio();
          setIsDeleteConfirmOpen(false);
        }}
        title={t('confirmDeletePortfolioTitle')}
        message={<p dangerouslySetInnerHTML={{ __html: t('confirmDeletePortfolioMessage').replace('{portfolioName}', `<strong>${portfolio.portfolioName}</strong>`) }} />}
        confirmText={t('confirmDeleteButton')}
        t={t}
      />
    </div>
  );
};

export default Dashboard;
