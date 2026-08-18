import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import { db, auth, isConfigValid } from "./firebase";
import { updateTrialLedger } from "./trialService";
import { safeLocalStorageSet } from "../utils/storageUtils";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export const isTransientOrShutdownError = (error: unknown): boolean => {
  const errStr = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || "";
  return (
    errCode === "unavailable" ||
    errCode === "failed-precondition" ||
    errStr.includes("offline") ||
    errStr.includes("could not reach") ||
    errStr.includes("Could not reach Cloud Firestore backend") ||
    errStr.includes("unavailable") ||
    errStr.includes("network-connection-lost") ||
    errStr.includes("resource-exhausted") ||
    errStr.includes("INTERNAL ASSERTION FAILED") ||
    errStr.includes("Unexpected state") ||
    errStr.includes("@firebase/firestore") ||
    errStr.includes("FIRESTORE") ||
    errStr.includes("queued writes") ||
    errStr.includes("backoff") ||
    errStr.includes("Quota exceeded") ||
    errStr.includes("quota") ||
    errStr.includes("Write stream exhausted") ||
    errStr.includes("exhausted maximum allowed queued writes") ||
    errStr.includes("shutting down") ||
    errStr.includes("shutting-down") ||
    errStr.includes("terminated") ||
    errStr.includes("client is offline") ||
    errStr.includes("Firestore shutting down")
  );
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth?.currentUser;
  const rawErr = error instanceof Error ? error.message : String(error);
  if (isTransientOrShutdownError(error)) {
    console.warn(`Firestore Notice (${operationType} on ${path}): ${rawErr}`);
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: rawErr,
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = removeUndefined(value);
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

export const saveToCloud = async (path: string, data: any, merge: boolean = true) => {
  if (!isConfigValid || !db) {
    throw new Error("Firebase is not configured. Cloud Sync is disabled.");
  }
  let targetPath = path;
  const parts = targetPath.split("/").filter(Boolean);
  if (parts.length === 1) {
    targetPath = `users/${parts[0]}`;
  } else if (parts[0] === "documents" || parts[0] === "invoices" || parts[0] === "quotations") {
    // Data isolation safeguard: Prevent un-partitioned global document paths
    const currentUid = auth?.currentUser?.uid || "guest";
    targetPath = `users/${currentUid}/${targetPath}`;
  }
  try {
    const docRef = doc(db, targetPath);
    const sanitizedData = removeUndefined(data);
    await setDoc(docRef, sanitizedData, { merge });
    return true;
  } catch (error) {
    const errStr = error instanceof Error ? error.message : String(error);
    if (isTransientOrShutdownError(error)) {
      console.warn(`Firestore save to cloud deferred/failed gracefully for path: ${targetPath}. (${errStr})`);
      return false;
    }
    handleFirestoreError(error, OperationType.WRITE, targetPath);
  }
};

export const loadFromCloud = async (path: string) => {
  if (!isConfigValid || !db) {
    throw new Error("Firebase is not configured. Cloud Sync is disabled.");
  }
  let targetPath = path;
  const parts = targetPath.split("/").filter(Boolean);
  if (parts.length === 1) {
    targetPath = `users/${parts[0]}`;
  } else if (parts[0] === "documents" || parts[0] === "invoices" || parts[0] === "quotations") {
    // Data isolation safeguard: Prevent un-partitioned global document paths
    const currentUid = auth?.currentUser?.uid || "guest";
    targetPath = `users/${currentUid}/${targetPath}`;
  }
  try {
    const docRef = doc(db, targetPath);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    const errStr = error instanceof Error ? error.message : String(error);
    if (isTransientOrShutdownError(error)) {
      console.warn(`Firestore load from cloud failed gracefully for path: ${targetPath}. Continuing in offline mode.`);
      return null;
    }
    handleFirestoreError(error, OperationType.GET, targetPath);
  }
};

/**
 * Data Isolation Query Audit Helper:
 * Fetches documents ONLY scoped strictly to the provided userId or auth.currentUser.uid.
 * Uses subcollection `users/${userId}/documents` and applies strict `where('userId', '==', targetUid)` filters.
 */
export const getUserDocumentsFromCloud = async (userId?: string): Promise<any[]> => {
  const targetUid = userId || auth?.currentUser?.uid;
  if (!targetUid) return [];

  const results: any[] = [];
  const idMap = new Set<string>();

  const addDoc = (docData: any) => {
    if (!docData) return;
    const id = docData.id || docData.documentNumber || docData.docId;
    if (id && !idMap.has(id)) {
      idMap.add(id);
      results.push({ ...docData, id, userId: targetUid });
    }
  };

  if (isConfigValid && db) {
    try {
      // 1. Fetch from subcollection users/${targetUid}/documents
      try {
        const userDocsRef = collection(db, "users", targetUid, "documents");
        const snapshot = await getDocs(userDocsRef);
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (!data.userId || data.userId === targetUid) {
            addDoc({ id: docSnap.id, ...data });
          }
        });
      } catch (e) {
        console.warn("Notice fetching user subcollection documents:", e);
      }

      // 2. Fetch from root documents collection ONLY with strict where('userId', '==', targetUid) filter
      try {
        const globalDocsRef = collection(db, "documents");
        const q = query(globalDocsRef, where("userId", "==", targetUid));
        const globalSnapshot = await getDocs(q);
        globalSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          addDoc({ id: docSnap.id, ...data });
        });
      } catch (e) {
        // Ignore if global collection query is restricted by rules
      }

      // 3. Fallback: Fetch root user document users/${targetUid} and check history array
      try {
        const userDocRef = doc(db, "users", targetUid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (Array.isArray(userData.history)) {
            userData.history.forEach((histItem: any) => {
              if (histItem) addDoc(histItem);
            });
          }
        }
      } catch (e) {
        console.warn("Notice checking root user history:", e);
      }
    } catch (error) {
      console.warn(`Notice loading isolated user documents for ${targetUid}:`, error);
    }
  }

  // 4. Fallback: Check local storage cached keys linked to targetUid
  const localDocs = getLocalCachedDocuments(targetUid);
  localDocs.forEach(item => addDoc(item));

  return results;
};

/**
 * Sanitizes a document ID for safe use in Firestore subcollection paths (avoiding path separator slashes).
 */
export const getSafeFirestoreDocId = (id: string, timestamp?: number): string => {
  const safeId = (id || "doc").replace(/[\/\\]/g, "_").replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  return timestamp ? `${safeId}_${timestamp}` : safeId;
};

/**
 * Saves a single document record to Firebase Firestore under the user's subcollection
 * users/{userId}/documents/{safeDocId} and synchronizes with local storage.
 * Ensures the saved schema includes: id, documentNumber, type, partyName, customerName,
 * customerCountry, date, createdAt, timestamp, totalAmount, total, inrTotal, currency,
 * lineItemsCount, itemsCount, status, paymentStatus, editCount, fullData, and userId.
 */
export const saveDocumentRecordToCloud = async (userId: string, docItem: any): Promise<boolean> => {
  if (!userId || !docItem) return false;

  const timestamp = docItem.timestamp || Date.now();
  const safeDocId = getSafeFirestoreDocId(docItem.id || docItem.documentNumber || "DOC", timestamp);
  const isoDate = docItem.createdAt || (docItem.date ? new Date(docItem.date).toISOString() : new Date().toISOString());

  const standardizedDoc = {
    ...docItem,
    id: docItem.id || docItem.documentNumber || "DOC",
    documentNumber: docItem.id || docItem.documentNumber || "DOC",
    type: docItem.type || "Tax Invoice",
    partyName: docItem.partyName || docItem.customerName || "Customer",
    customerName: docItem.partyName || docItem.customerName || "Customer",
    customerCountry: docItem.customerCountry || docItem.country || "",
    date: docItem.date || new Date().toISOString().split("T")[0],
    createdAt: isoDate,
    timestamp: timestamp,
    totalAmount: typeof docItem.totalAmount === "number" ? docItem.totalAmount : (docItem.total || 0),
    total: typeof docItem.total === "number" ? docItem.total : (docItem.totalAmount || 0),
    inrTotal: docItem.inrTotal || docItem.total || 0,
    currency: docItem.currency || "INR",
    lineItemsCount: docItem.lineItemsCount ?? (Array.isArray(docItem.fullData?.items) ? docItem.fullData.items.length : 0),
    itemsCount: docItem.itemsCount ?? (Array.isArray(docItem.fullData?.items) ? docItem.fullData.items.length : 0),
    status: docItem.status || (docItem.paymentStatus === "paid" ? "Paid" : "Issued"),
    paymentStatus: docItem.paymentStatus || "pending",
    editCount: docItem.editCount || 0,
    userId: userId,
    updatedAt: new Date().toISOString(),
  };

  // Local storage save first for immediate offline persistence
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const storageKey = `billiq_user_${userId}_document_history`;
      const currentRaw = localStorage.getItem(storageKey) || localStorage.getItem("document_history");
      let currentList: any[] = [];
      if (currentRaw) {
        try { currentList = JSON.parse(currentRaw) || []; } catch {}
      }
      const existingIdx = currentList.findIndex(d => (String(d.timestamp) === String(timestamp)) || (d.id === standardizedDoc.id && d.type === standardizedDoc.type));
      if (existingIdx !== -1) {
        currentList[existingIdx] = standardizedDoc;
      } else {
        currentList = [standardizedDoc, ...currentList];
      }
      safeLocalStorageSet(storageKey, currentList);
      safeLocalStorageSet("document_history", currentList);
    } catch (e) {
      console.warn("Notice updating local storage document history:", e);
    }
  }

  // Trigger First Document Creation Follow-up tracking in background
  try {
    const currentUser = auth?.currentUser;
    const userEmail = currentUser?.email || "";
    const username = currentUser?.displayName || (userEmail ? userEmail.split("@")[0] : "User");
    fetch("/api/track-first-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        email: userEmail,
        username,
        documentsCount: 1,
      }),
    }).catch(() => {});
  } catch (e) {}

  if (isConfigValid && db) {
    try {
      const sanitized = removeUndefined(standardizedDoc);
      // 1. Write to subcollection users/{userId}/documents/{safeDocId}
      const userDocRef = doc(db, "users", userId, "documents", safeDocId);
      await setDoc(userDocRef, sanitized, { merge: true });

      // 2. Also write to root documents collection partitioned by userId if rules allow
      try {
        const rootDocRef = doc(db, "documents", `${userId}_${safeDocId}`);
        await setDoc(rootDocRef, sanitized, { merge: true });
      } catch (rootErr) {
        // Safe to ignore if root write is denied
      }

      return true;
    } catch (error) {
      if (isTransientOrShutdownError(error)) {
        console.warn(`Firestore document save deferred for ${safeDocId}.`);
        return false;
      }
      console.warn(`Notice persisting document ${safeDocId} to cloud (saved locally):`, error);
      return false;
    }
  }

  return true;
};

/**
 * Deletes a single document record from Firebase Firestore under the user's subcollection
 * users/{userId}/documents/{safeDocId}.
 */
export const deleteDocumentRecordFromCloud = async (userId: string, docId: string, timestamp?: number): Promise<boolean> => {
  if (!userId || !docId) return false;
  const safeDocId = getSafeFirestoreDocId(docId, timestamp);
  if (isConfigValid && db) {
    try {
      const docRef = doc(db, "users", userId, "documents", safeDocId);
      await deleteDoc(docRef);
      try {
        const rootDocRef = doc(db, "documents", `${userId}_${safeDocId}`);
        await deleteDoc(rootDocRef);
      } catch {}
      return true;
    } catch (err) {
      console.warn("Notice deleting document from subcollection:", err);
      return false;
    }
  }
  return true;
};

/**
 * Attaches a real-time listener for user documents in the subcollection users/{userId}/documents.
 * Fires immediately with the latest documents sorted by timestamp/createdAt descending.
 */
export const subscribeToUserDocuments = (
  userId: string,
  onDocuments: (docs: any[]) => void,
  onError?: (error: any) => void
) => {
  if (!isConfigValid || !db || !userId) return () => {};

  let isUnsubscribed = false;
  const userDocsCol = collection(db, "users", userId, "documents");

  const unsubscribe = onSnapshot(
    userDocsCol,
    (snapshot) => {
      if (isUnsubscribed) return;
      const cloudDocs: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as any;
        if (data) {
          cloudDocs.push({
            id: data.id || docSnap.id,
            documentNumber: data.documentNumber || data.id || docSnap.id,
            type: data.type || "Tax Invoice",
            date: data.date || "",
            createdAt: data.createdAt || data.date,
            customerName: data.partyName || data.customerName || "Customer",
            partyName: data.partyName || data.customerName || "Customer",
            customerCountry: data.customerCountry || "",
            total: typeof data.total === "number" ? data.total : (data.totalAmount || 0),
            totalAmount: typeof data.totalAmount === "number" ? data.totalAmount : (data.total || 0),
            inrTotal: data.inrTotal || data.total || 0,
            currency: data.currency || "INR",
            lineItemsCount: data.lineItemsCount ?? (Array.isArray(data.fullData?.items) ? data.fullData.items.length : 0),
            status: data.status || (data.paymentStatus === "paid" ? "Paid" : "Issued"),
            fullData: data.fullData,
            paymentStatus: data.paymentStatus || "pending",
            dueDate: data.dueDate,
            editCount: data.editCount || 0,
            timestamp: data.timestamp || Date.now(),
            userId: userId,
          });
        }
      });

      if (cloudDocs.length > 0) {
        cloudDocs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        onDocuments(cloudDocs);
      }
    },
    (error) => {
      if (isTransientOrShutdownError(error)) {
        console.warn(`Firestore documents subcollection notice for user ${userId}:`, error instanceof Error ? error.message : String(error));
        return;
      }
      console.warn(`Firestore real-time documents subcollection error for user ${userId}:`, error);
      if (onError) onError(error);
    }
  );

  return () => {
    isUnsubscribed = true;
    unsubscribe();
  };
};

export const getLocalCachedDocuments = (userId?: string): any[] => {
  const targetUid = userId || auth?.currentUser?.uid;
  if (typeof window === "undefined" || !window.localStorage) return [];

  const docs: any[] = [];
  const idMap = new Set<string>();

  const keysToCheck: string[] = [];
  if (targetUid) {
    keysToCheck.push(`billiq_user_${targetUid}_document_history`);
    keysToCheck.push(`${targetUid}_document_history`);
  } else {
    keysToCheck.push("document_history");
  }

  keysToCheck.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (item && (item.id || item.documentNumber || item.docId)) {
              const id = item.id || item.documentNumber || item.docId;
              if (!idMap.has(id)) {
                if (targetUid ? (item.userId === targetUid || !item.userId) : true) {
                  idMap.add(id);
                  docs.push({ ...item, id, userId: targetUid || item.userId });
                }
              }
            }
          });
        }
      }
    } catch (e) {}
  });

  return docs;
};

/**
 * Merges local cached user data (documents, history, business settings, customers, suppliers, layout settings)
 * with Firebase Firestore on login, ensuring that cached documents and settings are synced correctly
 * when the user logs into a different device or logs in with offline-cached data.
 */
export const mergeLocalDataWithFirestore = async (userId: string, userEmail?: string): Promise<any> => {
  const targetUid = userId || auth?.currentUser?.uid;
  if (!targetUid) return {};

  let remoteData: any = {};
  let userDocRef: any = null;

  if (isConfigValid && db) {
    try {
      userDocRef = doc(db, "users", targetUid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        remoteData = userSnap.data() || {};
      }
    } catch (err) {
      console.warn("Notice fetching remote Firestore user doc during merge:", err);
    }
  }

  // 1. Local Cache Retrieval
  let localBusiness: any = {};
  let localHistory: any[] = [];
  let localCustomers: any[] = [];
  let localSuppliers: any[] = [];
  let localLayout: any = null;
  let localNotes: any = null;
  let localNumbers: Record<string, number> = {};
  let localPriceHistory: any = null;

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const bizRaw = localStorage.getItem(`billiq_user_${targetUid}_business_details`) || localStorage.getItem("business_details");
      if (bizRaw) localBusiness = JSON.parse(bizRaw) || {};
    } catch (e) {}

    localHistory = getLocalCachedDocuments(targetUid);

    try {
      const custRaw = localStorage.getItem(`billiq_user_${targetUid}_saved_customers`) || localStorage.getItem("saved_customers");
      if (custRaw) {
        const parsed = JSON.parse(custRaw);
        if (Array.isArray(parsed)) localCustomers = parsed;
      }
    } catch (e) {}

    try {
      const suppRaw = localStorage.getItem(`billiq_user_${targetUid}_saved_suppliers`) || localStorage.getItem("saved_suppliers");
      if (suppRaw) {
        const parsed = JSON.parse(suppRaw);
        if (Array.isArray(parsed)) localSuppliers = parsed;
      }
    } catch (e) {}

    try {
      const layRaw = localStorage.getItem(`billiq_user_${targetUid}_pdf_layout_settings`) || localStorage.getItem("pdf_layout_settings");
      if (layRaw) localLayout = JSON.parse(layRaw);
    } catch (e) {}

    try {
      const notesRaw = localStorage.getItem(`billiq_user_${targetUid}_last_used_notes_and_terms`) || localStorage.getItem("last_used_notes_and_terms");
      if (notesRaw) localNotes = JSON.parse(notesRaw);
    } catch (e) {}

    try {
      const numRaw = localStorage.getItem(`billiq_user_${targetUid}_last_used_document_numbers`) || localStorage.getItem("last_used_document_numbers");
      if (numRaw) localNumbers = JSON.parse(numRaw) || {};
    } catch (e) {}

    try {
      const priceRaw = localStorage.getItem(`billiq_user_${targetUid}_price_history`) || localStorage.getItem("price_history");
      if (priceRaw) localPriceHistory = JSON.parse(priceRaw);
    } catch (e) {}
  }

  // 2. Merge Documents / History
  const mergedHistoryMap = new Map<string, any>();
  const remoteHistory: any[] = Array.isArray(remoteData.history) ? remoteData.history : [];

  remoteHistory.forEach((item) => {
    if (item) {
      const id = item.id || item.documentNumber || item.docId;
      if (id) {
        mergedHistoryMap.set(`${id}_${item.type || ''}`, item);
      }
    }
  });

  // Include subcollection documents if present
  try {
    const subcolDocs = await getUserDocumentsFromCloud(targetUid);
    subcolDocs.forEach((item) => {
      if (item) {
        const id = item.id || item.documentNumber || item.docId;
        if (id) {
          const key = `${id}_${item.type || ''}`;
          const existing = mergedHistoryMap.get(key);
          if (!existing || (item.timestamp || 0) > (existing.timestamp || 0)) {
            mergedHistoryMap.set(key, item);
          }
        }
      }
    });
  } catch (e) {
    console.warn("Notice checking subcollection docs during merge:", e);
  }

  // Merge local history items
  localHistory.forEach((localItem) => {
    if (localItem) {
      const id = localItem.id || localItem.documentNumber || localItem.docId;
      if (id) {
        const key = `${id}_${localItem.type || ''}`;
        const cloudItem = mergedHistoryMap.get(key);
        if (!cloudItem) {
          mergedHistoryMap.set(key, localItem);
        } else {
          if (localItem.fullData && !cloudItem.fullData) {
            mergedHistoryMap.set(key, { ...cloudItem, fullData: localItem.fullData });
          } else if ((localItem.timestamp || 0) > (cloudItem.timestamp || 0)) {
            mergedHistoryMap.set(key, { ...cloudItem, ...localItem });
          }
        }
      }
    }
  });

  const mergedHistory = Array.from(mergedHistoryMap.values()).sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
  );

  // 3. Merge Business Details
  const remoteBusiness = remoteData.business || {};
  const bizName = localBusiness.name || localBusiness.companyName || remoteBusiness.name || remoteBusiness.companyName || "";
  const bizCountry = localBusiness.country || remoteBusiness.country || "India";
  const bizCurrency = localBusiness.currency || remoteBusiness.currency || "INR";
  const mergedBusiness = {
    ...remoteBusiness,
    ...localBusiness,
    name: bizName,
    companyName: bizName,
    country: bizCountry,
    currency: bizCurrency,
    letterhead: localBusiness.letterhead || remoteBusiness.letterhead,
    logo: localBusiness.logo || remoteBusiness.logo,
    signature: localBusiness.signature || remoteBusiness.signature,
  };

  // 4. Merge Saved Customers & Suppliers
  const customerMap = new Map<string, any>();
  (Array.isArray(remoteData.savedCustomers) ? remoteData.savedCustomers : []).forEach(c => {
    if (c) {
      const key = c.id || c.email || c.name;
      if (key) customerMap.set(key, c);
    }
  });
  localCustomers.forEach(c => {
    if (c) {
      const key = c.id || c.email || c.name;
      if (key && !customerMap.has(key)) {
        customerMap.set(key, c);
      }
    }
  });
  const mergedCustomers = Array.from(customerMap.values());

  const supplierMap = new Map<string, any>();
  (Array.isArray(remoteData.savedSuppliers) ? remoteData.savedSuppliers : []).forEach(s => {
    if (s) {
      const key = s.id || s.email || s.name;
      if (key) supplierMap.set(key, s);
    }
  });
  localSuppliers.forEach(s => {
    if (s) {
      const key = s.id || s.email || s.name;
      if (key && !supplierMap.has(key)) {
        supplierMap.set(key, s);
      }
    }
  });
  const mergedSuppliers = Array.from(supplierMap.values());

  // 5. Merge Layout, Notes, Numbers, Price History
  const mergedLayout = remoteData.pdf_layout_settings || localLayout;
  const mergedNotes = remoteData.last_used_notes_and_terms || localNotes;

  const remoteNumbers = remoteData.lastUsedNumbers || {};
  const mergedNumbers: Record<string, number> = { ...localNumbers, ...remoteNumbers };
  Object.keys(localNumbers).forEach(k => {
    if (remoteNumbers[k] !== undefined) {
      mergedNumbers[k] = Math.max(localNumbers[k] || 0, remoteNumbers[k] || 0);
    }
  });

  const mergedPriceHistory = remoteData.priceHistory || localPriceHistory;

  // 6. Push merged state to Firestore user document
  const mergedPayload: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };
  if (Object.keys(mergedBusiness).length > 0) mergedPayload.business = mergedBusiness;
  if (mergedHistory.length > 0) mergedPayload.history = mergedHistory;
  if (mergedCustomers.length > 0) mergedPayload.savedCustomers = mergedCustomers;
  if (mergedSuppliers.length > 0) mergedPayload.savedSuppliers = mergedSuppliers;
  if (mergedLayout) mergedPayload.pdf_layout_settings = mergedLayout;
  if (mergedNotes) mergedPayload.last_used_notes_and_terms = mergedNotes;
  if (Object.keys(mergedNumbers).length > 0) mergedPayload.lastUsedNumbers = mergedNumbers;
  if (mergedPriceHistory) mergedPayload.priceHistory = mergedPriceHistory;

  if (isConfigValid && db && userDocRef) {
    try {
      const sanitized = removeUndefined(mergedPayload);
      await setDoc(userDocRef, sanitized, { merge: true });
    } catch (e) {
      console.warn("Notice updating Firestore with merged user data:", e);
    }
  }

  // 7. Update Local Storage for this specific user
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (Object.keys(mergedBusiness).length > 0) {
        localStorage.setItem(`billiq_user_${targetUid}_business_details`, JSON.stringify(mergedBusiness));
      }
      if (mergedHistory.length > 0) {
        localStorage.setItem(`billiq_user_${targetUid}_document_history`, JSON.stringify(mergedHistory));
      }
      if (mergedCustomers.length > 0) {
        localStorage.setItem(`billiq_user_${targetUid}_saved_customers`, JSON.stringify(mergedCustomers));
      }
      if (mergedSuppliers.length > 0) {
        localStorage.setItem(`billiq_user_${targetUid}_saved_suppliers`, JSON.stringify(mergedSuppliers));
      }
      if (mergedLayout) {
        localStorage.setItem(`billiq_user_${targetUid}_pdf_layout_settings`, JSON.stringify(mergedLayout));
      }
      if (mergedNotes) {
        localStorage.setItem(`billiq_user_${targetUid}_last_used_notes_and_terms`, JSON.stringify(mergedNotes));
      }
      if (Object.keys(mergedNumbers).length > 0) {
        localStorage.setItem(`billiq_user_${targetUid}_last_used_document_numbers`, JSON.stringify(mergedNumbers));
      }
    } catch (e) {}
  }

  return {
    ...mergedPayload,
    mergedUserDoc: {
      ...remoteData,
      ...mergedPayload,
    }
  };
};

export const mergeUserDataWithFirestore = mergeLocalDataWithFirestore;

export const deleteUserAccount = async (userId: string) => {
  if (!isConfigValid || !db) {
    throw new Error("Firebase is not configured. Cloud Sync is disabled.");
  }
  try {
    const userDocRef = doc(db, "users", userId);
    let userEmail = "";
    let userUsername = "";

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        userEmail = data.signupEmail || data.authEmail || data.email || "";
        userUsername = data.username || data.authUsername || "";
      }
    } catch (e) {
      // ignore
    }

    const currentAuthEmail = auth?.currentUser?.email || "";
    const targetEmail = userEmail || (auth?.currentUser?.uid === userId ? currentAuthEmail : "");

    // Permanently mark trial ledger as exhausted for this email address so re-registration cannot reuse trial
    if (targetEmail) {
      try {
        await updateTrialLedger(targetEmail, {
          trialUsed: true,
          documentsRemaining: 0,
          planTier: "expired",
          planName: "Trial Expired",
          isReRegisteredUser: true,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Trial ledger update on account deletion notice:", e);
      }
    }

    // List of potential subcollections to completely purge
    const subCollections = [
      "documents",
      "invoices",
      "savedCustomers",
      "savedSuppliers",
      "businessProfile",
      "logs",
      "settings",
      "customers",
      "suppliers",
      "history",
      "items",
      "parties"
    ];

    for (const subColl of subCollections) {
      try {
        const subColRef = collection(db, "users", userId, subColl);
        const snapshot = await getDocs(subColRef);
        for (const docSnap of snapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
      } catch (e) {
        // Ignore if subcollection does not exist
      }
    }

    // Permanently delete the root user document
    await deleteDoc(userDocRef);

    // Call server to remove user from registeredUsers backend memory & disk
    try {
      await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, email: userEmail, username: userUsername })
      });
    } catch (e) {
      console.warn("Server API delete user notice:", e);
    }

    // Wipe cached user data in localStorage strictly for this specific user
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith(`billiq_user_${userId}_`) ||
            key.startsWith(`${userId}_`) ||
            key.endsWith(`_${userId}`) ||
            key.includes(userId) ||
            (userEmail && key.includes(userEmail))
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        // ignore storage clean up errors
      }
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
  }
};

export const deleteFromCloud = async (path: string) => {
  if (!isConfigValid || !db) {
    throw new Error("Firebase is not configured. Cloud Sync is disabled.");
  }
  try {
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 2 && parts[0] === "users") {
      return await deleteUserAccount(parts[1]);
    }
    const docRef = doc(db, path);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    if (isTransientOrShutdownError(error)) {
      console.warn(`Firestore delete deferred/failed gracefully for path: ${path}.`);
      return false;
    }
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getAllUsersFromCloud = async (): Promise<any[]> => {
  if (!isConfigValid || !db) {
    return [];
  }
  try {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    const result: any[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const currentAuthUser = auth?.currentUser;

      // Extract immutable signup email as highest priority source of truth (ACCOUNT EMAIL)
      let resolvedSignupEmail = (
        data.signupEmail ||
        data.authEmail ||
        data.email ||
        (currentAuthUser && currentAuthUser.uid === docSnap.id ? currentAuthUser.email : "") ||
        ""
      ).trim();

      if (!resolvedSignupEmail && data.business?.email && typeof data.business.email === "string") {
        resolvedSignupEmail = data.business.email.trim();
      }

      // Extract permanent username identifier (ACCOUNT USERNAME)
      let resolvedUsername = (
        data.username ||
        data.authUsername ||
        ""
      ).trim();

      if (!resolvedUsername && data.displayName && data.displayName !== data.business?.companyName && data.displayName !== data.business?.name) {
        resolvedUsername = data.displayName.trim();
      }

      if (!resolvedUsername && resolvedSignupEmail) {
        resolvedUsername = resolvedSignupEmail.split('@')[0];
      }

      if (!resolvedUsername) {
        resolvedUsername = "User";
      }

      result.push({
        id: docSnap.id,
        ...data,
        email: resolvedSignupEmail,
        signupEmail: resolvedSignupEmail,
        authEmail: resolvedSignupEmail,
        username: resolvedUsername,
        authUsername: resolvedUsername,
        displayName: (data.displayName && data.displayName !== data.business?.companyName ? data.displayName : resolvedUsername)
      });
    });
    return result;
  } catch (error) {
    if (isTransientOrShutdownError(error)) {
      console.warn("Notice: Firestore offline or shutting down while fetching users list.");
      return [];
    }
    console.error("Failed to fetch users from cloud:", error);
    handleFirestoreError(error, OperationType.LIST, "users");
    return [];
  }
};

/**
 * Attaches a real-time listener strictly to a user's Firestore document at users/{userId}.
 * Fires immediately upon data changes (e.g. plan/subscription updates from Admin Panel).
 */
export const subscribeToUserDoc = (
  userId: string,
  onData: (data: any) => void,
  onError?: (error: any) => void
) => {
  if (!isConfigValid || !db || !userId) return () => {};
  const userDocRef = doc(db, "users", userId);
  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data());
      } else {
        onData(null);
      }
    },
    (error) => {
      if (isTransientOrShutdownError(error)) {
        console.warn(`Firestore subscription notice for user ${userId}:`, error instanceof Error ? error.message : String(error));
        return;
      }
      console.warn(`Firestore real-time subscription error for user ${userId}:`, error);
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    }
  );
};

