import React, { useState, useEffect, useRef } from "react";
import { Search, UserPlus, Check, ChevronDown } from "lucide-react";
import { SavedCustomer, CustomerDetails } from "../types";
import { Input } from "./Input";
import { Button } from "./Button";

interface CustomerSelectorProps {
  customers: SavedCustomer[];
  onSelect: (customer: SavedCustomer) => void;
  currentValue: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  onAddNew?: () => void;
  currentUserId?: string;
}

export const CustomerSelector = ({ 
  customers, 
  onSelect, 
  currentValue, 
  onChange,
  label = "Customer Name",
  placeholder = "Search or enter new company name",
  disabled = false,
  onAddNew,
  currentUserId
}: CustomerSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(currentValue);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const entityType = label.toLowerCase().includes("supplier") ? "Supplier" : "Customer";

  useEffect(() => {
    setSearchTerm(currentValue);
  }, [currentValue]);

  const filteredCustomers = customers.filter((c: any) => {
    if (currentUserId && c.userId && c.userId !== currentUserId) return false;
    if (!searchTerm || searchTerm === currentValue) return true;
    const name = (c.name || "").toLowerCase();
    const term = (searchTerm || "").toLowerCase();
    return name.includes(term);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Input
        id="party-search-input"
        label={label}
        value={currentValue}
        onChange={(e) => {
          onChange(e.target.value);
          setSearchTerm(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => !disabled && setIsOpen(true)}
        placeholder={placeholder}
        className="pr-10"
        disabled={disabled}
      />
      <div className="absolute right-3 top-[34px] text-zinc-400">
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {!disabled && isOpen && (filteredCustomers.length > 0 || searchTerm.length > 0) && (
        <div className="absolute z-50 left-0 right-0 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto py-1 divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in slide-in-from-top-1 duration-150">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between group transition-colors"
                onClick={() => {
                  onSelect(customer);
                  setIsOpen(false);
                }}
              >
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{customer.name}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{customer.gstin || "No Tax ID"}</p>
                </div>
                <Check className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100" />
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 bg-slate-900/90 border border-slate-700 rounded-md">
              <p>No matching {entityType.toLowerCase()} found</p>
              <button
                type="button"
                onClick={() => {
                  if (onAddNew) onAddNew();
                  setIsOpen(false);
                }}
                className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded inline-flex items-center gap-1 transition-colors"
              >
                + Add as New {entityType}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
