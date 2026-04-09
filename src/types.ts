export type Category = string;

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: string;
  userId: string;
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  date: string;
  userId: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  userId: string;
}

export interface Budget {
  monthlyLimit: number;
  categories: Record<string, number>;
  userId: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: number; // Day of month (1-31)
  category: Category;
  isPaid: boolean;
  userId: string;
}

export interface QuickPreset {
  id: string;
  name: string;
  amount: number;
  category: Category;
  icon: string;
}
