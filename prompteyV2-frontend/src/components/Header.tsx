import { Button } from "@/components/ui/button";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RegionModal from "@/components/RegionModal";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";

const Header = () => {
  const { firebaseUser, userData, login } = useAuth(); // ✅ FIXED
  const location = useLocation();
  const navigate = useNavigate();
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [userRegionChecked, setUserRegionChecked] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignIn = async () => {
    try {
      await login();
      navigate("/dashboard");
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  };

  useEffect(() => {
    const checkRegion = async () => {
      if (firebaseUser && !userRegionChecked) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);
        const data = snap.data();

        if (!data?.region) {
          setShowRegionModal(true);
        }
        setUserRegionChecked(true);
      }
    };
    checkRegion();
  }, [firebaseUser]);

  const handleRegionSelect = async (region: "india" | "international") => {
    if (!firebaseUser) return;
    const userRef = doc(db, "users", firebaseUser.uid);
    await updateDoc(userRef, { region });
    setShowRegionModal(false);
  };

  return (
    <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">Promptey-AI Website Builder</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/features"
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/features") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/pricing") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Pricing
            </Link>
            <Link
              to="/about"
              className={`text-sm transition-colors hover:text-primary ${
                isActive("/about") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              About
            </Link>
            {firebaseUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/pricing")}
              >
                Upgrade
              </Button>
            )}
          </nav>

          {!firebaseUser && (
            <Button
              variant="gradient"
              size="sm"
              onClick={handleSignIn}
              className="gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="currentColor"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="currentColor"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="currentColor"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="currentColor"
                />
              </svg>
              Sign In with Google
            </Button>
          )}
        </div>
      </div>

      {/* 🌍 Region Modal */}
      <RegionModal open={showRegionModal} onSelect={handleRegionSelect} />
    </header>
  );
};

export default Header;
