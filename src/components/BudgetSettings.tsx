import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save, X, Settings2, Download } from 'lucide-react';
import { Budget } from '../types';
import { cn } from '../lib/utils';

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
    onUpdate({ ...localBudget, monthlyLimit: totalLimit });
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

        <div className="space-y-4">
          {Object.entries(localBudget.categories).map(([category, limit]) => (
            <div key={category} className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
                  {category}
                </label>
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
          ))}
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

        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
        <p className="text-indigo-100 text-sm font-medium mb-1">Total Monthly Limit</p>
        <h3 className="text-3xl font-black">₹{(Object.values(localBudget.categories).reduce((sum: number, limit: number) => sum + limit, 0) as number).toLocaleString('en-IN')}</h3>
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
