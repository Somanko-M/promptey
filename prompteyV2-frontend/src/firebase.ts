// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDf1vULlQ-E_Dolftd05dJwxnoupjWcgQ",
  authDomain: "promptey-v2-2f85c.firebaseapp.com",
  projectId: "promptey-v2-2f85c",
  storageBucket: "promptey-v2-2f85c.firebasestorage.app",
  messagingSenderId: "550324704981",
  appId: "1:550324704981:web:b518a90a11b727289c345c"
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
