import React, { useState } from 'react';
import { Target, Plus, TrendingUp, Calendar, Trash2, Sparkles } from 'lucide-react';
import { SavingsGoal } from '../types';
import { cn } from '../lib/utils';

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
          <div className="neo-card p-16 text-center border-2 border-dashed border-brand-gray-light bg-transparent flex flex-col items-center">
            <div className="w-20 h-20 bg-brand-gray-light rounded-3xl flex items-center justify-center mb-6">
              <Target className="w-10 h-10 text-brand-gray-muted/40" />
            </div>
            <h3 className="text-xl font-display font-bold text-brand-black mb-2">No Active Goals</h3>
            <p className="text-xs text-brand-gray-muted mb-8 max-w-[200px]">Define your financial milestones to start tracking progress.</p>
            <button 
              onClick={onAddClick}
              className="btn-primary px-8"
            >
              Initialize Goal
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
    <div className="neo-card p-8 rounded-4xl relative group overflow-hidden">
      <button 
        onClick={() => onDelete(goal.id)}
        className="absolute top-6 right-6 p-2 text-brand-gray-muted/20 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-gray-light rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500">
            <Target className="w-7 h-7 text-brand-black" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-brand-black tracking-tight">{goal.name}</h3>
            <div className="flex items-center gap-2 text-[10px] text-brand-gray-muted font-bold uppercase tracking-[0.2em] mt-1.5">
              <Calendar className="w-3 h-3" />
              <span>Due {new Date(goal.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between mb-2 px-1">
        <div>
          <p className="text-3xl font-display font-bold text-brand-black leading-none">
            ₹{goal.currentAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-brand-gray-muted font-bold uppercase tracking-[0.2em] mt-1.5">
            of ₹{goal.targetAmount.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-brand-black select-none">{progress.toFixed(0)}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-2.5 bg-brand-gray-light rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-brand-black rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-end px-1">
          <span className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.2em]">₹{remaining.toLocaleString('en-IN')} Remaining</span>
        </div>
      </div>

      <div className="mt-8 space-y-4 pt-4 border-t border-brand-gray-light/50">
        <div className="flex gap-3">
          <button 
            onClick={() => onUpdate(goal.id, 500)}
            className="flex-1 btn-secondary group/btn"
          >
            <span className="group-hover:scale-110 transition-transform">+₹500</span>
          </button>
          <button 
            onClick={() => onUpdate(goal.id, 1000)}
            className="flex-1 btn-secondary group/btn"
          >
            <span className="group-hover:scale-110 transition-transform">+₹1000</span>
          </button>
          <button 
            onClick={() => setShowBonus(!showBonus)}
            className={cn(
              "flex-1 py-4.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-sm border",
              showBonus 
                ? "bg-brand-black text-white border-brand-black shadow-lg" 
                : "bg-white text-brand-black border-brand-gray-light hover:border-brand-black"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>

        {showBonus && (
          <div className="flex gap-2 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray-muted text-xs font-bold transition-colors group-focus-within:text-brand-black">₹</span>
              <input 
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-brand-gray-light border-none rounded-2xl py-3.5 pl-8 pr-4 text-xs font-bold focus:ring-2 focus:ring-brand-black transition-all outline-none"
                autoFocus
              />
            </div>
            <button 
              onClick={handleAddBonus}
              disabled={!bonusAmount}
              className="px-6 py-3.5 bg-brand-black text-white rounded-2xl text-xs font-bold shadow-lg disabled:opacity-20 active:scale-95 transition-all"
            >
              Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
