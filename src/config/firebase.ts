
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {

  apiKey: "AIzaSyD-3YAuRsqXiPoNrN8RYYcBYdLNv9eU1a4",

  authDomain: "lifelink-1c090.firebaseapp.com",

  projectId: "lifelink-1c090",

  storageBucket: "lifelink-1c090.firebasestorage.app",

  messagingSenderId: "687652448931",

  appId: "1:687652448931:web:fb7f9bfcc26a1d9116ad16",

  measurementId: "G-GSFJLNGWWS"

};



const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);