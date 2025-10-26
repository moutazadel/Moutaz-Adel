import React, { useState, useEffect } from 'react';
import type { Target } from '../types';
import { TrashIcon } from './Icons';
import ConfirmModal from './ConfirmModal';

interface ManageTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTargets: Target[];
  onSave: (newTargets: Target[]) => void;
  t: (key: string) => string;
}

const ManageTargetsModal: React.FC<ManageTargetsModalProps> = ({ isOpen, onClose, currentTargets, onSave, t }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentTargets.length > 0) {
        setTargets(JSON.parse(JSON.stringify(currentTargets)).sort((a: Target, b: Target) => a.amount - b.amount));
      } else {
        setTargets([{ id: Date.now().toString(), name: t('initialTargetName'), amount: 1000 }]);
      }
    }
  }, [isOpen, currentTargets, t]);

  if (!isOpen) {
    return null;
  }

  const handleUpdate = (id: string, field: 'name' | 'amount', value: string | number) => {
    setTargets(prev => prev.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleAmountBlur = () => {
    setTargets(prev => [...prev].sort((a, b) => a.amount - b.amount));
  };
  
  const handleAdd = () => {
    const highestAmount = targets.reduce((max, t) => Math.max(max, t.amount), 0);
    const newTarget: Target = {
      id: Date.now().toString(),
      name: `${t('target')} ${targets.length + 1}`,
      amount: highestAmount > 0 ? Math.ceil((highestAmount * 1.25) / 1000) * 1000 : 1000,
    };
    setTargets(prev => [...prev, newTarget].sort((a, b) => a.amount - b.amount));
  };

  const handleDelete = (id: string) => {
    if (targets.length <= 1) return;
    setTargets(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveAttempt = () => {
    const validTargets = targets.filter(t => t.name.trim() && t.amount > 0);
    if (validTargets.length === 0) {
      onClose(); return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    const validTargets = targets.filter(t => t.name.trim() && t.amount > 0);
    onSave(validTargets);
    setIsConfirmOpen(false);
    onClose();
  };

  const sortedTargets = [...targets].sort((a,b) => a.amount - b.amount);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-200 dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-gray-300 dark:border-gray-700">
             <h3 className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{t('manageTargetsTitle')}</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('manageTargetsDescription')}</p>
          </div>
          
          <div className="space-y-4 overflow-y-auto p-6 flex-grow">
            {sortedTargets.map((target, index) => (
              <div key={target.id} className="flex items-start gap-4 p-4 bg-gray-100 dark:bg-gray-900/40 rounded-lg transition-all duration-300">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 font-bold text-sm mt-5">
                  {index + 1}
                </div>
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-5 gap-3 items-start">
                    <div className="sm:col-span-3">
                        <label htmlFor={`target-name-${target.id}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('targetNameLabel')}</label>
                        <input
                            type="text"
                            id={`target-name-${target.id}`}
                            value={target.name}
                            onChange={(e) => handleUpdate(target.id, 'name', e.target.value)}
                            placeholder={t('targetNamePlaceholder')}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor={`target-amount-${target.id}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('targetAmountLabel')}</label>
                        <input
                            type="number"
                            id={`target-amount-${target.id}`}
                            value={target.amount}
                            onChange={(e) => handleUpdate(target.id, 'amount', parseFloat(e.target.value) || 0)}
                            onBlur={handleAmountBlur}
                            placeholder={t('targetAmountPlaceholder')}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition"
                        />
                    </div>
                </div>
                <button
                  onClick={() => handleDelete(target.id)}
                  disabled={targets.length <= 1}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition self-center mt-3"
                  aria-label={t('deleteTarget')}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
            <button
                onClick={handleAdd}
                className="w-full mt-2 text-sm bg-gray-300 hover:bg-gray-400/80 dark:bg-gray-700/60 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-md transition border border-dashed border-gray-400 dark:border-gray-600"
            >
                {t('addNewTarget')}
            </button>
          </div>

          <div className="flex gap-4 p-6 bg-gray-200/50 dark:bg-gray-900/30 border-t border-gray-300 dark:border-gray-700">
            <button type="button" onClick={onClose} className="w-full bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-md transition">
              {t('cancel')}
            </button>
            <button type="button" onClick={handleSaveAttempt} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition">
              {t('saveChanges')}
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title={t('confirmTargetEditTitle')}
        message={<p>{t('confirmTargetEditMessage')}</p>}
        t={t}
      />
    </>
  );
};

export default ManageTargetsModal;