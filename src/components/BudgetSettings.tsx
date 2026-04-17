import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save, X, Settings2, Download, Sparkles, Loader2, LogOut, Smartphone, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { Budget } from '../types';
import { cn } from '../lib/utils';
import { suggestBudgetDistribution } from '../services/geminiService';
import { logout } from '../firebase';

interface BudgetSettingsProps {
  budget: Budget;
  onUpdate: (updatedBudget: Budget) => void;
  showInstallBtn?: boolean;
  onInstall?: () => void;
}

export default function BudgetSettings({ budget, onUpdate, showInstallBtn, onInstall }: BudgetSettingsProps) {
  const [localBudget, setLocalBudget] = useState<Budget>(budget);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [targetLimit, setTargetLimit] = useState(budget.monthlyLimit.toString());
  const [salary, setSalary] = useState(budget.salary?.toString() || '50000');

  const handleAiDistribute = async () => {
    const limit = parseFloat(targetLimit);
    if (isNaN(limit) || limit <= 0) return;

    setIsAiLoading(true);
    try {
      const categories = Object.keys(localBudget.categories);
      const suggested = await suggestBudgetDistribution(limit, categories);
      setLocalBudget({
        ...localBudget,
        monthlyLimit: limit,
        categories: suggested
      });
    } catch (error) {
      console.error("AI Distribution failed:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUpdateLimit = (category: string, limit: number) => {
    const updatedCategories = { ...localBudget.categories, [category]: limit };
    const updatedBudget = { ...localBudget, categories: updatedCategories };
    setLocalBudget(updatedBudget);
  };

  const handleAddCategory = () => {
    if (!newCategoryName || !newCategoryLimit) return;
    const updatedCategories = { 
      ...localBudget.categories, 
      [newCategoryName]: parseFloat(newCategoryLimit) 
    };
    const updatedBudget = { ...localBudget, categories: updatedCategories };
    setLocalBudget(updatedBudget);
    setNewCategoryName('');
    setNewCategoryLimit('');
  };

  const handleDeleteCategory = (category: string) => {
    const updatedCategories = { ...localBudget.categories };
    delete updatedCategories[category];
    const updatedBudget = { ...localBudget, categories: updatedCategories };
    setLocalBudget(updatedBudget);
  };

  const handleSave = () => {
    const totalLimit = Object.values(localBudget.categories).reduce((sum: number, limit: number) => sum + limit, 0);
    onUpdate({ 
      ...localBudget, 
      monthlyLimit: totalLimit,
      salary: parseFloat(salary) || 0
    });
  };

  return (
    <div className="space-y-10 pb-40">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-3xl font-display font-bold tracking-tight text-brand-black">Settings</h2>
        <button 
          onClick={handleSave}
          className="btn-primary py-3.5 px-6 shadow-brand-accent/20"
        >
          <div className="flex items-center gap-2 text-white">
            <Save className="w-4 h-4" />
            <span>Sync</span>
          </div>
        </button>
      </div>

      {/* Account Section */}
      <div className="neo-card p-6 sm:p-8 rounded-[32px] sm:rounded-4xl bg-brand-black text-white relative overflow-hidden group">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
              <User className="w-7 h-7 sm:w-8 h-8 text-brand-accent" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-muted mb-1">Active Profile</p>
              <h3 className="text-xl font-display font-bold">Standard User</h3>
              <div className="flex items-center gap-2 mt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />
                <span className="text-[8px] font-bold text-brand-gray-light uppercase tracking-widest">Biometric Encrypted</span>
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-12 h-12 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-[20px] flex items-center justify-center transition-all duration-300 active:scale-90"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-brand-accent/20 transition-all duration-1000" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Settings2 className="w-4 h-4 text-brand-black" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-black">Budget Configuration</h3>
        </div>

        <div className="neo-card p-8 rounded-4xl space-y-10">
          <div>
            <label className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.2em] mb-4 block px-1">Primary Monthly Income</label>
            <div className="relative border-b-2 border-brand-gray-light pb-2 focus-within:border-brand-black transition-colors">
              <span className="absolute left-0 bottom-2 text-2xl font-display font-bold text-brand-gray-muted">₹</span>
              <input 
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full pl-8 bg-transparent text-3xl font-display font-bold outline-none placeholder:text-brand-gray-light font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <label className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-[0.2em] px-1">Strategic Allocation</label>
              <button 
                onClick={handleAiDistribute}
                disabled={isAiLoading || !targetLimit}
                className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-brand-accent py-2 px-4 bg-brand-accent/5 rounded-full hover:bg-brand-accent/10 transition-all"
              >
                {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Apply AI Engine
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(localBudget.categories).map(([name, limit]) => (
                <div key={name} className="flex items-center justify-between p-5 bg-brand-gray-light rounded-[24px] group">
                  <div className="flex-1 mr-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-gray-muted leading-none mb-2">{name}</p>
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-bold opacity-30">₹</span>
                      <input 
                        type="number"
                        inputMode="decimal"
                        value={limit}
                        onChange={(e) => handleUpdateLimit(name, parseFloat(e.target.value) || 0)}
                        className="w-full pl-5 bg-transparent text-xl font-display font-bold outline-none font-mono"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteCategory(name)}
                    className="w-10 h-10 bg-white shadow-sm flex items-center justify-center rounded-xl text-brand-gray-muted hover:text-red-500 sm:opacity-0 group-hover:opacity-100 opacity-100 transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-brand-gray-light">
            <div className="space-y-4">
              <input 
                type="text"
                placeholder="New Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-brand-gray-light p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-black/5 transition-all text-center"
              />
              <div className="flex gap-4">
                <input 
                  type="number"
                  inputMode="decimal"
                  placeholder="Limit"
                  value={newCategoryLimit}
                  onChange={(e) => setNewCategoryLimit(e.target.value)}
                  className="flex-1 bg-brand-gray-light p-5 rounded-2xl text-lg font-display font-bold outline-none focus:ring-2 focus:ring-brand-black/5 transition-all text-center font-mono"
                />
                <button 
                  onClick={handleAddCategory}
                  className="w-16 h-16 bg-brand-black text-white rounded-[24px] flex items-center justify-center shadow-lg active:scale-90 transition-all shrink-0"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInstallBtn && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Smartphone className="w-4 h-4 text-brand-black" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-black">System Extensions</h3>
          </div>
          <button 
            onClick={onInstall}
            className="w-full p-8 neo-card rounded-4xl flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center">
                <Download className="w-6 h-6 text-brand-accent" />
              </div>
              <div className="text-left">
                <h4 className="font-display font-bold text-lg leading-tight text-brand-black">Native Client</h4>
                <p className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-widest mt-1">Install to Home Screen</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-brand-gray-muted group-hover:translate-x-1 transition-transform duration-500" />
          </button>
        </div>
      )}
    </div>
  );
}
