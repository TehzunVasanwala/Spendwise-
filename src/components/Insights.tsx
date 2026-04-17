import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, BrainCircuit, TrendingUp, TrendingDown, Flame, Trophy, Calendar, Target, AlertCircle, ArrowRight } from 'lucide-react';
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
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchData = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsPredicting(true);
    
    try {
      const [insightsResult, predictionResult] = await Promise.all([
        getFinancialAdvice(expenses, income, budget),
        getSpendingPrediction(expenses, budget)
      ]);
      setInsights(insightsResult);
      setPrediction(predictionResult);
      setHasInitialized(true);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setIsLoading(false);
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    // Auto-fetch when data is available and we haven't checked yet
    const hasData = expenses.length > 5; // Require some minimal history
    if (hasData && !hasInitialized && !isLoading) {
      fetchData();
    }
  }, [expenses.length, hasInitialized]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const netFlow = totalIncome - totalSpent;

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-brand-black">Intelligence</h2>
          <p className="text-[10px] text-brand-gray-muted font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-brand-accent animate-pulse" />
            Gemini 3.0 Analysis
          </p>
        </div>
        <button 
          onClick={fetchData}
          disabled={isLoading}
          className={cn(
            "w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-500",
            isLoading ? "bg-brand-gray-light text-brand-black" : "bg-brand-black text-white hover:scale-110 active:scale-95"
          )}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        </button>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="neo-card p-6 rounded-4xl flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-brand-gray-light rounded-2xl flex items-center justify-center mb-4">
            <Flame className={cn("w-7 h-7 transition-all duration-500", userStats.currentStreak > 0 ? "text-orange-500 fill-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]" : "text-brand-gray-muted/30")} />
          </div>
          <p className="text-3xl font-display font-bold text-brand-black">{userStats.currentStreak}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-muted mt-1">Day Streak</p>
        </div>
        <div className="neo-card p-6 rounded-4xl flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-brand-gray-light rounded-2xl flex items-center justify-center mb-4">
            <Trophy className={cn("w-7 h-7 transition-all duration-500", userStats.badges.length > 0 ? "text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]" : "text-brand-gray-muted/30")} />
          </div>
          <p className="text-3xl font-display font-bold text-brand-black">{userStats.badges.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-muted mt-1">Milestones</p>
        </div>
      </div>

      {/* AI Spending Prediction */}
      <div className="bg-brand-black text-white rounded-4xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
              <Calendar className="w-6 h-6 text-brand-accent" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl tracking-tight">AI Forecast</h3>
              <p className="text-[10px] text-brand-gray-muted font-bold uppercase tracking-[0.2em] mt-0.5">End of cycle</p>
            </div>
          </div>

          {isPredicting ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-brand-accent animate-spin mb-6" />
              <p className="text-[10px] text-brand-gray-muted font-black uppercase tracking-[0.3em] animate-pulse">Running Neural Forecast</p>
            </div>
          ) : prediction ? (
            <div className="space-y-12">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-brand-gray-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-3 px-1">Projected Total Output</p>
                  <p className={cn("text-6xl font-display font-bold tracking-tighter leading-none mb-1", prediction.isOverBudget ? "text-red-400" : "text-brand-accent shadow-glow")}>
                    ₹{prediction.forecastedTotal.toLocaleString('en-IN')}
                  </p>
                  {prediction.isOverBudget && (
                    <div className="flex items-center gap-1.5 px-1">
                      <TrendingUp className="w-3 h-3 text-red-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Exceeding Budgeted Limit</span>
                    </div>
                  )}
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-brand-gray-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-4 px-1">Confidence Model</p>
                  <div className="flex gap-1.5 h-12 items-end">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: i <= prediction.confidence * 5 ? `${20 + i * 15}%` : '10%' }}
                        key={i} 
                        className={cn(
                          "w-2 rounded-full transition-all duration-1000", 
                          i <= prediction.confidence * 5 ? "bg-brand-accent shadow-glow" : "bg-white/5"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={cn(
                "p-8 rounded-[32px] border backdrop-blur-3xl transition-all duration-700",
                prediction.isOverBudget ? "bg-red-500/10 border-red-500/20 shadow-[0_20px_50px_rgba(239,68,68,0.1)]" : "bg-white/5 border-white/10 shadow-[0_20px_50px_rgba(255,255,255,0.05)]"
              )}>
                <div className="flex gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                    prediction.isOverBudget ? "bg-red-500/20" : "bg-brand-accent/20"
                  )}>
                    {prediction.isOverBudget ? (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    ) : (
                      <Target className="w-6 h-6 text-brand-accent shadow-glow" />
                    )}
                  </div>
                  <p className={cn(
                    "text-[13px] font-semibold leading-relaxed",
                    prediction.isOverBudget ? "text-red-100" : "text-brand-gray-light"
                  )}>
                    {prediction.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-4">
              <Sparkles className="w-8 h-8 text-white/10" />
              <p className="text-[10px] text-brand-gray-muted font-bold uppercase tracking-[0.3em]">Accumulating Transaction Context</p>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[100px] -mr-64 -mt-64 group-hover:bg-brand-accent/20 transition-all duration-1000" />
      </div>

      {/* Structured AI Insights */}
      <div className="space-y-6 relative">
        <div className="flex items-center gap-3 px-2 mb-8">
          <BrainCircuit className="w-5 h-5 text-brand-black" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-black">Analysis Stream</h3>
        </div>

        {/* Vertical Stream Line */}
        {insights.length > 0 && !isLoading && (
          <div className="absolute left-[59px] top-24 bottom-10 w-0.5 bg-gradient-to-b from-brand-gray-light via-brand-gray-light to-transparent hidden md:block" />
        )}
        
        <div className="space-y-8 pl-0 md:pl-2">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="neo-card p-8 rounded-4xl bg-brand-gray-light/30 border-none">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-brand-gray-light rounded-2xl animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-brand-gray-light rounded-md w-1/3 animate-pulse" />
                      <div className="h-2 bg-brand-gray-light rounded-md w-1/4 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-brand-gray-light rounded-md w-full animate-pulse" />
                    <div className="h-3 bg-brand-gray-light rounded-md w-5/6 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : insights.length > 0 ? (
            insights.map((insight, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: 'spring', damping: 25 }}
                key={idx}
                className="neo-card p-10 rounded-[40px] group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative bg-white border border-brand-gray-light"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-105",
                        insight.type === 'anomaly' ? "bg-red-50 text-red-600 shadow-red-100/30" :
                        insight.type === 'warning' ? "bg-orange-50 text-orange-600 shadow-orange-100/30" :
                        insight.type === 'saving' ? "bg-green-50 text-green-600 shadow-green-100/30" :
                        "bg-brand-accent/5 text-brand-accent shadow-brand-accent/10"
                      )}>
                        {insight.type === 'anomaly' ? <AlertCircle className="w-8 h-8" /> :
                         insight.type === 'warning' ? <TrendingDown className="w-8 h-8" /> :
                         insight.type === 'saving' ? <TrendingUp className="w-8 h-8" /> :
                         <Sparkles className="w-8 h-8" />}
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-xl text-brand-black tracking-tight leading-none mb-3">{insight.title}</h4>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                            insight.type === 'anomaly' ? "bg-red-500 text-white" :
                            insight.type === 'warning' ? "bg-orange-500 text-white" :
                            insight.type === 'saving' ? "bg-green-500 text-white" :
                            "bg-brand-black text-white"
                          )}>
                            {insight.type}
                          </span>
                          {insight.impact && (
                            <span className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-widest border-l border-brand-gray-light pl-4">
                              {insight.impact}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[14px] text-brand-gray-muted font-medium leading-relaxed mb-10 pl-1">
                    {insight.description}
                  </p>

                  {insight.action && (
                    <button className="flex items-center justify-center gap-3 w-full py-5 bg-brand-gray-light hover:bg-brand-black hover:text-white rounded-[24px] text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 group/btn overflow-hidden relative">
                      <span className="relative z-10">{insight.action}</span>
                      <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </button>
                  )}
                </div>
                {/* Connector Node */}
                <div className="absolute left-[34px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white bg-brand-gray-light hidden md:block z-20 group-hover:bg-brand-accent transition-colors" />
              </motion.div>
            ))
          ) : (
            <div className="neo-card rounded-4xl p-20 text-center flex flex-col items-center gap-8 bg-transparent border-2 border-dashed border-brand-gray-light/50">
              <div className="w-24 h-24 bg-brand-gray-light/50 rounded-[40px] flex items-center justify-center relative">
                <BrainCircuit className="w-12 h-12 text-brand-gray-muted/20" />
                <div className="absolute inset-0 bg-brand-accent/5 rounded-[40px] animate-pulse" />
              </div>
              <div className="space-y-3">
                <h4 className="font-display font-bold text-xl text-brand-black tracking-tight">Intelligence Engine Standby</h4>
                <p className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.3em] max-w-[240px] leading-loose mx-auto">
                  Populate your ledger to generate a live analysis stream.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
