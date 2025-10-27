import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Trade } from '../types';

interface AddTradeFormProps {
  onAddTrade: (tradeData: Omit<Trade, 'id' | 'capitalBeforeTrade' | 'status' | 'pnl' | 'openDate' | 'closeDate'>) => void;
  historicalAssets: string[];
  t: (key: string) => string;
}

const egxStocks = [
  { ticker: 'COMI', name: 'البنك التجاري الدولي' },
  { ticker: 'EAST', name: 'الشرقية - ايسترن كومباني' },
  { ticker: 'HRHO', name: 'السويدي اليكتريك' },
  { ticker: 'TMGH', name: 'مجموعة طلعت مصطفى القابضة' },
  { ticker: 'FWRY', name: 'فوري لتكنولوجيا البنوك والمدفوعات الالكترونية' },
  { ticker: 'EKHO', name: 'اي اف چي القابضة' },
  { ticker: 'ABUK', name: 'أبو قير للأسمدة والصناعات الكيماوية' },
  { ticker: 'ORAS', name: 'أوراسكوم كونستراكشون بي ال سي' },
  { ticker: 'ESRS', name: 'حديد عز' },
  { ticker: 'MPRC', name: 'مدينة مصر' },
  { ticker: 'EGTS', name: 'المصرية للاتصالات' },
  { ticker: 'HELI', name: 'مصر الجديدة للاسكان والتعمير' },
  { ticker: 'CCAP', name: 'القلعة للاستشارات المالية' },
  { ticker: 'OCDI', name: 'أوراسكوم للاستثمار القابضة' },
  { ticker: 'PHDC', name: 'بالم هيلز للتعمير' },
  { ticker: 'JUFO', name: 'جهينة للصناعات الغذائية' },
  { ticker: 'SKPC', name: 'سيدي كرير للبتروكيماويات - سيدبك' },
  { ticker: 'ISPH', name: 'ابن سينا فارما' },
  { ticker: 'RMDA', name: 'العاشر من رمضان للصناعات الدوائية والمستحضرات تشخيصية-راميدا' },
  { ticker: 'ADIB', name: 'مصرف أبوظبي الإسلامي - مصر' },
];

const AddTradeForm: React.FC<AddTradeFormProps> = ({ onAddTrade, historicalAssets, t }) => {
  const [assetName, setAssetName] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [tradeValue, setTradeValue] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleAssetNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAssetName(e.target.value);
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  const handleSelectStock = (stock: { ticker: string; name: string }) => {
    setAssetName(stock.ticker);
    setIsDropdownOpen(false);
  };

  const filteredStocks = useMemo(() => {
    const combinedStocks = [...egxStocks];
    const existingTickers = new Set(egxStocks.map(s => s.ticker.toUpperCase()));

    historicalAssets.forEach(ticker => {
      const upperTicker = ticker.toUpperCase();
      if (!existingTickers.has(upperTicker)) {
        combinedStocks.push({ ticker, name: t('previouslyTradedStock') });
        existingTickers.add(upperTicker);
      }
    });

    if (!assetName.trim()) {
      return combinedStocks;
    }

    const searchLower = assetName.toLowerCase();
    return combinedStocks.filter(stock =>
      stock.ticker.toLowerCase().includes(searchLower) ||
      stock.name.toLowerCase().includes(searchLower)
    );
  }, [assetName, historicalAssets, t]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      assetName: assetName.toUpperCase(), 
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
        <div className="relative" ref={dropdownRef}>
          <label htmlFor="assetName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('assetNameLabel')}</label>
          <input
            type="text"
            id="assetName"
            value={assetName}
            onChange={handleAssetNameChange}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-cyan-500 outline-none transition"
            placeholder={t('assetNamePlaceholder')}
            required
            autoComplete="off"
          />
          {isDropdownOpen && filteredStocks.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-200 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <ul className="py-1">
                {filteredStocks.map(stock => (
                  <li
                    key={stock.ticker}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectStock(stock);
                    }}
                    className="px-3 py-2 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 mr-3 rtl:mr-0 rtl:ml-3 rounded-full bg-gray-500 dark:bg-gray-600 text-white font-bold text-sm flex-shrink-0">
                        {stock.ticker.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{stock.ticker}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
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