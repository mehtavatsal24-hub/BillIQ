import React from "react";
import { motion } from "motion/react";
import { Globe, Plus, User as UserIcon, LogOut, HelpCircle } from "lucide-react";
import { Button } from "./Button";
import { Logo } from "./Logo";
import { openSupportModal } from "./ContactSupportModal";

interface HeaderProps {
  onNavigateHome?: () => void;
  logoUrl?: string;
  autoSaveTime?: string | null;
  step?: string;
  countryFlag?: string;
  currency?: string;
  onOpenProfile?: () => void;
  onNewBill?: () => void;
  user?: { displayName?: string | null; email?: string | null } | null;
  onLogout?: () => void;
  onOpenSupport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateHome,
  logoUrl = "/logo.png",
  autoSaveTime,
  step,
  countryFlag,
  currency = "INR",
  onOpenProfile,
  onNewBill,
  user,
  onLogout,
  onOpenSupport
}) => {
  const handleSupportClick = () => {
    if (onOpenSupport) {
      onOpenSupport();
    } else {
      openSupportModal({ subject: "App Header Support Inquiry" });
    }
  };

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-10 py-3">
      <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Logo onClick={onNavigateHome} />
        </motion.div>

        {/* Navigation / Action Group */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSupportClick}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 transition-colors border border-zinc-200 cursor-pointer"
            title="Contact Support"
          >
            <HelpCircle className="h-3.5 w-3.5 text-brand-600 shrink-0" />
            <span className="hidden sm:inline">Support</span>
          </button>

          {onNewBill && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={onNewBill}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs px-2.5 sm:px-3 text-xs sm:text-sm"
            >
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Bill</span>
              <span className="sm:hidden">Bill</span>
            </Button>
          )}

          {user && onLogout && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-zinc-200">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-700">
                <UserIcon className="w-3.5 h-3.5 text-brand-600" />
                <span className="max-w-[120px] truncate font-semibold">{user.displayName || user.email?.split('@')[0]}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors border border-red-200 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
