export interface CountryConfig {
  code: string; // ISO 2-letter
  name: string;
  flag: string;
  currencyCode: string;
  currencySymbol: string;
  taxSystem: 'GST_INDIA' | 'SALES_TAX_US' | 'VAT_GLOBAL' | 'GST_GLOBAL';
  taxLabel: string; // e.g. "GSTIN/UIN", "EIN / Tax ID", "VAT Reg No", "TRN"
  defaultTaxRate: number; // e.g. 18 for India, 7 for US avg, 20 for UK, 5 for UAE
  states: { code: string; name: string }[];
}

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
}

export const ALL_CURRENCIES: CurrencyConfig[] = [
  { code: "INR", name: "Indian Rupee (₹)", symbol: "₹" },
  { code: "USD", name: "US Dollar ($)", symbol: "$" },
  { code: "EUR", name: "Euro (€)", symbol: "€" },
  { code: "GBP", name: "British Pound (£)", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar (C$)", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar (A$)", symbol: "A$" },
  { code: "AED", name: "UAE Dirham (AED)", symbol: "AED" },
  { code: "SGD", name: "Singapore Dollar (S$)", symbol: "S$" },
  { code: "JPY", name: "Japanese Yen (¥)", symbol: "¥" },
  { code: "SAR", name: "Saudi Riyal (SAR)", symbol: "SAR" },
  { code: "CHF", name: "Swiss Franc (CHF)", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan (¥)", symbol: "¥" },
  { code: "HKD", name: "Hong Kong Dollar (HK$)", symbol: "HK$" },
  { code: "NZD", name: "New Zealand Dollar (NZ$)", symbol: "NZ$" },
  { code: "ZAR", name: "South African Rand (R)", symbol: "R" },
  { code: "MXN", name: "Mexican Peso ($)", symbol: "$" },
  { code: "BRL", name: "Brazilian Real (R$)", symbol: "R$" },
  { code: "SEK", name: "Swedish Krona (kr)", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone (kr)", symbol: "kr" },
  { code: "DKK", name: "Danish Krone (kr)", symbol: "kr" },
  { code: "PLN", name: "Polish Zloty (zł)", symbol: "zł" },
  { code: "TRY", name: "Turkish Lira (₺)", symbol: "₺" },
  { code: "RUB", name: "Russian Ruble (₽)", symbol: "₽" },
  { code: "KRW", name: "South Korean Won (₩)", symbol: "₩" },
  { code: "THB", name: "Thai Baht (฿)", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah (Rp)", symbol: "Rp" },
  { code: "MYR", name: "Malaysian Ringgit (RM)", symbol: "RM" },
  { code: "PHP", name: "Philippine Peso (₱)", symbol: "₱" },
  { code: "VND", name: "Vietnamese Dong (₫)", symbol: "₫" },
  { code: "EGP", name: "Egyptian Pound (E£)", symbol: "E£" },
  { code: "PKR", name: "Pakistani Rupee (Rs)", symbol: "Rs" },
  { code: "BDT", name: "Bangladeshi Taka (৳)", symbol: "৳" },
  { code: "LKR", name: "Sri Lankan Rupee (Rs)", symbol: "Rs" },
  { code: "NGN", name: "Nigerian Naira (₦)", symbol: "₦" },
  { code: "KES", name: "Kenyan Shilling (KSh)", symbol: "KSh" },
  { code: "QAR", name: "Qatari Riyal (QAR)", symbol: "QAR" },
  { code: "KWD", name: "Kuwaiti Dinar (KWD)", symbol: "KWD" },
  { code: "OMR", name: "Omani Rial (OMR)", symbol: "OMR" },
  { code: "BHD", name: "Bahraini Dinar (BHD)", symbol: "BHD" },
  { code: "JOD", name: "Jordanian Dinar (JOD)", symbol: "JOD" },
  { code: "ILS", name: "Israeli Shekel (₪)", symbol: "₪" },
  { code: "ARS", name: "Argentine Peso ($)", symbol: "$" },
  { code: "CLP", name: "Chilean Peso ($)", symbol: "$" },
  { code: "COP", name: "Colombian Peso ($)", symbol: "$" },
  { code: "PEN", name: "Peruvian Sol (S/)", symbol: "S/" },
  { code: "TWD", name: "New Taiwan Dollar (NT$)", symbol: "NT$" },
  { code: "DZD", name: "Algerian Dinar (DZD)", symbol: "DZD" },
  { code: "MAD", name: "Moroccan Dirham (MAD)", symbol: "MAD" },
];

export const COUNTRIES: CountryConfig[] = [
  {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    currencyCode: "INR",
    currencySymbol: "₹",
    taxSystem: "GST_INDIA",
    taxLabel: "GSTIN",
    defaultTaxRate: 18,
    states: [
      { code: "27", name: "Maharashtra" },
      { code: "07", name: "Delhi" },
      { code: "24", name: "Gujarat" },
      { code: "29", name: "Karnataka" },
      { code: "33", name: "Tamil Nadu" },
      { code: "19", name: "West Bengal" },
      { code: "09", name: "Uttar Pradesh" },
      { code: "03", name: "Punjab" },
      { code: "06", name: "Haryana" },
      { code: "36", name: "Telangana" },
      { code: "37", name: "Andhra Pradesh" },
      { code: "10", name: "Bihar" },
      { code: "23", name: "Madhya Pradesh" },
      { code: "21", name: "Odisha" },
      { code: "08", name: "Rajasthan" },
      { code: "32", name: "Kerala" },
      { code: "22", name: "Chhattisgarh" },
      { code: "20", name: "Jharkhand" },
      { code: "05", name: "Uttarakhand" },
      { code: "01", name: "Jammu & Kashmir" },
      { code: "30", name: "Goa" },
      { code: "18", name: "Assam" },
    ]
  },
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currencyCode: "USD",
    currencySymbol: "$",
    taxSystem: "SALES_TAX_US",
    taxLabel: "EIN / Tax ID",
    defaultTaxRate: 7.25,
    states: [
      { code: "CA", name: "California" },
      { code: "NY", name: "New York" },
      { code: "TX", name: "Texas" },
      { code: "FL", name: "Florida" },
      { code: "IL", name: "Illinois" },
      { code: "PA", name: "Pennsylvania" },
      { code: "OH", name: "Ohio" },
      { code: "GA", name: "Georgia" },
      { code: "WA", name: "Washington" },
      { code: "NC", name: "North Carolina" },
      { code: "MI", name: "Michigan" },
      { code: "NJ", name: "New Jersey" },
      { code: "VA", name: "Virginia" },
      { code: "MA", name: "Massachusetts" },
      { code: "AZ", name: "Arizona" },
      { code: "CO", name: "Colorado" },
    ]
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    currencyCode: "GBP",
    currencySymbol: "£",
    taxSystem: "VAT_GLOBAL",
    taxLabel: "VAT Reg No",
    defaultTaxRate: 20,
    states: [
      { code: "ENG", name: "England" },
      { code: "SCT", name: "Scotland" },
      { code: "WLS", name: "Wales" },
      { code: "NIR", name: "Northern Ireland" },
    ]
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    currencyCode: "CAD",
    currencySymbol: "C$",
    taxSystem: "GST_GLOBAL",
    taxLabel: "BN / GST No",
    defaultTaxRate: 13,
    states: [
      { code: "ON", name: "Ontario" },
      { code: "QC", name: "Quebec" },
      { code: "BC", name: "British Columbia" },
      { code: "AB", name: "Alberta" },
      { code: "NS", name: "Nova Scotia" },
      { code: "MB", name: "Manitoba" },
      { code: "SK", name: "Saskatchewan" },
    ]
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    currencyCode: "AUD",
    currencySymbol: "A$",
    taxSystem: "GST_GLOBAL",
    taxLabel: "ABN (Business No)",
    defaultTaxRate: 10,
    states: [
      { code: "NSW", name: "New South Wales" },
      { code: "VIC", name: "Victoria" },
      { code: "QLD", name: "Queensland" },
      { code: "WA", name: "Western Australia" },
      { code: "SA", name: "South Australia" },
      { code: "TAS", name: "Tasmania" },
      { code: "ACT", name: "Australian Capital Territory" },
    ]
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currencyCode: "AED",
    currencySymbol: "AED",
    taxSystem: "VAT_GLOBAL",
    taxLabel: "TRN (Tax Reg No)",
    defaultTaxRate: 5,
    states: [
      { code: "DXB", name: "Dubai" },
      { code: "AUH", name: "Abu Dhabi" },
      { code: "SHJ", name: "Sharjah" },
      { code: "AJM", name: "Ajman" },
      { code: "RAK", name: "Ras Al Khaimah" },
      { code: "UAQ", name: "Umm Al Quwain" },
      { code: "FUJ", name: "Fujairah" },
    ]
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    currencyCode: "EUR",
    currencySymbol: "€",
    taxSystem: "VAT_GLOBAL",
    taxLabel: "USt-IdNr (VAT ID)",
    defaultTaxRate: 19,
    states: [
      { code: "BY", name: "Bavaria" },
      { code: "BE", name: "Berlin" },
      { code: "NW", name: "North Rhine-Westphalia" },
      { code: "HE", name: "Hesse" },
      { code: "BW", name: "Baden-Württemberg" },
      { code: "HH", name: "Hamburg" },
    ]
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    currencyCode: "EUR",
    currencySymbol: "€",
    taxSystem: "VAT_GLOBAL",
    taxLabel: "TVA Intracommunautaire",
    defaultTaxRate: 20,
    states: [
      { code: "IDF", name: "Île-de-France" },
      { code: "PAC", name: "Provence-Alpes-Côte d'Azur" },
      { code: "ARA", name: "Auvergne-Rhône-Alpes" },
      { code: "OCC", name: "Occitanie" },
    ]
  },
  {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    currencyCode: "SGD",
    currencySymbol: "S$",
    taxSystem: "GST_GLOBAL",
    taxLabel: "GST Reg No / UEN",
    defaultTaxRate: 9,
    states: [
      { code: "CEN", name: "Central Region" },
      { code: "EAS", name: "East Region" },
      { code: "NOR", name: "North Region" },
      { code: "WES", name: "West Region" },
    ]
  },
  {
    code: "JP",
    name: "Japan",
    flag: "🇯🇵",
    currencyCode: "JPY",
    currencySymbol: "¥",
    taxSystem: "VAT_GLOBAL",
    taxLabel: "Corporate ID / Invoice No",
    defaultTaxRate: 10,
    states: [
      { code: "13", name: "Tokyo" },
      { code: "27", name: "Osaka" },
      { code: "14", name: "Kanagawa" },
      { code: "23", name: "Aichi" },
      { code: "01", name: "Hokkaido" },
      { code: "40", name: "Fukuoka" },
    ]
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    currencyCode: "SAR",
    currencySymbol: "SAR",
    taxSystem: "VAT_GLOBAL",
    taxLabel: "VAT Registration No",
    defaultTaxRate: 15,
    states: [
      { code: "RIY", name: "Riyadh" },
      { code: "MAK", name: "Makkah" },
      { code: "EAST", name: "Eastern Province" },
      { code: "MED", name: "Madinah" },
    ]
  },
  // All other countries sorted alphabetically
  { code: "AF", name: "Afghanistan", flag: "🇦🇫", currencyCode: "AFN", currencySymbol: "؋", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 10, states: [] },
  { code: "AL", name: "Albania", flag: "🇦🇱", currencyCode: "ALL", currencySymbol: "L", taxSystem: "VAT_GLOBAL", taxLabel: "NIPT", defaultTaxRate: 20, states: [] },
  { code: "DZ", name: "Algeria", flag: "🇩🇿", currencyCode: "DZD", currencySymbol: "د.ج", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 19, states: [] },
  { code: "AD", name: "Andorra", flag: "🇦🇩", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "NTR", defaultTaxRate: 4.5, states: [] },
  { code: "AO", name: "Angola", flag: "🇦🇴", currencyCode: "AOA", currencySymbol: "Kz", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 14, states: [] },
  { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬", currencyCode: "XCD", currencySymbol: "EC$", taxSystem: "VAT_GLOBAL", taxLabel: "ABST No", defaultTaxRate: 15, states: [] },
  { code: "AR", name: "Argentina", flag: "🇦🇷", currencyCode: "ARS", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "CUIT", defaultTaxRate: 21, states: [] },
  { code: "AM", name: "Armenia", flag: "🇦🇲", currencyCode: "AMD", currencySymbol: "֏", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 20, states: [] },
  { code: "AT", name: "Austria", flag: "🇦🇹", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "UID (VAT ID)", defaultTaxRate: 20, states: [] },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿", currencyCode: "AZN", currencySymbol: "₼", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 18, states: [] },
  { code: "BS", name: "Bahamas", flag: "🇧🇸", currencyCode: "BSD", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 10, states: [] },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", currencyCode: "BHD", currencySymbol: "BD", taxSystem: "VAT_GLOBAL", taxLabel: "TRN", defaultTaxRate: 10, states: [] },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", currencyCode: "BDT", currencySymbol: "৳", taxSystem: "VAT_GLOBAL", taxLabel: "BIN", defaultTaxRate: 15, states: [] },
  { code: "BB", name: "Barbados", flag: "🇧🇧", currencyCode: "BBD", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "TAMIS Reg", defaultTaxRate: 17.5, states: [] },
  { code: "BY", name: "Belarus", flag: "🇧🇾", currencyCode: "BYN", currencySymbol: "Br", taxSystem: "VAT_GLOBAL", taxLabel: "UNP", defaultTaxRate: 20, states: [] },
  { code: "BE", name: "Belgium", flag: "🇧🇪", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "BTW / TVA", defaultTaxRate: 21, states: [] },
  { code: "BZ", name: "Belize", flag: "🇧🇿", currencyCode: "BZD", currencySymbol: "BZ$", taxSystem: "VAT_GLOBAL", taxLabel: "GST No", defaultTaxRate: 12.5, states: [] },
  { code: "BJ", name: "Benin", flag: "🇧🇯", currencyCode: "XOF", currencySymbol: "CFA", taxSystem: "VAT_GLOBAL", taxLabel: "IFU", defaultTaxRate: 18, states: [] },
  { code: "BT", name: "Bhutan", flag: "🇧🇹", currencyCode: "BTN", currencySymbol: "Nu.", taxSystem: "GST_GLOBAL", taxLabel: "TPN", defaultTaxRate: 0, states: [] },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", currencyCode: "BOB", currencySymbol: "Bs.", taxSystem: "VAT_GLOBAL", taxLabel: "NIT", defaultTaxRate: 13, states: [] },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦", currencyCode: "BAM", currencySymbol: "KM", taxSystem: "VAT_GLOBAL", taxLabel: "JIB", defaultTaxRate: 17, states: [] },
  { code: "BW", name: "Botswana", flag: "🇧🇼", currencyCode: "BWP", currencySymbol: "P", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 14, states: [] },
  { code: "BR", name: "Brazil", flag: "🇧🇷", currencyCode: "BRL", currencySymbol: "R$", taxSystem: "VAT_GLOBAL", taxLabel: "CNPJ", defaultTaxRate: 17, states: [] },
  { code: "BN", name: "Brunei", flag: "🇧🇳", currencyCode: "BND", currencySymbol: "B$", taxSystem: "GST_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 0, states: [] },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬", currencyCode: "BGN", currencySymbol: "лв", taxSystem: "VAT_GLOBAL", taxLabel: "UIC (VAT ID)", defaultTaxRate: 20, states: [] },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currencyCode: "XOF", currencySymbol: "CFA", taxSystem: "VAT_GLOBAL", taxLabel: "IFU", defaultTaxRate: 18, states: [] },
  { code: "BI", name: "Burundi", flag: "🇧🇮", currencyCode: "BIF", currencySymbol: "FBu", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 18, states: [] },
  { code: "KH", name: "Cambodia", flag: "🇰🇭", currencyCode: "KHR", currencySymbol: "៛", taxSystem: "VAT_GLOBAL", taxLabel: "VATTIN", defaultTaxRate: 10, states: [] },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", currencyCode: "XAF", currencySymbol: "FCFA", taxSystem: "VAT_GLOBAL", taxLabel: "NIU", defaultTaxRate: 19.25, states: [] },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻", currencyCode: "CVE", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 15, states: [] },
  { code: "CF", name: "Central African Republic", flag: "🇨🇫", currencyCode: "XAF", currencySymbol: "FCFA", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 19, states: [] },
  { code: "TD", name: "Chad", flag: "🇹🇩", currencyCode: "XAF", currencySymbol: "FCFA", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 18, states: [] },
  { code: "CL", name: "Chile", flag: "🇨🇱", currencyCode: "CLP", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "RUT", defaultTaxRate: 19, states: [] },
  { code: "CN", name: "China", flag: "🇨🇳", currencyCode: "CNY", currencySymbol: "¥", taxSystem: "VAT_GLOBAL", taxLabel: "USCC", defaultTaxRate: 13, states: [] },
  { code: "CO", name: "Colombia", flag: "🇨🇴", currencyCode: "COP", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "NIT", defaultTaxRate: 19, states: [] },
  { code: "KM", name: "Comoros", flag: "🇰🇲", currencyCode: "KMF", currencySymbol: "CF", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 10, states: [] },
  { code: "CG", name: "Congo", flag: "🇨🇬", currencyCode: "XAF", currencySymbol: "FCFA", taxSystem: "VAT_GLOBAL", taxLabel: "NIU", defaultTaxRate: 18, states: [] },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", currencyCode: "CRC", currencySymbol: "₡", taxSystem: "VAT_GLOBAL", taxLabel: "Cédula Jurídica", defaultTaxRate: 13, states: [] },
  { code: "HR", name: "Croatia", flag: "🇭🇷", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "OIB", defaultTaxRate: 25, states: [] },
  { code: "CU", name: "Cuba", flag: "🇨🇺", currencyCode: "CUP", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "NIT", defaultTaxRate: 10, states: [] },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "TIC (VAT No)", defaultTaxRate: 19, states: [] },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿", currencyCode: "CZK", currencySymbol: "Kč", taxSystem: "VAT_GLOBAL", taxLabel: "DIČ", defaultTaxRate: 21, states: [] },
  { code: "DK", name: "Denmark", flag: "🇩🇰", currencyCode: "DKK", currencySymbol: "kr.", taxSystem: "VAT_GLOBAL", taxLabel: "CVR", defaultTaxRate: 25, states: [] },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯", currencyCode: "DJF", currencySymbol: "Fdj", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 10, states: [] },
  { code: "DM", name: "Dominica", flag: "🇩🇲", currencyCode: "XCD", currencySymbol: "EC$", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 15, states: [] },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴", currencyCode: "DOP", currencySymbol: "RD$", taxSystem: "VAT_GLOBAL", taxLabel: "RNC", defaultTaxRate: 18, states: [] },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", currencyCode: "USD", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "RUC", defaultTaxRate: 15, states: [] },
  { code: "EG", name: "Egypt", flag: "🇪🇬", currencyCode: "EGP", currencySymbol: "E£", taxSystem: "VAT_GLOBAL", taxLabel: "Tax Reg No", defaultTaxRate: 14, states: [] },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", currencyCode: "USD", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "NIT", defaultTaxRate: 13, states: [] },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶", currencyCode: "XAF", currencySymbol: "FCFA", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 15, states: [] },
  { code: "ER", name: "Eritrea", flag: "🇪🇷", currencyCode: "ERN", currencySymbol: "Nfk", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 10, states: [] },
  { code: "EE", name: "Estonia", flag: "🇪🇪", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "KMKR (VAT ID)", defaultTaxRate: 22, states: [] },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", currencyCode: "SZL", currencySymbol: "E", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", currencyCode: "ETB", currencySymbol: "Br", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "FJ", name: "Fiji", flag: "🇫🇯", currencyCode: "FJD", currencySymbol: "FJ$", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "FI", name: "Finland", flag: "🇫🇮", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "Y-tunnus", defaultTaxRate: 25.5, states: [] },
  { code: "GA", name: "Gabon", flag: "🇬🇦", currencyCode: "XAF", currencySymbol: "FCFA", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 18, states: [] },
  { code: "GM", name: "Gambia", flag: "🇬🇲", currencyCode: "GMD", currencySymbol: "D", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "GE", name: "Georgia", flag: "🇬🇪", currencyCode: "GEL", currencySymbol: "₾", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 18, states: [] },
  { code: "GH", name: "Ghana", flag: "🇬🇭", currencyCode: "GHS", currencySymbol: "GH₵", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "GR", name: "Greece", flag: "🇬🇷", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "AFM (VAT ID)", defaultTaxRate: 24, states: [] },
  { code: "GD", name: "Grenada", flag: "🇬🇩", currencyCode: "XCD", currencySymbol: "EC$", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 15, states: [] },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", currencyCode: "GTQ", currencySymbol: "Q", taxSystem: "VAT_GLOBAL", taxLabel: "NIT", defaultTaxRate: 12, states: [] },
  { code: "GN", name: "Guinea", flag: "🇬🇳", currencyCode: "GNF", currencySymbol: "FG", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 18, states: [] },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼", currencyCode: "XOF", currencySymbol: "CFA", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 15, states: [] },
  { code: "GY", name: "Guyana", flag: "🇬🇾", currencyCode: "GYD", currencySymbol: "G$", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 14, states: [] },
  { code: "HT", name: "Haiti", flag: "🇭🇹", currencyCode: "HTG", currencySymbol: "G", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 10, states: [] },
  { code: "HN", name: "Honduras", flag: "🇭🇳", currencyCode: "HNL", currencySymbol: "L", taxSystem: "VAT_GLOBAL", taxLabel: "RTN", defaultTaxRate: 15, states: [] },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", currencyCode: "HKD", currencySymbol: "HK$", taxSystem: "GST_GLOBAL", taxLabel: "BRN", defaultTaxRate: 0, states: [] },
  { code: "HU", name: "Hungary", flag: "🇭🇺", currencyCode: "HUF", currencySymbol: "Ft", taxSystem: "VAT_GLOBAL", taxLabel: "Adószám", defaultTaxRate: 27, states: [] },
  { code: "IS", name: "Iceland", flag: "🇮🇸", currencyCode: "ISK", currencySymbol: "kr", taxSystem: "VAT_GLOBAL", taxLabel: "VSK", defaultTaxRate: 24, states: [] },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", currencyCode: "IDR", currencySymbol: "Rp", taxSystem: "VAT_GLOBAL", taxLabel: "NPWP", defaultTaxRate: 11, states: [] },
  { code: "IR", name: "Iran", flag: "🇮🇷", currencyCode: "IRR", currencySymbol: "﷼", taxSystem: "VAT_GLOBAL", taxLabel: "National ID", defaultTaxRate: 9, states: [] },
  { code: "IQ", name: "Iraq", flag: "🇮🇶", currencyCode: "IQD", currencySymbol: "ع.د", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 0, states: [] },
  { code: "IE", name: "Ireland", flag: "🇮🇪", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "VAT No", defaultTaxRate: 23, states: [] },
  { code: "IL", name: "Israel", flag: "🇮🇱", currencyCode: "ILS", currencySymbol: "₪", taxSystem: "VAT_GLOBAL", taxLabel: "HP / Osek", defaultTaxRate: 17, states: [] },
  { code: "IT", name: "Italy", flag: "🇮🇹", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "Partita IVA", defaultTaxRate: 22, states: [] },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮", currencyCode: "XOF", currencySymbol: "CFA", taxSystem: "VAT_GLOBAL", taxLabel: "NCC", defaultTaxRate: 18, states: [] },
  { code: "JM", name: "Jamaica", flag: "🇯🇲", currencyCode: "JMD", currencySymbol: "J$", taxSystem: "VAT_GLOBAL", taxLabel: "TRN", defaultTaxRate: 15, states: [] },
  { code: "JO", name: "Jordan", flag: "🇯🇴", currencyCode: "JOD", currencySymbol: "JD", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 16, states: [] },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿", currencyCode: "KZT", currencySymbol: "₸", taxSystem: "VAT_GLOBAL", taxLabel: "BIN / IIN", defaultTaxRate: 12, states: [] },
  { code: "KE", name: "Kenya", flag: "🇰🇪", currencyCode: "KES", currencySymbol: "KSh", taxSystem: "VAT_GLOBAL", taxLabel: "KRA PIN", defaultTaxRate: 16, states: [] },
  { code: "KI", name: "Kiribati", flag: "🇰🇮", currencyCode: "AUD", currencySymbol: "$", taxSystem: "GST_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 0, states: [] },
  { code: "XK", name: "Kosovo", flag: "🇽🇰", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "NUI", defaultTaxRate: 18, states: [] },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", currencyCode: "KWD", currencySymbol: "KD", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 0, states: [] },
  { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬", currencyCode: "KGS", currencySymbol: "сом", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 12, states: [] },
  { code: "LA", name: "Laos", flag: "🇱🇦", currencyCode: "LAK", currencySymbol: "₭", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 10, states: [] },
  { code: "LV", name: "Latvia", flag: "🇱🇻", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "PVN (VAT ID)", defaultTaxRate: 21, states: [] },
  { code: "LB", name: "Lebanon", flag: "🇱🇧", currencyCode: "LBP", currencySymbol: "L£", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 11, states: [] },
  { code: "LS", name: "Lesotho", flag: "🇱🇸", currencyCode: "LSL", currencySymbol: "L", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "LR", name: "Liberia", flag: "🇱🇷", currencyCode: "LRD", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 10, states: [] },
  { code: "LY", name: "Libya", flag: "🇱🇾", currencyCode: "LYD", currencySymbol: "LD", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 0, states: [] },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮", currencyCode: "CHF", currencySymbol: "CHF", taxSystem: "VAT_GLOBAL", taxLabel: "MWST", defaultTaxRate: 8.1, states: [] },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "PVM (VAT ID)", defaultTaxRate: 21, states: [] },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "TVA", defaultTaxRate: 17, states: [] },
  { code: "MO", name: "Macao", flag: "🇲🇴", currencyCode: "MOP", currencySymbol: "MOP$", taxSystem: "GST_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 0, states: [] },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", currencyCode: "MGA", currencySymbol: "Ar", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 20, states: [] },
  { code: "MW", name: "Malawi", flag: "🇲🇼", currencyCode: "MWK", currencySymbol: "MK", taxSystem: "VAT_GLOBAL", taxLabel: "TPIN", defaultTaxRate: 16.5, states: [] },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", currencyCode: "MYR", currencySymbol: "RM", taxSystem: "GST_GLOBAL", taxLabel: "SST Reg No", defaultTaxRate: 8, states: [] },
  { code: "MV", name: "Maldives", flag: "🇲🇻", currencyCode: "MVR", currencySymbol: "Rf", taxSystem: "GST_GLOBAL", taxLabel: "TIN", defaultTaxRate: 8, states: [] },
  { code: "ML", name: "Mali", flag: "🇲🇱", currencyCode: "XOF", currencySymbol: "CFA", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 18, states: [] },
  { code: "MT", name: "Malta", flag: "🇲🇹", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "VAT No", defaultTaxRate: 18, states: [] },
  { code: "MH", name: "Marshall Islands", flag: "🇲🇭", currencyCode: "USD", currencySymbol: "$", taxSystem: "GST_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 0, states: [] },
  { code: "MR", name: "Mauritania", flag: "🇲🇷", currencyCode: "MRU", currencySymbol: "UM", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 16, states: [] },
  { code: "MU", name: "Mauritius", flag: "🇲🇺", currencyCode: "MUR", currencySymbol: "₨", taxSystem: "VAT_GLOBAL", taxLabel: "VAT Reg No", defaultTaxRate: 15, states: [] },
  { code: "MX", name: "Mexico", flag: "🇲🇽", currencyCode: "MXN", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "RFC", defaultTaxRate: 16, states: [] },
  { code: "FM", name: "Micronesia", flag: "🇫🇲", currencyCode: "USD", currencySymbol: "$", taxSystem: "GST_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 0, states: [] },
  { code: "MD", name: "Moldova", flag: "🇲🇩", currencyCode: "MDL", currencySymbol: "L", taxSystem: "VAT_GLOBAL", taxLabel: "IDNO", defaultTaxRate: 20, states: [] },
  { code: "MC", name: "Monaco", flag: "🇲🇨", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "TVA", defaultTaxRate: 20, states: [] },
  { code: "MN", name: "Mongolia", flag: "🇲🇳", currencyCode: "MNT", currencySymbol: "₮", taxSystem: "VAT_GLOBAL", taxLabel: "TTUD", defaultTaxRate: 10, states: [] },
  { code: "ME", name: "Montenegro", flag: "🇲🇪", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "PIB", defaultTaxRate: 21, states: [] },
  { code: "MA", name: "Morocco", flag: "🇲🇦", currencyCode: "MAD", currencySymbol: "MAD", taxSystem: "VAT_GLOBAL", taxLabel: "ICE", defaultTaxRate: 20, states: [] },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", currencyCode: "MZN", currencySymbol: "MT", taxSystem: "VAT_GLOBAL", taxLabel: "NUIT", defaultTaxRate: 16, states: [] },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", currencyCode: "MMK", currencySymbol: "Ks", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 5, states: [] },
  { code: "NA", name: "Namibia", flag: "🇳🇦", currencyCode: "NAD", currencySymbol: "N$", taxSystem: "VAT_GLOBAL", taxLabel: "VAT No", defaultTaxRate: 15, states: [] },
  { code: "NR", name: "Nauru", flag: "🇳🇷", currencyCode: "AUD", currencySymbol: "$", taxSystem: "GST_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 0, states: [] },
  { code: "NP", name: "Nepal", flag: "🇳🇵", currencyCode: "NPR", currencySymbol: "रू", taxSystem: "VAT_GLOBAL", taxLabel: "PAN / VAT No", defaultTaxRate: 13, states: [] },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "Btw-nummer", defaultTaxRate: 21, states: [] },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", currencyCode: "NZD", currencySymbol: "$", taxSystem: "GST_GLOBAL", taxLabel: "GST No", defaultTaxRate: 15, states: [] },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", currencyCode: "NIO", currencySymbol: "C$", taxSystem: "VAT_GLOBAL", taxLabel: "RUC", defaultTaxRate: 15, states: [] },
  { code: "NE", name: "Niger", flag: "🇳🇪", currencyCode: "XOF", currencySymbol: "CFA", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 19, states: [] },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", currencyCode: "NGN", currencySymbol: "₦", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 7.5, states: [] },
  { code: "MK", name: "North Macedonia", flag: "🇲🇰", currencyCode: "MKD", currencySymbol: "ден", taxSystem: "VAT_GLOBAL", taxLabel: "EDB", defaultTaxRate: 18, states: [] },
  { code: "NO", name: "Norway", flag: "🇳🇴", currencyCode: "NOK", currencySymbol: "kr", taxSystem: "VAT_GLOBAL", taxLabel: "MVA No", defaultTaxRate: 25, states: [] },
  { code: "OM", name: "Oman", flag: "🇴🇲", currencyCode: "OMR", currencySymbol: "OMR", taxSystem: "VAT_GLOBAL", taxLabel: "VATIN", defaultTaxRate: 5, states: [] },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", currencyCode: "PKR", currencySymbol: "Rs", taxSystem: "GST_GLOBAL", taxLabel: "STRN / NTN", defaultTaxRate: 18, states: [] },
  { code: "PW", name: "Palau", flag: "🇵🇼", currencyCode: "USD", currencySymbol: "$", taxSystem: "GST_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 10, states: [] },
  { code: "PS", name: "Palestine", flag: "🇵🇸", currencyCode: "ILS", currencySymbol: "₪", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 16, states: [] },
  { code: "PA", name: "Panama", flag: "🇵🇦", currencyCode: "PAB", currencySymbol: "B/.", taxSystem: "VAT_GLOBAL", taxLabel: "RUC", defaultTaxRate: 7, states: [] },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬", currencyCode: "PGK", currencySymbol: "K", taxSystem: "GST_GLOBAL", taxLabel: "TIN", defaultTaxRate: 10, states: [] },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", currencyCode: "PYG", currencySymbol: "₲", taxSystem: "VAT_GLOBAL", taxLabel: "RUC", defaultTaxRate: 10, states: [] },
  { code: "PE", name: "Peru", flag: "🇵🇪", currencyCode: "PEN", currencySymbol: "S/", taxSystem: "VAT_GLOBAL", taxLabel: "RUC", defaultTaxRate: 18, states: [] },
  { code: "PH", name: "Philippines", flag: "🇵🇭", currencyCode: "PHP", currencySymbol: "₱", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 12, states: [] },
  { code: "PL", name: "Poland", flag: "🇵🇱", currencyCode: "PLN", currencySymbol: "zł", taxSystem: "VAT_GLOBAL", taxLabel: "NIP (VAT ID)", defaultTaxRate: 23, states: [] },
  { code: "PT", name: "Portugal", flag: "🇵🇹", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "NIF (VAT ID)", defaultTaxRate: 23, states: [] },
  { code: "QA", name: "Qatar", flag: "🇶🇦", currencyCode: "QAR", currencySymbol: "QAR", taxSystem: "VAT_GLOBAL", taxLabel: "Tax Card No", defaultTaxRate: 0, states: [] },
  { code: "RO", name: "Romania", flag: "🇷🇴", currencyCode: "RON", currencySymbol: "lei", taxSystem: "VAT_GLOBAL", taxLabel: "CUI / CIF", defaultTaxRate: 19, states: [] },
  { code: "RU", name: "Russia", flag: "🇷🇺", currencyCode: "RUB", currencySymbol: "₽", taxSystem: "VAT_GLOBAL", taxLabel: "INN", defaultTaxRate: 20, states: [] },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", currencyCode: "RWF", currencySymbol: "FRw", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 18, states: [] },
  { code: "KN", name: "Saint Kitts and Nevis", flag: "🇰🇳", currencyCode: "XCD", currencySymbol: "EC$", taxSystem: "VAT_GLOBAL", taxLabel: "VAT No", defaultTaxRate: 17, states: [] },
  { code: "LC", name: "Saint Lucia", flag: "🇱🇨", currencyCode: "XCD", currencySymbol: "EC$", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 12.5, states: [] },
  { code: "VC", name: "Saint Vincent and the Grenadines", flag: "🇻🇨", currencyCode: "XCD", currencySymbol: "EC$", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 16, states: [] },
  { code: "WS", name: "Samoa", flag: "🇼🇸", currencyCode: "WST", currencySymbol: "WS$", taxSystem: "VAT_GLOBAL", taxLabel: "VAGST No", defaultTaxRate: 15, states: [] },
  { code: "SM", name: "San Marino", flag: "🇸🇲", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "COE", defaultTaxRate: 17, states: [] },
  { code: "ST", name: "Sao Tome and Principe", flag: "🇸🇹", currencyCode: "STN", currencySymbol: "Db", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 15, states: [] },
  { code: "SN", name: "Senegal", flag: "🇸🇳", currencyCode: "XOF", currencySymbol: "CFA", taxSystem: "VAT_GLOBAL", taxLabel: "NINEA", defaultTaxRate: 18, states: [] },
  { code: "RS", name: "Serbia", flag: "🇷🇸", currencyCode: "RSD", currencySymbol: "дин.", taxSystem: "VAT_GLOBAL", taxLabel: "PIB", defaultTaxRate: 20, states: [] },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", currencyCode: "SCR", currencySymbol: "SR", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱", currencyCode: "SLE", currencySymbol: "Le", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "SK", name: "Slovakia", flag: "🇸🇰", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "IČ DPH", defaultTaxRate: 20, states: [] },
  { code: "SI", name: "Slovenia", flag: "🇸🇮", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "ID za DDV", defaultTaxRate: 22, states: [] },
  { code: "SB", name: "Solomon Islands", flag: "🇸🇧", currencyCode: "SBD", currencySymbol: "SI$", taxSystem: "GST_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "SO", name: "Somalia", flag: "🇸🇴", currencyCode: "SOS", currencySymbol: "Sh.So.", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 5, states: [] },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", currencyCode: "ZAR", currencySymbol: "R", taxSystem: "VAT_GLOBAL", taxLabel: "VAT No", defaultTaxRate: 15, states: [] },
  { code: "KR", name: "South Korea", flag: "🇰🇷", currencyCode: "KRW", currencySymbol: "₩", taxSystem: "VAT_GLOBAL", taxLabel: "BRN (Biz Reg No)", defaultTaxRate: 10, states: [] },
  { code: "SS", name: "South Sudan", flag: "🇸🇸", currencyCode: "SSP", currencySymbol: "£", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 18, states: [] },
  { code: "ES", name: "Spain", flag: "🇪🇸", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "NIF / CIF", defaultTaxRate: 21, states: [] },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", currencyCode: "LKR", currencySymbol: "Rs", taxSystem: "VAT_GLOBAL", taxLabel: "VAT No", defaultTaxRate: 18, states: [] },
  { code: "SD", name: "Sudan", flag: "🇸🇩", currencyCode: "SDG", currencySymbol: "LS", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 17, states: [] },
  { code: "SR", name: "Suriname", flag: "🇸🇷", currencyCode: "SRD", currencySymbol: "SRD$", taxSystem: "VAT_GLOBAL", taxLabel: "BTW No", defaultTaxRate: 10, states: [] },
  { code: "SE", name: "Sweden", flag: "🇸🇪", currencyCode: "SEK", currencySymbol: "kr", taxSystem: "VAT_GLOBAL", taxLabel: "Momsnr", defaultTaxRate: 25, states: [] },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", currencyCode: "CHF", currencySymbol: "CHF", taxSystem: "VAT_GLOBAL", taxLabel: "CHE / MWST", defaultTaxRate: 8.1, states: [] },
  { code: "SY", name: "Syria", flag: "🇸🇾", currencyCode: "SYP", currencySymbol: "LS", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 0, states: [] },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", currencyCode: "TWD", currencySymbol: "NT$", taxSystem: "VAT_GLOBAL", taxLabel: "GUI / BAN", defaultTaxRate: 5, states: [] },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯", currencyCode: "TJS", currencySymbol: "SM", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 12, states: [] },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", currencyCode: "TZS", currencySymbol: "TSh", taxSystem: "VAT_GLOBAL", taxLabel: "TIN / VRN", defaultTaxRate: 18, states: [] },
  { code: "TH", name: "Thailand", flag: "🇹🇭", currencyCode: "THB", currencySymbol: "฿", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 7, states: [] },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱", currencyCode: "USD", currencySymbol: "$", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 2.5, states: [] },
  { code: "TG", name: "Togo", flag: "🇹🇬", currencyCode: "XOF", currencySymbol: "CFA", taxSystem: "VAT_GLOBAL", taxLabel: "NIF", defaultTaxRate: 18, states: [] },
  { code: "TO", name: "Tonga", flag: "🇹🇴", currencyCode: "TOP", currencySymbol: "T$", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹", currencyCode: "TTD", currencySymbol: "TT$", taxSystem: "VAT_GLOBAL", taxLabel: "BIR No", defaultTaxRate: 12.5, states: [] },
  { code: "TN", name: "Tunisia", flag: "🇹🇳", currencyCode: "TND", currencySymbol: "DT", taxSystem: "VAT_GLOBAL", taxLabel: "MF (Matricule Fiscale)", defaultTaxRate: 19, states: [] },
  { code: "TR", name: "Turkey", flag: "🇹🇷", currencyCode: "TRY", currencySymbol: "₺", taxSystem: "VAT_GLOBAL", taxLabel: "VKN", defaultTaxRate: 20, states: [] },
  { code: "TM", name: "Turkmenistan", flag: "🇹🇲", currencyCode: "TMT", currencySymbol: "T", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 15, states: [] },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻", currencyCode: "AUD", currencySymbol: "$", taxSystem: "GST_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 3, states: [] },
  { code: "UG", name: "Uganda", flag: "🇺🇬", currencyCode: "UGX", currencySymbol: "USh", taxSystem: "VAT_GLOBAL", taxLabel: "TIN", defaultTaxRate: 18, states: [] },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", currencyCode: "UAH", currencySymbol: "₴", taxSystem: "VAT_GLOBAL", taxLabel: "IPN", defaultTaxRate: 20, states: [] },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", currencyCode: "UYU", currencySymbol: "$U", taxSystem: "VAT_GLOBAL", taxLabel: "RUT", defaultTaxRate: 22, states: [] },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿", currencyCode: "UZS", currencySymbol: "so'm", taxSystem: "VAT_GLOBAL", taxLabel: "STIR", defaultTaxRate: 12, states: [] },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺", currencyCode: "VUV", currencySymbol: "VT", taxSystem: "VAT_GLOBAL", taxLabel: "CTIN", defaultTaxRate: 15, states: [] },
  { code: "VA", name: "Vatican City", flag: "🇻🇦", currencyCode: "EUR", currencySymbol: "€", taxSystem: "VAT_GLOBAL", taxLabel: "VAT No", defaultTaxRate: 0, states: [] },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", currencyCode: "VES", currencySymbol: "Bs.S", taxSystem: "VAT_GLOBAL", taxLabel: "RIF", defaultTaxRate: 16, states: [] },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", currencyCode: "VND", currencySymbol: "₫", taxSystem: "VAT_GLOBAL", taxLabel: "MST", defaultTaxRate: 10, states: [] },
  { code: "YE", name: "Yemen", flag: "🇾🇪", currencyCode: "YER", currencySymbol: "﷼", taxSystem: "VAT_GLOBAL", taxLabel: "Tax ID", defaultTaxRate: 5, states: [] },
  { code: "ZM", name: "Zambia", flag: "🇿🇲", currencyCode: "ZMW", currencySymbol: "ZK", taxSystem: "VAT_GLOBAL", taxLabel: "TPIN", defaultTaxRate: 16, states: [] },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", currencyCode: "ZWG", currencySymbol: "Z$", taxSystem: "VAT_GLOBAL", taxLabel: "BP / TIN", defaultTaxRate: 15, states: [] },
];

export function getTaxName(taxSystemOrCountry?: string): string {
  if (!taxSystemOrCountry) return 'GST';
  const c = taxSystemOrCountry.toLowerCase().trim();

  if (c === 'sg' || c === 'singapore' || c.includes('singapore')) return 'GST';
  if (c === 'in' || c === 'india' || c.includes('india') || c === 'gst_india') return 'GST';
  if (c === 'us' || c === 'usa' || c.includes('united states') || c.includes('america') || c === 'sales_tax_us') return 'Sales Tax';
  if (c === 'ca' || c === 'canada' || c.includes('canada')) return 'GST/HST';
  if (c === 'au' || c === 'australia' || c.includes('australia')) return 'GST';
  if (c === 'nz' || c === 'new zealand' || c.includes('zealand')) return 'GST';

  const vatKeys = [
    'vat', 'vat_global',
    'ae', 'uae', 'united arab emirates',
    'gb', 'uk', 'united kingdom', 'britain', 'england',
    'de', 'germany', 'deutschland',
    'fr', 'france',
    'es', 'spain', 'españa',
    'it', 'italy', 'italia',
    'nl', 'netherlands', 'holland',
    'be', 'belgium',
    'se', 'sweden',
    'pl', 'poland',
    'at', 'austria',
    'dk', 'denmark',
    'fi', 'finland',
    'pt', 'portugal',
    'gr', 'greece',
    'cz', 'czechia', 'czech republic',
    'hu', 'hungary',
    'ro', 'romania',
    'sk', 'slovakia',
    'ie', 'ireland',
    'sa', 'saudi arabia', 'saudi'
  ];
  if (vatKeys.some(k => c === k || c.includes(k))) return 'VAT';

  if (c === 'gst_global') return 'GST';

  const found = COUNTRIES.find(
    item => (item.code || "").toLowerCase() === c || (item.name || "").toLowerCase() === c
  );
  if (found) {
    if (found.code === 'SG' || found.code === 'IN' || found.code === 'AU' || found.code === 'NZ') return 'GST';
    if (found.code === 'CA') return 'GST/HST';
    if (found.code === 'US') return 'Sales Tax';
    if (found.taxSystem === 'VAT_GLOBAL') return 'VAT';
    if (found.taxSystem === 'SALES_TAX_US') return 'Sales Tax';
    if (found.taxSystem === 'GST_GLOBAL') return 'GST';
  }

  return 'GST';
}

export function getTaxRateLabel(countryOrSystem?: string): string {
  return `${getTaxName(countryOrSystem)} Rate (%)`;
}

export function getTaxAmountLabel(countryOrSystem?: string): string {
  return `${getTaxName(countryOrSystem)} Amount`;
}

export function getTaxRegNoLabel(countryOrSystem?: string): string {
  return getRegionTaxLabel(countryOrSystem);
}

export function getCountryTaxRates(countryNameOrCode?: string): number[] {
  const config = getCountryConfig(countryNameOrCode);
  switch (config.code) {
    case 'IN':
      return [0, 5, 12, 18, 28];
    case 'US':
      return [0, 4, 5, 6, 7, 7.25, 8, 8.5, 9, 10];
    case 'GB':
      return [0, 5, 20];
    case 'CA':
      return [0, 5, 12, 13, 15];
    case 'AU':
      return [0, 10];
    case 'AE':
      return [0, 5];
    case 'DE':
      return [0, 7, 19];
    case 'FR':
      return [0, 5.5, 10, 20];
    case 'SG':
      return [0, 9];
    case 'JP':
      return [0, 8, 10];
    case 'SA':
      return [0, 15];
    default:
      if (config.defaultTaxRate > 0) {
        return Array.from(new Set([0, config.defaultTaxRate, 5, 10, 12, 15, 18, 20, 25])).sort((a,b) => a - b);
      }
      return [0, 5, 10, 12, 15, 18, 20, 28];
  }
}

export function getRegionTaxLabel(countryNameOrCode?: string): string {
  if (!countryNameOrCode || typeof countryNameOrCode !== 'string') return "GSTIN";
  const c = countryNameOrCode.toLowerCase().trim();

  // 1. Singapore
  if (c === "sg" || c === "singapore" || c.includes("singapore")) {
    return "GST Reg No";
  }

  // 2. India
  if (c === "in" || c === "india" || c.includes("india")) {
    return "GSTIN";
  }

  // 3. United States
  if (c === "us" || c === "usa" || c.includes("united states") || c.includes("america")) {
    return "EIN / Tax ID";
  }

  // 4. Canada
  if (c === "ca" || c === "canada" || c.includes("canada")) {
    return "GST/HST Reg No";
  }

  // 5. Australia & New Zealand
  if (c === "au" || c === "australia" || c.includes("australia")) {
    return "GST Reg No / ABN";
  }
  if (c === "nz" || c === "new zealand" || c.includes("zealand")) {
    return "GST Reg No";
  }

  // 6. UAE
  if (c === "ae" || c === "uae" || c.includes("united arab emirates") || c.includes("emirates")) {
    return "TRN (VAT Reg No)";
  }

  // 7. GCC Countries
  const gcc = [
    "sa", "ksa", "saudi arabia", "saudi",
    "qa", "qatar",
    "om", "oman",
    "kw", "kuwait",
    "bh", "bahrain"
  ];
  if (gcc.some(g => c === g || c.includes(g))) {
    return "TRN";
  }

  // 8. United Kingdom & EU Countries
  const euUk = [
    "gb", "uk", "united kingdom", "britain", "england",
    "de", "germany", "deutschland",
    "fr", "france",
    "it", "italy", "italia",
    "es", "spain", "españa",
    "at", "austria", "be", "belgium", "nl", "netherlands", "holland",
    "ie", "ireland", "se", "sweden", "pl", "poland",
    "dk", "denmark", "fi", "finland", "pt", "portugal",
    "gr", "greece", "cz", "czechia", "czech republic",
    "hu", "hungary", "ro", "romania", "sk", "slovakia",
    "si", "slovenia", "bg", "bulgaria", "hr", "croatia",
    "ee", "estonia", "lv", "latvia", "lt", "lithuania",
    "lu", "luxembourg", "mt", "malta", "cy", "cyprus"
  ];
  if (euUk.some(e => c === e || c.includes(e))) {
    return "VAT Reg No";
  }

  // 9. Check if listed in COUNTRIES
  const found = COUNTRIES.find(
    item => (item.code || "").toLowerCase() === c || (item.name || "").toLowerCase() === c
  );
  if (found && found.taxLabel) {
    return found.taxLabel;
  }

  return "Tax ID";
}

export function getCountryConfig(countryNameOrCode?: string): CountryConfig {
  if (!countryNameOrCode || typeof countryNameOrCode !== 'string') {
    return { ...COUNTRIES[0], taxLabel: "GSTIN" };
  }
  const lower = countryNameOrCode.toLowerCase().trim();
  const found = COUNTRIES.find(
    c => (c.code || "").toLowerCase() === lower || (c.name || "").toLowerCase() === lower
  );

  const resolvedTaxLabel = getRegionTaxLabel(countryNameOrCode);

  if (found) {
    return {
      ...found,
      taxLabel: resolvedTaxLabel
    };
  }

  return {
    code: countryNameOrCode.slice(0, 2).toUpperCase(),
    name: countryNameOrCode,
    flag: "🇮🇳",
    currencyCode: "INR",
    currencySymbol: "₹",
    taxSystem: "GST_INDIA",
    taxLabel: resolvedTaxLabel,
    defaultTaxRate: 18,
    states: []
  };
}

export function getCurrencySymbol(currencyCode?: string): string {
  if (!currencyCode || !currencyCode.trim()) return "₹";
  const cleanCode = currencyCode.trim().toUpperCase();
  if (
    cleanCode === "INR" || 
    cleanCode === "RS" || 
    cleanCode === "RS." || 
    cleanCode === "RUPEES" || 
    cleanCode === "RUPEE" || 
    cleanCode === "₹" ||
    cleanCode === "INDIA" ||
    cleanCode === "INDIAN RUPEE"
  ) {
    return "₹";
  }
  const found = ALL_CURRENCIES.find(c => c.code.toUpperCase() === cleanCode);
  if (found) return found.symbol;
  const countryMatch = COUNTRIES.find(c => c.currencyCode.toUpperCase() === cleanCode || c.code.toUpperCase() === cleanCode || c.name.toUpperCase() === cleanCode);
  if (countryMatch) return countryMatch.currencySymbol;
  return cleanCode;
}

export const APPROX_INR_RATES: Record<string, number> = {
  INR: 1,
  USD: 87,
  EUR: 94.5,
  GBP: 111,
  CAD: 63,
  AUD: 56,
  AED: 23.7,
  SGD: 65,
  SAR: 23.2,
  JPY: 0.58,
  CHF: 98,
  CNY: 12,
  NZD: 52,
  MXN: 4.3,
  BRL: 15,
  SEK: 8.2,
  TRY: 2.4,
  RUB: 0.95,
  KRW: 0.06,
  THB: 2.4,
  MYR: 19.5,
  PHP: 1.5,
  IDR: 0.0054,
  QAR: 23.9,
  KWD: 283,
  OMR: 226,
  BHD: 231
};

export function convertInrToCurrency(amountInr: number, targetCurrency = "INR"): number {
  const code = (targetCurrency || "INR").trim().toUpperCase();
  if (code === "INR") return amountInr;
  const inrPerUnit = APPROX_INR_RATES[code] || 87;
  return amountInr / inrPerUnit;
}

export function formatCurrencyAmount(
  amount: number | undefined | null,
  currencyCode = "INR",
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showCode?: boolean;
    space?: boolean;
  }
): string {
  const safeAmount = Number(amount) || 0;
  const cleanCode = (currencyCode || "INR").trim().toUpperCase();
  const symbol = getCurrencySymbol(cleanCode);
  const isINR = cleanCode === "INR" || symbol === "₹";
  const locale = isINR ? "en-IN" : "en-US";

  const minDigits = options?.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 0;
  const maxDigits = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2;

  const formatted = safeAmount.toLocaleString(locale, {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits
  });

  const spaceStr = options?.space ? " " : "";
  const codeSuffix = options?.showCode && symbol !== cleanCode ? ` ${cleanCode}` : "";

  return `${symbol}${spaceStr}${formatted}${codeSuffix}`;
}

export function formatCurrency(
  amount: number | undefined | null,
  currencyCode = "INR",
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showCode?: boolean;
    space?: boolean;
  }
): string {
  return formatCurrencyAmount(amount, currencyCode, options);
}

export function formatMoney(amount: number, currencyCode = "INR"): string {
  return formatCurrencyAmount(amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2, space: true });
}
