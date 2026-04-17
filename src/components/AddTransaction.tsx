import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Loader2, TrendingUp, TrendingDown, Check, ArrowRight } from 'lucide-react';
import { Category, Expense, Income } from '../types';
import { categorizeExpense } from '../services/geminiService';
import { cn } from '../lib/utils';

interface AddTransactionProps {
  onClose: () => void;
  onAdd: (data: any) => void;
  categories: string[];
  isIslandMode?: boolean;
}

export default function AddTransaction({ onClose, onAdd, categories, isIslandMode = false }: AddTransactionProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category | ''>(categories[0] as Category || '');
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [step, setStep] = useState(1);
  const [isExpanding, setIsExpanding] = useState(true);

  React.useEffect(() => {
    if (isIslandMode) {
      const timer = setTimeout(() => setIsExpanding(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isIslandMode]);

  const handleAutoCategorize = async () => {
    if (!description || type === 'income' || categories.length === 0) return;
    setIsCategorizing(true);
    const suggestedCategory = await categorizeExpense(description, categories);
    setCategory(suggestedCategory);
    setIsCategorizing(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!amount || !description || (type === 'expense' && !category)) return;
    onAdd({
      type,
      amount: parseFloat(amount),
      description,
      category: type === 'expense' ? category : undefined
    });
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && amount) {
      setStep(2);
    } else if (step === 2) {
      handleSubmit();
    }
  };

  if (isIslandMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-start pt-4 sm:pt-12 overflow-hidden">
        <motion.div 
          layoutId="dynamic-island"
          initial={{ width: 120, height: 36, borderRadius: 100, y: 0 }}
          animate={isExpanding ? { 
            width: 120, 
            height: 36, 
            borderRadius: 100,
            y: 0
          } : { 
            width: '92%', 
            maxWidth: 400,
            height: step === 1 ? 320 : 580, 
            borderRadius: 48,
            y: 12
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            layout: { duration: 0.3 }
          }}
          className="bg-black shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/5 relative flex flex-col items-center p-8"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/30 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-full h-full flex flex-col justify-between">
            <motion.div 
              key={step}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1"
            >
              {step === 1 ? (
                <div className="space-y-6 text-center mt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <h2 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Quick Entry</h2>
                  </div>
                  
                  <div className="flex p-1 bg-white/5 rounded-2xl mb-4 max-w-[200px] mx-auto">
                    <button 
                      onClick={() => setType('expense')}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                        type === 'expense' ? "bg-white text-black" : "text-white/40"
                      )}
                    >
                      Expense
                    </button>
                    <button 
                      onClick={() => setType('income')}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                        type === 'income' ? "bg-white text-black" : "text-white/40"
                      )}
                    >
                      Income
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 text-3xl font-black">₹</span>
                    <input 
                      autoFocus
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border-none text-white text-6xl font-black focus:ring-0 text-center placeholder:text-white/5"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-8 mt-4">
                  {type === 'expense' && (
                    <div className="space-y-4">
                      <h2 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Category</h2>
                      <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategory(cat as Category)}
                            className={cn(
                              "py-3 px-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border",
                              category === cat 
                                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                                : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h2 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">
                      {type === 'expense' ? 'Note' : 'Source'}
                    </h2>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={type === 'expense' ? "What was this for?" : "Who sent this?"}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold focus:ring-1 focus:ring-white transition-all outline-none"
                      />
                      {type === 'expense' && (
                        <button 
                          onClick={handleAutoCategorize}
                          disabled={isCategorizing || !description}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"
                        >
                          {isCategorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <button 
              onClick={handleNext}
              disabled={step === 1 && !amount}
              className="w-full py-5 bg-white text-black rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-10 mt-6"
            >
              {step === 1 ? (
                <>Next <ArrowRight className="w-5 h-5" /></>
              ) : (
                <>Save <Check className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </motion.div>

        <div className="mt-8 flex gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", step === 1 ? "bg-white w-4" : "bg-white/20")} />
          <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", step === 2 ? "bg-white w-4" : "bg-white/20")} />
        </div>
      </div>
    );
  }

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
