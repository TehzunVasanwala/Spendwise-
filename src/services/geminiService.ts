import { Category, Expense, Income, Budget, SpendingPrediction, FinancialInsight, ChatMessage, SavingsGoal } from "../types";
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

export async function getFinancialAdvice(expenses: Expense[], income: Income[], budget: Budget): Promise<FinancialInsight[]> {
  try {
    const ai = getAI();
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    
    const categories = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `You are an elite financial advisor. Analyze this data and provide 3-4 structured insights.
    - Total Income: ₹${totalIncome}
    - Total Expenses: ₹${totalSpent}
    - Budget Limit: ₹${budget.monthlyLimit}
    - Categories: ${JSON.stringify(categories)}
    - Expenses: ${JSON.stringify(expenses.slice(-30))}

    Look for:
    - Anomalies: Unusual amounts compared to typical category spend.
    - Leakage: High spend in lifestyle categories.
    - Optimization: Where they can save based on trends.
    
    Return a JSON array of objects with title, description, type (saving, warning, tip, anomaly), impact, and action.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { 
                type: Type.STRING,
                enum: ["saving", "warning", "tip", "anomaly"]
              },
              impact: { type: Type.STRING },
              action: { type: Type.STRING }
            },
            required: ["title", "description", "type"]
          }
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error getting financial advice:", error);
    return [];
  }
}

export async function getFinancialChatResponse(
  message: string, 
  history: ChatMessage[], 
  context: { expenses: Expense[], income: Income[], budget: Budget, goals: SavingsGoal[] }
): Promise<string> {
  try {
    const ai = getAI();
    const { expenses, income, budget, goals } = context;
    
    const systemPrompt = `You are SpendWise AI, a friendly and accurate personal finance assistant. 
    You have access to the user's financial data to answer questions.
    
    CONTEXT:
    - Total Expenses (Current): ₹${expenses.reduce((s, e) => s + e.amount, 0)}
    - Total Income (Current): ₹${income.reduce((s, i) => s + i.amount, 0)}
    - Budget Limit: ₹${budget.monthlyLimit}
    - Recent Expenses: ${JSON.stringify(expenses.slice(-20))}
    - Savings Goals: ${goals.map(g => `${g.name}: ₹${g.currentAmount}/₹${g.targetAmount}`).join(', ')}
    
    GUIDELINES:
    - If user asks about spending (e.g., "How much on food?"), calculate it from the context.
    - If they ask for advice, be professional and encouraging.
    - Keep responses concise and use emojis.
    - If they ask about future goals, refer to the "Savings Goals" provided.
    - If you don't have enough data to answer specifically, say so.`;

    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemPrompt,
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Error in financial chat:", error);
    return "I'm sorry, I'm having trouble processing your question right now. 😔";
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

export async function parseTransactionsFromText(text: string, availableCategories: string[]): Promise<{ expenses: Partial<Expense>[], income: Partial<Income>[] }> {
  try {
    const ai = getAI();
    const prompt = `Extract all financial transactions from the following raw text (likely from a Google Pay history or bank statement). 
    
    TEXT:
    """
    ${text}
    """
    
    RULES:
    1. Distinguish between Expenses (money going out) and Income (money coming in/refunds).
    2. IN INCOME: Look for keywords like "Received from", "Refunded", "Credit", "Cashback", "Added to balance", or positive numbers.
    3. IN EXPENSES: Look for keywords like "Paid to", "Sent to", "Debit", "Payment to", or negative numbers.
    4. For each transaction, extract: amount, description, and date.
    5. The DATE must be converted to an ISO 8601 string (e.g., 2026-04-21T12:00:00.000Z). Use the actual year from the text or 2026 if not specified.
    6. Categorize Expenses into exactly one of these categories: ${availableCategories.join(', ')}.
    7. Clean up descriptions (e.g., remove "Payment to", "Received from", "UPI Transaction ID", etc.).
    8. If a transaction is unclear or incomplete, ignore it.
    
    Return a JSON object with two arrays: 'expenses' and 'income'.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expenses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  amount: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING, enum: availableCategories },
                  date: { type: Type.STRING, description: "ISO 8601 string" }
                },
                required: ["amount", "description", "category", "date"]
              }
            },
            income: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  amount: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  date: { type: Type.STRING, description: "ISO 8601 string" }
                },
                required: ["amount", "description", "date"]
              }
            }
          },
          required: ["expenses", "income"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error parsing transactions from text:", error);
    return { expenses: [], income: [] };
  }
}
