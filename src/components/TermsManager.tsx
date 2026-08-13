import React, { useState } from "react";
import { Check, X, Zap, Eye, EyeOff } from "lucide-react";

interface TermsManagerProps {
  terms: string;
  onChange: (newTerms: string) => void;
  onClearAll?: () => void;
  showTerms?: boolean;
  onToggleShowTerms?: () => void;
}

export const TermsManager: React.FC<TermsManagerProps> = ({
  terms,
  onChange,
  onClearAll,
  showTerms = true,
  onToggleShowTerms
}) => {
  const [newClauseInput, setNewClauseInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isRawTextMode, setIsRawTextMode] = useState(false);

  // Parse terms string into individual clauses
  const parseClauses = (str: string): string[] => {
    if (!str || !str.trim()) return [];
    return str
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^\d+[\.\)]\s*/, "")); // Strip "1. " or "1) " prefix
  };

  // Convert array of clauses back to numbered terms string
  const formatClausesToString = (clausesArr: string[]): string => {
    return clausesArr
      .map((clause, idx) => `${idx + 1}. ${clause.trim()}`)
      .join("\n");
  };

  const clauses = parseClauses(terms);

  const handleAddClause = () => {
    if (!newClauseInput.trim()) return;
    const updated = [...clauses, newClauseInput.trim()];
    onChange(formatClausesToString(updated));
    setNewClauseInput("");
  };

  const handleRemoveClause = (index: number) => {
    const updated = clauses.filter((_, i) => i !== index);
    onChange(formatClausesToString(updated));
  };

  const handleStartEdit = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditingText(currentText);
  };

  const handleSaveEdit = (index: number) => {
    if (!editingText.trim()) {
      handleRemoveClause(index);
    } else {
      const updated = [...clauses];
      updated[index] = editingText.trim();
      onChange(formatClausesToString(updated));
    }
    setEditingIndex(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    } else {
      onChange("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
            TERMS & CONDITIONS
          </label>
          {onToggleShowTerms && (
            <button
              type="button"
              onClick={onToggleShowTerms}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                showTerms
                  ? "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200"
              }`}
              title={showTerms ? "Terms are visible in PDF" : "Terms are hidden from PDF"}
            >
              {showTerms ? (
                <Eye className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              )}
              <span>{showTerms ? "Show" : "Hide"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsRawTextMode(!isRawTextMode)}
            className="text-[10px] text-zinc-400 hover:text-zinc-600 underline font-medium ml-1 cursor-pointer"
          >
            {isRawTextMode ? "Switch to Clause Editor" : "Raw Text"}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleClearAll}
            className="font-bold text-red-500 hover:text-red-700 uppercase tracking-wider text-[11px] focus:outline-none transition-colors cursor-pointer"
          >
            CLEAR ALL
          </button>
        </div>
      </div>

      {isRawTextMode ? (
        <textarea
          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-zinc-900/5 resize-none"
          placeholder="Add standard terms and conditions..."
          value={terms ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="space-y-3">
          {/* Input Row for adding new terms: [ Insert extra terms... ] [ Add ] */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Insert extra terms..."
              value={newClauseInput}
              onChange={(e) => setNewClauseInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddClause();
                }
              }}
              className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 placeholder:text-zinc-400 shadow-xs"
            />
            <button
              type="button"
              onClick={handleAddClause}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-all shadow-xs active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
            >
              Add
            </button>
          </div>

          {/* Clauses List */}
          <div className="bg-zinc-50/50 border border-zinc-200/80 rounded-xl divide-y divide-zinc-200/60 overflow-hidden shadow-xs">
            {clauses.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 italic">
                No terms & conditions clauses added. Type a term above and click Add, or click <span className="font-semibold text-zinc-600">USE MOST REGULAR</span> to populate standard terms.
              </div>
            ) : (
              clauses.map((clause, index) => (
                <div
                  key={index}
                  className="group px-4 py-3 flex items-start justify-between gap-4 hover:bg-white transition-colors"
                >
                  {editingIndex === index ? (
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-sm font-semibold text-zinc-400 shrink-0">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(index);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        autoFocus
                        className="flex-1 px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(index)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md cursor-pointer"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-md cursor-pointer"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-zinc-700 font-normal leading-relaxed flex-1">
                        <span className="font-semibold text-zinc-900 mr-1.5">
                          {index + 1}.
                        </span>
                        {clause}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(index, clause)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-zinc-300 text-xs">|</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveClause(index)}
                          className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
