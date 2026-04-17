import { Coffee, Car, Film, ShoppingBag, Zap, HeartPulse, MoreHorizontal } from 'lucide-react';

export const CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Health',
  'Other'
];

export const CATEGORY_UI = {
  Food: { icon: Coffee, color: 'bg-orange-50 text-orange-600', darkColor: 'bg-orange-950/30 text-orange-400' },
  Transport: { icon: Car, color: 'bg-blue-50 text-blue-600', darkColor: 'bg-blue-950/30 text-blue-400' },
  Entertainment: { icon: Film, color: 'bg-purple-50 text-purple-600', darkColor: 'bg-purple-950/30 text-purple-400' },
  Shopping: { icon: ShoppingBag, color: 'bg-pink-50 text-pink-600', darkColor: 'bg-pink-950/30 text-pink-400' },
  Utilities: { icon: Zap, color: 'bg-yellow-50 text-yellow-600', darkColor: 'bg-yellow-950/30 text-yellow-400' },
  Health: { icon: HeartPulse, color: 'bg-red-50 text-red-600', darkColor: 'bg-red-950/30 text-red-400' },
  Other: { icon: MoreHorizontal, color: 'bg-gray-50 text-gray-600', darkColor: 'bg-gray-900/30 text-gray-400' }
};

export type CategoryKey = keyof typeof CATEGORY_UI;
