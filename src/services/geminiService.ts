import { Category, Expense, Income, Budget, SpendingPrediction } from "../types";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function categorizeExpense(description: string, availableCategories: string[]): Promise<Category> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize this expense description into one of these categories: ${availableCategories.join(', ')}. 
      Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    const result = JSON.parse(response.text.replace(/```json|```/g, ''));
    return result.category as Category;
  } catch (error) {
    console.error("Error categorizing expense:", error);
    return availableCategories[0] || 'Other' as Category;
  }
}

export async function getSpendingPrediction(expenses: Expense[], budget: Budget): Promise<SpendingPrediction> {
  try {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    
    const prompt = `Analyze these expenses and predict the end-of-month total.
    - Current Day of Month: ${currentDay}/${daysInMonth}
    - Monthly Budget: ₹${budget.monthlyLimit}
    - Total Spent So Far: ₹${totalSpent}
    - Recent Expenses: ${JSON.stringify(expenses.slice(-10))}
    
    Predict if the user will exceed their budget and provide a recommendation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    return JSON.parse(response.text.replace(/```json|```/g, ''));
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
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    
    const prompt = `You are a strict but helpful financial coach. Analyze this user's monthly data and provide 3 concise, actionable pieces of advice.
    - Total Income: ₹${totalIncome}
    - Total Expenses: ₹${totalSpent}
    - Budget Limit: ₹${budget.monthlyLimit}
    - Expense Categories: ${JSON.stringify(expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>))}
    
    Your goal is to help the user increase savings. 
    1. Identify "useless" or excessive spending in Lifestyle categories (Eating Out, Movies, Misc).
    2. Suggest specific cuts to reach a higher savings goal.
    3. Be direct and firm if the user is overspending.
    
    Format your response as a single paragraph with clear bullet points using emojis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "I'm still analyzing your data. Keep tracking your expenses to get personalized advice!";
  } catch (error) {
    console.error("Error getting financial advice:", error);
    return "I'm having trouble connecting to my financial brain right now. Please try again later!";
  }
}

export async function suggestBudgetDistribution(totalLimit: number, categories: string[]): Promise<Record<string, number>> {
  try {
    const prompt = `Suggest a budget distribution for a total monthly limit of ₹${totalLimit} across these categories: ${categories.join(', ')}.
    Follow a realistic distribution for a middle-class individual in India. 
    
    Rules for distribution:
    1. Rent/EMI should be around 30-40% of the total if present.
    2. Essentials (Groceries, Utilities) should be around 20-25%.
    3. Transport should be around 5-10%.
    4. Savings/Buffer should be at least 10-15%.
    5. Lifestyle (Eating out, Movies, Misc) should be minimized (5-10%).
    
    Return a JSON object where keys are the category names and values are the calculated amounts.
    Ensure the sum of all category limits exactly equals ₹${totalLimit}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    return JSON.parse(response.text.replace(/```json|```/g, ''));
  } catch (error) {
    console.error("Error suggesting budget distribution:", error);
    const equalShare = Math.floor(totalLimit / categories.length);
    return categories.reduce((acc, cat) => {
      acc[cat] = equalShare;
      return acc;
    }, {} as Record<string, number>);
  }
}
