// SpendWise - Smart Budget Manager
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Target, 
  Plus, 
  Settings, 
  Wallet,
  TrendingUp,
  AlertCircle,
  Bell,
  LogOut,
  LogIn,
  Loader2
} from 'lucide-react';
import { cn } from './lib/utils';
import { Expense, Income, SavingsGoal, Budget, Category, Bill, QuickPreset, UserStats, SpendingPrediction } from './types';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import SavingsGoals from './components/SavingsGoals';
import AddTransaction from './components/AddTransaction';
import Insights from './components/Insights';
import BudgetSettings from './components/BudgetSettings';
import Bills from './components/Bills';
import { BrainCircuit, Calendar as CalendarIcon } from 'lucide-react';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'goals' | 'bills' | 'insights' | 'settings'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // Auth Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed. User:", firebaseUser?.email || "None");
      setUser(firebaseUser);
      setIsAuthReady(true);
    });
    return () => {
      unsubscribe();
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
    }, (error) => handleFirestoreError(error, OperationType.GET, `stats/${user.uid}`));

    const budgetDoc = doc(db, 'budgets', user.uid);
    const unsubBudget = onSnapshot(budgetDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Budget;
        setBudget(data);
        // Auto-update old default (50k) to new default (40k) as requested
        if (data.monthlyLimit === 50000) {
          const updatedBudget: Budget = {
            monthlyLimit: 40000,
            categories: {
              Food: 8000,
              Transport: 4000,
              Entertainment: 4000,
              Shopping: 8000,
              Utilities: 4000,
              Health: 4000,
              Other: 8000
            },
            userId: user.uid
          };
          setDoc(budgetDoc, updatedBudget).catch(e => handleFirestoreError(e, OperationType.WRITE, `budgets/${user.uid}`));
        }
      } else {
        // Initialize default budget for new user
        const defaultBudget: Budget = {
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
    
    // Check yesterday's spending
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayExpenses = expenses.filter(e => e.date.startsWith(yesterdayStr));
    const yesterdayTotal = yesterdayExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate daily limit based on actual days in the month
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dailyLimit = budget.monthlyLimit / daysInMonth;
    
    let newStreak = userStats.currentStreak;
    if (yesterdayTotal <= dailyLimit && yesterdayExpenses.length > 0) {
      newStreak += 1;
    } else if (yesterdayTotal > dailyLimit) {
      newStreak = 0;
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

  const addTransaction = async (data: any) => {
    if (!user) return;
    try {
      if (data.type === 'expense') {
        const newExpense = {
          amount: data.amount,
          description: data.description,
          category: data.category,
          date: new Date().toISOString(),
          userId: user.uid
        };
        await addDoc(collection(db, 'expenses'), newExpense);
      } else {
        const newIncome = {
          amount: data.amount,
          description: data.description,
          date: new Date().toISOString(),
          userId: user.uid
        };
        await addDoc(collection(db, 'income'), newIncome);
      }
      setIsAddModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, data.type === 'expense' ? 'expenses' : 'income');
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

  const updateGoal = async (id: string, amount: number) => {
    if (!user) return;
    try {
      const goal = goals.find(g => g.id === id);
      if (goal) {
        await updateDoc(doc(db, 'goals', id), { currentAmount: goal.currentAmount + amount });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `goals/${id}`);
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

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-gray-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] p-6 text-center">
        <div className="w-20 h-20 bg-black rounded-[24px] flex items-center justify-center mb-8 shadow-2xl">
          <Wallet className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2">SpendWise</h1>
        <p className="text-gray-500 mb-8 max-w-xs">Your smart AI-powered financial companion. Sign in to start tracking your budget.</p>
        
        {authError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-left max-w-xs">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">Sign in failed</p>
              <p className="text-xs text-red-600 mt-1">{authError}</p>
            </div>
          </div>
        )}

        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-200 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">SpendWise</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5 text-gray-500" />
              {bills.some(b => !b.isPaid) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
            <button 
              onClick={logout}
              className="p-2 hover:bg-red-50 rounded-full transition-colors text-gray-500 hover:text-red-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 pt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard 
                expenses={expenses} 
                income={income} 
                budget={budget} 
                goals={goals} 
                bills={bills}
                presets={presets}
                onQuickAdd={addFromPreset}
                onToggleBill={toggleBillPaid}
                onManageBills={() => setActiveTab('bills')}
              />
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ExpenseList expenses={expenses} onDelete={deleteExpense} />
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SavingsGoals goals={goals} onUpdate={updateGoal} />
            </motion.div>
          )}

          {activeTab === 'bills' && (
            <motion.div
              key="bills"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Bills bills={bills} userId={user.uid} categories={Object.keys(budget.categories)} />
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Insights expenses={expenses} income={income} budget={budget} userStats={userStats} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <BudgetSettings 
                budget={budget} 
                onUpdate={updateBudget} 
                showInstallBtn={showInstallBtn}
                onInstall={handleInstall}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-black text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 px-6 py-4 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard className="w-6 h-6" />}
            label="Home"
          />
          <NavButton 
            active={activeTab === 'expenses'} 
            onClick={() => setActiveTab('expenses')}
            icon={<ReceiptText className="w-6 h-6" />}
            label="History"
          />
          <NavButton 
            active={activeTab === 'bills'} 
            onClick={() => setActiveTab('bills')}
            icon={<CalendarIcon className="w-6 h-6" />}
            label="Bills"
          />
          <NavButton 
            active={activeTab === 'insights'} 
            onClick={() => setActiveTab('insights')}
            icon={<BrainCircuit className="w-6 h-6" />}
            label="Coach"
          />
          <NavButton 
            active={activeTab === 'goals'} 
            onClick={() => setActiveTab('goals')}
            icon={<Target className="w-6 h-6" />}
            label="Goals"
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="w-6 h-6" />}
            label="Settings"
          />
        </div>
      </nav>

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
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-black" : "text-gray-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="w-1 h-1 bg-black rounded-full mt-0.5"
        />
      )}
    </button>
  );
}
