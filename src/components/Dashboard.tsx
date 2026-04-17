import { useMemo, useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { TrendingUp, AlertCircle, ArrowDownRight, Coffee, Calendar, CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Expense, Income, Budget, SavingsGoal, Category, Bill, QuickPreset } from '../types';
import { cn } from '../lib/utils';
import { format, differenceInDays, endOfMonth, startOfMonth, subMonths, addMonths, isSameMonth } from 'date-fns';

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
    if (!isSameMonth(now, selectedDate)) return { amount: 0, isExceeded: false };
    
    const lastDay = endOfMonth(now);
    const daysLeft = differenceInDays(lastDay, now) + 1;
    
    // Subtract upcoming unpaid bills from remaining budget to get "Safe to Spend"
    const unpaidBillsTotal = bills
      .filter(b => !b.isPaid && isSameMonth(new Date(), selectedDate))
      .reduce((sum, b) => sum + b.amount, 0);
      
    const safeRemaining = remainingBudget - unpaidBillsTotal;
    
    return {
      amount: Math.max(0, safeRemaining / daysLeft),
      isExceeded: safeRemaining <= 0
    };
  }, [remainingBudget, selectedDate, bills]);

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
    <div className="space-y-6 pb-8">
      {/* PWA Install Banner */}
      {showInstallBtn && (
        <div className="bg-indigo-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-indigo-100 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <p className="text-xs font-bold">Install SpendWise</p>
              <p className="text-[10px] text-indigo-100">Add to your home screen for full access</p>
            </div>
          </div>
          <button 
            onClick={onInstall}
            className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors"
          >
            Install
          </button>
        </div>
      )}

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
        <button 
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-gray-900">{format(selectedDate, 'MMMM yyyy')}</span>
          {isSameMonth(new Date(), selectedDate) && (
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Current Month</span>
          )}
        </div>
        <button 
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-black text-white rounded-[40px] p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Net Cash Flow</p>
              <h2 className="text-4xl font-black tracking-tight">₹{netFlow.toLocaleString('en-IN')}</h2>
            </div>
            <div className={cn(
              "backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1",
              isOverBudget ? "bg-red-500/20" : "bg-white/10"
            )}>
              {isOverBudget ? (
                <>
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Overspending</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Healthy</span>
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Income</p>
              <p className="text-xl font-bold text-green-400">+₹{totalIncome.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Expenses</p>
              <p className="text-xl font-bold text-red-400">-₹{totalSpent.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {effectiveIncome > 0 && (
            <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Savings Potential</p>
                <p className="text-xs font-bold text-green-400">₹{(effectiveIncome - totalSpent).toLocaleString('en-IN')}</p>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${Math.max(0, Math.min(100, ((effectiveIncome - totalSpent) / effectiveIncome) * 100))}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <span>{isOverBudget ? 'Over Budget' : 'Budget Usage'}</span>
              <span className={cn(isOverBudget && "text-red-400 font-black")}>
                {isOverBudget ? `+₹${(totalSpent - effectiveLimit).toLocaleString('en-IN')}` : `${percentSpent.toFixed(0)}%`}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  isOverBudget ? "bg-red-500" : percentSpent > 75 ? "bg-yellow-500" : "bg-white"
                )}
                style={{ width: `${Math.min(percentSpent, 100)}%` }}
              />
            </div>
            {isOverBudget && (
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse">
                ⚠️ You are over spending this month!
              </p>
            )}
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Daily Allowance Widget */}
      <div className={cn(
        "rounded-[40px] p-8 shadow-lg flex items-center justify-between relative overflow-hidden transition-all duration-500",
        dailyAllowance.isExceeded ? "bg-red-500 text-white shadow-red-100" : "bg-indigo-600 text-white shadow-indigo-100"
      )}>
        <div className="relative z-10">
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest mb-2",
            dailyAllowance.isExceeded ? "text-red-100" : "text-indigo-200"
          )}>
            {dailyAllowance.isExceeded ? 'Budget Exceeded' : 'Daily Spending Limit'}
          </p>
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-2xl font-black",
              dailyAllowance.isExceeded ? "text-red-100" : "text-indigo-200"
            )}>₹</span>
            <h3 className="text-5xl font-black tracking-tighter">
              {Math.floor(dailyAllowance.amount).toLocaleString('en-IN')}
            </h3>
            <span className={cn(
              "text-xl font-bold ml-1",
              dailyAllowance.isExceeded ? "text-red-100" : "text-indigo-200"
            )}>
              .{((dailyAllowance.amount % 1) * 100).toFixed(0).padStart(2, '0')}
            </span>
          </div>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest mt-2",
            dailyAllowance.isExceeded ? "text-red-100" : "text-indigo-200"
          )}>
            {dailyAllowance.isExceeded ? 'Try to minimize expenses' : 'Safe to spend today'}
          </p>
        </div>
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[24px] flex items-center justify-center relative z-10">
          {dailyAllowance.isExceeded ? (
            <AlertCircle className="w-8 h-8 text-white" />
          ) : (
            <Coffee className="w-8 h-8 text-white" />
          )}
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Quick Presets */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">Quick Add</h3>
        <div className="grid grid-cols-4 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onQuickAdd(preset)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <span className="text-xl">{preset.icon}</span>
              <span className="text-[10px] font-bold text-gray-600">₹{preset.amount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bill Reminders */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Upcoming Bills</h3>
          <button 
            onClick={onManageBills}
            className="text-xs font-medium text-black hover:underline"
          >
            Manage
          </button>
        </div>
        <div className="space-y-4">
          {bills.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No bills added</p>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onToggleBill(bill.id)}
                    className="text-indigo-600"
                  >
                    {bill.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 text-gray-300" />}
                  </button>
                  <div>
                    <p className={cn("text-sm font-bold", bill.isPaid && "text-gray-400 line-through")}>{bill.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Due on {bill.dueDate}th</p>
                  </div>
                </div>
                <span className={cn("text-sm font-black", bill.isPaid ? "text-gray-400" : "text-gray-900")}>
                  ₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Spending by Category</h3>
          <div className="h-48 w-full min-h-[192px] flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={100}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <p className="text-xs text-gray-400">No data for this month</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(entry.name) }} />
                <span className="text-gray-600 truncate">{entry.name}</span>
                <span className="font-medium ml-auto">₹{entry.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Recent Transactions</h3>
          <button className="text-xs font-medium text-black hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {recentExpenses.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No transactions yet</p>
          ) : (
            recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{expense.description}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{expense.category}</p>
                  </div>
                </div>
                <span className="text-sm font-bold">-₹{expense.amount.toLocaleString('en-IN')}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
