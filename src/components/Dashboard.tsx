import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { TrendingUp, AlertCircle, ArrowDownRight, Coffee, Calendar, CheckCircle2, Circle, ChevronLeft, ChevronRight, ReceiptText, Sparkles } from 'lucide-react';
import { Expense, Income, Budget, SavingsGoal, Category, Bill, QuickPreset } from '../types';
import { cn } from '../lib/utils';
import { CATEGORY_UI } from '../lib/constants';
import { format, differenceInDays, endOfMonth, startOfMonth, subMonths, addMonths, isSameMonth, isToday } from 'date-fns';
import { sound } from '../services/soundService';

interface DashboardProps {
  expenses: Expense[];
  income: Income[];
  budget: Budget;
  goals: SavingsGoal[];
  bills: Bill[];
  presets: QuickPreset[];
  onQuickAdd: (preset: QuickPreset) => void;
  onToggleBill: (id: string) => void;
  onManageBills: () => void;
  onUpdateBudget?: (budget: Budget) => void;
  onNavigate?: (tab: 'dashboard' | 'expenses' | 'goals' | 'bills' | 'insights' | 'settings') => void;
  onSync?: () => void;
  showInstallBtn?: boolean;
  onInstall?: () => void;
}

const COLORS = {
  'House Rent': '#6366f1',
  'EMI': '#f43f5e',
  'Groceries & Daily Needs': '#10b981',
  'Utilities': '#8b5cf6',
  'Internet + Mobile': '#06b6d4',
  'Transport': '#f59e0b',
  'Eating Out / Movies': '#ec4899',
  'Personal / Misc': '#64748b',
  'Savings / Buffer': '#22c55e',
  'Food': '#FF8042',
  'Shopping': '#FFBB28',
  'Health': '#82ca9d',
  'Other': '#999'
};

export default function Dashboard({ 
  expenses, 
  income, 
  budget, 
  goals, 
  bills, 
  presets, 
  onQuickAdd, 
  onToggleBill,
  onManageBills,
  onUpdateBudget,
  onNavigate,
  onSync,
  showInstallBtn,
  onInstall
}: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempSalary, setTempSalary] = useState(budget.salary?.toString() || '');
  const [tempLimit, setTempLimit] = useState(budget.monthlyLimit?.toString() || '');

  useEffect(() => {
    setTempSalary(budget.salary?.toString() || '');
    setTempLimit(budget.monthlyLimit?.toString() || '');
  }, [budget.salary, budget.monthlyLimit]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return isSameMonth(d, selectedDate);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedDate]);

  const filteredIncome = useMemo(() => {
    return income.filter(i => {
      const d = new Date(i.date);
      return isSameMonth(d, selectedDate);
    });
  }, [income, selectedDate]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
  const effectiveIncome = budget.salary || totalIncome;
  
  // Use income as fallback if budget is not set
  const effectiveLimit = budget.monthlyLimit > 0 ? budget.monthlyLimit : effectiveIncome;
  const remainingBudget = effectiveLimit - totalSpent;
  const percentSpent = effectiveLimit > 0 ? (totalSpent / effectiveLimit) * 100 : 0;
  const isOverBudget = percentSpent > 100;
  const netFlow = effectiveIncome - totalSpent;

  // Daily Allowance Calculation
  const dailyAllowance = useMemo(() => {
    const now = new Date();
    if (!isSameMonth(now, selectedDate)) return { amount: 0, isExceeded: false, todaySpent: 0 };
    
    const lastDay = endOfMonth(now);
    const daysLeft = differenceInDays(lastDay, now) + 1;
    
    // Subtract upcoming unpaid bills from remaining budget to get "Safe to Spend"
    const unpaidBillsTotal = bills
      .filter(b => !b.isPaid && isSameMonth(new Date(), selectedDate))
      .reduce((sum, b) => sum + b.amount, 0);
      
    const safeRemaining = remainingBudget - unpaidBillsTotal;
    const todaySpent = filteredExpenses
      .filter(e => isToday(new Date(e.date)))
      .reduce((sum, e) => sum + e.amount, 0);
    
    return {
      amount: Math.max(0, safeRemaining / daysLeft),
      isExceeded: safeRemaining <= 0,
      todaySpent
    };
  }, [remainingBudget, selectedDate, bills, filteredExpenses]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const recentExpenses = filteredExpenses.slice(0, 3);

  const handlePrevMonth = () => {
    sound.playClick();
    setSelectedDate(subMonths(selectedDate, 1));
  };
  
  const handleNextMonth = () => {
    sound.playClick();
    setSelectedDate(addMonths(selectedDate, 1));
  };

  const getCategoryColor = (category: string) => {
    return COLORS[category as keyof typeof COLORS] || '#999';
  };

  const handleUpdateSalary = () => {
    const newSalary = parseFloat(tempSalary);
    if (!isNaN(newSalary) && onUpdateBudget) {
      onUpdateBudget({ ...budget, salary: newSalary });
      setIsEditingSalary(false);
    }
  };

  const handleUpdateLimit = () => {
    const newLimit = parseFloat(tempLimit);
    if (!isNaN(newLimit) && onUpdateBudget) {
      onUpdateBudget({ ...budget, monthlyLimit: newLimit });
      setIsEditingLimit(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-32">
      {/* PWA Install Banner */}
      {showInstallBtn && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-black text-white rounded-[32px] sm:rounded-[40px] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden ring-1 ring-white/10"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <TrendingUp className="w-6 h-6 text-brand-accent" />
            </div>
            <div>
              <p className="text-sm font-bold">Install SpendWise</p>
              <p className="text-xs text-brand-gray-muted">Get a native experience</p>
            </div>
          </div>
          <button 
            onClick={onInstall}
            className="px-5 py-2.5 bg-white text-brand-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-light transition-colors relative z-10"
          >
            Install
          </button>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/20 rounded-full blur-3xl -mr-10 -mt-10" />
        </motion.div>
      )}

      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center justify-between neo-card rounded-3xl p-2">
          <button 
            onClick={handlePrevMonth}
            className="p-3 text-brand-gray-muted hover:text-brand-black transition-colors rounded-2xl hover:bg-brand-gray-light"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-base font-display font-bold text-brand-black tracking-tight">{format(selectedDate, 'MMMM yyyy')}</span>
            {isSameMonth(new Date(), selectedDate) && (
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.2em] mt-0.5">Current</span>
            )}
          </div>
          <button 
            onClick={handleNextMonth}
            className="p-3 text-brand-gray-muted hover:text-brand-black transition-colors rounded-2xl hover:bg-brand-gray-light"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button 
          onClick={onSync}
          className="p-4 bg-brand-black text-white rounded-[24px] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
          title="Smart Sync"
        >
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest sm:inline hidden">Sync</span>
        </button>
      </div>

      <motion.div 
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-brand-black text-white rounded-[44px] p-8 sm:p-11 shadow-[0_50px_120px_rgba(0,0,0,0.4)] relative overflow-hidden group border border-white/10"
      >
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-0 mb-12 sm:mb-16">
            <div className="space-y-1">
              <p className={cn(
                "text-[10px] font-black uppercase tracking-[0.4em] mb-4 px-1",
                netFlow >= 0 ? "text-brand-accent/60" : "text-red-400"
              )}>
                {netFlow >= 0 ? "Surplus Availability" : "Financial Deficit"}
              </p>
              <h2 className="text-5xl sm:text-7xl font-display font-bold tracking-tighter leading-none whitespace-nowrap drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">₹{netFlow.toLocaleString('en-IN')}</h2>
            </div>
            <div className={cn(
              "backdrop-blur-3xl px-7 py-3.5 rounded-[24px] flex items-center gap-3 border shadow-2xl transition-all duration-700 hover:bg-white/10 shrink-0",
              netFlow < 0 ? "bg-red-500/20 border-red-500/30" : "bg-white/10 border-white/20"
            )}>
              {netFlow < 0 ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">Deficit</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-brand-accent shadow-glow" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">Optimized</span>
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-10 sm:gap-20 mb-12 sm:mb-16 px-1">
            <div className="group/item">
              <div className="flex items-center gap-3 mb-4">
                <p className="text-brand-gray-muted text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Total Inflow</p>
                <button 
                  onClick={() => setIsEditingSalary(!isEditingSalary)}
                  className="p-2 rounded-full bg-white/10 hover:bg-brand-accent transition-all active:scale-90"
                >
                  <ReceiptText className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              {isEditingSalary ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    inputMode="decimal"
                    value={tempSalary}
                    onChange={(e) => setTempSalary(e.target.value)}
                    onBlur={handleUpdateSalary}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateSalary()}
                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 text-xl font-display font-bold text-white outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                    autoFocus
                  />
                </div>
              ) : (
                <p className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tighter leading-tight">₹{effectiveIncome.toLocaleString('en-IN')}</p>
              )}
            </div>
            <div className="group/item">
              <div className="flex items-center gap-3 mb-4">
                <p className="text-brand-gray-muted text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Monthly Outflow</p>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setIsEditingLimit(!isEditingLimit)}
                    className="p-2 rounded-full bg-white/10 hover:bg-brand-accent transition-all active:scale-90"
                  >
                    <ReceiptText className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button 
                    onClick={() => onNavigate?.('expenses')}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-90"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-brand-gray-muted rotate-180" />
                  </button>
                </div>
              </div>
              {isEditingLimit ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    inputMode="decimal"
                    value={tempLimit}
                    onChange={(e) => setTempLimit(e.target.value)}
                    onBlur={handleUpdateLimit}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateLimit()}
                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 text-xl font-display font-bold text-white outline-none focus:ring-1 focus:ring-brand-accent transition-all"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-3xl sm:text-4xl font-display font-bold text-brand-gray-muted tracking-tighter leading-tight">₹{totalSpent.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] font-black text-brand-gray-muted uppercase tracking-[0.2em] opacity-30">Goal: ₹{effectiveLimit.toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end px-2">
              <div className="space-y-4">
                <p className="text-brand-gray-muted text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Efficiency Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-6 h-2 rounded-full transition-all duration-1000",
                        i <= Math.ceil((100 - Math.min(percentSpent, 100)) / 20) ? "bg-brand-accent shadow-glow" : "bg-white/10"
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[11px] font-display font-bold text-brand-accent uppercase tracking-widest drop-shadow-sm">
                {percentSpent.toFixed(0)}% Exhausted
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentSpent, 100)}%` }}
                transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "h-full rounded-full shadow-[0_0_40px_rgba(255,255,255,0.15)]",
                  isOverBudget ? "bg-red-500" : "bg-white"
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Abstract artifacts */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[140px] -mr-60 -mt-60 group-hover:bg-brand-accent/20 transition-all duration-[5s] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-white/[0.02] rounded-full blur-[100px] -ml-20 -mb-20" />
      </motion.div>

      {/* Daily Allowance Widget */}
      <div className={cn(
        "rounded-[32px] sm:rounded-4xl p-6 sm:p-10 shadow-3xl flex items-center justify-between relative overflow-hidden group transition-all duration-700",
        dailyAllowance.isExceeded ? "bg-red-50 border border-red-100" : "bg-white border border-brand-gray-light"
      )}>
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className={cn(
              "w-12 h-12 rounded-[20px] flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 duration-500",
              dailyAllowance.isExceeded ? "bg-red-500 text-white" : "bg-brand-black text-white"
            )}>
              {dailyAllowance.isExceeded ? <AlertCircle className="w-6 h-6" /> : <Coffee className="w-6 h-6" />}
            </div>
            <div>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-[0.3em] leading-tight",
                dailyAllowance.isExceeded ? "text-red-500" : "text-brand-gray-muted"
              )}>
                {dailyAllowance.isExceeded ? 'Daily Threshold Exceeded' : 'Safe to Spend Today'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", dailyAllowance.isExceeded ? "bg-red-500" : "bg-brand-accent animate-pulse")} />
                <span className="text-[8px] font-bold text-brand-gray-muted uppercase tracking-widest">Real-time Calculation</span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-6 sm:mb-8 overflow-hidden max-w-full">
            <span className="text-2xl sm:text-3xl font-display font-bold text-brand-black/20 shrink-0">₹</span>
            <h3 className="text-4xl sm:text-7xl font-display font-bold tracking-tighter text-brand-black whitespace-nowrap">
              {Math.floor(dailyAllowance.amount).toLocaleString('en-IN')}
            </h3>
            <span className="text-lg sm:text-2xl font-display font-bold text-brand-gray-muted/40 shrink-0">
              .{((dailyAllowance.amount % 1) * 100).toFixed(0).padStart(2, '0')}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className={cn(
              "px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
              dailyAllowance.isExceeded ? "bg-red-100 text-red-600" : "bg-white text-brand-gray-muted shadow-sm"
            )}>
              {dailyAllowance.isExceeded ? 'Exhausted' : `Used ₹${dailyAllowance.todaySpent.toLocaleString()}`}
            </div>
            {dailyAllowance.todaySpent > 0 && !dailyAllowance.isExceeded && (
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1 h-3 rounded-full", 
                      i < Math.ceil((dailyAllowance.todaySpent / (dailyAllowance.amount + dailyAllowance.todaySpent)) * 5) ? "bg-brand-accent" : "bg-brand-gray-muted/20"
                    )} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Refined backgrounds */}
        <div className={cn(
          "absolute right-0 top-0 w-80 h-80 rounded-full blur-[100px] -mr-40 -mt-40 transition-opacity duration-1000",
          dailyAllowance.isExceeded ? "bg-red-500/5" : "bg-brand-accent/5 opacity-40 group-hover:opacity-100"
        )} />
      </div>

      {/* Quick Presets */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-muted px-4">Instant Ledger</h3>
        <div className="grid grid-cols-4 gap-4">
          {presets.map((preset) => (
            <motion.button
              key={preset.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sound.playClick();
                onQuickAdd(preset);
              }}
              className="neo-card p-5 rounded-3xl flex flex-col items-center gap-3 group"
            >
              <div className="w-12 h-12 bg-brand-gray-light rounded-2xl flex items-center justify-center group-hover:bg-brand-black group-hover:text-white transition-all duration-300">
                <span className="text-2xl">{preset.icon}</span>
              </div>
              <span className="text-xs font-display font-bold text-brand-black">₹{preset.amount}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-8">
        {/* Recent Activity */}
        <div className="neo-card rounded-4xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-display font-bold uppercase tracking-[0.1em] text-brand-black">Recent Activity</h3>
            <button className="text-xs font-bold text-brand-accent hover:underline px-2 py-1">All History</button>
          </div>
          <div className="space-y-6">
            {recentExpenses.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-brand-gray-light rounded-full flex items-center justify-center">
                  <ReceiptText className="w-8 h-8 text-brand-gray-muted/40" />
                </div>
                <p className="text-xs font-medium text-brand-gray-muted">No recent transactions</p>
              </div>
            ) : (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-gray-light flex items-center justify-center group-hover:bg-brand-black transition-colors duration-300">
                      <ArrowDownRight className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-black">{expense.description}</p>
                      <p className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.1em] mt-0.5">{expense.category}</p>
                    </div>
                  </div>
                  <span className="text-base font-display font-bold text-brand-black">-₹{expense.amount.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bill Reminders */}
        <div className="neo-card rounded-4xl p-10 relative overflow-hidden bg-white">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-sm font-display font-bold uppercase tracking-[0.1em] text-brand-black">Upcoming Obligations</h3>
              <p className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-widest mt-1">Next 7 Days</p>
            </div>
            <button 
              onClick={onManageBills}
              className="w-12 h-12 bg-brand-gray-light rounded-2xl flex items-center justify-center text-brand-black hover:bg-brand-black hover:text-white transition-all duration-300"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {bills.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-brand-gray-light rounded-[32px] flex flex-col items-center gap-3">
                <ReceiptText className="w-8 h-8 text-brand-gray-muted/20" />
                <p className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.2em]">Zero Obligations Detected</p>
              </div>
            ) : (
              bills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-6 bg-brand-gray-light/30 rounded-[28px] group hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-brand-gray-light">
                  <div className="flex items-center gap-5">
                    <button 
                      onClick={() => {
                        sound.playClick();
                        onToggleBill(bill.id);
                      }}
                      className="transition-transform active:scale-90"
                    >
                      {bill.isPaid ? 
                        <div className="w-8 h-8 rounded-full bg-brand-black flex items-center justify-center shadow-lg"><CheckCircle2 className="w-5 h-5 text-white" /></div> : 
                        <div className="w-8 h-8 rounded-full border-2 border-brand-gray-muted/30 hover:border-brand-black transition-colors" />
                      }
                    </button>
                    <div>
                      <p className={cn("text-base font-display font-bold transition-all tracking-tight", bill.isPaid ? "text-brand-gray-muted line-through" : "text-brand-black")}>{bill.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-brand-gray-muted/50">Expiring in</span>
                        <span className="text-[9px] font-bold text-brand-accent uppercase tracking-widest">Day {bill.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-lg font-display font-bold leading-none", bill.isPaid ? "text-brand-gray-muted" : "text-brand-black")}>
                      ₹{bill.amount.toLocaleString('en-IN')}
                    </span>
                    {!bill.isPaid && (
                      <div className="w-1 h-1 bg-red-400 rounded-full mx-auto mt-2 animate-pulse" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Categories Analysis */}
        <div className="neo-card rounded-[32px] sm:rounded-4xl p-6 sm:p-10 bg-brand-black text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-white/40 mb-8 sm:mb-12">Capital Distribution</h3>
            
            <div className="flex flex-col items-center gap-12">
              <div className="h-56 w-56 relative group/chart">
                {categoryData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={95}
                          paddingAngle={8}
                          stroke="none"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => {
                            const colorPool = ['#000000', '#007AFF', '#FF8042', '#FFBB28', '#82ca9d', '#6366f1', '#f43f5e'];
                            return <Cell key={`cell-${index}`} fill={colorPool[index % colorPool.length]} />;
                          })}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Total Impact</p>
                      <p className="text-2xl font-display font-bold text-white tracking-tighter">₹{totalSpent.toLocaleString('en-IN')}</p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-center opacity-20">
                    <ReceiptText className="w-12 h-12" />
                  </div>
                )}
              </div>
              
              <div className="w-full space-y-6">
                {categoryData.slice(0, 4).map((entry, index) => {
                  const percentage = totalSpent > 0 ? (entry.value / totalSpent) * 100 : 0;
                  return (
                    <div key={entry.name} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            index === 0 ? "bg-brand-accent" : index === 1 ? "bg-white" : "bg-white/20"
                          )} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black tracking-widest text-white">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1.5, delay: 0.2 }}
                          className={cn(
                            "h-full rounded-full",
                            index === 0 ? "bg-brand-accent" : index === 1 ? "bg-white" : "bg-white/40"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-brand-accent/20 transition-all duration-1000" />
        </div>
      </div>
    </div>
  );
}
