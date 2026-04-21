import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckCircle2, Circle, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Bill, Category } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { sound } from '../services/soundService';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface BillsProps {
  bills: Bill[];
  userId: string;
  categories: string[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Bills({ bills, userId, categories, onToggle, onDelete }: BillsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDate: '1',
    category: categories[0] || 'Utilities'
  });

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBill.name || !newBill.amount) return;

    try {
      await addDoc(collection(db, 'bills'), {
        name: newBill.name,
        amount: parseFloat(newBill.amount),
        dueDate: parseInt(newBill.dueDate),
        category: newBill.category,
        isPaid: false,
        userId: userId
      });
      sound.playClick();
      setNewBill({
        name: '',
        amount: '',
        dueDate: '1',
        category: categories[0] || 'Utilities'
      });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bills');
    }
  };

  const sortedBills = [...bills].sort((a, b) => a.dueDate - b.dueDate);
  const unpaidTotal = bills.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-brand-black">Obligations</h2>
          <p className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-brand-accent" />
            Recurring Financial Weights
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="w-12 h-12 bg-brand-black text-white rounded-2xl shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {unpaidTotal > 0 && (
        <div className="bg-brand-black text-white rounded-[40px] p-10 flex flex-col gap-8 relative overflow-hidden group shadow-3xl">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-brand-gray-muted text-[10px] font-black uppercase tracking-[0.4em] mb-2 px-1">Unfiltered Exposure</p>
              <h3 className="text-5xl font-display font-bold text-white tracking-tighter">₹{unpaidTotal.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-[28px] flex items-center justify-center backdrop-blur-3xl border border-white/10">
              <AlertCircle className="w-8 h-8 text-brand-accent animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-4 relative z-10 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-black text-brand-gray-muted uppercase tracking-[0.3em]">Settlement Index</p>
              <p className="text-[11px] font-display font-bold text-brand-accent">
                {bills.filter(b => b.isPaid).length} of {bills.length} Settled
              </p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(bills.filter(b => b.isPaid).length / bills.length) * 100}%` }}
                className="h-full bg-brand-accent shadow-glow"
              />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[100px] -mr-40 -mt-40" />
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="neo-card p-8 rounded-4xl bg-white space-y-8 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-display font-bold uppercase tracking-[0.1em] text-brand-black">Initialize Obligation</h3>
                <button onClick={() => setIsAdding(false)} className="text-brand-gray-muted hover:text-brand-black transition-colors">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              
              <form onSubmit={handleAddBill} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.2em] px-1">Entity Name</label>
                    <input
                      type="text"
                      required
                      value={newBill.name}
                      onChange={e => setNewBill({ ...newBill, name: e.target.value })}
                      placeholder="e.g. Fiber Internet"
                      className="w-full px-6 py-4 bg-brand-gray-light border-none rounded-2xl focus:ring-2 focus:ring-brand-black transition-all outline-none font-bold text-brand-black placeholder:font-normal"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.2em] px-1">Financial Impact</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gray-muted font-bold text-sm">₹</span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={newBill.amount}
                        onChange={e => setNewBill({ ...newBill, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full pl-10 pr-6 py-4 bg-brand-gray-light border-none rounded-2xl focus:ring-2 focus:ring-brand-black transition-all outline-none font-bold text-brand-black placeholder:font-normal"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.2em] px-1">Monthly Cycle Day</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={newBill.dueDate}
                      onChange={e => setNewBill({ ...newBill, dueDate: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-gray-light border-none rounded-2xl focus:ring-2 focus:ring-brand-black transition-all outline-none font-bold text-brand-black"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.2em] px-1">Classification</label>
                    <select
                      value={newBill.category}
                      onChange={e => setNewBill({ ...newBill, category: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-gray-light border-none rounded-2xl focus:ring-2 focus:ring-brand-black transition-all outline-none font-bold text-brand-black appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Commit Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-8 py-4 bg-brand-gray-light text-brand-black rounded-2xl text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-brand-black hover:text-white transition-all"
                  >
                    Discard
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {sortedBills.map((bill) => (
          <motion.div
            layout
            key={bill.id}
            className={cn(
              "p-6 rounded-[32px] transition-all duration-500 relative group overflow-hidden border",
              bill.isPaid 
                ? "bg-brand-gray-light/30 border-brand-gray-light/50 grayscale opacity-40 shadow-inner" 
                : "bg-white border-brand-gray-light shadow-3xl hover:shadow-4xl hover:-translate-y-1"
            )}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner",
                  bill.isPaid ? "bg-brand-gray-light text-brand-gray-muted" : "bg-brand-black text-white"
                )}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-brand-black tracking-tight">{bill.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-gray-muted">{bill.category}</span>
                    <div className="w-1 h-1 bg-brand-gray-light rounded-full" />
                    <span className="text-[8px] font-bold text-brand-accent uppercase tracking-widest">Day {bill.dueDate}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDelete(bill.id)}
                className="p-3 text-brand-gray-muted/20 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 active:scale-90"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-bold text-brand-gray-muted opacity-30">₹</span>
                <p className="text-2xl font-display font-bold text-brand-black tracking-tight">
                  {bill.amount.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] font-bold text-brand-gray-muted">.00</span>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  onToggle(bill.id);
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-90 shadow-[0_10px_25px_rgba(0,0,0,0.1)]",
                  bill.isPaid 
                    ? "bg-brand-black text-white hover:scale-[1.02]" 
                    : "bg-brand-gray-light text-brand-black hover:bg-brand-black hover:text-white hover:shadow-2xl"
                )}
              >
                {bill.isPaid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-brand-accent shadow-glow" />
                    Archive
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    Authorize
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {bills.length === 0 && !isAdding && (
        <div className="neo-card rounded-4xl p-20 text-center flex flex-col items-center gap-8 bg-transparent border-2 border-dashed border-brand-gray-light/50">
          <div className="w-24 h-24 bg-brand-gray-light/50 rounded-[40px] flex items-center justify-center relative">
            <Calendar className="w-12 h-12 text-brand-gray-muted/20" />
            <div className="absolute inset-0 bg-brand-accent/5 rounded-[40px] animate-pulse" />
          </div>
          <div className="space-y-3">
            <h4 className="font-display font-bold text-xl text-brand-black tracking-tight">Zero Obligations</h4>
            <p className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.3em] max-w-[240px] leading-loose mx-auto">
              Initialize recurring bills to activate the obligation engine.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
