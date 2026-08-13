import React, { useState } from "react";
import { Receipt, Zap } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dark" | "white";
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  onClick?: () => void;
  showIconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  variant = "default",
  showSubtitle = true,
  subtitleText = "Billing & Invoicing",
  className = "",
  onClick,
  showIconOnly = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const containerSizes = {
    sm: "h-7 w-7 rounded-lg",
    md: "h-9 w-9 rounded-xl",
    lg: "h-11 w-11 rounded-2xl",
    xl: "h-14 w-14 rounded-2xl",
  };

  const lucideIconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  };

  const titleSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const subtitleSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-[11px]",
    xl: "text-xs",
  };

  const titleColors = {
    default: "text-zinc-900 group-hover:text-brand-600",
    dark: "text-slate-900 group-hover:text-blue-600",
    white: "text-white group-hover:text-brand-200",
  };

  const subtitleColors = {
    default: "text-brand-600 font-bold uppercase tracking-widest",
    dark: "text-blue-600 font-bold uppercase tracking-widest",
    white: "text-brand-200 font-bold uppercase tracking-wider",
  };

  const badgeGradients = {
    default: "bg-gradient-to-br from-brand-600 via-indigo-600 to-blue-700 text-white shadow-xs border border-brand-500/20",
    dark: "bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 text-white shadow-xs border border-slate-700/50",
    white: "bg-white/15 backdrop-blur-md text-white border border-white/20 shadow-xs",
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 group shrink-0 select-none ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {/* App Brand Logo Image / SVG Icon Badge */}
      <div className={`relative flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-105 ${containerSizes[size]} ${badgeGradients[variant]}`}>
        {!imgError ? (
          <img
            src="/logo.svg"
            alt="BillIQ Logo"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full relative">
            <Receipt className={`${lucideIconSizes[size]} stroke-[2.2]`} />
            <Zap className="w-2.5 h-2.5 text-amber-300 absolute -top-0.5 -right-0.5 animate-pulse" />
          </div>
        )}
      </div>

      {!showIconOnly && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center">
            <span className={`font-black ${titleSizes[size]} tracking-tight leading-none ${titleColors[variant]} transition-colors`}>
              BillIQ
            </span>
          </div>
          {showSubtitle && (
            <p className={`${subtitleSizes[size]} ${subtitleColors[variant]} hidden sm:block mt-1 leading-none`}>
              {subtitleText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;

