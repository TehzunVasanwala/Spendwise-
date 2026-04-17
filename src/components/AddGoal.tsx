import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Target, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

interface AddGoalProps {
  onClose: () => void;
  onAdd: (data: { name: string; targetAmount: number; currentAmount: number; deadline: string }) => void;
}

export default function AddGoal({ onClose, onAdd }: AddGoalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) return;
    onAdd({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline: new Date(deadline).toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-black/20 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-t-4xl sm:rounded-4xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8 px-1">
            <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-brand-black">Objective</h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-brand-gray-muted hover:text-brand-black transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-muted px-1">Objective Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray-muted transition-colors group-focus-within:text-brand-black">
                  <Target className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Portfolio expansion"
                  className="w-full bg-brand-gray-light border-none rounded-2xl py-4.5 pl-12 pr-4 text-sm font-semibold focus:ring-2 focus:ring-brand-black transition-all outline-none placeholder:text-brand-gray-muted/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-muted px-1">Target Capital</label>
              <div className="relative group">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-display font-bold text-brand-gray-muted transition-colors group-focus-within:text-brand-black">₹</span>
                <input 
                  type="number" 
                  inputMode="decimal"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent border-b-2 border-brand-gray-light py-5 pl-10 pr-4 text-4xl font-display font-bold focus:border-brand-black transition-all outline-none placeholder:text-brand-gray-light"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-muted px-1">Initial</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-muted font-bold text-xs">₹</span>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-brand-gray-light border-none rounded-2xl py-3.5 pl-7 pr-3 text-xs font-bold focus:ring-2 focus:ring-brand-black transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-muted px-1">Deadline</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-muted transition-colors group-focus-within:text-brand-black">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-brand-gray-light border-none rounded-2xl py-3.5 pl-9 pr-3 text-xs font-bold focus:ring-2 focus:ring-brand-black transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="btn-primary w-full mt-4"
            >
              Confirm Objective
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
