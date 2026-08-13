import { DocumentType } from "./types";

export const DEFAULT_TERMS = "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within due date.\n3. Subject to local jurisdiction.";

export const DOCUMENT_TYPE_OPTIONS = Object.values(DocumentType);

export const TAX_RATES = [0, 5, 12, 18, 28];

export const UNITS = [
  "NOS",
  "KGS",
  "TONS",
  "MTR",
  "SQM",
  "SQF",
  "PCS",
  "SET",
  "BOX",
  "PKT",
  "LTR",
  "BAG",
  "DRM",
  "ROL",
  "CAN",
  "HRS",
  "DAY",
  "JOB",
  "SRV"
];

export function normalizeUnit(unitStr?: string): string {
  if (!unitStr) return "NOS";
  const u = unitStr.trim().toUpperCase();
  if (u === "DRM" || u === "DRUM" || u === "DRUMS" || u.includes("DRUM")) return "DRM";
  if (u === "KG" || u === "KGS" || u === "KILOGRAM" || u === "KILOGRAMS" || u.includes("KILOGRAM")) return "KGS";
  if (u === "TON" || u === "TONS" || u === "MT" || u.includes("TON")) return "TONS";
  if (u === "MTR" || u === "M" || u === "METER" || u === "METERS" || u === "METRES") return "MTR";
  if (u === "PCS" || u === "PC" || u === "PIECE" || u === "PIECES") return "PCS";
  if (u === "SET" || u === "SETS") return "SET";
  if (u === "BOX" || u === "BOXES") return "BOX";
  if (u === "PKT" || u === "PKTS" || u === "PACKET" || u === "PACKETS") return "PKT";
  if (u === "LTR" || u === "L" || u === "LITER" || u === "LITERS" || u === "LITRES") return "LTR";
  if (u === "BAG" || u === "BAGS") return "BAG";
  if (u === "CAN" || u === "CANS" || u === "JERRYCAN" || u === "JERRYCANS") return "CAN";
  if (u === "ROL" || u === "ROLL" || u === "ROLLS") return "ROL";
  if (u === "SQM" || u === "SQ.M") return "SQM";
  if (u === "SQF" || u === "SQ.FT") return "SQF";
  if (u === "NOS" || u === "NO" || u === "NUMBER" || u === "NUMBERS" || u === "UNIT" || u === "UNITS") return "NOS";
  return u;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  "INR": "₹",
  "USD": "$",
  "EUR": "€",
  "GBP": "£",
  "AED": "د.إ",
  "SAR": "﷼",
  "JPY": "¥",
  "SGD": "S$",
  "AUD": "A$",
  "CAD": "C$",
  "CNY": "¥"
};

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const OWNER_EMAIL = "support@billiq.site";
