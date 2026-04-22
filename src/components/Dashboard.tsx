import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
} from 'recharts';
import { 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Coffee, 
  Calendar, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ReceiptText, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Wallet,
  HelpCircle
} from 'lucide-react';
import { Expense, Income, Budget, SavingsGoal, QuickPreset, Bill } from '../types';
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
  selectedDate: Date;
  onDateChange: (date: Date) => void;
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
  onInstall,
  selectedDate,
  onDateChange
}: DashboardProps) {
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
      .filter(e => isSameMonth(new Date(e.date), selectedDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedDate]);

  const filteredIncome = useMemo(() => {
    return income.filter(i => isSameMonth(new Date(i.date), selectedDate));
  }, [income, selectedDate]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
  
  // Real-world logic: If we have captured income transactions, they represent the true source.
  // We use the budgeted salary as a projected floor if no income is logged, 
  // but we prioritize captured reality once we have it.
  const effectiveInflow = Math.max(totalIncome, budget.salary || 0);
  const effectiveLimit = budget.monthlyLimit > 0 ? budget.monthlyLimit : effectiveInflow;
  const percentSpent = effectiveLimit > 0 ? (totalSpent / effectiveLimit) * 100 : 0;
  const isOverBudget = percentSpent > 100;
  const netFlow = effectiveInflow - totalSpent;

  // Running Total / Wallet Balance (Reality Reconciliation)
  const walletBalance = useMemo(() => {
    const allExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const allIncome = income.reduce((sum, i) => sum + i.amount, 0);
    // User opening balance + recorded income - recorded expenses
    return (budget.openingBalance || 0) + allIncome - allExpenses;
  }, [expenses, income, budget.openingBalance]);

  const dailyAllowance = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = isSameMonth(today, selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const monthStart = startOfMonth(selectedDate);
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;

    if (!isCurrentMonth) {
      return { 
        amount: totalSpent / daysInMonth, 
        isExceeded: totalSpent > effectiveLimit, 
        todaySpent: 0,
        isHistory: true 
      };
    }
    
    const daysLeft = differenceInDays(monthEnd, today) + 1;
    const unpaidBillsTotal = bills
      .filter(b => !b.isPaid && isSameMonth(today, selectedDate))
      .reduce((sum, b) => sum + b.amount, 0);
      
    const safeRemaining = effectiveLimit - totalSpent - unpaidBillsTotal;
    const todaySpent = filteredExpenses
      .filter(e => isToday(new Date(e.date)))
      .reduce((sum, e) => sum + e.amount, 0);
    
    return {
      amount: Math.max(0, safeRemaining / daysLeft),
      isExceeded: safeRemaining <= 0,
      todaySpent,
      isHistory: false
    };
  }, [effectiveLimit, totalSpent, selectedDate, bills, filteredExpenses]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const handlePrevMonth = () => {
    sound.playClick();
    onDateChange(subMonths(selectedDate, 1));
  };
  
  const handleNextMonth = () => {
    sound.playClick();
    onDateChange(addMonths(selectedDate, 1));
  };

  const handleUpdateSalary = () => {
    const val = parseFloat(tempSalary);
    if (!isNaN(val) && onUpdateBudget) {
      onUpdateBudget({ ...budget, salary: val });
      setIsEditingSalary(false);
    }
  };

  const handleUpdateLimit = () => {
    const val = parseFloat(tempLimit);
    if (!isNaN(val) && onUpdateBudget) {
      onUpdateBudget({ ...budget, monthlyLimit: val });
      setIsEditingLimit(false);
    }
  };

  return (
    <div className="space-y-12 pb-32 mesh-bg">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-display font-medium tracking-tight text-brand-black">Hello, Premium</h1>
            <ShieldCheck className="w-5 h-5 text-brand-accent animate-pulse" />
          </div>
          <p className="text-sm font-medium text-brand-gray-muted">Your financial architecture for {format(selectedDate, 'MMMM yyyy')}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-brand-gray-light shadow-sm">
          {[
            { date: subMonths(selectedDate, 1), icon: <ChevronLeft className="w-4 h-4" /> },
            { date: selectedDate, label: format(selectedDate, 'MMM'), isCenter: true },
            { date: addMonths(selectedDate, 1), icon: <ChevronRight className="w-4 h-4" /> }
          ].map((m, i) => (
            <button 
              key={i}
              onClick={() => {
                sound.playClick();
                onDateChange(m.date);
              }}
              className={cn(
                "transition-all duration-300",
                m.isCenter 
                  ? "px-6 py-2 bg-brand-black text-white rounded-xl text-xs font-bold uppercase tracking-widest cursor-default" 
                  : "p-3 hover:bg-brand-gray-light rounded-xl text-brand-gray-muted hover:text-brand-black"
              )}
            >
              {m.label || m.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Card */}
      <motion.div 
        layout
        className="relative bg-brand-black rounded-[48px] p-8 sm:p-14 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.2)] border border-white/5 group"
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0">
          {/* Main Balance Display */}
          <div className="lg:col-span-7 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                  <Zap className="w-3 h-3 text-brand-accent fill-brand-accent" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/70">
                    {netFlow >= 0 ? 'Surplus Optimized' : 'Allocation Required'}
                  </span>
                </span>
              </div>

              <h2 className={cn(
                "text-7xl sm:text-9xl font-display font-medium tracking-tighter leading-none transition-colors",
                netFlow >= 0 ? "text-white" : "text-red-400"
              )}>
                ₹{netFlow.toLocaleString('en-IN')}
              </h2>
              <div className="flex items-center gap-2 group/help cursor-help">
                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] pl-2">
                  {netFlow >= 0 ? 'Monthly Surplus Balance' : 'Monthly Cash Deficit'}
                </p>
                <HelpCircle className="w-3 h-3 text-white/20 group-hover/help:text-brand-accent transition-colors" />
                <div className="absolute top-full left-0 mt-2 opacity-0 group-hover/help:opacity-100 transition-opacity bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[9px] text-white/60 max-w-[200px] z-50">
                  {netFlow < 0 
                    ? "Negative means you've spent more than your income this month. Realized surplus depends on total income captured." 
                    : "This represents how much money is left over from this month's income after all recorded expenses."}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 pr-10">
              <div className="space-y-3">
                <div className="flex items-center gap-2 opacity-40">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Total Source</span>
                </div>
                <div className="relative group">
                  <p className="text-2xl sm:text-3xl font-display font-medium text-white">
                    ₹{effectiveInflow.toLocaleString('en-IN')}
                  </p>
                  <div className="absolute top-full left-0 mt-2 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[200px] shadow-2xl">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-white/50">
                           <span className="uppercase tracking-widest">Base Salary</span>
                           <span className="font-mono">₹{(budget.salary || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-white/50 border-t border-white/5 pt-2">
                           <span className="uppercase tracking-widest">Extra Credits</span>
                           <span className="font-mono text-green-400">+₹{totalIncome > (budget.salary || 0) ? (totalIncome - (budget.salary || 0)).toLocaleString() : '0'}</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 opacity-40">
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Monthly Usage</span>
                </div>
                <p className="text-2xl sm:text-3xl font-display font-medium text-white/60">₹{totalSpent.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Efficiency Visualizer */}
          <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-12 pt-10 lg:pt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Budget Integrity</span>
                <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-white/50">{percentSpent.toFixed(0)}% Used</span>
              </div>
              <div className="h-24 flex items-end gap-1.5 pb-2">
                {[...Array(24)].map((_, i) => {
                  const isActive = (i / 24) * 100 < percentSpent;
                  return (
                    <motion.div 
                      key={i}
                      initial={{ height: 4 }}
                      animate={{ height: isActive ? 60 + Math.random() * 20 : 4 }}
                      transition={{ delay: i * 0.02, duration: 1 }}
                      className={cn(
                        "flex-1 rounded-full transition-colors duration-500",
                        isActive ? (isOverBudget ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-brand-accent shadow-[0_0_15px_rgba(99,102,241,0.5)]") : "bg-white/5"
                      )}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                   <div className={cn("w-1.5 h-1.5 rounded-full animate-ping", isOverBudget ? "bg-red-500" : "bg-brand-accent")} />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                    {isOverBudget ? 'Budget Reached' : 'Safe to Execute'}
                   </span>
                </div>
                <span className={cn(
                  "text-xs font-display font-bold tracking-tight",
                  isOverBudget ? "text-red-400" : "text-white"
                )}>
                  ₹{Math.max(0, effectiveLimit - totalSpent).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Abstract artifacts */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[140px] -mr-60 -mt-60 animate-pulse pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
      </motion.div>

      {/* Actionable Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Safe to Spend Odometer */}
        <div className="bg-white rounded-[40px] p-10 border border-brand-gray-light shadow-sm flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-700 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className={cn(
                "w-12 h-12 rounded-[20px] flex items-center justify-center transition-all duration-500",
                dailyAllowance.isExceeded ? "bg-red-500 text-white" : "bg-brand-black text-white group-hover:bg-brand-accent shadow-[0_12px_24px_rgba(0,0,0,0.1)]"
              )}>
                {dailyAllowance.isExceeded ? <AlertCircle className="w-6 h-6 animate-pulse" /> : <Coffee className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-muted leading-none">
                  {dailyAllowance.isHistory ? 'Legacy Velocity' : 'Dynamic Safety'}
                </p>
                <h4 className="text-lg font-display font-medium text-brand-black mt-1">
                  {dailyAllowance.isHistory ? 'History Avg' : 'Safe Capital'}
                </h4>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-8 overflow-hidden">
              <span className="text-2xl font-display font-bold text-brand-gray-muted/30">₹</span>
              <h3 className={cn(
                "text-6xl font-display font-medium tracking-tighter",
                dailyAllowance.isExceeded ? "text-red-500" : "text-brand-black"
              )}>
                {Math.floor(dailyAllowance.amount).toLocaleString('en-IN')}
              </h3>
              <span className="text-2xl font-display font-medium text-brand-gray-muted/20">
                .{((dailyAllowance.amount % 1) * 100).toFixed(0).padStart(2, '0')}
              </span>
            </div>

            <div className="h-2 w-full bg-brand-gray-light rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: dailyAllowance.isHistory ? '100%' : `${Math.min((dailyAllowance.todaySpent / (dailyAllowance.amount || 1)) * 100, 100)}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    dailyAllowance.isExceeded ? "bg-red-500 shadow-glow-red" : "bg-brand-accent shadow-glow"
                  )}
                />
            </div>
            <div className="flex justify-between items-center px-1">
               <span className="text-[9px] font-black uppercase tracking-widest text-brand-gray-muted">Session Allocation</span>
               <span className={cn("text-[10px] font-display font-bold", dailyAllowance.isExceeded ? "text-red-500" : "text-brand-accent")}>
                  {dailyAllowance.isExceeded ? 'CRITICAL' : 'BUFFERED'}
               </span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-accent/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:opacity-100 opacity-0 transition-opacity" />
        </div>

        {/* Quick Archive Panel */}
        <div className="bg-white rounded-[40px] p-10 border border-brand-gray-light shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-muted">Immediate Capture</h3>
            <Zap className="w-4 h-4 text-brand-accent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {presets.slice(0, 4).map((preset) => (
              <button
                key={preset.id}
                onClick={() => onQuickAdd(preset)}
                className="group p-5 bg-brand-gray-light/50 hover:bg-brand-black rounded-[28px] transition-all duration-500 border border-transparent hover:border-brand-black text-left"
              >
                <span className="text-2xl block mb-4 group-hover:scale-125 transition-transform origin-left">{preset.icon}</span>
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-gray-muted group-hover:text-white/40">{preset.name}</p>
                <p className="text-base font-display font-bold text-brand-black group-hover:text-white">₹{preset.amount}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Obligations */}
        <div 
          onClick={onManageBills}
          className="bg-white rounded-[40px] p-10 border border-brand-gray-light shadow-sm cursor-pointer group hover:bg-brand-accent transition-all duration-700"
        >
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-muted group-hover:text-white/40">Critical Timeline</h3>
            <ArrowRight className="w-5 h-5 text-brand-gray-muted group-hover:text-white" />
          </div>
          
          <div className="space-y-6">
            {bills.filter(b => !b.isPaid).slice(0, 3).map((bill) => (
              <div key={bill.id} className="flex justify-between items-center group/item">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-accent group-hover:bg-white" />
                  <div>
                    <p className="text-sm font-bold text-brand-black group-hover:text-white tracking-tight leading-none">{bill.name}</p>
                    <p className="text-[9px] font-bold text-brand-gray-muted uppercase tracking-widest mt-1.5 group-hover:text-white/60">Day {bill.dueDate}</p>
                  </div>
                </div>
                <span className="text-base font-display font-bold text-brand-black group-hover:text-white">₹{bill.amount.toLocaleString()}</span>
              </div>
            ))}
            {bills.filter(b => !b.isPaid).length === 0 && (
              <div className="py-10 text-center opacity-40">
                <CheckCircle2 className="w-10 h-10 mx-auto text-brand-gray-muted group-hover:text-white mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-black group-hover:text-white">All Obligations Met</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-depth Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        {/* Category breakdown */}
        <div className="lg:col-span-8 bg-white rounded-[48px] p-8 sm:p-12 border border-brand-gray-light shadow-sm overflow-hidden group">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-gray-muted">Structural Analytics</h3>
              <h2 className="text-2xl font-display font-bold text-brand-black mt-2 tracking-tight">Outflow Breakdown</h2>
            </div>
            <button 
              onClick={() => onNavigate?.('expenses')}
              className="px-6 py-2 bg-brand-gray-light rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-black hover:text-white transition-all flex items-center gap-2"
            >
              Analyze <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-square max-w-[280px] mx-auto">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      stroke="none"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[entry.name as keyof typeof COLORS] || '#E5E7EB'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full rounded-full border-2 border-dashed border-brand-gray-light flex items-center justify-center">
                   <ReceiptText className="w-10 h-10 text-brand-gray-muted/20" />
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-[10px] font-black text-brand-gray-muted uppercase tracking-[0.2em] mb-1">Concentration</p>
                 <Sparkles className="w-5 h-5 text-brand-accent" />
              </div>
            </div>

            <div className="space-y-6">
               {categoryData.slice(0, 5).map((category, idx) => {
                 const percent = (category.value / totalSpent) * 100;
                 return (
                   <div key={category.name} className="space-y-2">
                     <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-black flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[category.name as keyof typeof COLORS] }} />
                          {category.name}
                        </span>
                        <span className="text-[10px] font-bold text-brand-gray-muted">{percent.toFixed(0)}%</span>
                     </div>
                     <div className="h-1 w-full bg-brand-gray-light rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: COLORS[category.name as keyof typeof COLORS] }}
                        />
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>

        {/* Global Action Sync */}
        <div className="lg:col-span-4 flex flex-col gap-8">
           <button 
             onClick={onSync}
             className="flex-1 bg-brand-black text-white rounded-[48px] p-12 flex flex-col items-center justify-center text-center gap-8 group hover:bg-brand-accent transition-all duration-700 shadow-2xl relative overflow-hidden"
           >
             <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center backdrop-blur-md mx-auto group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  <Sparkles className="w-10 h-10 text-brand-accent group-hover:text-white" />
                </div>
                <div>
                   <h3 className="text-2xl font-display font-bold tracking-tight">Sync Reality</h3>
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mt-2">AI Statement Processing</p>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-[80px] -mr-32 -mt-32 opacity-40 group-hover:opacity-100 transition-opacity" />
           </button>
           
           <div className="bg-white rounded-[48px] p-10 border border-brand-gray-light flex flex-col justify-between">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-6 h-6 text-brand-accent" />
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-muted">Session Secured</span>
              </div>
              <div className="mt-6">
                 <p className="text-3xl font-display font-medium tracking-tight text-brand-black">Ready to scale.</p>
                 <p className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-widest mt-2">{totalIncome > 0 ? 'External income detected' : 'Standard flow active'}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
