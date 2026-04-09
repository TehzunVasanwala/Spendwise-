import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Category, Expense, Income } from '../types';
import { categorizeExpense } from '../services/geminiService';
import { cn } from '../lib/utils';

interface AddTransactionProps {
  onClose: () => void;
  onAdd: (data: any) => void;
  categories: string[];
}

export default function AddTransaction({ onClose, onAdd, categories }: AddTransactionProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [isCategorizing, setIsCategorizing] = useState(false);

  const handleAutoCategorize = async () => {
    if (!description || type === 'income' || categories.length === 0) return;
    setIsCategorizing(true);
    const suggestedCategory = await categorizeExpense(description, categories);
    setCategory(suggestedCategory);
    setIsCategorizing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || (type === 'expense' && !category)) return;
    onAdd({
      type,
      amount: parseFloat(amount),
      description,
      category: type === 'expense' ? category : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight">Add Transaction</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
            <button 
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                type === 'expense' ? "bg-white text-black shadow-sm" : "text-gray-500"
              )}
            >
              <TrendingDown className="w-4 h-4" />
              Expense
            </button>
            <button 
              onClick={() => setType('income')}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                type === 'income' ? "bg-white text-black shadow-sm" : "text-gray-500"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Income
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-10 pr-4 text-2xl font-bold focus:ring-2 focus:ring-black transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">Description</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleAutoCategorize}
                  placeholder={type === 'expense' ? "What did you buy?" : "Where is this from?"}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all pr-12"
                  required
                />
                {type === 'expense' && (
                  <button 
                    type="button"
                    onClick={handleAutoCategorize}
                    disabled={isCategorizing || !description}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isCategorizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>

            {type === 'expense' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                        category === cat 
                          ? "bg-black text-white border-black" 
                          : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm shadow-lg shadow-black/10 active:scale-[0.98] transition-all mt-4"
            >
              Save {type === 'expense' ? 'Expense' : 'Income'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
