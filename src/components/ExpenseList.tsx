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
    <div className="space-y-12 pb-40">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
           <h2 className="text-4xl font-display font-medium tracking-tight text-brand-black">Ledger Archive</h2>
           <p className="text-sm font-medium text-brand-gray-muted leading-relaxed">Systematic history of all verified financial logs.</p>
        </div>

        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-xl p-1.5 rounded-2xl border border-white shadow-sm">
          <button 
            onClick={() => onDateChange(subMonths(selectedDate, 1))}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-brand-gray-light transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-brand-gray-muted" />
          </button>
          
          <div className="px-4 text-center min-w-[120px]">
            <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-brand-accent/60 mb-0.5">{format(selectedDate, 'yyyy')}</span>
            <span className="block text-sm font-display font-bold text-brand-black uppercase tracking-widest">{format(selectedDate, 'MMMM')}</span>
          </div>

          <button 
            onClick={() => onDateChange(addMonths(selectedDate, 1))}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-brand-gray-light transition-all active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-brand-gray-muted" />
          </button>
        </div>
      </div>

      {sortedTransactions.length === 0 ? (
        <div className="glass-card p-24 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-brand-gray-light rounded-[40px] flex items-center justify-center mb-8 border border-white/50">
            <Tag className="w-10 h-10 text-brand-gray-muted/20" />
          </div>
          <p className="text-base font-display font-bold text-brand-black uppercase tracking-widest">Vault Empty</p>
          <p className="text-xs font-semibold mt-2 text-brand-gray-muted/60 leading-relaxed">No registered transactions found for this period.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedTransactions)
            .sort((a, b) => new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime())
            .map(([date, items]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gray-muted opacity-50">{date}</h3>
                <div className="flex-1 h-px bg-brand-gray-light" />
              </div>
              
              <div className="glass-card overflow-hidden !p-0">
                {items.map((t, index) => {
                  const { icon: CategoryIcon, color } = t.ledgerType === 'expense' 
                    ? getCategoryUI(t.category) 
                    : { icon: ArrowDownLeft, color: 'bg-indigo-500' };

                  return (
                    <div 
                      key={`${t.ledgerType}-${t.id}`} 
                      className={cn(
                        "group flex items-center justify-between p-6 hover:bg-white/40 transition-all duration-300",
                        index !== items.length - 1 && "border-b border-brand-gray-light/30"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500 text-white",
                          color
                        )}>
                          <CategoryIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-base font-display font-bold text-brand-black tracking-tight leading-tight">{t.description}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-muted mt-2 opacity-50">{t.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                           <span className={cn(
                             "text-xl font-display font-bold tracking-tighter block",
                             t.ledgerType === 'expense' ? "text-brand-black" : "text-indigo-600"
                           )}>
                             {t.ledgerType === 'expense' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                           </span>
                        </div>
                        <button 
                          onClick={() => t.ledgerType === 'expense' ? onDeleteExpense(t.id) : onDeleteIncome(t.id)}
                          className="w-10 h-10 flex items-center justify-center text-brand-gray-muted/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 group/btn"
                        >
                          <Trash2 className="w-4 h-4 group-hover/btn:scale-110" />
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
