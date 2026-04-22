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
        setError("AI could not detect clear transactional patterns. Please ensure the statement text is legible.");
      } else {
        setPreview(result);
      }
    } catch (err) {
      setError("Neural extraction interrupted. Check your link and retry.");
    } finally {
      setIsParsing(false);
    }
  };

  const isDuplicate = (t: Partial<Expense | Income>, existingList: (Expense | Income)[]) => {
    const tDate = t.date ? new Date(t.date) : null;
    if (!tDate || isNaN(tDate.getTime())) return false;
    const normalizedTDate = new Date(tDate).setHours(0, 0, 0, 0);
    return existingList.some(item => {
      const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
      return item.amount === t.amount && 
        item.description.trim().toLowerCase() === t.description?.trim().toLowerCase() &&
        itemDate === normalizedTDate;
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="w-full max-w-xl bg-brand-gray-light rounded-[48px] shadow-[0_40px_120px_rgba(0,0,0,0.5)] border border-white relative overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Section */}
        <div className="p-8 sm:p-10 bg-white border-b border-brand-gray-light flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-brand-black rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-brand-accent" />
             </div>
             <div>
                <h2 className="text-2xl font-display font-medium tracking-tight text-brand-black">Intelligence Sync</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-muted opacity-40 mt-1">Multi-Format Transaction Extraction</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-brand-gray-light rounded-xl flex items-center justify-center text-brand-gray-muted hover:text-brand-black transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-8 custom-scrollbar">
          {!preview ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Feature Highlight */}
              <div className="p-6 bg-white rounded-3xl border border-brand-gray-light shadow-sm flex gap-4">
                <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center shrink-0">
                   <Info className="w-5 h-5 text-brand-accent" />
                </div>
                <p className="text-sm font-medium text-brand-gray-muted leading-relaxed">
                  Provide any raw bank statement, GPay snippet, or PDF export. The system will handle sanitization and categorization automatically.
                </p>
              </div>

              {/* Data Input Area */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gray-muted px-2">Terminal Input</label>
                <textarea 
                   value={text}
                   onChange={(e) => setText(e.target.value)}
                   placeholder="Paste statement logs or raw activity data..."
                   className="w-full h-48 bg-white border border-brand-gray-light rounded-[32px] p-8 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-black/5 transition-all font-mono leading-relaxed shadow-inner"
                />
              </div>

              {/* Advanced Dropzone */}
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-[40px] p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group",
                  isDragActive ? "border-brand-accent bg-brand-accent/5" : "border-brand-gray-light hover:border-brand-black bg-white/50"
                )}
              >
                <input {...getInputProps()} />
                <motion.div 
                  animate={isDragActive ? { y: [0, -10, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shadow-lg border border-brand-gray-light group-hover:scale-110 transition-transform"
                >
                  <Upload className="w-7 h-7 text-brand-gray-muted" />
                </motion.div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-black">
                    {isDragActive ? "Release to Analyze" : isExtractingPDF ? "Decrypting PDF..." : "External Document Drop"}
                  </p>
                  <p className="text-[10px] text-brand-gray-muted mt-2 font-medium">Supports PDF, CSV, TXT exports</p>
                </div>
              </div>

              {error && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="p-5 bg-red-50 text-red-600 rounded-[24px] text-[10px] font-black uppercase tracking-widest flex items-center gap-4 border border-red-100 shadow-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gray-muted">Validation Queue ({preview.expenses.length + preview.income.length})</h3>
                 <button onClick={() => setPreview(null)} className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent hover:underline">Re-examine Input</button>
              </div>
              
              <div className="space-y-3">
                {preview.expenses.map((exp, idx) => {
                  const duplicate = isDuplicate(exp, existingExpenses);
                  return (
                    <div key={`exp-${idx}`} className={cn(
                      "p-6 rounded-[28px] border transition-all flex items-center justify-between",
                      duplicate ? "bg-brand-gray-light/40 border-brand-gray-light grayscale opacity-50" : "bg-white border-brand-gray-light hover:shadow-lg"
                    )}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-display font-bold text-brand-black">{exp.description}</p>
                          {duplicate && <span className="text-[9px] font-black uppercase tracking-widest text-brand-gray-muted bg-white px-3 py-1 rounded-full border border-brand-gray-light">Sync Conflict</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray-muted bg-brand-gray-light/50 px-2 py-0.5 rounded-md">{exp.category}</span>
                           <span className="text-[10px] font-medium text-brand-gray-muted">
                             {exp.date && !isNaN(new Date(exp.date).getTime()) ? format(new Date(exp.date), 'MMM dd, yyyy') : 'Indeterminate Date'}
                           </span>
                        </div>
                      </div>
                      <span className="text-xl font-display font-medium text-brand-black shrink-0 ml-4">-{exp.amount?.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
                {preview.income.map((inc, idx) => {
                  const duplicate = isDuplicate(inc, existingIncome);
                  return (
                    <div key={`inc-${idx}`} className={cn(
                      "p-6 rounded-[28px] border transition-all flex items-center justify-between",
                      duplicate ? "bg-brand-gray-light/40 border-brand-gray-light grayscale opacity-50" : "bg-indigo-50/50 border-indigo-100 hover:shadow-lg"
                    )}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-display font-bold text-brand-black">{inc.description}</p>
                          {duplicate && <span className="text-[9px] font-black uppercase tracking-widest text-brand-gray-muted bg-white px-3 py-1 rounded-full border border-brand-gray-light">Sync Conflict</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-100/50 px-2 py-0.5 rounded-md">Credit</span>
                           <span className="text-[10px] font-medium text-brand-gray-muted">
                             {inc.date && !isNaN(new Date(inc.date).getTime()) ? format(new Date(inc.date), 'MMM dd, yyyy') : 'Indeterminate Date'}
                           </span>
                        </div>
                      </div>
                      <span className="text-xl font-display font-medium text-indigo-600 shrink-0 ml-4">+{inc.amount?.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-8 sm:p-10 bg-white border-t border-brand-gray-light">
          {!preview ? (
            <button
              onClick={handleParse}
              disabled={!text.trim() || isParsing}
              className="btn-primary w-full h-20 text-sm"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Neural Extraction in Progress...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Apply Intelligence
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="btn-primary w-full h-20 text-sm !bg-indigo-600 !shadow-indigo-600/20"
            >
              <CheckCircle2 className="w-6 h-6" />
              Commit Extraction
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
