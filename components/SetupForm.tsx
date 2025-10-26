import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';

interface SetupFormProps {
  onSetup: (portfolioName: string, initialCapital: number, targetAmount: number, currency: string) => void;
  t: (key: string) => string;
}

const SetupForm: React.FC<SetupFormProps> = ({ onSetup, t }) => {
  const [portfolioName, setPortfolioName] = useState('');
  const [initialCapital, setInitialCapital] = useState('');
  const [target, setTarget] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const capitalNum = parseFloat(initialCapital);
    const targetNum = parseFloat(target);

    if (!portfolioName.trim()) {
        setError(t('portfolioNameError'));
        return;
    }
    if (isNaN(capitalNum) || isNaN(targetNum) || capitalNum <= 0 || targetNum <= 0) {
      setError(t('setupErrorPositive'));
      return;
    }
    if (targetNum <= capitalNum) {
      setError(t('setupErrorTargetGreater'));
      return;
    }
    
    setError('');
    setIsConfirmOpen(true);
  };

  const handleConfirmSetup = () => {
    onSetup(portfolioName, parseFloat(initialCapital), parseFloat(target), currency);
  };

  return (
    <>
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl shadow-cyan-500/10 animate-fade-in">
        <h2 className="text-2xl font-bold text-center mb-6 text-cyan-600 dark:text-cyan-400">{t('setupTitle')}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
            <label htmlFor="portfolioName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('portfolioNameLabel')}
            </label>
            <input
              type="text"
              id="portfolioName"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
              placeholder={t('portfolioNamePlaceholder')}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="initialCapital" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('initialCapitalLabel')}
              </label>
              <input
                type="number"
                id="initialCapital"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                placeholder={t('initialCapitalPlaceholder')}
                required
              />
            </div>
            <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('currencyLabel')}
                </label>
                <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                >
                    <option value="EGP">EGP</option>
                    <option value="USD">USD</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                    <option value="EUR">EUR</option>
                </select>
            </div>
          </div>
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('firstTargetLabel')}
            </label>
            <input
              type="number"
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
              placeholder={t('targetPlaceholder')}
              required
            />
          </div>
          {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            {t('startButton')}
          </button>
        </form>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSetup}
        title={t('confirmSetupTitle')}
        message={
          <p>
            {t('confirmSetupMessage')
                .replace('{capital}', new Intl.NumberFormat().format(parseFloat(initialCapital || '0')))
                .replace('{target}', new Intl.NumberFormat().format(parseFloat(target || '0')))
            }
          </p>
        }
        confirmText={t('confirmSetupButton')}
        t={t}
      />
    </>
  );
};

export default SetupForm;