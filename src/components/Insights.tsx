import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, BrainCircuit, TrendingUp, TrendingDown, Flame, Trophy, Calendar, Target, AlertCircle } from 'lucide-react';
import { Expense, Income, Budget, UserStats, SpendingPrediction, FinancialInsight } from '../types';
import { getFinancialAdvice, getSpendingPrediction } from '../services/geminiService';
import { cn } from '../lib/utils';

interface InsightsProps {
  expenses: Expense[];
  income: Income[];
  budget: Budget;
  userStats: UserStats;
}

export default function Insights({ expenses, income, budget, userStats }: InsightsProps) {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [prediction, setPrediction] = useState<SpendingPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setIsPredicting(true);
    
    try {
      const [insightsResult, predictionResult] = await Promise.all([
        getFinancialAdvice(expenses, income, budget),
        getSpendingPrediction(expenses, budget)
      ]);
      setInsights(insightsResult);
      setPrediction(predictionResult);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setIsLoading(false);
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    // Only auto-fetch once when data becomes available to save API calls
    if ((expenses.length > 0 || income.length > 0) && insights.length === 0 && !prediction) {
      fetchData();
    }
  }, [expenses.length, income.length]);

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
          className="p-2 bg-black text-white rounded-full hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
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
      <div className="bg-black text-white rounded-[40px] p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Calendar className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-xl tracking-tight">Monthly Forecast</h3>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Powered by Gemini</p>
            </div>
          </div>

          {isPredicting ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-xs text-white/40 font-bold uppercase tracking-widest animate-pulse">Scanning Habits...</p>
            </div>
          ) : prediction ? (
            <div className="space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Predicted Total</p>
                  <p className={cn("text-4xl font-black tracking-tight", prediction.isOverBudget ? "text-red-400" : "text-green-400")}>
                    ₹{prediction.forecastedTotal.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Confidence</p>
                  <div className="flex gap-1 justify-end">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-1.5 h-4 rounded-full transition-all duration-500", 
                          i <= prediction.confidence * 5 ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-white/10"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={cn(
                "p-6 rounded-[24px] border border-white/5 backdrop-blur-md",
                prediction.isOverBudget ? "bg-red-500/10" : "bg-green-500/10"
              )}>
                <div className="flex gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    prediction.isOverBudget ? "bg-red-500/20" : "bg-green-500/20"
                  )}>
                    {prediction.isOverBudget ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Target className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <p className={cn(
                    "text-sm font-medium leading-relaxed",
                    prediction.isOverBudget ? "text-red-100" : "text-green-100"
                  )}>
                    {prediction.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-4">Add more expenses to see your AI forecast.</p>
          )}
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Structured AI Insights */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-2 flex items-center gap-2">
          <BrainCircuit className="w-3 h-3" /> Smart Analysis
        </h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-gray-50 h-32 rounded-[32px] animate-pulse" />
            ))}
          </div>
        ) : insights.length > 0 ? (
          insights.map((insight, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    insight.type === 'anomaly' ? "bg-red-50 text-red-600" :
                    insight.type === 'warning' ? "bg-orange-50 text-orange-600" :
                    insight.type === 'saving' ? "bg-green-50 text-green-600" :
                    "bg-blue-50 text-blue-600"
                  )}>
                    {insight.type === 'anomaly' ? <AlertCircle className="w-4 h-4" /> :
                     insight.type === 'warning' ? <TrendingDown className="w-4 h-4" /> :
                     insight.type === 'saving' ? < TrendingUp className="w-4 h-4" /> :
                     <Sparkles className="w-4 h-4" />}
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">{insight.title}</h4>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  {insight.description}
                </p>

                {insight.impact && (
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4 bg-indigo-50 w-fit px-3 py-1 rounded-full">
                    Impact: {insight.impact}
                  </div>
                )}

                {insight.action && (
                  <button className="w-full py-3 bg-gray-50 hover:bg-black hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                    {insight.action}
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-gray-50 rounded-[32px] p-8 text-center">
            <p className="text-sm text-gray-400">Analysis will appear as you spend more.</p>
          </div>
        )}
      </div>
    </div>
  );
}
