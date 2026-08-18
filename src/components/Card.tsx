import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  return (
    <div 
      className={cn("bg-white border border-zinc-200 rounded-3xl shadow-xl shadow-zinc-200/40 transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-300/50", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, children, className }: { title?: string; subtitle?: string; action?: React.ReactNode; children?: React.ReactNode; className?: string }) => {
  if (children) {
    return (
      <div className={cn("px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30 rounded-t-3xl", className)}>
        {children}
      </div>
    );
  }
  return (
    <div className={cn("px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30 rounded-t-3xl", className)}>
      <div>
        <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-zinc-500 mt-1 font-medium">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

export const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <h3 className={cn("text-base font-extrabold text-zinc-900 tracking-tight", className)}>{children}</h3>;
};

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn("p-8", className)}>{children}</div>;
};
