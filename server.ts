import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'spendwise-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      httpOnly: true
    }
  }));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not set in the environment.");
  }
  const genAI = new GoogleGenAI({ apiKey: apiKey || '' });

  // API Routes
  app.post('/api/ai/categorize', async (req, res) => {
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }
    const { description, availableCategories } = req.body;
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Categorize this expense description into one of these categories: ${availableCategories.join(', ')}. 
        Description: "${description}"`,
        config: {
          responseMimeType: "application/json",
        },
      });
      res.json(JSON.parse(response.text.replace(/```json|```/g, '')));
    } catch (error) {
      console.error("Error categorizing expense:", error);
      res.status(500).json({ error: "Failed to categorize" });
    }
  });

  app.post('/api/ai/predict', async (req, res) => {
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }
    const { expenses, budget } = req.body;
    try {
      const totalSpent = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const today = new Date();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const currentDay = today.getDate();
      
      const prompt = `Analyze these expenses and predict the end-of-month total.
      - Current Day of Month: ${currentDay}/${daysInMonth}
      - Monthly Budget: ₹${budget.monthlyLimit}
      - Total Spent So Far: ₹${totalSpent}
      - Recent Expenses: ${JSON.stringify(expenses.slice(-10))}
      
      Predict if the user will exceed their budget and provide a recommendation.`;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      res.json(JSON.parse(response.text.replace(/```json|```/g, '')));
    } catch (error) {
      console.error("Error predicting spending:", error);
      res.status(500).json({ error: "Failed to predict" });
    }
  });

  app.post('/api/ai/advice', async (req, res) => {
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }
    const { expenses, income, budget } = req.body;
    try {
      const totalSpent = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const totalIncome = income.reduce((sum: number, i: any) => sum + i.amount, 0);
      
      const prompt = `You are a strict but helpful financial coach. Analyze this user's monthly data and provide 3 concise, actionable pieces of advice.
      - Total Income: ₹${totalIncome}
      - Total Expenses: ₹${totalSpent}
      - Budget Limit: ₹${budget.monthlyLimit}
      - Expense Categories: ${JSON.stringify(expenses.reduce((acc: any, e: any) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>))}
      
      Your goal is to help the user increase savings. 
      1. Identify "useless" or excessive spending in Lifestyle categories (Eating Out, Movies, Misc).
      2. Suggest specific cuts to reach a higher savings goal.
      3. Be direct and firm if the user is overspending.
      
      Format your response as a single paragraph with clear bullet points using emojis.`;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      res.json({ advice: response.text });
    } catch (error) {
      console.error("Error getting advice:", error);
      res.status(500).json({ error: "Failed to get advice" });
    }
  });

  app.post('/api/ai/suggest-budget', async (req, res) => {
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }
    const { totalLimit, categories } = req.body;
    try {
      const prompt = `Suggest a budget distribution for a total monthly limit of ₹${totalLimit} across these categories: ${categories.join(', ')}.
      Follow a realistic distribution for a middle-class individual in India. 
      Prioritize:
      1. Fixed Costs (Rent, EMI)
      2. Essential Living (Groceries, Utilities, Transport)
      3. Savings (Trip Fund, Emergency Buffer)
      4. Minimize Lifestyle (Eating Out, Misc) to maximize savings.
      
      Ensure the sum of all category limits exactly equals ₹${totalLimit}.`;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      res.json(JSON.parse(response.text.replace(/```json|```/g, '')));
    } catch (error) {
      console.error("Error suggesting budget:", error);
      res.status(500).json({ error: "Failed to suggest budget" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
