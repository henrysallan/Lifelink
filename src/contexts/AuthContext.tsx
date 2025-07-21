import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Define the shape of your context data
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context. It should be exported so the hook can use it.
// Initialize with 'undefined' to help catch errors where the hook is used outside the provider.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is your component. It's the only component export from this file.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          lastActive: serverTimestamp(),
        }, { merge: true });
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {/* Show children only when not loading to prevent flicker */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// DO NOT have 'export const useAuth' here anymore.