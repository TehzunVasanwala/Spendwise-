import { Trash2, Calendar, Tag, ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { Expense, Income, Category } from '../types';
import { cn } from '../lib/utils';
import { CATEGORY_UI } from '../lib/constants';

interface ExpenseListProps {
  expenses: Expense[];
  income: Income[];
  onDeleteExpense: (id: string) => void;
  onDeleteIncome: (id: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

type CombinedTransaction = 
  | (Expense & { ledgerType: 'expense' }) 
  | (Income & { ledgerType: 'income', category: string });

export default function ExpenseList({ 
  expenses, 
  income, 
  onDeleteExpense, 
  onDeleteIncome, 
  selectedDate, 
  onDateChange 
}: ExpenseListProps) {
  const getCategoryUI = (category: string) => {
    return CATEGORY_UI[category as keyof typeof CATEGORY_UI] || CATEGORY_UI.Other;
  };

  const combined: CombinedTransaction[] = [
    ...expenses.map(e => ({ ...e, ledgerType: 'expense' as const })),
    ...income.map(i => ({ ...i, ledgerType: 'income' as const, category: 'Income' }))
  ];

  const sortedTransactions = combined.sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  const groupedTransactions = sortedTransactions.reduce((groups, t) => {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return groups;
    const date = format(d, 'MMM dd, yyyy');
    if (!groups[date]) groups[date] = [];
    groups[date].push(t);
    return groups;
  }, {} as Record<string, CombinedTransaction[]>);

  return (
    <div className="space-y-10 pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold tracking-tight text-brand-black">Ledger</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onDateChange(subMonths(selectedDate, 1))}
            className="w-10 h-10 bg-white border border-brand-gray-light rounded-xl flex items-center justify-center hover:bg-brand-black hover:text-white transition-all shadow-sm active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">{format(selectedDate, 'yyyy')}</span>
            <span className="text-sm font-display font-bold text-brand-black uppercase tracking-widest">{format(selectedDate, 'MMMM')}</span>
          </div>
          <button 
            onClick={() => onDateChange(addMonths(selectedDate, 1))}
            className="w-10 h-10 bg-white border border-brand-gray-light rounded-xl flex items-center justify-center hover:bg-brand-black hover:text-white transition-all shadow-sm active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {sortedTransactions.length === 0 ? (
        <div className="neo-card p-20 flex flex-col items-center justify-center text-center opacity-60">
          <div className="w-20 h-20 bg-brand-gray-light rounded-full flex items-center justify-center mb-6">
            <Tag className="w-10 h-10 text-brand-gray-muted/30" />
          </div>
          <p className="text-sm font-semibold text-brand-black">Archive Empty</p>
          <p className="text-[10px] uppercase font-bold tracking-widest mt-1 text-brand-gray-muted">No transactions registered</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTransactions)
            .sort((a, b) => new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime())
            .map(([date, items]) => (
            <div key={date} className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gray-muted px-4">{date}</h3>
              <div className="neo-card overflow-hidden">
                {items.map((t, index) => {
                  const { icon: CategoryIcon, color } = t.ledgerType === 'expense' 
                    ? getCategoryUI(t.category) 
                    : { icon: ArrowDownLeft, color: 'bg-green-500' };

                  return (
                    <div 
                      key={`${t.ledgerType}-${t.id}`} 
                      className={cn(
                        "group flex items-center justify-between p-6 hover:bg-brand-gray-light/30 transition-all duration-300",
                        index !== items.length - 1 && "border-b border-brand-gray-light/50"
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-[18px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 ring-1 ring-white/10 text-white",
                          color
                        )}>
                          <CategoryIcon className="w-5 h-5 drop-shadow-sm" />
                        </div>
                        <div>
                          <p className="text-base font-display font-bold text-brand-black tracking-tight leading-tight">{t.description}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-muted mt-1.5 opacity-60">{t.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-6">
                        <span className={cn(
                          "text-lg font-display font-bold tracking-tighter",
                          t.ledgerType === 'expense' ? "text-brand-black" : "text-green-600"
                        )}>
                          {t.ledgerType === 'expense' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                        </span>
                        <button 
                          onClick={() => t.ledgerType === 'expense' ? onDeleteExpense(t.id) : onDeleteIncome(t.id)}
                          className="w-10 h-10 flex items-center justify-center text-brand-gray-muted/30 hover:text-red-500 hover:bg-red-50 rounded-[14px] transition-all duration-300 active:scale-90"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
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
