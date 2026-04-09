import { Target, Plus, TrendingUp, Calendar } from 'lucide-react';
import { SavingsGoal } from '../types';
import { cn } from '../lib/utils';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onUpdate: (id: string, amount: number) => void;
}

export default function SavingsGoals({ goals, onUpdate }: SavingsGoalsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Savings Goals</h2>
        <button className="p-2 bg-black text-white rounded-full">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const remaining = goal.targetAmount - goal.currentAmount;
          
          return (
            <div key={goal.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{goal.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      <span>Until {goal.deadline}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
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

              <div className="mt-6 flex gap-2">
                <button 
                  onClick={() => onUpdate(goal.id, 500)}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xs font-bold transition-colors"
                >
                  Add ₹500
                </button>
                <button 
                  onClick={() => onUpdate(goal.id, 1000)}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xs font-bold transition-colors"
                >
                  Add ₹1000
                </button>
                <button className="p-3 bg-black text-white rounded-2xl">
                  <TrendingUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivation Card */}
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
        <h4 className="font-bold mb-1">Keep it up!</h4>
        <p className="text-sm text-indigo-100 leading-relaxed">
          You've saved ₹2,050 this year. You're on track to reach your emergency fund goal by December.
        </p>
      </div>
    </div>
  );
}
