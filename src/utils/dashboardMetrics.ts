export interface DocumentRecord {
  id: string;
  documentType: string;
  documentDate: string; // 'YYYY-MM-DD'
  amount: number;
  status: string;
  data?: {
    terms?: string[];
    paymentTerms?: string;
  };
}

/**
 * Parses payment terms string (e.g., "3 days", "Net 30", "15 Days") to extract the number of days.
 */
export const extractPaymentDays = (doc: DocumentRecord): number => {
  const termsText = 
    doc.data?.paymentTerms || 
    (doc.data?.terms && doc.data.terms.join(' ')) || 
    '';

  const match = termsText.match(/(\d+)\s*(?:days|day)/i);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Computes dashboard financial metrics dynamically based on payment terms and due dates.
 */
export const calculateDashboardMetrics = (documents: DocumentRecord[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  let totalSales = 0;
  let totalUnpaid = 0;
  let unpaidCount = 0;

  let overdueAmount = 0;
  let overdueCount = 0;

  let dueSoonAmount = 0;
  let dueSoonCount = 0;

  documents.forEach((doc) => {
    // Exclude non-financial documents like Packing Lists or Quotations if necessary
    if (doc.documentType === 'Packing List' || doc.documentType === 'Quotation') {
      return;
    }

    const docAmount = Number(doc.amount) || 0;
    totalSales += docAmount;

    // Check unpaid invoices
    if (doc.status !== 'Paid') {
      totalUnpaid += docAmount;
      unpaidCount += 1;

      // 1. Calculate target Due Date based on Document Date + Payment Term Days
      const issueDate = doc.documentDate ? new Date(doc.documentDate) : new Date();
      issueDate.setHours(0, 0, 0, 0);

      const paymentDays = extractPaymentDays(doc);
      
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + paymentDays);

      // 2. Evaluate status relative to Today
      const diffInTime = dueDate.getTime() - today.getTime();
      const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));

      if (diffInDays < 0) {
        // Due date has already passed
        overdueAmount += docAmount;
        overdueCount += 1;
      } else if (diffInDays >= 0 && diffInDays <= 7) {
        // Due date falls within the upcoming 7 days
        dueSoonAmount += docAmount;
        dueSoonCount += 1;
      }
    }
  });

  return {
    totalSales,
    totalUnpaid,
    unpaidCount,
    overdueAmount,
    overdueCount,
    dueSoonAmount,
    dueSoonCount,
  };
};
