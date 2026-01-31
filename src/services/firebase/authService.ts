import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  /**
   * Sign in with Google popup
   */
  signInWithGoogle: async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  /**
   * Sign out the current user
   */
  signOut: async (): Promise<void> => {
    await firebaseSignOut(auth);
  },

  /**
   * Get the current user (null if not signed in)
   */
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  /**
   * Subscribe to auth state changes
   * @param callback - Called whenever auth state changes
   * @returns Unsubscribe function
   */
  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    return onAuthStateChanged(auth, callback);
  },
};
