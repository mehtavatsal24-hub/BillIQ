import { auth } from "../services/auth";
import { safeLocalStorageSet } from "./storageUtils";
import { loadFromCloud, saveToCloud } from "../services/dbService";

export interface ContactEntity {
  id?: string;
  userId?: string;
  name: string;
  type: 'Customer' | 'Supplier';
  gstin?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  attentionPerson?: string;
}

export const autoSaveContactIfNew = async (
  contact: ContactEntity,
  existingContacts: ContactEntity[],
  saveContactFn: (newContact: ContactEntity) => Promise<void> | void
) => {
  if (!contact.name || !contact.name.trim()) return;

  const normalizedName = contact.name.trim().toLowerCase();
  
  const exists = existingContacts.some(
    (item) =>
      (item.name || "").trim().toLowerCase() === normalizedName ||
      (contact.gstin && item.gstin && item.gstin.trim().toLowerCase() === contact.gstin.trim().toLowerCase())
  );

  if (!exists) {
    const currentUid = contact.userId || auth?.currentUser?.uid || "local-admin";
    const newEntry: ContactEntity = {
      ...contact,
      userId: currentUid,
      id: contact.id || `contact_${Date.now()}`,
      name: contact.name.trim()
    };
    await saveContactFn(newEntry);
  }
};

export const getUserContacts = async (
  userId: string,
  type: 'Customer' | 'Supplier'
): Promise<ContactEntity[]> => {
  const currentUid = userId || auth?.currentUser?.uid;
  if (!currentUid) return [];
  try {
    const profile = await loadFromCloud(`users/${currentUid}`);
    const cloudContacts = type === 'Customer' ? profile?.savedCustomers : profile?.savedSuppliers;
    if (Array.isArray(cloudContacts)) return cloudContacts;
  } catch (error) {
    console.warn("Failed to load contacts from Firestore:", error);
  }
  if (typeof window === "undefined" || !window.localStorage) return [];

  const key = type === 'Customer' 
    ? `billiq_user_${currentUid}_saved_customers` 
    : `billiq_user_${currentUid}_saved_suppliers`;
  const raw = localStorage.getItem(key) || localStorage.getItem(type === 'Customer' ? 'saved_customers' : 'saved_suppliers');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
};

export const saveUserContact = async (userId: string, contact: Omit<ContactEntity, 'userId'>) => {
  const currentUid = userId || auth?.currentUser?.uid;
  if (!currentUid) return;
  if (!contact.name) return;

  const contactData: ContactEntity = {
    ...contact,
    userId: currentUid,
    id: contact.id || `contact_${Date.now()}`
  };

  const key = contact.type === 'Customer' 
    ? `billiq_user_${currentUid}_saved_customers` 
    : `billiq_user_${currentUid}_saved_suppliers`;

  const existing = await getUserContacts(currentUid, contact.type);
  const updated = [contactData, ...existing.filter(c => c.name !== contact.name)];
  safeLocalStorageSet(key, updated);
  await saveToCloud(`users/${currentUid}`, contact.type === 'Customer' ? { savedCustomers: updated } : { savedSuppliers: updated }, true);
};

export const deleteUserContact = async (userId: string, contactId: string) => {
  const currentUid = userId || auth?.currentUser?.uid;
  if (!currentUid) return;
  if (!contactId) return;

  const removeType = async (type: 'Customer' | 'Supplier') => {
    const key = type === 'Customer' 
      ? `billiq_user_${currentUid}_saved_customers` 
      : `billiq_user_${currentUid}_saved_suppliers`;
    const existing = await getUserContacts(currentUid, type);
    const updated = existing.filter(c => c.id !== contactId);
    safeLocalStorageSet(key, updated);
    await saveToCloud(`users/${currentUid}`, type === 'Customer' ? { savedCustomers: updated } : { savedSuppliers: updated }, true);
  };

  await removeType('Customer');
  await removeType('Supplier');
};
