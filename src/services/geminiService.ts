import { Category, Expense, Income, Budget, SpendingPrediction } from "../types";

export async function categorizeExpense(description: string, availableCategories: string[]): Promise<Category> {
  try {
    const response = await fetch('/api/ai/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, availableCategories })
    });
    if (!response.ok) throw new Error('Failed to categorize');
    const result = await response.json();
    return result.category as Category;
  } catch (error) {
    console.error("Error categorizing expense:", error);
    return availableCategories[0] || 'Other';
  }
}

export async function getSpendingPrediction(expenses: Expense[], budget: Budget): Promise<SpendingPrediction> {
  try {
    const response = await fetch('/api/ai/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses, budget })
    });
    if (!response.ok) throw new Error('Failed to predict');
    return await response.json();
  } catch (error) {
    console.error("Error getting spending prediction:", error);
    return {
      forecastedTotal: 0,
      isOverBudget: false,
      daysUntilLimitReached: null,
      recommendation: "Keep tracking to see your prediction!",
      confidence: 0
    };
  }
}

export async function getFinancialAdvice(expenses: Expense[], income: Income[], budget: Budget): Promise<string> {
  try {
    const response = await fetch('/api/ai/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses, income, budget })
    });
    if (!response.ok) throw new Error('Failed to get advice');
    const result = await response.json();
    return result.advice || "I'm still analyzing your data. Keep tracking your expenses to get personalized advice!";
  } catch (error) {
    console.error("Error getting financial advice:", error);
    return "I'm having trouble connecting to my financial brain right now. Please try again later!";
  }
}

export async function suggestBudgetDistribution(totalLimit: number, categories: string[]): Promise<Record<string, number>> {
  try {
    const response = await fetch('/api/ai/suggest-budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalLimit, categories })
    });
    if (!response.ok) throw new Error('Failed to suggest budget');
    return await response.json();
  } catch (error) {
    console.error("Error suggesting budget distribution:", error);
    const equalShare = Math.floor(totalLimit / categories.length);
    return categories.reduce((acc, cat) => {
      acc[cat] = equalShare;
      return acc;
    }, {} as Record<string, number>);
  }
}
