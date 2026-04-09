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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Savings Goals</h2>
        <button 
          onClick={onAddClick}
          className="p-2 bg-black text-white rounded-full hover:scale-110 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">No goals yet</h3>
            <p className="text-sm text-gray-500 mb-6">Start saving for something special!</p>
            <button 
              onClick={onAddClick}
              className="px-6 py-3 bg-black text-white rounded-2xl text-xs font-bold"
            >
              Create First Goal
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
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
          <h4 className="font-bold mb-1">Keep it up!</h4>
          <p className="text-sm text-indigo-100 leading-relaxed">
            You're making great progress towards your goals. Every small contribution counts!
          </p>
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
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group">
      <button 
        onClick={() => onDelete(goal.id)}
        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Target className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{goal.name}</h3>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              <Calendar className="w-3 h-3" />
              <span>Until {new Date(goal.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="text-right pr-8">
          <p className="text-lg font-black text-gray-900">₹{goal.currentAmount.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">of ₹{goal.targetAmount.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-indigo-600">{progress.toFixed(0)}% Complete</span>
          <span className="text-xs font-medium text-gray-500">₹{remaining.toLocaleString('en-IN')} to go</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex gap-2">
          <button 
            onClick={() => onUpdate(goal.id, 500)}
            className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xs font-bold transition-colors"
          >
            +₹500
          </button>
          <button 
            onClick={() => onUpdate(goal.id, 1000)}
            className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xs font-bold transition-colors"
          >
            +₹1000
          </button>
          <button 
            onClick={() => setShowBonus(!showBonus)}
            className={cn(
              "flex-1 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              showBonus ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
            )}
          >
            <Sparkles className="w-3 h-3" />
            Bonus
          </button>
        </div>

        {showBonus && (
          <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
              <input 
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="Enter bonus amount"
                className="w-full bg-gray-50 border-none rounded-xl py-2 pl-7 pr-3 text-xs font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                autoFocus
              />
            </div>
            <button 
              onClick={handleAddBonus}
              disabled={!bonusAmount}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
