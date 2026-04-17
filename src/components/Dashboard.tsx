import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { TrendingUp, AlertCircle, ArrowDownRight, Coffee, Calendar, CheckCircle2, Circle, ChevronLeft, ChevronRight, ReceiptText } from 'lucide-react';
import { Expense, Income, Budget, SavingsGoal, Category, Bill, QuickPreset } from '../types';
import { cn } from '../lib/utils';
import { format, differenceInDays, endOfMonth, startOfMonth, subMonths, addMonths, isSameMonth, isToday } from 'date-fns';

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
  showInstallBtn,
  onInstall
}: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return isSameMonth(d, selectedDate);
    });
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

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  const getCategoryColor = (category: string) => {
    return COLORS[category as keyof typeof COLORS] || '#999';
  };

  return (
    <div className="space-y-8 pb-32">
      {/* PWA Install Banner */}
      {showInstallBtn && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-black text-white rounded-3xl p-5 flex items-center justify-between shadow-2xl relative overflow-hidden"
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
      <div className="flex items-center justify-between neo-card rounded-3xl p-2">
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

      {/* Summary Card */}
      <div className="bg-brand-black text-white rounded-4xl p-10 shadow-[0_40px_100px_rgba(0,0,0,0.15)] relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-brand-gray-muted text-[10px] font-bold uppercase tracking-[0.3em] mb-3 px-1">Disposable Velocity</p>
              <h2 className="text-5xl font-display font-bold tracking-tighter leading-none break-all">₹{netFlow.toLocaleString('en-IN')}</h2>
            </div>
            <div className={cn(
              "backdrop-blur-2xl px-5 py-2.5 rounded-2xl flex items-center gap-2 border shadow-lg transition-transform duration-500 hover:scale-105",
              isOverBudget ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"
            )}>
              {isOverBudget ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400">Leakage</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-brand-accent shadow-glow" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-accent">Optimized</span>
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <p className="text-brand-gray-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Total Inflow</p>
              <p className="text-2xl font-display font-bold text-white tracking-tight">₹{totalIncome.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-brand-gray-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-2 px-1">Monthly Outflow</p>
              <p className="text-2xl font-display font-bold text-brand-gray-muted tracking-tight">₹{totalSpent.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex justify-between items-end px-1">
              <div>
                <p className="text-brand-gray-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">Efficiency Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-4 h-1.5 rounded-full transition-all duration-700",
                        i <= Math.ceil((100 - percentSpent) / 20) ? "bg-brand-accent shadow-glow" : "bg-white/5"
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] font-display font-bold text-brand-gray-muted uppercase tracking-widest">
                {percentSpent.toFixed(0)}% Exhausted
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentSpent, 100)}%` }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "h-full rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]",
                  isOverBudget ? "bg-red-500" : "bg-white"
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Abstract artifacts */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[120px] -mr-40 -mt-40 group-hover:bg-brand-accent/15 transition-all duration-1000" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-white/[0.02] rounded-full blur-[100px] -ml-20 -mb-20" />
      </div>

      {/* Daily Allowance Widget */}
      <div className={cn(
        "rounded-4xl p-10 shadow-3xl flex items-center justify-between relative overflow-hidden group transition-all duration-700",
        dailyAllowance.isExceeded ? "bg-red-50 border border-red-100" : "bg-brand-gray-light border border-brand-gray-light"
      )}>
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-3 mb-8">
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

          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-3xl font-display font-bold text-brand-black/20">₹</span>
            <h3 className="text-7xl font-display font-bold tracking-tighter text-brand-black">
              {Math.floor(dailyAllowance.amount).toLocaleString('en-IN')}
            </h3>
            <span className="text-2xl font-display font-bold text-brand-gray-muted/40">
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
              onClick={() => onQuickAdd(preset)}
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
        <div className="neo-card rounded-4xl p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-display font-bold uppercase tracking-[0.1em] text-brand-black">Due This Week</h3>
            <button 
              onClick={onManageBills}
              className="text-xs font-bold text-brand-black/40 hover:text-brand-black transition-colors"
            >
              Calendar
            </button>
          </div>
          <div className="space-y-6">
            {bills.length === 0 ? (
              <p className="text-center text-brand-gray-muted text-xs py-10 opacity-60">No upcoming obligations</p>
            ) : (
              bills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => onToggleBill(bill.id)}
                      className="transition-transform active:scale-90"
                    >
                      {bill.isPaid ? 
                        <div className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-white" /></div> : 
                        <div className="w-6 h-6 rounded-full border-2 border-brand-gray-muted/30 hover:border-brand-black transition-colors" />
                      }
                    </button>
                    <div>
                      <p className={cn("text-sm font-bold transition-all", bill.isPaid ? "text-brand-gray-muted line-through" : "text-brand-black")}>{bill.name}</p>
                      <p className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.1em] mt-0.5">Due {bill.dueDate}th</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-display font-bold", bill.isPaid ? "text-brand-gray-muted" : "text-brand-black")}>
                    ₹{bill.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Categories Analysis */}
        <div className="neo-card rounded-4xl p-8">
          <h3 className="text-sm font-display font-bold uppercase tracking-[0.1em] text-brand-black mb-10">Wallet Composition</h3>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="h-48 w-48 relative shrink-0">
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        animationBegin={200}
                        animationDuration={1500}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Other' ? '#E5E5E5' : index === 0 ? '#0A0A0A' : index === 1 ? '#007AFF' : getCategoryColor(entry.name)} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.1em]">Total</p>
                    <p className="text-xl font-display font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-xs text-brand-gray-muted opacity-60">No spending data</p>
                </div>
              )}
            </div>
            
            <div className="w-full space-y-4">
              {categoryData.slice(0, 5).map((entry, index) => (
                <div key={entry.name} className="flex flex-col gap-1.5 w-full">
                  <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-[0.1em]">
                    <span className="text-brand-black">{entry.name}</span>
                    <span className="text-brand-gray-muted">₹{entry.value.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-1.5 w-full bg-brand-gray-light rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-black transition-all duration-1000" 
                      style={{ 
                        width: `${(entry.value / totalSpent) * 100}%`,
                        backgroundColor: entry.name === 'Other' ? '#E5E5E5' : index === 0 ? '#0A0A0A' : index === 1 ? '#007AFF' : getCategoryColor(entry.name)
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
