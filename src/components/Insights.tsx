import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, BrainCircuit, TrendingUp, TrendingDown, Flame, Trophy, Calendar, Target, AlertCircle } from 'lucide-react';
import { Expense, Income, Budget, UserStats, SpendingPrediction } from '../types';
import { getFinancialAdvice, getSpendingPrediction } from '../services/geminiService';
import { cn } from '../lib/utils';

interface InsightsProps {
  expenses: Expense[];
  income: Income[];
  budget: Budget;
  userStats: UserStats;
}

export default function Insights({ expenses, income, budget, userStats }: InsightsProps) {
  const [advice, setAdvice] = useState<string>('');
  const [prediction, setPrediction] = useState<SpendingPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setIsPredicting(true);
    
    try {
      const [adviceResult, predictionResult] = await Promise.all([
        getFinancialAdvice(expenses, income, budget),
        getSpendingPrediction(expenses, budget)
      ]);
      setAdvice(adviceResult);
      setPrediction(predictionResult);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setIsLoading(false);
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    if (expenses.length > 0 || income.length > 0) {
      fetchData();
    }
  }, []);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const netFlow = totalIncome - totalSpent;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">AI Insights</h2>
        <button 
          onClick={fetchData}
          disabled={isLoading}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        </button>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-3">
            <Flame className={cn("w-6 h-6", userStats.currentStreak > 0 ? "text-orange-500 fill-orange-500" : "text-gray-300")} />
          </div>
          <p className="text-2xl font-black text-gray-900">{userStats.currentStreak}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Day Streak</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center mb-3">
            <Trophy className={cn("w-6 h-6", userStats.badges.length > 0 ? "text-yellow-500" : "text-gray-300")} />
          </div>
          <p className="text-2xl font-black text-gray-900">{userStats.badges.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Badges Won</p>
        </div>
      </div>

      {/* AI Spending Prediction */}
      <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold">Monthly Forecast</h3>
            <p className="text-xs text-gray-500">AI Prediction for end of month</p>
          </div>
        </div>

        {isPredicting ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-2" />
            <p className="text-xs text-gray-400">Calculating forecast...</p>
          </div>
        ) : prediction ? (
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Predicted Total</p>
                <p className={cn("text-3xl font-black", prediction.isOverBudget ? "text-red-600" : "text-green-600")}>
                  ₹{prediction.forecastedTotal.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Confidence</p>
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-1 h-3 rounded-full", 
                          i <= prediction.confidence ? "bg-purple-500" : "bg-gray-100"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-2xl flex gap-3",
              prediction.isOverBudget ? "bg-red-50" : "bg-green-50"
            )}>
              {prediction.isOverBudget ? (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              ) : (
                <Target className="w-5 h-5 text-green-600 shrink-0" />
              )}
              <p className={cn(
                "text-xs font-medium leading-relaxed",
                prediction.isOverBudget ? "text-red-900" : "text-green-900"
              )}>
                {prediction.recommendation}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Add more expenses to see your forecast.</p>
        )}
      </div>

      {/* AI Coach Card */}
      <div className="bg-black text-white rounded-[40px] p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BrainCircuit className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl tracking-tight">Financial Coach</h3>
                <p className="text-xs text-indigo-300 font-medium">AI Spending Analysis</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Strict Mode</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-indigo-200 animate-pulse font-medium">Scanning for useless spending...</p>
            </div>
          ) : advice ? (
            <div className="space-y-6">
              <div className="text-sm leading-relaxed text-indigo-50 whitespace-pre-line font-medium">
                {advice}
              </div>
              <div className="pt-4 border-t border-white/10">
                <button 
                  onClick={fetchData}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  Refresh Analysis <Sparkles className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-indigo-200 mb-6">Let AI analyze your habits to find hidden savings.</p>
              <button 
                onClick={fetchData}
                className="w-full py-4 bg-indigo-600 rounded-2xl text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
              >
                Start Analysis
              </button>
            </div>
          )}
        </div>

        {/* Decorative background elements */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
      </div>

      {/* Savings Focus Tip */}
      <div className="bg-green-50 border border-green-100 rounded-[32px] p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-green-600" />
          </div>
          <h4 className="text-sm font-bold text-green-900">Savings Strategy</h4>
        </div>
        <p className="text-sm text-green-800 leading-relaxed font-medium">
          To reach your goals faster, aim to keep "Lifestyle" spending (Eating Out, Movies, Misc) below 15% of your total income. Every rupee saved today is a step closer to your Ladakh trip!
        </p>
      </div>
    </div>
  );
}
