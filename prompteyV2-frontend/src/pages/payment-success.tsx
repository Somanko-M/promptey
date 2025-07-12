import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate("/signin");

      const searchParams = new URLSearchParams(window.location.search);
      const plan = searchParams.get("plan");
      const projectId = searchParams.get("projectId") || localStorage.getItem("lastUsedProjectId") || "";

      if (!plan || !["extra", "premium", "download"].includes(plan)) {
        alert("Invalid plan or missing data.");
        return navigate("/dashboard");
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const updates: any = {
          plan,
          updated_at: serverTimestamp(),
        };

        // Plan-specific data
        if (plan === "extra") {
          updates.promptAllowance = 10;
          updates.downloadQuota = 1;
        } else if (plan === "download") {
          updates.downloadQuota = 1;
        } else if (plan === "premium") {
          updates.promptAllowance = "unlimited";
          updates.downloadQuota = "unlimited";
          updates.subscriptionActive = true;
        }

        await updateDoc(userRef, updates);
        console.log("✅ Plan updated to:", plan);

        setTimeout(() => {
          navigate("/promptbuilder?id=" + projectId);
        }, 2000);
      } catch (err) {
        console.error("❌ Failed to update plan:", err);
        alert("Something went wrong. Please contact support.");
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">🎉 Payment Successful!</h1>
        <p className="text-lg">Redirecting you to your project...</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
