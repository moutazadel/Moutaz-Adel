import React, { useState, useEffect } from 'react';
import type { Trade } from '../types';
import { GoogleGenAI } from '@google/genai';
import { SparklesIcon } from './Icons';

interface TradeAnalyzerModalProps {
  trade: Trade;
  onCancel: () => void;
  t: (key: string) => string;
}

const TradeAnalyzerModal: React.FC<TradeAnalyzerModalProps> = ({ trade, onCancel, t }) => {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError('');
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        const pnlStatus = trade.pnl > 0 ? 'profit' : (trade.pnl < 0 ? 'loss' : 'breakeven');
        const pnlValue = Math.abs(trade.pnl).toFixed(2);
        const tradeDuration = (trade.closeDate && trade.openDate) ? ((trade.closeDate - trade.openDate) / (1000 * 60 * 60 * 24)).toFixed(1) : 'N/A';

        const prompt = `You are an expert trading analyst providing feedback to a new trader.
        Analyze the following closed trade and provide concise, actionable advice.
        Structure your response with a title, a brief summary, and 2-3 bullet points for improvement.
        Keep the language simple and encouraging.

        Trade Details:
        - Asset: ${trade.assetName}
        - Status: Closed with a ${pnlStatus} of ${pnlValue}
        - Entry Price: ${trade.entryPrice}
        - Initial Trade Value: ${trade.tradeValue}
        - Take Profit Price Target: ${trade.takeProfitPrice}
        - Stop Loss Price Target: ${trade.stopLossPrice}
        - Trade Duration (days): ${trade.openDate && trade.closeDate ? tradeDuration : 'N/A'}
        - Trader's Notes: ${trade.notes || 'No notes provided.'}

        Please provide your analysis now.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        setAnalysis(response.text);
      } catch (err) {
        console.error("Error fetching AI analysis:", err);
        setError(t('aiAnalysisError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [trade, t]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-gray-200 dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-full">
                 <SparklesIcon />
            </div>
            <div>
                <h3 className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{t('aiAnalysisTitle')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('aiAnalysisForTrade').replace('{assetName}', trade.assetName)}</p>
            </div>
        </div>

        <div className="overflow-y-auto flex-grow pr-2">
            {isLoading && (
                 <div className="flex flex-col items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('aiAnalysisLoading')}</p>
                </div>
            )}
            {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
            {!isLoading && !error && (
                 <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                     {analysis}
                </div>
            )}
        </div>
        
        <div className="mt-6 text-left">
          <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-md transition">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeAnalyzerModal;
