import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, BrainCircuit, TrendingUp, TrendingDown } from 'lucide-react';
import { Expense, Income, Budget } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

interface InsightsProps {
  expenses: Expense[];
  income: Income[];
  budget: Budget;
}

export default function Insights({ expenses, income, budget }: InsightsProps) {
  const [advice, setAdvice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdvice = async () => {
    setIsLoading(true);
    const result = await getFinancialAdvice(expenses, income, budget);
    setAdvice(result);
    setIsLoading(false);
  };

  useEffect(() => {
    if (expenses.length > 0 || income.length > 0) {
      fetchAdvice();
    }
  }, []);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const netFlow = totalIncome - totalSpent;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">AI Insights</h2>
        <button 
          onClick={fetchAdvice}
          disabled={isLoading}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Net Flow</span>
          </div>
          <p className={`text-lg font-black ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netFlow >= 0 ? '+' : ''}₹{netFlow.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Savings Rate</span>
          </div>
          <p className="text-lg font-black text-indigo-600">
            {totalIncome > 0 ? ((netFlow / totalIncome) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      {/* AI Coach Card */}
      <div className="bg-black text-white rounded-[32px] p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Financial Coach</h3>
              <p className="text-xs text-indigo-300">Powered by Gemini AI</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-indigo-200 animate-pulse">Analyzing your spending habits...</p>
            </div>
          ) : advice ? (
            <div className="space-y-4">
              <div className="text-sm leading-relaxed text-indigo-50 whitespace-pre-line">
                {advice}
              </div>
              <button 
                onClick={fetchAdvice}
                className="text-xs font-bold text-indigo-400 hover:text-white transition-colors flex items-center gap-1"
              >
                Refresh Advice <TrendingUp className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-indigo-200 mb-4">Start tracking your expenses to get personalized financial advice.</p>
              <button 
                onClick={fetchAdvice}
                className="px-6 py-3 bg-indigo-600 rounded-2xl text-xs font-bold hover:bg-indigo-500 transition-colors"
              >
                Get Initial Advice
              </button>
            </div>
          )}
        </div>

        {/* Decorative background elements */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Tip of the day */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Pro Tip</h4>
        <p className="text-sm text-indigo-900 leading-relaxed">
          The 50/30/20 rule suggests spending 50% on needs, 30% on wants, and 20% on savings. Check your category breakdown to see how you compare!
        </p>
      </div>
    </div>
  );
}
