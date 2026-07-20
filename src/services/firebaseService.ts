/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export const firebaseService = {
  /**
   * Saves the entire state object to the user's Firestore document.
   */
  async saveAllUserData(userId: string, data: Record<string, any>): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, data, { merge: true });
    } catch (err) {
      console.error('Error saving user data to Firestore:', err);
    }
  },

  /**
   * Retrieves the user's Firestore document content.
   */
  async getAllUserData(userId: string): Promise<Record<string, any> | null> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (err) {
      console.error('Error getting user data from Firestore:', err);
      return null;
    }
  },

  /**
   * Subscribes to real-time changes of the user's Firestore document.
   */
  subscribeToUserData(userId: string, callback: (data: Record<string, any> | null) => void, onError?: (err: any) => void): () => void {
    const userDocRef = doc(db, 'users', userId);
    return onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in real-time user data subscription:', error);
      if (onError) onError(error);
    });
  }
};
