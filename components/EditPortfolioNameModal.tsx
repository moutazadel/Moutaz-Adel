import React, { useState, useEffect } from 'react';

interface EditPortfolioNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
  t: (key: string) => string;
}

const EditPortfolioNameModal: React.FC<EditPortfolioNameModalProps> = ({ isOpen, onClose, currentName, onSave, t }) => {
  const [name, setName] = useState(currentName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setError('');
    }
  }, [isOpen, currentName]);

  if (!isOpen) {
    return null;
  }
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      setError(t('portfolioNameError'));
      return;
    }
    setError('');
    onSave(name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-200 dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4 text-cyan-600 dark:text-cyan-400">{t('editPortfolioNameTitle')}</h3>
        <form onSubmit={handleSave}>
          <div>
            <label htmlFor="portfolioName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('portfolioNameLabel')}
            </label>
            <input
              type="text"
              id="portfolioName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
              placeholder={t('portfolioNamePlaceholder')}
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
  );
};

export default EditPortfolioNameModal;
