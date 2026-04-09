import { GoogleGenAI, Type } from "@google/genai";
import { Category, Expense, Income, Budget } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function categorizeExpense(description: string, availableCategories: string[]): Promise<Category> {
  try {
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
