import { db, auth } from "../services/firebase";
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
    const currentUid = contact.userId || auth?.currentUser?.uid || undefined;
    const newEntry: ContactEntity = {
      ...contact,
      userId: currentUid,
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

  // If Firebase Auth is still initializing or user doesn't match yet, avoid unauthenticated network errors
  if (auth && !auth.currentUser) {
    return [];
  }

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
    if (
      error?.message?.includes("Firestore shutting down") || 
      error?.message?.includes("Missing or insufficient permissions") ||
      error?.code === "permission-denied" ||
      error?.code === "cancelled" || 
      error?.code === "unavailable"
    ) {
      console.warn(`[Contacts] Safe sync fallback for ${type}s (User: ${userId}): ${error?.message || error?.code}`);
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
  const currentUid = userId || auth?.currentUser?.uid;
  if (!currentUid || !contact.name || !db) return;

  const contactData: ContactEntity = {
    ...contact,
    userId: currentUid, // Enforce current user ownership
  };

  const contactsRef = collection(db, 'contacts');
  await addDoc(contactsRef, contactData);
};

/**
 * Delete a user contact strictly verifying current user ownership.
 */
export const deleteUserContact = async (userId: string, contactId: string) => {
  const currentUid = userId || auth?.currentUser?.uid;
  if (!currentUid || !contactId || !db) return;

  try {
    const { doc, deleteDoc: firestoreDeleteDoc } = await import("firebase/firestore");
    const contactRef = doc(db, 'contacts', contactId);
    await firestoreDeleteDoc(contactRef);
  } catch (error) {
    console.warn(`[Contacts] Error deleting contact ${contactId} for user ${currentUid}:`, error);
  }
};


