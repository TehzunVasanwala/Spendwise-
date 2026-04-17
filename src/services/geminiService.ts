import { Category, Expense, Income, Budget, SpendingPrediction } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini SDK lazily to ensure environment variables are present
let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY environment variable");
    }
    genAI = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return genAI;
}

export async function categorizeExpense(description: string, availableCategories: string[]): Promise<Category> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize this expense description into exactly one of these categories: ${availableCategories.join(', ')}. 
      Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { 
              type: Type.STRING,
              description: "The name of the category that best matches the description."
            }
          },
          required: ["category"]
        }
      },
    });
    
    const result = JSON.parse(response.text);
    return result.category as Category;
  } catch (error) {
    console.error("Error categorizing expense:", error);
    return availableCategories[0] || 'Other' as Category;
  }
}

export async function getSpendingPrediction(expenses: Expense[], budget: Budget): Promise<SpendingPrediction> {
  try {
    const ai = getAI();
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    
    const prompt = `Analyze these expenses and predict the end-of-month total.
    - Current Day of Month: ${currentDay}/${daysInMonth}
    - Monthly Budget Limit: ₹${budget.monthlyLimit}
    - Total Spent So Far: ₹${totalSpent}
    - Recent Expenses: ${JSON.stringify(expenses.slice(-20))}
    
    Predict if the user will exceed their budget and provide a helpful, concise recommendation.`;

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
            daysUntilLimitReached: { 
              type: Type.NUMBER, 
              description: "Estimated days from today until budget is exhausted, or 0 if already over."
            },
            recommendation: { type: Type.STRING },
            confidence: { 
              type: Type.NUMBER,
              description: "Confidence Level from 0 to 1"
            }
          },
          required: ["forecastedTotal", "isOverBudget", "recommendation"]
        }
      },
    });
    
    const text = response.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error getting spending prediction:", error);
    return {
      forecastedTotal: 0,
      isOverBudget: false,
      daysUntilLimitReached: null,
      recommendation: "I'm having trouble calculating your prediction. Keep tracking to try again!",
      confidence: 0
    };
  }
}

export async function getFinancialAdvice(expenses: Expense[], income: Income[], budget: Budget): Promise<string> {
  try {
    const ai = getAI();
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    
    const categories = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `You are a strict but helpful financial coach. Analyze this user's monthly data and provide 3 concise, actionable pieces of advice.
    - Total Income: ₹${totalIncome}
    - Total Expenses: ₹${totalSpent}
    - Budget Limit: ₹${budget.monthlyLimit}
    - Expense Categories: ${JSON.stringify(categories)}
    
    Your goal is to help the user increase savings. 
    1. Identify potentially unnecessary spending or trends.
    2. Suggest specific ways to save.
    3. Be direct if the user is overspending.
    
    Format as a conversational paragraph with bullet points using emojis. Total length should be under 150 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return response.text || "I'm still analyzing your data. Keep tracking your expenses to get personalized advice!";
  } catch (error) {
    console.error("Error getting financial advice:", error);
    return "I'm having trouble connecting to my financial coach brain right now. Please check back in a moment!";
  }
}

export async function suggestBudgetDistribution(totalLimit: number, categories: string[]): Promise<Record<string, number>> {
  try {
    const ai = getAI();
    const prompt = `Suggest a budget distribution for a total monthly limit of ₹${totalLimit} across EXACTLY these categories: ${categories.join(', ')}.
    
    Rules for distribution:
    1. Rent/EMI should be around 30-40% of the total if present in the list.
    2. Essentials (Groceries, Utilities) should be around 20-25%.
    3. Transport should be around 5-10%.
    4. Savings/Buffer should be at least 15%.
    5. Lifestyle (Eating out, Movies, Misc) should be minimized (5-10%).
    
    CRITICAL:
    - You MUST use ONLY the category names provided in the list.
    - DO NOT add new categories.
    - The sum of all values MUST exactly equal ₹${totalLimit}.
    - Return a JSON object where keys are category names and values are numbers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: categories.reduce((acc, cat) => {
            acc[cat] = { type: Type.NUMBER };
            return acc;
          }, {} as any),
          required: categories
        }
      },
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error suggesting budget distribution:", error);
    const equalShare = Math.floor(totalLimit / categories.length);
    return categories.reduce((acc, cat) => {
      acc[cat] = equalShare;
      return acc;
    }, {} as Record<string, number>);
  }
}
