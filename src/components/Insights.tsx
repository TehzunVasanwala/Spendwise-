import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, BrainCircuit, TrendingUp, TrendingDown, Flame, Trophy, Calendar, Target, AlertCircle, ArrowRight } from 'lucide-react';
import { Expense, Income, Budget, UserStats, SpendingPrediction, FinancialInsight } from '../types';
import { getFinancialAdvice, getSpendingPrediction } from '../services/geminiService';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface InsightsProps {
  expenses: Expense[];
  income: Income[];
  budget: Budget;
  userStats: UserStats;
  selectedDate: Date;
}

export default function Insights({ expenses, income, budget, userStats, selectedDate }: InsightsProps) {
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
        getFinancialAdvice(expenses, income, budget, selectedDate),
        getSpendingPrediction(expenses, budget, selectedDate)
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

  useEffect(() => { fetchData(); }, [selectedDate]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const netFlow = totalIncome - totalSpent;

  return (
    <div className="space-y-12 pb-40">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
           <h2 className="text-4xl font-display font-medium tracking-tight text-brand-black">Intelligence Terminal</h2>
           <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gray-muted opacity-60">Neural Engine v3.0</span>
             </div>
             <span className="text-[9px] font-black bg-brand-black text-white px-2.5 py-1 rounded-lg uppercase tracking-widest">{format(selectedDate, 'MMM yyyy')}</span>
           </div>
        </div>
        <button 
          onClick={fetchData}
          disabled={isLoading}
          className={cn(
            "w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center transition-all duration-500 border border-brand-gray-light",
            isLoading ? "opacity-50" : "hover:bg-brand-black hover:text-white hover:-translate-y-1 active:scale-90"
          )}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        </button>
      </div>

      {/* High-End Status Grid */}
      <div className="grid grid-cols-2 gap-6 px-1">
        <div className="glass-card flex flex-col items-center text-center !p-8 group">
          <div className="w-16 h-16 bg-brand-gray-light rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Flame className={cn("w-8 h-8 transition-all duration-700", userStats.currentStreak > 0 ? "text-orange-500 fill-orange-500 drop-shadow-2xl" : "text-brand-gray-muted/20")} />
          </div>
          <p className="text-4xl font-display font-medium text-brand-black tracking-tight">{userStats.currentStreak}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-muted mt-2 opacity-50">Active Streak</p>
        </div>
        <div className="glass-card flex flex-col items-center text-center !p-8 group">
          <div className="w-16 h-16 bg-brand-gray-light rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Trophy className={cn("w-8 h-8 transition-all duration-700", userStats.badges.length > 0 ? "text-indigo-600 drop-shadow-2xl" : "text-brand-gray-muted/20")} />
          </div>
          <p className="text-4xl font-display font-medium text-brand-black tracking-tight">{userStats.badges.length}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-muted mt-2 opacity-50">Milestone Vault</p>
        </div>
      </div>

      {/* AI Spending Projection */}
      <div className="bg-brand-black text-white rounded-[48px] p-10 sm:p-14 shadow-[0_48px_120px_rgba(0,0,0,0.4)] relative overflow-hidden group">
        <div className="relative z-10 space-y-12">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-2xl border border-white/10 shadow-inner">
              <Calendar className="w-7 h-7 text-brand-accent" />
            </div>
            <div>
              <h3 className="font-display font-medium text-2xl tracking-tight text-white/90">Predictive Modeling</h3>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-1.5">Full-Cycle Financial Projection</p>
            </div>
          </div>

          {isPredicting ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-14 h-14 text-brand-accent animate-spin mb-8" />
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em] animate-pulse">Running Monte Carlo Simulation...</p>
            </div>
          ) : prediction ? (
            <div className="space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
                <div>
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] mb-4 px-1">Projected Aggregate Output</p>
                  <p className={cn("text-6xl sm:text-8xl font-display font-medium tracking-tighter leading-none transition-all duration-700", prediction.isOverBudget ? "text-red-400" : "text-brand-accent")}>
                    ₹{prediction.forecastedTotal.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] mb-4 px-1">Confidence Rating</p>
                  <div className="flex gap-2 h-14 items-end">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: i <= prediction.confidence * 5 ? `${30 + i * 14}%` : '15%' }}
                        key={i} 
                        className={cn(
                          "w-2.5 rounded-full transition-all duration-1000", 
                          i <= prediction.confidence * 5 ? "bg-brand-accent shadow-[0_0_20px_rgba(242,125,38,0.4)]" : "bg-white/5"
                        )} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={cn(
                "p-10 rounded-[40px] border backdrop-blur-3xl transition-all duration-700 flex flex-col sm:flex-row gap-8 items-start sm:items-center",
                prediction.isOverBudget ? "bg-red-500/5 border-red-500/20" : "bg-white/5 border-white/10"
              )}>
                <div className={cn(
                   "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                   prediction.isOverBudget ? "bg-red-500/30 border-red-500/50" : "bg-brand-accent/20 border-brand-accent/30"
                )}>
                  {prediction.isOverBudget ? <AlertCircle className="w-6 h-6 text-red-300" /> : <Target className="w-6 h-6 text-brand-accent" />}
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-white/70 max-w-lg">
                   {prediction.recommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center gap-6">
              <Sparkles className="w-10 h-10 text-white/5" />
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">Aggregating Multi-Dimensional Data Context</p>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[140px] -mr-64 -mt-64" />
      </div>

      {/* Analysis Stream */}
      <div className="space-y-10">
        <div className="flex items-center gap-4 px-2">
           <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
           </div>
           <div>
              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-brand-black">Analysis Stream</h3>
              <p className="text-[10px] text-brand-gray-muted font-medium opacity-50">Real-time intelligent takeaways.</p>
           </div>
        </div>

        <div className="space-y-8">
          {isLoading ? (
            <div className="space-y-8">
              {[1, 2].map(i => (
                <div key={i} className="glass-card !p-12 space-y-8 animate-pulse">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-brand-gray-light rounded-3xl" />
                      <div className="space-y-3 flex-1">
                         <div className="h-4 bg-brand-gray-light rounded-md w-1/3" />
                         <div className="h-2 bg-brand-gray-light rounded-md w-1/4" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="h-3 bg-brand-gray-light rounded-md w-full" />
                      <div className="h-3 bg-brand-gray-light rounded-md w-5/6" />
                   </div>
                </div>
              ))}
            </div>
          ) : insights.length > 0 ? (
            insights.map((insight, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: 'spring', damping: 25 }}
                key={idx}
                className="glass-card !p-12 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-700 relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-10">
                   <div className={cn(
                     "w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-700 text-white",
                     insight.type === 'anomaly' ? "bg-red-500" :
                     insight.type === 'warning' ? "bg-orange-500" :
                     insight.type === 'saving' ? "bg-green-500" :
                     "bg-brand-black"
                   )}>
                     {insight.type === 'anomaly' ? <AlertCircle className="w-10 h-10" /> :
                      insight.type === 'warning' ? <TrendingDown className="w-10 h-10" /> :
                      insight.type === 'saving' ? <TrendingUp className="w-10 h-10" /> :
                      <BrainCircuit className="w-10 h-10" />}
                   </div>
                   
                   <div className="space-y-6 flex-1">
                      <div className="space-y-2">
                         <div className="flex flex-wrap items-center gap-3">
                            <h4 className="font-display font-medium text-2xl text-brand-black tracking-tight leading-none">{insight.title}</h4>
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                              insight.type === 'anomaly' ? "bg-red-50 text-red-600" :
                              insight.type === 'warning' ? "bg-orange-50 text-orange-600" :
                              insight.type === 'saving' ? "bg-green-50 text-green-600" :
                              "bg-brand-gray-light text-brand-gray-muted"
                            )}>
                              {insight.type}
                            </span>
                         </div>
                         {insight.impact && <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-muted opacity-60">{insight.impact}</p>}
                      </div>

                      <p className="text-base text-brand-black/70 font-medium leading-relaxed max-w-2xl">
                        {insight.description}
                      </p>

                      {insight.action && (
                        <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-brand-black group/link">
                           <span>Execute Action: {insight.action}</span>
                           <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-2" />
                        </button>
                      )}
                   </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="glass-card !p-20 text-center flex flex-col items-center gap-10">
              <div className="w-24 h-24 bg-brand-gray-light rounded-[40px] flex items-center justify-center relative overflow-hidden">
                <BrainCircuit className="w-10 h-10 text-brand-gray-muted/20" />
                <div className="absolute inset-0 bg-brand-accent/5 animate-pulse" />
              </div>
              <div className="space-y-4">
                <h4 className="font-display font-medium text-2xl text-brand-black tracking-tight uppercase tracking-widest">Awaiting Simulation Data</h4>
                <p className="text-sm text-brand-gray-muted font-medium max-w-xs mx-auto leading-relaxed">
                  The intelligence engine requires more transactional context to initialize a meaningful analysis stream.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
