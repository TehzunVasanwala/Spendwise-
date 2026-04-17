import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Check, ArrowRight, Wallet, Tag } from 'lucide-react';
import { cn } from '../lib/utils';
import { Category } from '../types';

interface QuickAddProps {
  onClose: () => void;
  onAdd: (amount: number, description: string, category: Category) => void;
  categories: Category[];
}

export default function QuickAdd({ onClose, onAdd, categories }: QuickAddProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0]);
  const [step, setStep] = useState(1);
  const [isExpanding, setIsExpanding] = useState(true);

  useEffect(() => {
    // Small delay to trigger the "expansion" animation from the top pill
    const timer = setTimeout(() => setIsExpanding(false), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (step === 1 && amount) setStep(2);
    else if (step === 2) {
      onAdd(parseFloat(amount), description || 'Quick Add', selectedCategory);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-start pt-4 sm:pt-12 overflow-hidden">
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
          height: step === 1 ? 320 : 540, 
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
                <div className="space-y-4">
                  <h2 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Category</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "py-3 px-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border",
                          selectedCategory === cat 
                            ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                            : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Note</h2>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What was this for?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold focus:ring-1 focus:ring-white transition-all outline-none"
                  />
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
