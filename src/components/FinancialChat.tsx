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
        className="fixed bottom-24 right-6 w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
      >
        <Bot className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-gray-50 h-[85vh] sm:h-[600px] flex flex-col rounded-t-[40px] sm:rounded-[40px] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-black p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold leading-tight">Financial Assistant</h3>
                    <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Always Learning</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Chat Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50 px-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-[24px] flex items-center justify-center">
                      <Bot className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">How can I help you today?</h4>
                      <p className="text-sm">Ask me about your spending, budget, or for tips to save more.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 w-full mt-4">
                      {[
                        "How much did I spend this week?",
                        "Can I afford to buy a bike?",
                        "Give me 3 tips to save money.",
                        "What is my biggest expense?"
                      ].map((hint) => (
                        <button
                          key={hint}
                          onClick={() => setInput(hint)}
                          className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 py-2 px-4 rounded-xl hover:bg-indigo-100 transition-colors"
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
                      "flex gap-3",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                      msg.role === 'user' ? "bg-black" : "bg-indigo-600"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed",
                      msg.role === 'user' ? "bg-black text-white rounded-tr-none" : "bg-white text-gray-900 shadow-sm border border-gray-100 rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                      <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-gray-100">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative"
                >
                  <input 
                    autoFocus
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="w-full bg-gray-50 border-none rounded-[24px] py-4 pl-6 pr-14 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                  />
                  <button
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
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
