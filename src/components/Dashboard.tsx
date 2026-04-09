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
}

const COLORS = {
  Food: '#FF8042',
  Transport: '#0088FE',
  Entertainment: '#00C49F',
  Shopping: '#FFBB28',
  Utilities: '#8884d8',
  Health: '#82ca9d',
  Other: '#999'
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
  onManageBills
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
  const remainingBudget = budget.monthlyLimit - totalSpent;
  const percentSpent = budget.monthlyLimit > 0 ? (totalSpent / budget.monthlyLimit) * 100 : 0;
  const netFlow = totalIncome - totalSpent;

  // Daily Allowance Calculation
  const dailyAllowance = useMemo(() => {
    const now = new Date();
    if (!isSameMonth(now, selectedDate)) return 0;
    
    const lastDay = endOfMonth(now);
    const daysLeft = differenceInDays(lastDay, now) + 1;
    return Math.max(0, remainingBudget / daysLeft);
  }, [remainingBudget, selectedDate]);

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
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Healthy</span>
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

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <span>Budget Usage</span>
              <span>{percentSpent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  percentSpent > 90 ? "bg-red-500" : percentSpent > 75 ? "bg-yellow-500" : "bg-white"
                )}
                style={{ width: `${Math.min(percentSpent, 100)}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Daily Allowance Widget */}
      <div className="bg-indigo-600 text-white rounded-3xl p-6 shadow-lg shadow-indigo-100 flex items-center justify-between">
        <div>
          <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Daily Spending Limit</p>
          <h3 className="text-3xl font-black tracking-tight">₹{dailyAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <p className="text-indigo-200 text-[10px] mt-1">Based on remaining budget</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
          <Coffee className="w-6 h-6" />
        </div>
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
