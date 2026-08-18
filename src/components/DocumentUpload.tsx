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
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [mergeSimilar, setMergeSimilar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    setProcessingStatus("Extracting line items & specs with AI...");
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
      setProcessingStatus("");
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
    if (disabled || isProcessing) return;

    // Check if target is inside an input or outside textarea
    const target = e.target as HTMLElement;
    const isInsideOtherInput = target && target.tagName === "INPUT";
    const isInsideOtherTextarea = target && target.tagName === "TEXTAREA" && target !== textareaRef.current;
    if (isInsideOtherInput || isInsideOtherTextarea || target?.isContentEditable) {
      return;
    }

    // 1. Direct file from clipboardData.files (e.g. copied image or PDF file)
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file && (file.type.startsWith("image/") || file.type === "application/pdf" || file.name.match(/\.(png|jpe?g|webp|pdf|docx?|xlsx?|csv)$/i))) {
        e.preventDefault();
        await processFile(file);
        return;
      }
    }

    // 2. Direct file item from clipboardData.items (e.g. screenshot or image data)
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1 || item.type === "application/pdf") {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await processFile(file);
            return;
          }
        }
      }
    }

    // 3. Text pasted directly when NOT inside the paste textarea
    if (target !== textareaRef.current) {
      const text = e.clipboardData?.getData("text");
      if (text && text.trim().length > 3) {
        e.preventDefault();
        setIsProcessing(true);
        setProcessingStatus("Extracting line items from pasted text...");
        try {
          const analysis = await analyzeTextContent(text.trim(), industry, businessName);
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
          setProcessingStatus("");
        }
      }
    }
  };

  const handleManualTextAnalysis = async () => {
    if (!pastedText.trim() || disabled) return;
    setIsProcessing(true);
    setProcessingStatus("Extracting line items & specs with AI...");
    try {
      const analysis = await analyzeTextContent(pastedText.trim(), industry, businessName);
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
      setProcessingStatus("");
    }
  };

  const handleClipboardPasteClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setPastedText(clipText);
          if (textareaRef.current) textareaRef.current.focus();
        }
      }
    } catch (err) {
      console.warn("Clipboard read permission denied:", err);
    }
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [disabled, isProcessing, industry, businessName, mergeSimilar]);

  useEffect(() => {
    if (showPasteArea && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showPasteArea]);

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
            <span className="text-xs font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
              <Clipboard className="h-3.5 w-3.5 text-brand-600" />
              Paste document content
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2 font-bold text-zinc-700 bg-white"
                onClick={handleClipboardPasteClick}
                title="Paste directly from clipboard"
              >
                Paste from Clipboard
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-600" onClick={() => setShowPasteArea(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            className="w-full h-40 p-4 text-xs font-mono border border-zinc-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 bg-white transition-all outline-none resize-none"
            placeholder="Paste text from PO, Quote, WhatsApp order, Email or RFQ here... (Press Ctrl+Enter to analyze)"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleManualTextAnalysis();
              }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-600">
              {pastedText.length > 0 ? `${pastedText.length} characters` : "Press Ctrl+Enter to start"}
            </span>
            <Button 
              size="sm" 
              className="font-black uppercase tracking-widest px-6" 
              onClick={handleManualTextAnalysis}
              isLoading={isProcessing}
              disabled={!pastedText.trim()}
            >
              Start Smart Analysis
            </Button>
          </div>
        </div>
      )}

      {/* Processing Status Banner */}
      {isProcessing && (
        <div className="mt-2 flex items-center justify-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold rounded-xl p-3 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          <span>{processingStatus || "Analyzing document with AI..."}</span>
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

      {/* High-Capacity Extraction Note */}
      <div className="mt-2 text-[11px] text-zinc-600 bg-zinc-50 border border-zinc-200/80 rounded-xl p-2.5 shadow-2xs flex items-start gap-2">
        <p className="leading-snug">
          <span className="font-bold text-zinc-900">High-Resolution OCR:</span> Supports multi-page PDFs, spreadsheets, and dense documents with 200+ line items without truncation. Small table fonts are preserved at up to 4K resolution.
        </p>
      </div>
    </div>
  );
};
