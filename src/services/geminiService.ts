import { GoogleGenAI, Type } from "@google/genai";
import { Category, Expense, Income, Budget, SpendingPrediction } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not set. Please add it to your .env file.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function categorizeExpense(description: string, availableCategories: string[]): Promise<Category> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize this expense description into one of these categories: ${availableCategories.join(', ')}. 
      Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              enum: availableCategories,
            },
          },
          required: ["category"],
        },
      },
    });

    const result = JSON.parse(response.text);
    return result.category as Category;
  } catch (error) {
    console.error("Error categorizing expense:", error);
    return availableCategories[0] || 'Other';
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

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            forecastedTotal: { type: Type.NUMBER },
            isOverBudget: { type: Type.BOOLEAN },
            daysUntilLimitReached: { type: Type.NUMBER, nullable: true },
            recommendation: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["forecastedTotal", "isOverBudget", "recommendation", "confidence"],
        },
      },
    });

    return JSON.parse(response.text) as SpendingPrediction;
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
    
    const prompt = `You are a friendly financial coach. Analyze this user's monthly data and provide 3 concise, actionable pieces of advice.
    - Total Income: ₹${totalIncome}
    - Total Expenses: ₹${totalSpent}
    - Budget Limit: ₹${budget.monthlyLimit}
    - Expense Categories: ${JSON.stringify(expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>))}
    
    Format your response as a single paragraph with clear bullet points using emojis. Keep it encouraging but realistic.`;

    const ai = getAI();
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
