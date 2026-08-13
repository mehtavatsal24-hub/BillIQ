import { useState, useRef, useEffect } from "react";
import { Camera, FileText, Loader2, X, Upload, Clipboard } from "lucide-react";
import { Button } from "./Button";
import { analyzeDocument, analyzeTextContent, getFriendlyGeminiError } from "../services/geminiService";
import { AIDocumentAnalysis, DocumentHistoryItem } from "../types";

interface DocumentUploadProps {
  onAnalysisComplete: (analysis: AIDocumentAnalysis, mergeSimilar: boolean) => void;
  onError?: (message: string) => void;
  industry?: string;
  history?: DocumentHistoryItem[];
  letterhead?: string;
  businessName?: string;
  disabled?: boolean;
  showMergeOption?: boolean;
}

export const DocumentUpload = ({ 
  onAnalysisComplete, 
  onError, 
  industry, 
  history, 
  letterhead, 
  businessName, 
  disabled = false,
  showMergeOption = true,
}: DocumentUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergeSimilar, setMergeSimilar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showError = (msg: string) => {
    if (onError) {
      onError(msg);
    } else {
      alert(msg);
    }
  };

  const processFile = async (file: File) => {
    if (disabled) return;
    setIsProcessing(true);
    try {
      const analysis = await analyzeDocument(file, industry, history, letterhead, businessName);
      if (analysis) {
        if ((analysis.products && analysis.products.length > 0) || analysis.customer) {
          onAnalysisComplete(analysis, mergeSimilar);
        } else {
          showError("No products or customer details could be extracted from this document.");
        }
      } else {
        showError("Document analysis returned empty results.");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      const friendlyMsg = getFriendlyGeminiError(error);
      showError(friendlyMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    if (disabled || isProcessing || showPasteArea) return;

    // Skip if focus is in an input or textarea to avoid interfering with normal text editing
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1 || items[i].type === "application/pdf") {
        const file = items[i].getAsFile();
        if (file) {
          await processFile(file);
          return;
        }
      }
    }

    // Handled as text if no files found
    const text = e.clipboardData?.getData("text");
    if (text && text.length > 20) {
      // Automatic detection of long text for analysis
      setIsProcessing(true);
      try {
        const analysis = await analyzeTextContent(text, industry, businessName);
        if (analysis && ((analysis.products && analysis.products.length > 0) || analysis.customer)) {
          onAnalysisComplete(analysis, mergeSimilar);
        } else {
          showError("No products or customer details could be extracted from this text.");
        }
      } catch (error: any) {
        console.error("Paste text error:", error);
        const friendlyMsg = getFriendlyGeminiError(error);
        showError(friendlyMsg);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleManualTextAnalysis = async () => {
    if (!pastedText.trim() || disabled) return;
    setIsProcessing(true);
    try {
      const analysis = await analyzeTextContent(pastedText, industry, businessName);
      if (analysis && ((analysis.products && analysis.products.length > 0) || analysis.customer)) {
        onAnalysisComplete(analysis, mergeSimilar);
        setShowPasteArea(false);
        setPastedText("");
      } else {
        showError("No products or customer details could be extracted from this text.");
      }
    } catch (error: any) {
      console.error("Manual text analysis error:", error);
      const friendlyMsg = getFriendlyGeminiError(error);
      showError(friendlyMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [disabled, isProcessing, industry, businessName, mergeSimilar]);

  return (
    <div 
      className={`relative flex flex-col gap-2 p-4 rounded-xl border-2 border-dashed transition-all bg-white ${
        isDragging ? "border-brand-500 bg-brand-50/50 scale-[1.02] shadow-xl" : "border-zinc-200 hover:border-brand-400 hover:bg-zinc-50/50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-brand-100 text-brand-600' : 'bg-zinc-100 text-zinc-500'}`}>
          <Upload className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-zinc-700">Drag & Drop Document Here</p>
        <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-extrabold">OR PASTE (CTRL+V) ANYWHERE</p>
      </div>

      <div className="flex items-center gap-2 justify-center flex-wrap mt-2">
        <input
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={disabled}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute("capture");
              fileInputRef.current.click();
            }
          }}
          isLoading={isProcessing}
          className="px-6 font-bold"
          disabled={disabled}
        >
          Select File
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPasteArea(!showPasteArea)}
          title="Paste Text Content"
          className={`font-bold ${showPasteArea ? "bg-zinc-100 border-zinc-400" : ""}`}
          disabled={disabled || isProcessing}
        >
          <Clipboard className="h-4 w-4 mr-2" />
          Paste Text
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.setAttribute("capture", "environment");
              fileInputRef.current.click();
            }
          }}
          isLoading={isProcessing}
          title="Camera"
          disabled={disabled}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      {showPasteArea && (
        <div className="mt-4 flex flex-col gap-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Paste document content</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-600" onClick={() => setShowPasteArea(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <textarea
            className="w-full h-40 p-4 text-xs font-mono border border-zinc-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 bg-white transition-all outline-none resize-none"
            placeholder="Paste text from PO, Quote, Email or RFQ here..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <Button 
            size="sm" 
            className="w-full font-black uppercase tracking-widest py-4" 
            onClick={handleManualTextAnalysis}
            isLoading={isProcessing}
            disabled={!pastedText.trim()}
          >
            Start Smart Analysis
          </Button>
        </div>
      )}

      {(showMergeOption || isDragging) && (
        <div className="flex items-center justify-between w-full mt-3 pt-3 border-t border-zinc-100 flex-wrap gap-2">
          {showMergeOption && (
            <label className={`flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-zinc-400 transition-colors ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-zinc-600"}`}>
              <input 
                type="checkbox" 
                checked={mergeSimilar} 
                onChange={(e) => setMergeSimilar(e.target.checked)}
                className="rounded border-zinc-300 h-3.5 w-3.5 text-brand-600 focus:ring-brand-500"
                disabled={disabled}
              />
              Merge same products
            </label>
          )}
          {isDragging && (
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-600 animate-pulse">Release to analyze!</span>
          )}
        </div>
      )}

      {/* Note for 50-70+ line items batch screenshots */}
      <div className="mt-2 text-[11px] text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 shadow-2xs">
        <p className="leading-snug">
          <span className="font-bold">Pro Tip:</span> If you have a document with 50-70+ line items, we highly recommend taking screenshots of 30-40 items at a time and performing multiple batch uploads for higher extraction accuracy and speed.
        </p>
      </div>
    </div>
  );
};
