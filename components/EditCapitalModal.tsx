import React, { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';

interface EditCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCapital: number;
  onSave: (newCapital: number) => void;
  t: (key: string) => string;
}

const EditCapitalModal: React.FC<EditCapitalModalProps> = ({ isOpen, onClose, currentCapital, onSave, t }) => {
  const [capital, setCapital] = useState(currentCapital.toString());
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCapital(currentCapital.toString());
      setError('');
    }
  }, [isOpen, currentCapital]);

  if (!isOpen) {
    return null;
  }
  
  const handleSaveAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    const capitalNum = parseFloat(capital);
    if (isNaN(capitalNum) || capitalNum <= 0) {
      setError(t('capitalError'));
      return;
    }
    setError('');
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    onSave(parseFloat(capital));
    setIsConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-200 dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-bold mb-4 text-cyan-600 dark:text-cyan-400">{t('editCapitalTitle')}</h3>
          <form onSubmit={handleSaveAttempt}>
            <div>
              <label htmlFor="initialCapital" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('initialCapitalLabel')}
              </label>
              <input
                type="number"
                id="initialCapital"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                placeholder={t('initialCapitalPlaceholder')}
                required
              />
            </div>
            {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
            <div className="flex gap-4 mt-6">
              <button type="button" onClick={onClose} className="w-full bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition">
                {t('cancel')}
              </button>
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition">
                {t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title={t('confirmCapitalEditTitle')}
        message={
          <>
            <p>{t('confirmCapitalEditMessage')}</p>
            <p className="font-bold mt-2">{t('confirmCapitalEditWarning')}</p>
          </>
        }
        t={t}
      />
    </>
  );
};

export default EditCapitalModal;