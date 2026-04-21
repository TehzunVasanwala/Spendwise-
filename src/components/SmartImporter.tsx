import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, Sparkles, Loader2, CheckCircle2, AlertCircle, Info, FileCode } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { parseTransactionsFromText } from '../services/geminiService';
import { Expense, Income } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { sound } from '../services/soundService';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SmartImporterProps {
  onClose: () => void;
  onImport: (expenses: Partial<Expense>[], income: Partial<Income>[]) => void;
  categories: string[];
  existingExpenses: Expense[];
  existingIncome: Income[];
}

export default function SmartImporter({ onClose, onImport, categories, existingExpenses, existingIncome }: SmartImporterProps) {
  const [text, setText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ expenses: Partial<Expense>[], income: Partial<Income>[] } | null>(null);

  const extractTextFromPDF = async (file: File) => {
    setIsExtractingPDF(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      setText(fullText);
      sound.playClick();
    } catch (err) {
      console.error("PDF Extraction Error:", err);
      setError("Failed to read PDF. Make sure it's not password protected.");
    } finally {
      setIsExtractingPDF(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      extractTextFromPDF(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
        sound.playClick();
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const handleParse = async () => {
    if (!text.trim()) return;
    setIsParsing(true);
    setError(null);
    sound.playClick();

    try {
      const result = await parseTransactionsFromText(text, categories);
      if (result.expenses.length === 0 && result.income.length === 0) {
        setError("Could not find any clear transactions in the text. Try pasting raw transaction logs or a clearer statement.");
      } else {
        setPreview(result);
      }
    } catch (err) {
      setError("AI parsing failed. Please check your internet connection.");
    } finally {
      setIsParsing(false);
    }
  };

  const isDuplicate = (t: Partial<Expense | Income>, existingList: (Expense | Income)[]) => {
    const tDate = t.date ? new Date(t.date) : null;
    if (!tDate || isNaN(tDate.getTime())) return false;

    return existingList.some(item => {
      const itemDate = new Date(item.date);
      return item.amount === t.amount && 
        item.description.trim().toLowerCase() === t.description?.trim().toLowerCase() &&
        itemDate.toDateString() === tDate.toDateString();
    });
  };

  const handleConfirm = () => {
    if (preview) {
      onImport(preview.expenses, preview.income);
      sound.playIncome();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-brand-black/40 backdrop-blur-3xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-white rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-brand-gray-light relative p-8 sm:p-10 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-brand-black flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-accent animate-pulse" />
              Smart Importer
            </h2>
            <p className="text-xs font-bold text-brand-gray-muted uppercase tracking-[0.1em] mt-1">AI-Powered Transaction Sync</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-brand-gray-light rounded-2xl text-brand-gray-muted hover:text-brand-black transition-all hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {!preview ? (
            <>
              {/* Info Box */}
              <div className="p-5 bg-brand-accent/5 rounded-3xl border border-brand-accent/10 flex gap-4">
                <Info className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-brand-black/70 leading-relaxed">
                  Google Pay doesn't have an automatic link, but you can copy your <b>Activity History</b> and paste it here. Our AI will intelligently extract the amounts and categories for you.
                </p>
              </div>

              {/* Paste Area */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-widest px-1">Paste Raw Text / Activity</label>
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste GPay activity text here..."
                  className="w-full h-40 bg-brand-gray-light/30 border-2 border-brand-gray-light rounded-[32px] p-6 text-sm resize-none focus:outline-none focus:border-brand-black transition-all font-mono"
                />
              </div>

              {/* Dropzone */}
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer",
                  isDragActive ? "border-brand-accent bg-brand-accent/5" : "border-brand-gray-light hover:border-brand-black"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 bg-brand-gray-light rounded-2xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-brand-gray-muted" />
                </div>
                <p className="text-xs font-bold text-brand-gray-muted uppercase tracking-widest text-center">
                  {isDragActive ? "Drop to Scan" : isExtractingPDF ? "Reading PDF..." : "Or drop PDF/CSV/Text file"}
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Preview List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-bold text-brand-gray-muted uppercase tracking-widest">Detected Transactions ({preview.expenses.length + preview.income.length})</h3>
                  <button onClick={() => setPreview(null)} className="text-[10px] font-bold text-brand-accent uppercase tracking-widest hover:underline">Edit Input</button>
                </div>
                
                <div className="space-y-3">
                  {preview.expenses.map((exp, idx) => {
                    const duplicate = isDuplicate(exp, existingExpenses);
                    return (
                      <div key={`exp-${idx}`} className={cn(
                        "p-5 rounded-3xl border transition-all flex items-center justify-between",
                        duplicate ? "bg-brand-gray-light/20 border-brand-gray-light grayscale opacity-60" : "bg-brand-gray-light/30 border-transparent hover:border-brand-gray-light"
                      )}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-brand-black">{exp.description}</p>
                            {duplicate && <span className="text-[8px] font-black uppercase tracking-widest text-brand-gray-muted bg-white px-2 py-0.5 rounded-full border border-brand-gray-light">Duplicate</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-brand-gray-muted px-2 py-0.5 bg-white rounded-lg inline-block">{exp.category}</span>
                            <span className="text-[9px] font-medium text-brand-gray-muted">
                              {exp.date && !isNaN(new Date(exp.date).getTime()) 
                                ? format(new Date(exp.date), 'MMM dd, yyyy') 
                                : 'No Date'}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-display font-bold text-red-500 shrink-0 ml-4">-₹{exp.amount}</span>
                      </div>
                    );
                  })}
                  {preview.income.map((inc, idx) => {
                    const duplicate = isDuplicate(inc, existingIncome);
                    return (
                      <div key={`inc-${idx}`} className={cn(
                        "p-5 rounded-3xl border transition-all flex items-center justify-between",
                        duplicate ? "bg-brand-gray-light/20 border-brand-gray-light grayscale opacity-60" : "bg-brand-accent/5 border-brand-accent/10 hover:border-brand-accent/30"
                      )}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-brand-black">{inc.description}</p>
                            {duplicate && <span className="text-[8px] font-black uppercase tracking-widest text-brand-gray-muted bg-white px-2 py-0.5 rounded-full border border-brand-gray-light">Duplicate</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-brand-accent px-2 py-0.5 bg-white rounded-lg inline-block">Income</span>
                            <span className="text-[9px] font-medium text-brand-gray-muted">
                              {inc.date && !isNaN(new Date(inc.date).getTime()) 
                                ? format(new Date(inc.date), 'MMM dd, yyyy') 
                                : 'No Date'}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-display font-bold text-brand-accent shrink-0 ml-4">+₹{inc.amount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-8 border-t border-brand-gray-light">
          {!preview ? (
            <button
              onClick={handleParse}
              disabled={!text.trim() || isParsing}
              className="w-full h-16 bg-brand-black text-white rounded-[24px] font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI Syncing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Initialize AI Extraction
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="w-full h-16 bg-brand-accent text-white rounded-[24px] font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(242,125,38,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              Commit Transactions
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
