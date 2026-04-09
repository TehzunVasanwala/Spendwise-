import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save, X, Settings2, Download, Sparkles, Loader2 } from 'lucide-react';
import { Budget } from '../types';
import { cn } from '../lib/utils';
import { suggestBudgetDistribution } from '../services/geminiService';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight">Budget Settings</h2>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold">Monthly Budget</h3>
            <p className="text-xs text-gray-500">Manage your categories and limits</p>
          </div>
        </div>

        {/* Salary Input */}
        <div className="mb-8 p-5 bg-gray-50 rounded-[32px] border border-gray-100">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Monthly Salary (In-hand)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
            <input 
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full pl-10 pr-4 py-4 bg-white border border-gray-100 rounded-2xl font-black text-xl focus:ring-2 focus:ring-black outline-none transition-all shadow-sm"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">This helps AI calculate your savings potential.</p>
        </div>

        {/* AI Auto-Distribute Section */}
        <div className="mb-8 p-5 bg-gradient-to-br from-indigo-50 to-white rounded-[32px] border border-indigo-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-indigo-900">AI Auto-Distribute</h4>
            </div>
            <div className="px-2 py-1 bg-indigo-100 rounded-lg">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Smart Suggest</span>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-bold text-sm">₹</span>
              <input 
                type="number"
                value={targetLimit}
                onChange={(e) => setTargetLimit(e.target.value)}
                placeholder="Target Limit (e.g. 40000)"
                className="w-full pl-7 pr-4 py-3 bg-white border border-indigo-100 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
              />
            </div>
            <button 
              onClick={handleAiDistribute}
              disabled={isAiLoading || !targetLimit}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Distribute
            </button>
          </div>
          <p className="text-[10px] text-indigo-400 mt-3 font-medium leading-relaxed">
            Our AI will analyze typical spending patterns to split your ₹{targetLimit || '0'} limit across your categories. Perfect for staying within your 40k goal!
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(localBudget.categories).map(([category, limit]) => {
            const categoryValues = Object.values(localBudget.categories) as number[];
            const totalLimit = categoryValues.reduce((sum: number, l: number) => sum + (l || 0), 0);
            const percentage = totalLimit > 0 ? ((limit as number) / totalLimit) * 100 : 0;

            return (
              <div key={category} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {category}
                    </label>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input 
                      type="number"
                      value={limit}
                      onChange={(e) => handleUpdateLimit(category, parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-4 py-2 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteCategory(category)}
                  className="mt-5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100">
          <h4 className="font-bold mb-4">Add New Category</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input 
              type="text"
              placeholder="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="px-4 py-2 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-black transition-all"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
              <input 
                type="number"
                placeholder="Limit"
                value={newCategoryLimit}
                onChange={(e) => setNewCategoryLimit(e.target.value)}
                className="w-full pl-7 pr-4 py-2 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-black transition-all"
              />
            </div>
          </div>
          <button 
            onClick={handleAddCategory}
            disabled={!newCategoryName || !newCategoryLimit}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-2">Total Monthly Limit</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-indigo-200">₹</span>
            <h3 className="text-5xl font-black tracking-tighter">
              {(Object.values(localBudget.categories).reduce((sum: number, limit: number) => sum + limit, 0) as number).toLocaleString('en-IN')}
            </h3>
          </div>
        </div>
        {/* Decorative background flare */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {showInstallBtn && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold">Install App</h3>
              <p className="text-xs text-gray-500">Install SpendWise on your home screen</p>
            </div>
          </div>
          <button 
            onClick={onInstall}
            className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install Now
          </button>
        </div>
      )}
    </div>
  );
}
