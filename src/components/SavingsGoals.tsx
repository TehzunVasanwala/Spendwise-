import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, TrendingUp, Calendar, Trash2, Sparkles } from 'lucide-react';
import { SavingsGoal } from '../types';
import { cn } from '../lib/utils';
import { sound } from '../services/soundService';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onUpdate: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
}

export default function SavingsGoals({ goals, onUpdate, onDelete, onAddClick }: SavingsGoalsProps) {
  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold tracking-tight text-brand-black">Objectives</h2>
        <button 
          onClick={onAddClick}
          className="w-10 h-10 bg-brand-black text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {goals.length === 0 ? (
          <div className="neo-card p-20 text-center border border-brand-gray-light bg-white/50 backdrop-blur-sm flex flex-col items-center rounded-[44px] shadow-sm">
            <div className="w-24 h-24 bg-brand-gray-light rounded-[36px] flex items-center justify-center mb-8 shadow-inner">
              <Target className="w-12 h-12 text-brand-gray-muted/30" />
            </div>
            <h3 className="text-2xl font-display font-bold text-brand-black mb-3">Vision Archive Empty</h3>
            <p className="text-[10px] font-bold text-brand-gray-muted mb-10 max-w-[220px] uppercase tracking-[0.2em] leading-relaxed">Initialize your financial blueprints to begin systematic capital accumulation.</p>
            <button 
              onClick={onAddClick}
              className="btn-primary py-5 px-10 rounded-[24px] shadow-xl"
            >
              Initialize Milestone
            </button>
          </div>
        ) : (
          goals.map((goal) => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onUpdate={onUpdate} 
              onDelete={onDelete} 
            />
          ))
        )}
      </div>

      {/* Motivation Card */}
      {goals.length > 0 && (
        <div className="bg-brand-black rounded-4xl p-8 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="font-display font-bold text-lg mb-2">Momentum is key.</h4>
            <p className="text-xs text-brand-gray-muted leading-relaxed max-w-[240px]">
              Consistency in your contributions accelerates your progress. You're building lasting financial health.
            </p>
          </div>
          <div className="absolute top-0 right-0 p-8 transform group-hover:scale-110 transition-transform duration-700">
            <TrendingUp className="w-12 h-12 text-brand-accent/20" />
          </div>
        </div>
      )}
    </div>
  );
}

interface GoalCardProps {
  goal: SavingsGoal;
  onUpdate: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
  key?: string;
}

function GoalCard({ goal, onUpdate, onDelete }: GoalCardProps) {
  const [showBonus, setShowBonus] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('');

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const handleAddBonus = () => {
    const amount = parseFloat(bonusAmount);
    if (!isNaN(amount) && amount > 0) {
      onUpdate(goal.id, amount);
      setBonusAmount('');
      setShowBonus(false);
    }
  };

  return (
    <div className="neo-card p-10 rounded-4xl relative group overflow-hidden bg-white">
      <button 
        onClick={() => onDelete(goal.id)}
        className="absolute top-8 right-8 p-3 text-brand-gray-muted/20 hover:text-red-500 hover:bg-red-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-90"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      <div className="flex items-start justify-between mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-gray-light rounded-[24px] flex items-center justify-center shadow-inner group-hover:bg-brand-black transition-colors duration-500 group/icon">
            <Target className="w-8 h-8 text-brand-black group-hover/icon:text-white transition-colors" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-brand-black tracking-tight">{goal.name}</h3>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-brand-accent py-1 px-2.5 bg-brand-accent/5 rounded-full">
                <TrendingUp className="w-2.5 h-2.5" />
                <span>Active Vault</span>
              </div>
              <span className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.1em] border-l border-brand-gray-light pl-3">
                Dec {new Date(goal.deadline).getDate()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-0">
        <div className="flex items-baseline justify-between mb-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-brand-gray-muted opacity-30">₹</span>
            <h4 className="text-5xl font-display font-bold text-brand-black tracking-tighter">
              {goal.currentAmount.toLocaleString('en-IN')}
            </h4>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-brand-gray-muted uppercase tracking-[0.3em] mb-1">Target</p>
            <p className="text-lg font-display font-bold text-brand-black tracking-tight">₹{goal.targetAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="relative pt-2">
          <div className="h-4 bg-brand-gray-light rounded-full overflow-hidden border border-brand-gray-light/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "h-full rounded-full shadow-[0_0_30px_rgba(0,0,0,0.1)]",
                progress >= 100 ? "bg-green-500 shadow-green-500/20" : "bg-brand-black"
              )}
            >
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-white/10" />
            </motion.div>
          </div>
          
          <div className="flex justify-between items-center mt-5 px-1">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", progress >= 100 ? "bg-green-500 animate-pulse" : "bg-brand-black")} />
              <span className="text-[11px] font-black text-brand-black uppercase tracking-[0.2em]">
                {progress.toFixed(0)}% Secured
              </span>
            </div>
            <span className="text-[11px] font-bold text-brand-gray-muted uppercase tracking-[0.2em]">
              ₹{remaining.toLocaleString('en-IN')} Left
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-5 pt-8 border-t border-brand-gray-light/50">
        <div className="flex gap-4">
          <button 
            onClick={() => {
              sound.playClick();
              onUpdate(goal.id, 500);
            }}
            className="flex-1 h-16 bg-brand-gray-light hover:bg-brand-black hover:text-white rounded-[24px] text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 group/btn shadow-sm active:scale-95"
          >
            <span className="group-hover/btn:scale-110 transition-transform inline-block">+ ₹500</span>
          </button>
          <button 
            onClick={() => {
              sound.playClick();
              onUpdate(goal.id, 1000);
            }}
            className="flex-1 h-16 bg-brand-gray-light hover:bg-brand-black hover:text-white rounded-[24px] text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 group/btn shadow-sm active:scale-95"
          >
            <span className="group-hover/btn:scale-110 transition-transform inline-block">+ ₹1.0K</span>
          </button>
          <button 
            onClick={() => {
              sound.playClick();
              setShowBonus(!showBonus);
            }}
            className={cn(
              "flex-1 h-16 rounded-[24px] text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-2 active:scale-95 shadow-sm border",
              showBonus 
                ? "bg-brand-black text-white border-brand-black shadow-lg" 
                : "bg-white text-brand-black border-brand-gray-light hover:border-brand-black"
            )}
          >
            <Sparkles className={cn("w-4 h-4", showBonus && "animate-spin")} />
            Inject
          </button>
        </div>

        <AnimatePresence>
          {showBonus && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex gap-3 overflow-hidden"
            >
              <div className="relative flex-1 group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gray-muted text-lg font-display font-bold transition-colors group-focus-within:text-brand-black">₹</span>
                <input 
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="Manual Override..."
                  className="w-full h-16 bg-brand-gray-light/50 border-none rounded-[24px] py-3.5 pl-12 pr-6 text-xl font-display font-bold focus:ring-2 focus:ring-brand-black transition-all outline-none placeholder:text-[10px] placeholder:font-sans placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                  autoFocus
                />
              </div>
              <button 
                onClick={handleAddBonus}
                disabled={!bonusAmount}
                className="px-10 h-16 bg-brand-black text-white rounded-[24px] text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl disabled:opacity-20 active:scale-95 transition-all"
              >
                Commit
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Visual background hint */}
      <div className={cn(
        "absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[80px] transition-all duration-1000",
        progress >= 100 ? "bg-green-500/10" : "bg-brand-accent/5 opacity-0 group-hover:opacity-100"
      )} />
    </div>
  );
}
