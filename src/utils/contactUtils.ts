import { db } from "../services/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

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

/**
 * Automatically checks and saves a new customer or supplier if they don't already exist.
 */
export const autoSaveContactIfNew = async (
  contact: ContactEntity,
  existingContacts: ContactEntity[],
  saveContactFn: (newContact: ContactEntity) => Promise<void> | void
) => {
  if (!contact.name || !contact.name.trim()) return;

  const normalizedName = contact.name.trim().toLowerCase();
  
  // Check if contact already exists by name or GSTIN
  const exists = existingContacts.some(
    (item) =>
      (item.name || "").trim().toLowerCase() === normalizedName ||
      (contact.gstin && item.gstin && item.gstin.trim().toLowerCase() === contact.gstin.trim().toLowerCase())
  );

  if (!exists) {
    const newEntry: ContactEntity = {
      ...contact,
      id: contact.id || `contact_${Date.now()}`,
      name: contact.name.trim()
    };
    await saveContactFn(newEntry);
  }
};

/**
 * Fetch contacts strictly belonging to the currently logged-in user.
 */
export const getUserContacts = async (
  userId: string,
  type: 'Customer' | 'Supplier'
): Promise<ContactEntity[]> => {
  if (!userId || !db) return [];

  try {
    const contactsRef = collection(db, 'contacts');
    // STRICT FILTER: Only retrieve items matching the current user's ID
    const q = query(
      contactsRef,
      where('userId', '==', userId),
      where('type', '==', type)
    );

    const querySnapshot = await getDocs(q);
    const contacts: ContactEntity[] = [];

    querySnapshot.forEach((docSnap) => {
      contacts.push({ id: docSnap.id, ...docSnap.data() } as ContactEntity);
    });

    return contacts;
  } catch (error: any) {
    if (error?.message?.includes("Firestore shutting down") || error?.code === "cancelled" || error?.code === "unavailable") {
      console.warn(`Firestore query safely handled during shutdown for ${type}s.`);
    } else {
      console.error(`Error loading ${type}s for user ${userId}:`, error);
    }
    return [];
  }
};

/**
 * Save a new contact strictly tagged with the active userId.
 */
export const saveUserContact = async (userId: string, contact: Omit<ContactEntity, 'userId'>) => {
  if (!userId || !contact.name || !db) return;

  const contactData: ContactEntity = {
    ...contact,
    userId, // Enforce current user ownership
  };

  const contactsRef = collection(db, 'contacts');
  await addDoc(contactsRef, contactData);
};
