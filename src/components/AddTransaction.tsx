import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Loader2, TrendingUp, TrendingDown, Check, ArrowRight } from 'lucide-react';
import { Category, Expense, Income } from '../types';
import { categorizeExpense } from '../services/geminiService';
import { cn } from '../lib/utils';
import { CATEGORY_UI } from '../lib/constants';
import { sound } from '../services/soundService';

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
    sound.playClick();
    setIsCategorizing(true);
    const suggestedCategory = await categorizeExpense(description, categories);
    setCategory(suggestedCategory);
    setIsCategorizing(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = Math.abs(parseFloat(amount)); // Guarantee positive value
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      sound.playClick();
      return;
    }
    if (!description.trim()) return;
    if (type === 'expense' && !category) return;

    onAdd({
      type,
      amount: parsedAmount,
      description: description.trim(),
      category: type === 'expense' ? category : undefined
    });
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && amount) {
      sound.playClick();
      setStep(2);
    } else if (step === 2) {
      sound.playClick();
      handleSubmit();
    }
  };

  if (isIslandMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-brand-black/20 backdrop-blur-2xl flex flex-col items-center justify-start pt-4 sm:pt-12 overflow-hidden">
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
            height: step === 1 ? 340 : 600, 
            borderRadius: 48,
            y: 12
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            layout: { duration: 0.3 }
          }}
          className="bg-brand-black shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10 relative flex flex-col items-center p-10"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-white/20 hover:text-white transition-all transform hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-full h-full flex flex-col justify-between">
            <motion.div 
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex-1"
            >
              {step === 1 ? (
                <div className="space-y-10 text-center mt-6">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                    <h2 className="text-brand-gray-muted text-[10px] font-bold uppercase tracking-[0.4em]">Engine Active</h2>
                  </div>
                  
                  <div className="flex p-1.5 bg-white/5 rounded-2xl mb-8 max-w-[220px] mx-auto border border-white/5">
                    <button 
                      onClick={() => setType('expense')}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        type === 'expense' ? "bg-white text-brand-black shadow-xl" : "text-white/20 hover:text-white/40"
                      )}
                    >
                      Outflow
                    </button>
                    <button 
                      onClick={() => setType('income')}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        type === 'income' ? "bg-white text-brand-black shadow-xl" : "text-white/20 hover:text-white/40"
                      )}
                    >
                      Inflow
                    </button>
                  </div>

                  <div className="relative group">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/10 text-4xl font-display font-bold transition-colors group-focus-within:text-brand-accent">₹</span>
                    <input 
                      autoFocus
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent border-none text-white text-7xl font-display font-bold focus:ring-0 text-center placeholder:text-white/5 tracking-tighter"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-10 mt-6 px-1">
                  {type === 'expense' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">Classification</h2>
                        <span className="text-brand-accent text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-brand-accent/10 rounded-full">Required</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar-dark pb-4">
                        {categories.map((cat) => {
                          const ui = CATEGORY_UI[cat as keyof typeof CATEGORY_UI] || CATEGORY_UI.Other;
                          const Icon = ui.icon;
                          return (
                            <button
                              key={cat}
                              onClick={() => setCategory(cat as Category)}
                              className={cn(
                                "flex flex-col items-center gap-3 p-5 rounded-[28px] text-[10px] font-bold uppercase tracking-widest transition-all border outline-none",
                                category === cat 
                                  ? "bg-white text-brand-black border-white shadow-[0_20px_40px_rgba(255,255,255,0.2)] scale-[1.02]" 
                                  : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:border-white/20"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-inner",
                                category === cat ? ui.color : "bg-white/5 text-white/20"
                              )}>
                                <Icon className="w-5 h-5" />
                              </div>
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h2 className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">
                      {type === 'expense' ? 'Designation' : 'Provenance'}
                    </h2>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={type === 'expense' ? "e.g., Cloud Infrastructure" : "e.g., Quarterly Dividend"}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white text-sm font-semibold focus:ring-2 focus:ring-brand-accent/50 transition-all outline-none placeholder:text-white/10"
                      />
                      {type === 'expense' && (
                        <button 
                          onClick={handleAutoCategorize}
                          disabled={isCategorizing || !description}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 text-brand-accent hover:bg-brand-accent/10 rounded-xl transition-all disabled:opacity-10"
                        >
                          {isCategorizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 shadow-glow" />}
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
              className="w-full py-6 bg-white text-brand-black rounded-[28px] font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-10 mt-10 shadow-2xl"
            >
              {step === 1 ? (
                <>Manifest <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Commit Ledger <Check className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </motion.div>

        <div className="mt-12 flex gap-2">
          <div className={cn("h-1.5 rounded-full transition-all duration-500", step === 1 ? "bg-white w-8" : "bg-white/20 w-1.5")} />
          <div className={cn("h-1.5 rounded-full transition-all duration-500", step === 2 ? "bg-white w-8" : "bg-white/20 w-1.5")} />
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
            <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-brand-black">Ledger</h2>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-brand-gray-muted hover:text-brand-black transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Toggle */}
          <div className="flex p-1 bg-brand-gray-light rounded-2xl mb-10">
            <button 
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2",
                type === 'expense' ? "bg-white text-brand-black shadow-[0_4px_12px_rgba(0,0,0,0.05)]" : "text-brand-gray-muted hover:text-brand-black"
              )}
            >
              <TrendingDown className="w-4 h-4" />
              Expense
            </button>
            <button 
              onClick={() => setType('income')}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2",
                type === 'income' ? "bg-white text-brand-black shadow-[0_4px_12px_rgba(0,0,0,0.05)]" : "text-brand-gray-muted hover:text-brand-black"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Income
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-muted px-1">Amount</label>
              <div className="relative group">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-display font-bold text-brand-gray-muted transition-colors group-focus-within:text-brand-black">₹</span>
                <input 
                  type="number" 
                  step="0.01"
                  inputMode="decimal"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent border-b-2 border-brand-gray-light py-5 pl-10 pr-4 text-4xl font-display font-bold focus:border-brand-black transition-all outline-none placeholder:text-brand-gray-light"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-muted px-1">Description</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleAutoCategorize}
                  placeholder={type === 'expense' ? "Purchase details..." : "Revenue source..."}
                  className="w-full bg-brand-gray-light border-none rounded-2xl py-4 px-5 text-sm font-semibold focus:ring-2 focus:ring-brand-black transition-all pr-12 placeholder:text-brand-gray-muted/50"
                  required
                />
                {type === 'expense' && (
                  <button 
                    type="button"
                    onClick={handleAutoCategorize}
                    disabled={isCategorizing || !description}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-brand-accent hover:bg-brand-accent/10 rounded-xl transition-all disabled:opacity-30"
                  >
                    {isCategorizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>

            {type === 'expense' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-muted px-1">Category</label>
                  <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest px-2 py-0.5 bg-brand-accent/5 rounded-md">Unified Library</span>
                </div>
                <div className="grid grid-cols-3 gap-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar pb-2">
                  {categories.map((cat) => {
                    const ui = CATEGORY_UI[cat as keyof typeof CATEGORY_UI] || CATEGORY_UI.Other;
                    const Icon = ui.icon;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat as Category)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all border shrink-0",
                          category === cat 
                            ? "bg-brand-black text-white border-brand-black shadow-lg" 
                            : "bg-white text-brand-gray-muted border-brand-gray-light hover:border-brand-gray-muted"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                          category === cat ? "bg-white/10 text-white" : ui.color
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="truncate w-full text-center">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button 
              type="submit"
              className="btn-primary w-full mt-4"
            >
              Archive Entry
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
