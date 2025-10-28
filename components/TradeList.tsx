import React, { useState, useMemo } from 'react';
import type { Trade } from '../types';
import { TrashIcon, TrendingDownIcon, TrendingUpIcon, EditIcon, InfoIcon } from './Icons';
import ConfirmModal from './ConfirmModal';

// Modal Component for closing trades
const CloseTradeModal: React.FC<{
  trade: Trade;
  onConfirm: (finalPnl: number) => void;
  onCancel: () => void;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
}> = ({ trade, onConfirm, onCancel, t, formatCurrency }) => {
  const [finalPnl, setFinalPnl] = useState('');
  const [error, setError] = useState('');
  const [pnlToConfirm, setPnlToConfirm] = useState<number | null>(null);

  const handleAttemptClose = (pnl: number) => {
    setPnlToConfirm(pnl);
  };

  const handleConfirmClose = () => {
    if (pnlToConfirm !== null) {
      onConfirm(pnlToConfirm);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pnlNum = parseFloat(finalPnl);
    if (isNaN(pnlNum)) {
      setError(t('pnlError'));
      return;
    }
    setError('');
    handleAttemptClose(pnlNum);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onCancel}>
        <div className="bg-gray-200 dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-2 text-cyan-600 dark:text-cyan-400">{t('closeTradeTitle').replace('{assetName}', trade.assetName)}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('closeTradeDescription')}</p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => handleAttemptClose(trade.takeProfit)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition flex flex-col items-center justify-center">
                  <span>{t('confirmProfit')}</span>
                  <span className="text-xs font-mono">({formatCurrency(trade.takeProfit)})</span>
              </button>
              <button onClick={() => handleAttemptClose(-trade.stopLoss)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition flex flex-col items-center justify-center">
                  <span>{t('confirmLoss')}</span>
                  <span className="text-xs font-mono">({formatCurrency(-trade.stopLoss)})</span>
              </button>
          </div>
          
          <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-400 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center">
                  <span className="bg-gray-200 dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">{t('orCustomValue')}</span>
              </div>
          </div>

          <form onSubmit={handleSubmit}>
              <label htmlFor="finalPnl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('manualPnlLabel')}</label>
              <input
                  type="number"
                  step="any"
                  id="finalPnl"
                  value={finalPnl}
                  onChange={(e) => setFinalPnl(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                  placeholder={t('manualPnlPlaceholder')}
                  required
              />
              {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
              <div className="flex gap-4 mt-6">
                  <button type="button" onClick={onCancel} className="w-full bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition">
                      {t('cancel')}
                  </button>
                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition">
                      {t('addAndConfirm')}
                  </button>
              </div>
          </form>
        </div>
      </div>
      <ConfirmModal
        isOpen={pnlToConfirm !== null}
        onClose={() => setPnlToConfirm(null)}
        onConfirm={handleConfirmClose}
        title={t('confirmCloseTitle')}
        message={
          pnlToConfirm !== null && (
            <p>
              {t('confirmCloseMessage').replace('{pnl}', '')}
              <span className={`font-bold mx-1 ${pnlToConfirm >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(pnlToConfirm)}
              </span>?
            </p>
          )
        }
        confirmText={t('confirmCloseButton')}
        t={t}
      />
    </>
  );
};

// Modal Component for editing trades
const EditTradeModal: React.FC<{
  trade: Trade;
  onConfirm: (updates: Partial<Pick<Trade, 'entryPrice' | 'tradeValue' | 'takeProfitPrice' | 'stopLossPrice' | 'notes'>>) => void;
  onCancel: () => void;
  t: (key: string) => string;
}> = ({ trade, onConfirm, onCancel, t }) => {
    const [entryPrice, setEntryPrice] = useState(trade.entryPrice.toString());
    const [tradeValue, setTradeValue] = useState(trade.tradeValue.toString());
    const [takeProfitPrice, setTakeProfitPrice] = useState(trade.takeProfitPrice.toString());
    const [stopLossPrice, setStopLossPrice] = useState(trade.stopLossPrice.toString());
    const [notes, setNotes] = useState(trade.notes || '');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const entryPriceNum = parseFloat(entryPrice);
        const tradeValueNum = parseFloat(tradeValue);
        const takeProfitPriceNum = parseFloat(takeProfitPrice);
        const stopLossPriceNum = parseFloat(stopLossPrice);

        if (isNaN(entryPriceNum) || entryPriceNum <= 0) {
            setError(t('addTradeErrorEntry')); return;
        }
        if (isNaN(tradeValueNum) || tradeValueNum <= 0) {
            setError(t('addTradeErrorValue')); return;
        }
        if (isNaN(takeProfitPriceNum) || takeProfitPriceNum <= 0) {
            setError(t('addTradeErrorTP')); return;
        }
        if (isNaN(stopLossPriceNum) || stopLossPriceNum <= 0) {
            setError(t('addTradeErrorSL')); return;
        }
        if (takeProfitPriceNum <= entryPriceNum) {
            setError(t('addTradeErrorTPGreater')); return;
        }
        if (stopLossPriceNum >= entryPriceNum) {
            setError(t('addTradeErrorSLLess')); return;
        }
        
        setError('');
        onConfirm({ 
            entryPrice: entryPriceNum, 
            tradeValue: tradeValueNum, 
            takeProfitPrice: takeProfitPriceNum,
            stopLossPrice: stopLossPriceNum,
            notes: notes,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onCancel}>
            <div className="bg-gray-200 dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-cyan-600 dark:text-cyan-400">{t('editTradeTitle').replace('{assetName}', trade.assetName)}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="editEntryPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('entryPriceLabel')}</label>
                            <input type="number" step="any" id="editEntryPrice" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" required />
                        </div>
                        <div>
                            <label htmlFor="editTradeValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('tradeValueLabel')}</label>
                            <input type="number" step="any" id="editTradeValue" value={tradeValue} onChange={e => setTradeValue(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="editTakeProfitPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('tpPriceLabel')}</label>
                            <input type="number" step="any" id="editTakeProfitPrice" value={takeProfitPrice} onChange={e => setTakeProfitPrice(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" required />
                        </div>
                        <div>
                            <label htmlFor="editStopLossPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('slPriceLabel')}</label>
                            <input type="number" step="any" id="editStopLossPrice" value={stopLossPrice} onChange={e => setStopLossPrice(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" required />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="editNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notesLabel')}</label>
                        <textarea id="editNotes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" rows={3} placeholder={t('notesPlaceholder')}></textarea>
                    </div>
                    {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                    <div className="flex gap-4 pt-2">
                        <button type="button" onClick={onCancel} className="w-full bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition">
                            {t('saveChanges')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface TradeListProps {
  trades: Trade[];
  onDeleteTrade: (tradeId: string) => void;
  onCloseTrade: (tradeId: string, finalPnl: number) => void;
  onUpdateTrade: (tradeId: string, updates: Partial<Pick<Trade, 'entryPrice' | 'tradeValue' | 'takeProfitPrice' | 'stopLossPrice' | 'notes'>>) => void;
  t: (key: string) => string;
  language: 'ar' | 'en';
  formatCurrency: (amount: number) => string;
}

const TradeItem: React.FC<{trade: Trade, children: React.ReactNode, t: (key: string) => string}> = ({ trade, children, t }) => {
    const [notesVisible, setNotesVisible] = useState(false);
    return (
        <li className="bg-gray-200/50 dark:bg-gray-900/40 p-3 rounded-lg flex flex-col">
            {children}
            {trade.notes && (
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
                    <button onClick={() => setNotesVisible(!notesVisible)} className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400">
                        <InfoIcon />
                        <span className="mx-1">{notesVisible ? t('hideNotes') : t('showNotes')}</span>
                    </button>
                    {notesVisible && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 p-2 bg-gray-200 dark:bg-gray-800/50 rounded whitespace-pre-wrap">
                            {trade.notes}
                        </p>
                    )}
                </div>
            )}
        </li>
    );
}


const TradeList: React.FC<TradeListProps> = ({ trades, onDeleteTrade, onCloseTrade, onUpdateTrade, t, language, formatCurrency }) => {
  const [tradeToClose, setTradeToClose] = useState<Trade | null>(null);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);

  const { openTrades, closedTrades } = useMemo(() => {
    const open: Trade[] = [];
    const closed: Trade[] = [];
    trades.forEach(trade => {
      if (trade.status === 'open') open.push(trade);
      else closed.push(trade);
    });
    open.sort((a, b) => (b.openDate || parseInt(b.id)) - (a.openDate || parseInt(a.id)));
    closed.sort((a, b) => (b.closeDate || 0) - (a.closeDate || 0));
    return { openTrades: open, closedTrades: closed };
  }, [trades]);
  
  const locale = language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-yellow-500 dark:text-yellow-400">{t('openTrades')} ({openTrades.length})</h3>
        <div className="max-h-[250px] overflow-y-auto">
          {openTrades.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('noOpenTrades')}</p>
          ) : (
            <ul className="space-y-2 pe-2">
              {openTrades.map(trade => (
                <TradeItem key={trade.id} trade={trade} t={t}>
                  <div className="grid grid-cols-5 gap-4 items-center">
                    <div className="col-span-3 space-y-1">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg text-yellow-600 dark:text-yellow-300">{trade.assetName}</span>
                            </div>
                            {trade.openDate && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {new Date(trade.openDate).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
                              </span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300">
                            <span>{formatCurrency(trade.tradeValue)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">@ {trade.entryPrice}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span className="flex items-center gap-1 text-green-500 dark:text-green-400"><TrendingUpIcon/> {trade.takeProfit.toFixed(2)}</span>
                            <span className="flex items-center gap-1 text-red-500 dark:text-red-400"><TrendingDownIcon/> {trade.stopLoss.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                       <button onClick={() => setTradeToDelete(trade)} className="text-gray-500 dark:text-gray-400 hover:text-red-500 p-2 rounded-md transition" aria-label={t('cancel')}>
                          <TrashIcon />
                      </button>
                      <button onClick={() => setTradeToEdit(trade)} className="text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 p-2 rounded-md transition" aria-label={t('edit')}>
                          <EditIcon />
                      </button>
                      <button onClick={() => setTradeToClose(trade)} className="bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white text-sm font-bold py-2 px-3 rounded-md transition">
                          {t('close')}
                      </button>
                    </div>
                  </div>
                </TradeItem>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">{t('closedTradesHistory')} ({closedTrades.length})</h3>
        <div className="max-h-[400px] overflow-y-auto">
          {closedTrades.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('noClosedTrades')}</p>
          ) : (
            <div className="flex flex-col">
              <div className="grid grid-cols-10 gap-2 px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm">
                <div className="text-right col-span-1">{t('tradeNumHeader')}</div>
                <div className="text-right col-span-2">{t('assetHeader')}</div>
                <div className="text-right col-span-2">{t('dateHeader')}</div>
                <div className="text-right col-span-2">{t('pnlHeader')}</div>
                <div className="text-center col-span-2">{t('percentageHeader')}</div>
                <div className="text-left col-span-1">{t('actionsHeader')}</div>
              </div>
              <ul className="space-y-2 mt-2 pe-2">
                {closedTrades.map((trade, index) => {
                  const isProfit = trade.pnl >= 0;
                  const percentage = trade.tradeValue > 0 ? (trade.pnl / trade.tradeValue) * 100 : 0;
                  return (
                    <TradeItem key={trade.id} trade={trade} t={t}>
                      <div className="grid grid-cols-10 gap-2 items-center">
                         <div className="col-span-1 font-mono text-gray-500 dark:text-gray-400 text-sm text-right">#{closedTrades.length - index}</div>
                         <div className="col-span-2 font-semibold text-gray-800 dark:text-gray-200 text-right">{trade.assetName}</div>
                         <div className="col-span-2 font-mono text-gray-500 dark:text-gray-400 text-sm text-right">
                           {trade.closeDate ? new Date(trade.closeDate).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                         </div>
                         <div className={`col-span-2 font-bold text-lg text-right ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{isProfit ? '+' : ''}{formatCurrency(trade.pnl)}</div>
                         <div className={`col-span-2 font-semibold text-sm text-center ${isProfit ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300'}`}>({isProfit ? '+' : ''}{percentage.toFixed(2)}%)</div>
                         <div className="col-span-1 text-left flex items-center justify-end">
                           <button onClick={() => setTradeToDelete(trade)} className="text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 p-1" aria-label={`${t('delete')} #${trades.length - index}`}>
                             <TrashIcon />
                           </button>
                         </div>
                       </div>
                    </TradeItem>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {tradeToClose && (
        <CloseTradeModal
          trade={tradeToClose}
          onConfirm={(finalPnl) => { onCloseTrade(tradeToClose.id, finalPnl); setTradeToClose(null); }}
          onCancel={() => setTradeToClose(null)}
          t={t}
          formatCurrency={formatCurrency}
        />
      )}

      {tradeToEdit && (
          <EditTradeModal
            trade={tradeToEdit}
            onConfirm={(updates) => { onUpdateTrade(tradeToEdit.id, updates); setTradeToEdit(null); }}
            onCancel={() => setTradeToEdit(null)}
            t={t}
          />
      )}
      {tradeToDelete && (
          <ConfirmModal
              isOpen={!!tradeToDelete}
              onClose={() => setTradeToDelete(null)}
              onConfirm={() => {
                  if (tradeToDelete) {
                      onDeleteTrade(tradeToDelete.id);
                      setTradeToDelete(null);
                  }
              }}
              title={t('confirmDeleteTitle')}
              message={<p dangerouslySetInnerHTML={{ __html: t('confirmDeleteMessage').replace('{assetName}', `<strong>${tradeToDelete.assetName}</strong>`) }} />}
              confirmText={t('confirmDeleteButton')}
              t={t}
          />
      )}
    </div>
  );
};

export default TradeList;