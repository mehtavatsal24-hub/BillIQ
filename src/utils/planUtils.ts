export interface PlanDetails {
  tier: "free_trial" | "free_tier" | "pro" | "enterprise" | "expired";
  badgeText: string;
  shortLabel: string;
  badgeBg: string;
  badgeTextColor: string;
  badgeBorderColor: string;
  badgeHoverBg: string;
  documentLimit: number;
  isUnlimited: boolean;
  description: string;
}

export const getPlanDetails = (planStr?: string): PlanDetails => {
  const p = (planStr || "").toLowerCase();

  if (p.includes("expired")) {
    return {
      tier: "expired",
      badgeText: "Trial Expired",
      shortLabel: "Trial Expired",
      badgeBg: "bg-red-50",
      badgeTextColor: "text-red-700",
      badgeBorderColor: "border-red-200 shadow-xs",
      badgeHoverBg: "hover:bg-red-100",
      documentLimit: 0,
      isUnlimited: false,
      description: "Trial Expired - Free trial limit consumed"
    };
  } else if (p.includes("enterprise") || p.includes("admin")) {
    return {
      tier: "enterprise",
      badgeText: "Enterprise Plan",
      shortLabel: "Enterprise Plan",
      badgeBg: "bg-purple-50",
      badgeTextColor: "text-purple-700",
      badgeBorderColor: "border-purple-200 shadow-xs",
      badgeHoverBg: "hover:bg-purple-100",
      documentLimit: Infinity,
      isUnlimited: true,
      description: "Enterprise Plan - Unlimited Documents & Premium Support"
    };
  } else if (p.includes("pro")) {
    return {
      tier: "pro",
      badgeText: "Pro Plan",
      shortLabel: "Pro Plan",
      badgeBg: "bg-emerald-50",
      badgeTextColor: "text-emerald-700",
      badgeBorderColor: "border-emerald-200 shadow-xs",
      badgeHoverBg: "hover:bg-emerald-100",
      documentLimit: Infinity,
      isUnlimited: true,
      description: "Pro Plan - Unlimited Document Creation & Cloud Sync"
    };
  } else if (p.includes("50")) {
    return {
      tier: "free_tier",
      badgeText: "Free Tier (50 Docs)",
      shortLabel: "Free Tier",
      badgeBg: "bg-blue-50",
      badgeTextColor: "text-blue-700",
      badgeBorderColor: "border-blue-200 shadow-xs",
      badgeHoverBg: "hover:bg-blue-100",
      documentLimit: 50,
      isUnlimited: false,
      description: "Free Tier - 50 Documents limit"
    };
  } else {
    // Default Free Trial
    return {
      tier: "free_trial",
      badgeText: "Free Trial",
      shortLabel: "Free Trial",
      badgeBg: "bg-amber-50",
      badgeTextColor: "text-amber-800",
      badgeBorderColor: "border-amber-200 shadow-xs",
      badgeHoverBg: "hover:bg-amber-100",
      documentLimit: 5,
      isUnlimited: false,
      description: "Free Trial - 5 Documents Limit"
    };
  }
};
