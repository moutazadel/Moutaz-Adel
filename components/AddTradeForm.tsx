import React, { useState } from 'react';
import type { Trade } from '../types';

interface AddTradeFormProps {
  onAddTrade: (tradeData: Omit<Trade, 'id' | 'capitalBeforeTrade' | 'status' | 'pnl' | 'openDate' | 'closeDate'>) => void;
  historicalAssets: string[];
  t: (key: string) => string;
}

const AddTradeForm: React.FC<AddTradeFormProps> = ({ onAddTrade, historicalAssets, t }) => {
  const [assetName, setAssetName] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [tradeValue, setTradeValue] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryPriceNum = parseFloat(entryPrice);
    const tradeValueNum = parseFloat(tradeValue);
    const takeProfitPriceNum = parseFloat(takeProfitPrice);
    const stopLossPriceNum = parseFloat(stopLossPrice);

    if (!assetName.trim()) {
      setError(t('addTradeErrorAsset'));
      return;
    }
    if (isNaN(entryPriceNum) || entryPriceNum <= 0) {
      setError(t('addTradeErrorEntry'));
      return;
    }
    if (isNaN(tradeValueNum) || tradeValueNum <= 0) {
      setError(t('addTradeErrorValue'));
      return;
    }
    if (isNaN(takeProfitPriceNum) || takeProfitPriceNum <= 0) {
      setError(t('addTradeErrorTP'));
      return;
    }
    if (isNaN(stopLossPriceNum) || stopLossPriceNum <= 0) {
      setError(t('addTradeErrorSL'));
      return;
    }
    if (takeProfitPriceNum <= entryPriceNum) {
      setError(t('addTradeErrorTPGreater'));
      return;
    }
    if (stopLossPriceNum >= entryPriceNum) {
      setError(t('addTradeErrorSLLess'));
      return;
    }
    
    setError('');

    const numberOfShares = tradeValueNum / entryPriceNum;
    const takeProfitAmount = (takeProfitPriceNum - entryPriceNum) * numberOfShares;
    const stopLossAmount = (entryPriceNum - stopLossPriceNum) * numberOfShares;

    onAddTrade({ 
      assetName, 
      entryPrice: entryPriceNum, 
      tradeValue: tradeValueNum, 
      takeProfitPrice: takeProfitPriceNum,
      stopLossPrice: stopLossPriceNum,
      takeProfit: takeProfitAmount, 
      stopLoss: stopLossAmount,
      notes,
    });

    setAssetName('');
    setEntryPrice('');
    setTradeValue('');
    setTakeProfitPrice('');
    setStopLossPrice('');
    setNotes('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-full">
      <h3 className="text-xl font-bold mb-4">{t('newTradeTitle')}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="assetName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('assetNameLabel')}</label>
          <input type="text" id="assetName" value={assetName} onChange={(e) => setAssetName(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" placeholder={t('assetNamePlaceholder')} required list="historical-assets" />
          <datalist id="historical-assets">
            {historicalAssets.map(asset => (
              <option key={asset} value={asset} />
            ))}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('entryPriceLabel')}</label>
            <input type="number" step="any" id="entryPrice" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" placeholder={t('entryPricePlaceholder')} required />
          </div>
          <div>
            <label htmlFor="tradeValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('tradeValueLabel')}</label>
            <input type="number" step="any" id="tradeValue" value={tradeValue} onChange={(e) => setTradeValue(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" placeholder={t('tradeValuePlaceholder')} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="takeProfitPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('tpPriceLabel')}</label>
              <input type="number" step="any" id="takeProfitPrice" value={takeProfitPrice} onChange={(e) => setTakeProfitPrice(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" placeholder={t('tpPricePlaceholder')} required />
            </div>
            <div>
              <label htmlFor="stopLossPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('slPriceLabel')}</label>
              <input type="number" step="any" id="stopLossPrice" value={stopLossPrice} onChange={(e) => setStopLossPrice(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" placeholder={t('slPricePlaceholder')} required />
            </div>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notesLabel')}</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition" rows={2} placeholder={t('notesPlaceholder')}></textarea>
        </div>
        
        {error && <p className="text-red-500 dark:text-red-400 text-sm py-1">{error}</p>}

        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out !mt-4">
          {t('openTradeButton')}
        </button>
      </form>
    </div>
  );
};

export default AddTradeForm;