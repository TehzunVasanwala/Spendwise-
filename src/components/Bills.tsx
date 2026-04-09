import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckCircle2, Circle, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Bill, Category } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface BillsProps {
  bills: Bill[];
  userId: string;
  categories: Category[];
}

export default function Bills({ bills, userId, categories }: BillsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDate: '1',
    category: categories[0] || 'Utilities'
  });

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBill.name || !newBill.amount) return;

    try {
      await addDoc(collection(db, 'bills'), {
        name: newBill.name,
        amount: parseFloat(newBill.amount),
        dueDate: parseInt(newBill.dueDate),
        category: newBill.category,
        isPaid: false,
        userId: userId
      });
      setNewBill({
        name: '',
        amount: '',
        dueDate: '1',
        category: categories[0] || 'Utilities'
      });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bills');
    }
  };

  const togglePaid = async (bill: Bill) => {
    try {
      await updateDoc(doc(db, 'bills', bill.id), {
        isPaid: !bill.isPaid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bills/${bill.id}`);
    }
  };

  const deleteBill = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bills', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bills/${id}`);
    }
  };

  const sortedBills = [...bills].sort((a, b) => a.dueDate - b.dueDate);
  const unpaidTotal = bills.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monthly Bills</h2>
          <p className="text-gray-500">Manage your recurring expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Bill
          </button>
        </div>
      </div>

      {unpaidTotal > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900">Upcoming Payments</p>
            <p className="text-2xl font-bold text-amber-700">₹{unpaidTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
          >
            <form onSubmit={handleAddBill} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill Name</label>
                <input
                  type="text"
                  required
                  value={newBill.name}
                  onChange={e => setNewBill({ ...newBill, name: e.target.value })}
                  placeholder="e.g. Rent, Netflix"
                  className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newBill.amount}
                    onChange={e => setNewBill({ ...newBill, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date (Day)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={newBill.dueDate}
                  onChange={e => setNewBill({ ...newBill, dueDate: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedBills.map((bill) => (
          <motion.div
            layout
            key={bill.id}
            className={cn(
              "p-5 rounded-2xl border transition-all",
              bill.isPaid 
                ? "bg-gray-50 border-gray-100 opacity-75" 
                : "bg-white border-gray-100 shadow-sm hover:shadow-md"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  bill.isPaid ? "bg-gray-200 text-gray-500" : "bg-indigo-50 text-indigo-600"
                )}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{bill.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{bill.category}</p>
                </div>
              </div>
              <button
                onClick={() => deleteBill(bill.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Due on day {bill.dueDate}</p>
                <p className="text-xl font-bold text-gray-900">₹{bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <button
                onClick={() => togglePaid(bill)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  bill.isPaid 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                )}
              >
                {bill.isPaid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Paid
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    Mark Paid
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {bills.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No bills yet</h3>
          <p className="text-gray-500 mb-6">Add your recurring monthly bills to stay organized.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Bill
          </button>
        </div>
      )}
    </div>
  );
}
