import { Trash2, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { Expense, Category } from '../types';
import { cn } from '../lib/utils';
import { CATEGORY_UI } from '../lib/constants';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
  const getCategoryUI = (category: string) => {
    return CATEGORY_UI[category as keyof typeof CATEGORY_UI] || CATEGORY_UI.Other;
  };

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const groupedExpenses = sortedExpenses.reduce((groups, expense) => {
    const date = format(new Date(expense.date), 'MMM dd, yyyy');
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);

  return (
    <div className="space-y-10 pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold tracking-tight text-brand-black">Ledger</h2>
        <div className="flex items-center gap-2 text-[10px] font-bold text-brand-gray-muted bg-white px-4 py-2 rounded-xl border border-brand-gray-light shadow-sm tracking-widest uppercase">
          <Calendar className="w-3.5 h-3.5" />
          <span>Active Period</span>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="neo-card p-20 flex flex-col items-center justify-center text-center opacity-60">
          <div className="w-20 h-20 bg-brand-gray-light rounded-full flex items-center justify-center mb-6">
            <Tag className="w-10 h-10 text-brand-gray-muted/30" />
          </div>
          <p className="text-sm font-semibold text-brand-black">Archive Empty</p>
          <p className="text-[10px] uppercase font-bold tracking-widest mt-1 text-brand-gray-muted">No transactions registered</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedExpenses)
            .sort((a, b) => new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime())
            .map(([date, items]) => (
            <div key={date} className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gray-muted px-4">{date}</h3>
              <div className="neo-card overflow-hidden">
                {items.map((expense, index) => {
                  const { icon: CategoryIcon, color } = getCategoryUI(expense.category);
                  return (
                    <div 
                      key={expense.id} 
                      className={cn(
                        "group flex items-center justify-between p-6 hover:bg-brand-gray-light/30 transition-all duration-300",
                        index !== items.length - 1 && "border-b border-brand-gray-light/50"
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500",
                          color
                        )}>
                          <CategoryIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-black tracking-tight">{expense.description}</p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-gray-muted mt-1">{expense.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <span className="text-base font-display font-bold text-brand-black">₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <button 
                          onClick={() => onDelete(expense.id)}
                          className="p-3 text-brand-gray-muted/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 sm:opacity-0 group-hover:opacity-100 opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
