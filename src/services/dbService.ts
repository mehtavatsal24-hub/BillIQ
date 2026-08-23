/**
 * Local Storage Database Service
 * Replaces Cloud Firestore read/write/query operations with browser localStorage persistence.
 * Stores invoices, parties, landing data, user history, and settings locally in JSON format.
 */

import { safeLocalStorageSet } from "../utils/storageUtils";
import { auth } from "./auth";
import {
  collection as firestoreCollection,
  deleteDoc as firestoreDeleteDoc,
  doc as firestoreDoc,
  getDoc as firestoreGetDoc,
  getDocs as firestoreGetDocs,
  onSnapshot as firestoreOnSnapshot,
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc,
} from "firebase/firestore";
import { firestore } from "./firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const stripDbArg = (args: any[]) => args[0] === db || args[0] === null ? args.slice(1) : args;
const firestoreDocAny = firestoreDoc as any;
const firestoreCollectionAny = firestoreCollection as any;
const firestoreSetDocAny = firestoreSetDoc as any;
const firestoreGetDocAny = firestoreGetDoc as any;
const firestoreGetDocsAny = firestoreGetDocs as any;
const firestoreOnSnapshotAny = firestoreOnSnapshot as any;
const firestoreUpdateDocAny = firestoreUpdateDoc as any;
const firestoreDeleteDocAny = firestoreDeleteDoc as any;
export const doc = (...args: any[]): any => firestoreDocAny(firestore, ...stripDbArg(args));
export const setDoc = async (...args: any[]): Promise<any> => firestoreSetDocAny(...args);
export const getDoc = async (...args: any[]): Promise<any> => firestoreGetDocAny(...args);
export const getDocs = async (...args: any[]): Promise<any> => firestoreGetDocsAny(...args);
export const onSnapshot = (...args: any[]): any => firestoreOnSnapshotAny(...args);
export const collection = (...args: any[]): any => firestoreCollectionAny(firestore, ...stripDbArg(args));
export const query = (...args: any[]): any => null;
export const where = (...args: any[]): any => null;
export const orderBy = (...args: any[]): any => null;
export const limit = (...args: any[]): any => null;
export const updateDoc = async (...args: any[]): Promise<any> => firestoreUpdateDocAny(...args);
export const deleteDoc = async (...args: any[]): Promise<any> => firestoreDeleteDocAny(...args);

export const isConfigValid = true;
export const db = firestore;

export const isTransientOrShutdownError = (error: unknown): boolean => {
  return false;
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.warn(`Local DB (${operationType} on ${path}):`, error);
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

export const getStorageKeyForPath = (path: string): string => {
  const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
  return `billiq_localdb_${cleanPath.replace(/[\/\\]/g, '_')}`;
};

export const saveToCloud = async (path: string, data: any, merge: boolean = true) => {
  const pathParts = path.split("/").filter(Boolean);
  if (pathParts.length % 2 !== 0) throw new Error(`Firestore path must point to a document: ${path}`);
  await firestoreSetDocAny(firestoreDocAny(firestore, ...pathParts), removeUndefined(data), { merge });
  if (typeof window === "undefined" || !window.localStorage) return true;
  try {
    const key = getStorageKeyForPath(path);
    const sanitized = removeUndefined(data);
    if (merge) {
      const existingRaw = localStorage.getItem(key);
      let existingData = {};
      if (existingRaw) {
        try { existingData = JSON.parse(existingRaw) || {}; } catch {}
      }
      const merged = { ...existingData, ...sanitized };
      safeLocalStorageSet(key, merged);
    } else {
      safeLocalStorageSet(key, sanitized);
    }
    return true;
  } catch (error) {
    console.warn("Failed to save to local DB:", error);
    return false;
  }
};

export const loadFromCloud = async (path: string) => {
  const pathParts = path.split("/").filter(Boolean);
  if (pathParts.length % 2 !== 0) throw new Error(`Firestore path must point to a document: ${path}`);
  try {
    const snapshot = await firestoreGetDocAny(firestoreDocAny(firestore, ...pathParts));
    if (snapshot.exists()) return snapshot.data();
  } catch (error) {
    console.warn("Failed to load from Firestore:", error);
  }
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const key = getStorageKeyForPath(path);
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
    return null;
  } catch (error) {
    console.warn("Failed to load from local DB:", error);
    return null;
  }
};

export const getSafeFirestoreDocId = (id: string, timestamp?: number): string => {
  const safeId = (id || "doc").replace(/[\/\\]/g, "_").replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  return timestamp ? `${safeId}_${timestamp}` : safeId;
};

export const getLocalCachedDocuments = (userId?: string): any[] => {
  const targetUid = userId || auth?.currentUser?.uid;
  if (!targetUid) return [];
  if (typeof window === "undefined" || !window.localStorage) return [];

  const docs: any[] = [];
  const idMap = new Set<string>();

  const keysToCheck = [
    `billiq_user_${targetUid}_document_history`,
    `${targetUid}_document_history`,
    getStorageKeyForPath(`users/${targetUid}/documents`)
  ];

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
                idMap.add(id);
                docs.push({ ...item, id, userId: targetUid });
              }
            }
          });
        }
      }
    } catch (e) {}
  });

  return docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

export const getUserDocumentsFromCloud = async (userId?: string): Promise<any[]> => {
  const targetUid = userId || auth?.currentUser?.uid;
  if (!targetUid) return [];
  try {
    const snapshot = await firestoreGetDocAny(firestoreDocAny(firestore, "users", targetUid));
    const data = snapshot.exists() ? snapshot.data() : null;
    if (Array.isArray(data?.history)) {
      return data.history.map((item: any) => ({ ...item, userId: targetUid }));
    }
  } catch (error) {
    console.warn("Failed to load user documents from Firestore:", error);
  }
  return getLocalCachedDocuments(targetUid);
};

export const saveDocumentRecordToCloud = async (userId: string, docItem: any): Promise<boolean> => {
  if (!userId || !docItem) return false;

  const timestamp = docItem.timestamp || Date.now();
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

  return true;
};

export const deleteDocumentRecordFromCloud = async (userId: string, docId: string, timestamp?: number): Promise<boolean> => {
  if (!userId || !docId) return false;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const storageKey = `billiq_user_${userId}_document_history`;
      const filterDocs = (key: string) => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const updated = list.filter(d => d.id !== docId && d.documentNumber !== docId);
              safeLocalStorageSet(key, updated);
            }
          } catch {}
        }
      };
      filterDocs(storageKey);
      filterDocs("document_history");
    } catch (e) {}
  }
  return true;
};

export const subscribeToUserDocuments = (
  userId: string,
  onDocuments: (docs: any[]) => void,
  onError?: (error: any) => void
) => {
  const docs = getLocalCachedDocuments(userId);
  onDocuments(docs);
  return () => {};
};

export const mergeLocalDataWithFirestore = async (userId: string, userEmail?: string): Promise<any> => {
  const targetUid = userId || auth?.currentUser?.uid;
  if (!targetUid) return { history: [], mergedUserDoc: null };
  const history = getLocalCachedDocuments(targetUid);
  return {
    history,
    mergedUserDoc: await loadFromCloud(`users/${targetUid}`)
  };
};

export const mergeUserDataWithFirestore = mergeLocalDataWithFirestore;

export const deleteUserAccount = async (userId: string) => {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(userId) || key.startsWith("billiq_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }
  return true;
};

export const deleteFromCloud = async (path: string) => {
  if (typeof window === "undefined" || !window.localStorage) return true;
  try {
    const key = getStorageKeyForPath(path);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
};

export const getAllUsersFromCloud = async (): Promise<any[]> => {
  try {
    const snapshot = await firestoreGetDocsAny(firestoreCollectionAny(firestore, "users"));
    return snapshot.docs.map((entry: any) => ({ id: entry.id, ...entry.data() }));
  } catch (error) {
    console.warn("Failed to load users from Firestore:", error);
    return [];
  }
};

export const subscribeToUserDoc = (
  userId: string,
  onData: (data: any) => void,
  onError?: (error: any) => void
) => {
  if (!userId) return () => {};
  return firestoreOnSnapshotAny(
    firestoreDocAny(firestore, "users", userId),
    (snapshot) => onData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    onError
  );
};
