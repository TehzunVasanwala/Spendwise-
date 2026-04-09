import { Trash2, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { Expense, Category } from '../types';
import { cn } from '../lib/utils';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS: Record<Category, string> = {
  Food: 'bg-orange-100 text-orange-600',
  Transport: 'bg-blue-100 text-blue-600',
  Entertainment: 'bg-emerald-100 text-emerald-600',
  Shopping: 'bg-amber-100 text-amber-600',
  Utilities: 'bg-indigo-100 text-indigo-600',
  Health: 'bg-green-100 text-green-600',
  Other: 'bg-gray-100 text-gray-600'
};

export default function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as Category] || 'bg-gray-100 text-gray-600';
  };

  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = format(new Date(expense.date), 'MMM dd, yyyy');
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
          <Calendar className="w-3 h-3" />
          <span>This Month</span>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Tag className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium">No transactions found</p>
          <p className="text-xs">Add your first expense to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExpenses).map(([date, items]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-2">{date}</h3>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {items.map((expense, index) => (
                  <div 
                    key={expense.id} 
                    className={cn(
                      "group flex items-center justify-between p-4 hover:bg-gray-50 transition-colors",
                      index !== items.length - 1 && "border-bottom border-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center",
                        getCategoryColor(expense.category)
                      )}>
                        <span className="text-lg font-bold">{expense.category[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{expense.description}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{expense.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-gray-900">₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <button 
                        onClick={() => onDelete(expense.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
