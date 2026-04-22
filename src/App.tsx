// SpendWise - Smart Budget Manager
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutGrid,
  History, 
  Target, 
  Plus, 
  Settings, 
  Wallet,
  TrendingUp,
  AlertCircle,
  Bell,
  LogOut,
  LogIn,
  Loader2,
  BrainCircuit,
  Calendar,
  Sparkles
} from 'lucide-react';
import { cn } from './lib/utils';
import { Expense, Income, SavingsGoal, Budget, Category, Bill, QuickPreset, UserStats, SpendingPrediction } from './types';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import SavingsGoals from './components/SavingsGoals';
import AddTransaction from './components/AddTransaction';
import AddGoal from './components/AddGoal';
import Insights from './components/Insights';
import SmartImporter from './components/SmartImporter';
import BudgetSettings from './components/BudgetSettings';
import Bills from './components/Bills';
import FinancialChat from './components/FinancialChat';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { sound } from './services/soundService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc
} from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'goals' | 'bills' | 'insights' | 'settings'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSmartImporterOpen, setIsSmartImporterOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
    lastUpdateDate: new Date().toISOString()
  });
  
  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budget, setBudget] = useState<Budget>({
    monthlyLimit: 40000,
    salary: 50000,
    categories: {
      'House Rent': 17000,
      'EMI': 2700,
      'Groceries & Daily Needs': 6000,
      'Utilities': 2500,
      'Internet + Mobile': 1200,
      'Transport': 2500,
      'Eating Out / Movies': 2000,
      'Personal / Misc': 2100,
      'Savings / Buffer': 4000
    },
    userId: ''
  });

  const [presets] = useState<QuickPreset[]>([
    { id: 'p1', name: 'Coffee', amount: 150, category: 'Food', icon: '☕' },
    { id: 'p2', name: 'Lunch', amount: 300, category: 'Food', icon: '🍱' },
    { id: 'p3', name: 'Auto', amount: 100, category: 'Transport', icon: '🛺' },
    { id: 'p4', name: 'Grocery', amount: 2000, category: 'Food', icon: '🛒' }
  ]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  }, [expenses, selectedDate]);

  const filteredIncome = useMemo(() => {
    return income.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  }, [income, selectedDate]);

  const totalSpent = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
  const totalIncome = useMemo(() => filteredIncome.reduce((sum, i) => sum + i.amount, 0), [filteredIncome]);
  const netFlow = useMemo(() => Math.max(totalIncome, budget.salary || 0) - totalSpent, [budget.salary, totalIncome, totalSpent]);

  // Auth Listener
  useEffect(() => {
    const checkParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('quickadd')) {
        setIsQuickAddOpen(true);
      }
    };
    
    checkParams();
    window.addEventListener('popstate', checkParams);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
    });
    
    return () => {
      unsubscribe();
      window.removeEventListener('popstate', checkParams);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setIncome([]);
      setGoals([]);
      setBills([]);
      return;
    }

    const qExpenses = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expense)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'expenses'));

    const qIncome = query(collection(db, 'income'), where('userId', '==', user.uid));
    const unsubIncome = onSnapshot(qIncome, (snapshot) => {
      setIncome(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Income)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'income'));

    const qBills = query(collection(db, 'bills'), where('userId', '==', user.uid));
    const unsubBills = onSnapshot(qBills, (snapshot) => {
      setBills(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Bill)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'bills'));

    const qGoals = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SavingsGoal)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'goals'));

    const statsDoc = doc(db, 'stats', user.uid);
    const unsubStats = onSnapshot(statsDoc, (snapshot) => {
      if (snapshot.exists()) {
        setUserStats(snapshot.data() as UserStats);
      } else {
        const initialStats: UserStats = {
          currentStreak: 0,
          longestStreak: 0,
          badges: [],
          lastUpdateDate: new Date().toISOString()
        };
        setDoc(statsDoc, initialStats).catch(e => handleFirestoreError(e, OperationType.WRITE, `stats/${user.uid}`));
      }
      setTimeout(() => setInitialLoading(false), 1200);
    }, (error) => handleFirestoreError(error, OperationType.GET, `stats/${user.uid}`));

    const budgetDoc = doc(db, 'budgets', user.uid);
    const unsubBudget = onSnapshot(budgetDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Budget;
        setBudget(data);
      } else {
        // Initialize default budget for new user
        const defaultBudget: Budget = {
          monthlyLimit: 40000,
          salary: 50000,
          openingBalance: 0,
          categories: {
            'House Rent': 17000,
            'EMI': 2700,
            'Groceries & Daily Needs': 6000,
            'Utilities': 2500,
            'Internet + Mobile': 1200,
            'Transport': 2500,
            'Eating Out / Movies': 2000,
            'Personal / Misc': 2100,
            'Savings / Buffer': 4000
          },
          userId: user.uid
        };
        setDoc(budgetDoc, defaultBudget).catch(e => handleFirestoreError(e, OperationType.WRITE, `budgets/${user.uid}`));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `budgets/${user.uid}`));

    return () => {
      unsubExpenses();
      unsubIncome();
      unsubGoals();
      unsubBills();
      unsubStats();
      unsubBudget();
    };
  }, [user]);

  const updateStats = async () => {
    if (!user || !budget) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const lastUpdateStr = userStats.lastUpdateDate.split('T')[0];
    
    if (todayStr === lastUpdateStr) return; // Already updated today
    
    // Check if we missed more than one day
    const lastUpdate = new Date(userStats.lastUpdateDate);
    const dayGap = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = userStats.currentStreak;

    if (dayGap > 1) {
      // Missed a full day (or more), streak resets
      newStreak = 0;
    } else {
      // Check yesterday's spending
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const yesterdayExpenses = expenses.filter(e => e.date?.startsWith(yesterdayStr));
      const yesterdayTotal = yesterdayExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const dailyLimit = budget.monthlyLimit / daysInMonth;
      
      if (yesterdayTotal <= dailyLimit && yesterdayExpenses.length > 0) {
        newStreak += 1;
      } else if (yesterdayTotal > dailyLimit) {
        newStreak = 0;
      }
    }
    
    const newLongest = Math.max(newStreak, userStats.longestStreak);
    
    // Check for new badges
    const newBadges = [...userStats.badges];
    const badgeCheck = (id: string, name: string, desc: string, icon: string, condition: boolean) => {
      if (condition && !newBadges.find(b => b.id === id)) {
        newBadges.push({ id, name, description: desc, icon, unlockedAt: new Date().toISOString() });
      }
    };
    
    badgeCheck('streak-3', '3 Day Streak', 'Stayed under budget for 3 days!', '🔥', newStreak >= 3);
    badgeCheck('streak-7', 'Week Warrior', 'Stayed under budget for 7 days!', '🛡️', newStreak >= 7);
    badgeCheck('first-goal', 'Goal Setter', 'Created your first savings goal!', '🎯', goals.length > 0);
    
    const updatedStats: UserStats = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      badges: newBadges,
      lastUpdateDate: today.toISOString()
    };
    
    try {
      await setDoc(doc(db, 'stats', user.uid), updatedStats);
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  };

  useEffect(() => {
    if (user && budget && expenses.length > 0) {
      updateStats();
    }
  }, [user, budget, expenses]);

  const addTransaction = async (data: any, isQuick: boolean = false) => {
    if (!user) return;
    try {
      if (data.type === 'expense' || isQuick) {
        const newExpense = {
          amount: data.amount,
          description: data.description,
          category: data.category,
          date: new Date().toISOString(),
          userId: user.uid
        };
        await addDoc(collection(db, 'expenses'), newExpense);
        sound.playSpend();
      } else {
        const newIncome = {
          amount: data.amount,
          description: data.description,
          date: new Date().toISOString(),
          userId: user.uid
        };
        await addDoc(collection(db, 'income'), newIncome);
        sound.playIncome();
      }
      setIsAddModalOpen(false);
      setIsQuickAddOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, (data.type === 'expense' || isQuick) ? 'expenses' : 'income');
    }
  };

  const addFromPreset = async (preset: QuickPreset) => {
    if (!user) return;
    try {
      const newExpense = {
        amount: preset.amount,
        description: preset.name,
        category: preset.category,
        date: new Date().toISOString(),
        userId: user.uid
      };
      await addDoc(collection(db, 'expenses'), newExpense);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'expenses');
    }
  };

  const toggleBillPaid = async (id: string) => {
    if (!user) return;
    try {
      const bill = bills.find(b => b.id === id);
      if (bill) {
        const newPaidStatus = !bill.isPaid;
        await updateDoc(doc(db, 'bills', id), { isPaid: newPaidStatus });
        
        // If marking as paid, create a corresponding expense
        if (newPaidStatus) {
          const newExpense = {
            amount: bill.amount,
            description: `Bill: ${bill.name}`,
            category: bill.category,
            date: new Date().toISOString(),
            userId: user.uid
          };
          await addDoc(collection(db, 'expenses'), newExpense);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bills/${id}`);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const deleteIncome = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'income', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `income/${id}`);
    }
  };

  const updateGoal = async (id: string, amount: number) => {
    if (!user) return;
    try {
      const goal = goals.find(g => g.id === id);
      if (goal) {
        // Update the goal's current amount
        await updateDoc(doc(db, 'goals', id), { currentAmount: goal.currentAmount + amount });
        sound.playIncome();
        
        // Deduction from account balance: Create an expense transaction for the contribution
        if (amount > 0) {
          const newExpense = {
            amount: amount,
            description: `Contribution: ${goal.name}`,
            category: 'Savings / Buffer',
            date: new Date().toISOString(),
            userId: user.uid
          };
          await addDoc(collection(db, 'expenses'), newExpense);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `goals/${id}`);
    }
  };

  const addGoal = async (data: { name: string; targetAmount: number; currentAmount: number; deadline: string }) => {
    if (!user) return;
    try {
      const newGoal = {
        ...data,
        userId: user.uid
      };
      await addDoc(collection(db, 'goals'), newGoal);
      
      // If there's an initial amount, record it as an expense to deduct from balance
      if (data.currentAmount > 0) {
        const newExpense = {
          amount: data.currentAmount,
          description: `Initial: ${data.name}`,
          category: 'Savings / Buffer',
          date: new Date().toISOString(),
          userId: user.uid
        };
        await addDoc(collection(db, 'expenses'), newExpense);
      }
      
      setIsAddGoalModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'goals');
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'goals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `goals/${id}`);
    }
  };

  const deleteBill = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'bills', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bills/${id}`);
    }
  };

  const updateBudget = async (updatedBudget: Budget) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'budgets', user.uid), updatedBudget);
      setActiveTab('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `budgets/${user.uid}`);
    }
  };

  const handleSmartImport = async (importedExpenses: Partial<Expense>[], importedIncome: Partial<Income>[]) => {
    if (!user) return;
    try {
      const batch = [];
      
      // Filter out duplicates (Match on amount, description, and normalized date)
      const isDuplicate = (t: Partial<Expense | Income>, existingList: (Expense | Income)[]) => {
        const tDate = t.date ? new Date(t.date) : null;
        if (!tDate || isNaN(tDate.getTime())) return false;
        
        // Normalize to date only for robust comparison (Midnight)
        const normalizedTDate = new Date(tDate);
        normalizedTDate.setHours(0, 0, 0, 0);
        const tTime = normalizedTDate.getTime();

        return existingList.some(item => {
          const itemDate = new Date(item.date);
          itemDate.setHours(0, 0, 0, 0);
          return Math.abs(item.amount - (t.amount || 0)) < 0.01 && 
            item.description.trim().toLowerCase() === t.description?.trim().toLowerCase() &&
            itemDate.getTime() === tTime;
        });
      };

      const newExpenses = importedExpenses.filter(e => !isDuplicate(e, expenses));
      const newIncome = importedIncome.filter(i => !isDuplicate(i, income));

      if (newExpenses.length === 0 && newIncome.length === 0) {
        return;
      }
      
      for (const exp of newExpenses) {
        batch.push(addDoc(collection(db, 'expenses'), {
          ...exp,
          userId: user.uid,
          date: exp.date || new Date().toISOString()
        }));
      }
      
      for (const inc of newIncome) {
        batch.push(addDoc(collection(db, 'income'), {
          ...inc,
          userId: user.uid,
          date: inc.date || new Date().toISOString()
        }));
      }
      
      await Promise.all(batch);
      sound.playIncome();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bulk-import');
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError("Popup blocked! Please allow popups for this site in your browser settings.");
      } else {
        setAuthError(error.message || "An error occurred during sign in.");
      }
    }
  };

  if (!isAuthReady || (initialLoading && user)) {
    return (
      <div className="fixed inset-0 bg-brand-black flex flex-col items-center justify-center z-[1000] p-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-12"
        >
          <div className="w-28 h-28 border-[6px] border-white/5 rounded-[44px] border-t-brand-accent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Wallet className="w-10 h-10 text-white animate-pulse" />
          </div>
        </motion.div>
        
        <div className="text-center space-y-4">
          <h2 className="text-white font-display font-bold text-xl tracking-tight">SpendWise v3</h2>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] animate-pulse">
              Synchronizing Neural Ledger
            </p>
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-full h-full bg-brand-accent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-gray-light p-6 text-center mesh-bg select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-28 h-28 bg-brand-black rounded-[40px] flex items-center justify-center mb-12 shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-white/10"
        >
          <Wallet className="w-12 h-12 text-white" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h1 className="text-6xl font-display font-medium tracking-tight text-brand-black">SpendWise</h1>
          <p className="text-brand-gray-muted mb-12 max-w-[320px] mx-auto text-sm font-medium leading-relaxed">
            Architecting your financial future through high-fidelity intelligence and automated synchronization.
          </p>
        </motion.div>
        
        {authError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 p-6 bg-red-50 rounded-[32px] border border-red-100 flex items-start gap-4 text-left max-w-sm shadow-sm"
          >
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">Vault Access Interrupted</p>
              <p className="text-xs text-red-600/80 mt-1 font-medium">{authError}</p>
            </div>
          </motion.div>
        )}

        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="btn-primary w-full max-w-[320px] h-20 text-sm"
        >
          {isLoggingIn ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <div className="flex items-center gap-4">
              <LogIn className="w-6 h-6" />
              <span>Initialize Session</span>
            </div>
          )}
        </motion.button>
        
        <div className="mt-12 flex flex-col items-center gap-4 opacity-40">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gray-muted">
            Intelligence Provided by Gemini 3 Flash
          </p>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-1 bg-brand-gray-muted rounded-full" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-brand-accent/20 selection:text-brand-accent overflow-x-hidden transition-all duration-700 mesh-bg",
      isQuickAddOpen ? "bg-black" : "bg-brand-gray-light"
    )}>
      {isQuickAddOpen ? (
        <div className="fixed inset-0 bg-black z-[100]">
          <AddTransaction 
            onClose={() => {
              setIsQuickAddOpen(false);
              window.history.replaceState({}, '', window.location.pathname);
            }} 
            onAdd={addTransaction} 
            categories={Object.keys(budget.categories)}
            isIslandMode={true}
          />
        </div>
      ) : (
        <div className="flex min-h-screen">
          {/* Desktop Sidebar Rail */}
          <aside className="hidden lg:flex w-24 flex-col items-center py-10 border-r border-brand-gray-light bg-white sticky top-0 h-screen z-40">
            <motion.div 
               whileHover={{ rotate: 10, scale: 1.1 }}
               className="w-12 h-12 bg-brand-black rounded-2xl flex items-center justify-center shadow-xl mb-12"
            >
              <Wallet className="w-6 h-6 text-white" />
            </motion.div>

            <div className="flex-1 flex flex-col gap-8">
              {[
                { id: 'dashboard', icon: LayoutGrid, label: 'Home' },
                { id: 'expenses', icon: History, label: 'Logs' },
                { id: 'insights', icon: BrainCircuit, label: 'Coach' },
                { id: 'goals', icon: Target, label: 'Goals' },
                { id: 'bills', icon: Calendar, label: 'Bills' },
                { id: 'settings', icon: Settings, label: 'Configs' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    activeTab === item.id ? "bg-brand-black text-white shadow-xl" : "text-brand-gray-muted hover:bg-brand-gray-light hover:text-brand-black"
                  )}
                  title={item.label}
                >
                  <item.icon className="w-5 h-5" />
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsSmartImporterOpen(true)}
              className="w-12 h-12 bg-brand-accent text-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-brand-accent/40 active:scale-90 transition-all group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </aside>

          <div className="flex-1 flex flex-col relative w-full lg:max-w-screen-xl lg:mx-auto">
            {/* Unified Header */}
            <header className="sticky top-0 z-30 bg-brand-gray-light/60 backdrop-blur-3xl px-6 sm:px-12 py-6 flex items-center justify-between">
               <div className="lg:hidden flex items-center gap-4">
                 <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center shadow-lg">
                    <Wallet className="w-5 h-5 text-white" />
                 </div>
                 <h1 className="text-xl font-display font-medium tracking-tight">SpendWise</h1>
               </div>
               
               <div className="hidden lg:block">
                 <h2 className="text-xs font-black uppercase tracking-[0.3em] text-brand-gray-muted opacity-40">Financial Terminal v3.0</h2>
               </div>

               <div className="flex items-center gap-3">
                 <button className="w-12 h-12 bg-white rounded-2xl border border-brand-gray-light flex items-center justify-center text-brand-gray-muted hover:text-brand-black transition-all group relative">
                    <Bell className="w-5 h-5" />
                    {bills.some(b => !b.isPaid) && (
                      <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-brand-accent rounded-full animate-ping" />
                    )}
                 </button>
                 <button 
                   onClick={() => setActiveTab('settings')}
                   className="w-12 h-12 bg-brand-black text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-brand-accent transition-all duration-300"
                 >
                    <Settings className="w-5 h-5" />
                 </button>
               </div>
            </header>

            {/* Standard Tab Layout */}
            <main className="flex-1 px-6 sm:px-12 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      expenses={expenses} 
                      income={income} 
                      budget={budget} 
                      goals={goals} 
                      bills={bills}
                      presets={presets}
                      selectedDate={selectedDate}
                      onDateChange={setSelectedDate}
                      onQuickAdd={addFromPreset}
                      onToggleBill={toggleBillPaid}
                      onManageBills={() => setActiveTab('bills')}
                      onUpdateBudget={updateBudget}
                      onNavigate={setActiveTab}
                      onSync={() => setIsSmartImporterOpen(true)}
                    />
                  )}
                  {activeTab === 'expenses' && <ExpenseList expenses={filteredExpenses} income={filteredIncome} onDeleteExpense={deleteExpense} onDeleteIncome={deleteIncome} selectedDate={selectedDate} onDateChange={setSelectedDate} />}
                  {activeTab === 'goals' && <SavingsGoals goals={goals} onUpdate={updateGoal} onDelete={deleteGoal} onAddClick={() => setIsAddGoalModalOpen(true)} />}
                  {activeTab === 'bills' && <Bills bills={bills} userId={user.uid} categories={Object.keys(budget.categories)} onToggle={toggleBillPaid} onDelete={deleteBill} />}
                  {activeTab === 'insights' && <Insights expenses={filteredExpenses} income={filteredIncome} budget={budget} userStats={userStats} selectedDate={selectedDate} />}
                  {activeTab === 'settings' && <BudgetSettings budget={budget} onUpdate={updateBudget} showInstallBtn={showInstallBtn} onInstall={handleInstall} />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Mobile High-Fidelity Bottom Bar */}
          <nav className="fixed lg:hidden bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-50">
            <div className="nav-blur rounded-[32px] p-2 flex items-center justify-between shadow-[0_32px_100px_rgba(0,0,0,0.25)] ring-1 ring-white/20">
              <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutGrid className="w-5 h-5" />} label="Home" />
              <NavButton active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={<History className="w-5 h-5" />} label="Logs" />
              
              {/* Portal Trigger */}
              <div className="relative -top-1">
                <button 
                  onClick={() => {
                    sound.playClick();
                    setIsAddModalOpen(true);
                  }}
                  className="w-16 h-16 bg-brand-black text-white rounded-[24px] shadow-2xl flex items-center justify-center active:scale-95 transition-all border-[6px] border-white"
                >
                  <Plus className="w-8 h-8" />
                </button>
              </div>

              <NavButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<BrainCircuit className="w-5 h-5" />} label="Coach" />
              <NavButton active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} icon={<Target className="w-5 h-5" />} label="Goals" />
            </div>
          </nav>

          <FinancialChat expenses={expenses} income={income} budget={budget} goals={goals} />

          {/* Add Transaction Modal */}
          <AnimatePresence>
            {isAddModalOpen && (
              <AddTransaction 
                onClose={() => setIsAddModalOpen(false)} 
                onAdd={addTransaction} 
                categories={Object.keys(budget.categories)}
              />
            )}
          </AnimatePresence>

          {/* Smart Importer Modal */}
          <AnimatePresence>
            {isSmartImporterOpen && (
              <SmartImporter 
                onClose={() => setIsSmartImporterOpen(false)}
                onImport={handleSmartImport}
                categories={Object.keys(budget.categories)}
                existingExpenses={expenses}
                existingIncome={income}
              />
            )}
          </AnimatePresence>

          {/* Add Goal Modal */}
          <AnimatePresence>
            {isAddGoalModalOpen && (
              <AddGoal 
                onClose={() => setIsAddGoalModalOpen(false)} 
                onAdd={addGoal} 
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  const handleClick = () => {
    sound.playClick();
    onClick();
  };

  return (
    <button 
      onClick={handleClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 relative h-14 sm:h-16 outline-none",
        active ? "text-brand-black" : "text-brand-gray-muted"
      )}
    >
      <div className={cn(
        "transition-transform duration-300",
        active ? "scale-110" : "scale-100"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-[0.1em] transition-opacity duration-300",
        active ? "opacity-100" : "opacity-60"
      )}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-black rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
