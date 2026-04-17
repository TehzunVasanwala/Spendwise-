import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage, Expense, Income, Budget } from '../types';
import { getFinancialChatResponse } from '../services/geminiService';
import { cn } from '../lib/utils';

interface FinancialChatProps {
  expenses: Expense[];
  income: Income[];
  budget: Budget;
}

export default function FinancialChat({ expenses, income, budget }: FinancialChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getFinancialChatResponse(input, messages, { expenses, income, budget });
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 left-6 w-14 h-14 bg-brand-black text-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-accent rounded-full border-2 border-white animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-brand-black/40 backdrop-blur-xl"
            />

            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white h-[90vh] sm:h-[700px] flex flex-col rounded-t-[48px] sm:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-brand-black p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                    <Sparkles className="w-6 h-6 text-brand-accent" />
                  </div>
                  <div>
                    <h3 className="text-white font-display font-bold text-xl tracking-tight leading-none">Financial Intelligence</h3>
                    <p className="text-brand-gray-muted text-[10px] uppercase font-bold tracking-[0.2em] mt-2">Gemini 3.0 Real-time</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-brand-gray-muted hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Chat Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth custom-scrollbar"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-8 opacity-40 px-10">
                    <div className="w-20 h-20 bg-brand-gray-light rounded-[32px] flex items-center justify-center shadow-inner">
                      <Sparkles className="w-10 h-10 text-brand-black/20" />
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-bold text-brand-black leading-tight">Secure Financial Bridge</h4>
                      <p className="text-xs font-medium text-brand-gray-muted mt-2">Analyze spending patterns, project future balance, or optimize your budget via secure LLM interaction.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 w-full max-w-sm mt-4">
                      {[
                        "Analyze this week's spending",
                        "Prediction of month-end balance",
                        "Optimization tips for my utility spend",
                        "Breakdown of recent major purchases"
                      ].map((hint) => (
                        <button
                          key={hint}
                          onClick={() => setInput(hint)}
                          className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-black bg-brand-gray-light py-3.5 px-6 rounded-2xl hover:bg-brand-black hover:text-white transition-all duration-300 shadow-sm"
                        >
                          "{hint}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex gap-4",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                      msg.role === 'user' ? "bg-brand-black" : "bg-brand-accent shadow-[0_0_15px_rgba(0,122,255,0.3)]"
                    )}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                    </div>
                    <div className={cn(
                      "max-w-[85%] p-5 rounded-[24px] text-[13px] font-semibold leading-relaxed shadow-sm",
                      msg.role === 'user' 
                        ? "bg-brand-black text-white rounded-tr-none" 
                        : "bg-brand-gray-light text-brand-black rounded-tl-none border border-brand-gray-light"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-brand-accent rounded-2xl flex items-center justify-center shrink-0 animate-pulse shadow-[0_0_15px_rgba(0,122,255,0.3)]">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-brand-gray-light/50 p-6 rounded-[24px] rounded-tl-none border border-brand-gray-light">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-8 bg-white border-t border-brand-gray-light shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative group"
                >
                  <input 
                    autoFocus
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Inquire about habits, limits, or streaks..."
                    className="w-full bg-brand-gray-light/50 border-none rounded-[28px] py-5 pl-8 pr-16 text-sm font-bold focus:ring-2 focus:ring-brand-black transition-all outline-none placeholder:text-brand-gray-muted/50"
                  />
                  <button
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-brand-black text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-10 shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
