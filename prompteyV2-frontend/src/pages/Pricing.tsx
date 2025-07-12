import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const Pricing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isIndian, setIsIndian] = useState<boolean | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [planExpiry, setPlanExpiry] = useState<Date | null>(null);
  const [downloadUsed, setDownloadUsed] = useState<number>(0);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, "users", firebaseUser.uid);

        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("📄 User data:", data);

            setIsIndian(data?.isIndian ?? false);
            setUserPlan(data?.plan || "free");
            setDownloadUsed(data?.downloadUsed || 0);

            if (data?.planExpiry?.toDate) {
              const expiryDate = data.planExpiry.toDate();
              setPlanExpiry(expiryDate);
            }
          } else {
            console.warn("⚠️ User doc not found, falling back to language detection.");
            detectFromBrowser();
          }
        } catch (err) {
          console.error("❌ Firestore error:", err);
          detectFromBrowser();
        }
      } else {
        console.log("🌐 No user, falling back to browser language...");
        detectFromBrowser();
      }
    });

    const detectFromBrowser = () => {
      const lang = navigator.language || "";
      const isIN = lang.includes("en-IN") || lang.includes("hi");
      console.log("🌐 Detected browser language:", lang, "➡️", isIN);
      setIsIndian(isIN);
    };

    // Razorpay
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => unsubscribe();
  }, []);

  if (isIndian === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading pricing...</p>
      </div>
    );
  }

  const handleCheckout = async (plan: string) => {
    if (!user) return alert("Please sign in to continue.");

    if (plan === "premium" && planExpiry && planExpiry > new Date()) {
      return alert("You already have an active premium plan.");
    }

    if (plan === "download" && downloadUsed >= 1) {
      return alert("You’ve already used your download plan.");
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.uid, plan, isINR: isIndian }),
    });

    const data = await res.json();

    if (!data.id || !data.key) {
      alert("Failed to initiate payment.");
      return;
    }

    const razorpay = new (window as any).Razorpay({
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: "PromptEy",
      description: `Purchase ${plan} plan`,
      order_id: data.id,
      handler: async function (response: any) {
        alert("✅ Payment successful!");

        let planExpiry = null;
        if (plan === "premium") {
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 1);
          planExpiry = expiryDate.toISOString();
        }

        await fetch("/api/payment-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            userId: user.uid,
            plan,
            planExpiry,
          }),
        });

        navigate("/dashboard");
      },
      prefill: {
        name: user.displayName || "",
        email: user.email || "",
      },
      theme: {
        color: "#6366f1",
      },
    });

    razorpay.open();
  };

  const plans = [
    {
      id: "download",
      name: "Download Only",
      price: isIndian ? "₹50" : "$4.99",
      period: "one time",
      features: [
        "Download a single generated website",
        "Limited access to features",
        "No additional prompts included",
      ],
      buttonText: "Buy Now",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      id: "extra",
      name: "Download + 10 Prompts",
      price: isIndian ? "₹65" : "$5.99",
      period: "one time",
      features: [
        "Download one project",
        "10 additional prompt generations",
        "Fast AI response time",
      ],
      buttonText: "Buy Now",
      buttonVariant: "gradient" as const,
      popular: true,
    },
    {
      id: "premium",
      name: "All Access",
      price: isIndian ? "₹150" : "$12.99",
      period: "per month",
      features: [
        "Unlimited prompts",
        "Download all websites",
        "Premium templates",
        "Priority support",
        "Early access to new features",
      ],
      buttonText: "Subscribe",
      buttonVariant: "outline" as const,
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-primary-glow bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Start free and upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative bg-gradient-card border-border/50 hover:shadow-card transition-all duration-300 ${
                plan.popular ? "border-primary/50 shadow-glow" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-primary flex-shrink-0"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.buttonVariant}
                  size="lg"
                  className="w-full"
                  onClick={() => handleCheckout(plan.id)}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Pricing;
