import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, provider, db } from "../firebase";

type UserData = {
  uid: string;
  name: string | null;
  email: string | null;
  plan: "free" | "download" | "extra" | "premium";
  planExpiry?: Date | Timestamp | null;
  prompts_used?: number;
  downloadUsed?: number;
  isIndian?: boolean;
  maxProjects?: number;
  lastPromptDate?: any;
};

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  const checkAndDowngradeExpiredPlan = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const user = snapshot.data() as UserData;

      let planExpiry: Date | null = null;
      if (user.planExpiry instanceof Date) {
        planExpiry = user.planExpiry;
      } else if (
        user.planExpiry &&
        typeof (user.planExpiry as Timestamp).toDate === "function"
      ) {
        planExpiry = (user.planExpiry as Timestamp).toDate();
      }

      if (user.plan === "premium" && planExpiry && new Date() > planExpiry) {
        await updateDoc(userRef, {
          plan: "free",
          planExpiry: null,
          downgradedAt: serverTimestamp(),
        });
        user.plan = "free";
        user.planExpiry = null;
        console.log("⏳ Downgraded expired premium user:", uid);
      }

      return user;
    }

    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);

        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          const wantsIndia = window.confirm("Are you from India?");
          const isIndian = wantsIndia === true;

          const defaultUser: UserData = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            plan: "free",
            prompts_used: 0,
            downloadUsed: 0,
            isIndian,
            maxProjects: 5,
            lastPromptDate: null,
            planExpiry: null,
          };

          await setDoc(userRef, {
            ...defaultUser,
            created_at: new Date(),
          });

          setUserData(defaultUser);
        } else {
          const data = userDoc.data() as UserData;

          const patch: any = {};
          if (!("downloadUsed" in data)) patch.downloadUsed = 0;
          if (!("isIndian" in data)) patch.isIndian = false;
          if (!("maxProjects" in data)) patch.maxProjects = 5;
          if (!("lastPromptDate" in data)) patch.lastPromptDate = null;

          if (Object.keys(patch).length > 0) {
            await updateDoc(userRef, patch);
          }

          const updatedData = await checkAndDowngradeExpiredPlan(user.uid);
          setUserData(updatedData || data);
        }
      } else {
        setFirebaseUser(null);
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ firebaseUser, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
