import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "@/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PreviewLoader from "@/components/PreviewLoader";
import { toast } from "react-toastify";


const PromptBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("id");
  const previewRef = useRef<HTMLIFrameElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [projectName, setProjectName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [pages, setPages] = useState<Record<string, { html: string; css: string; js: string }>>({});
  const [backendCode, setBackendCode] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activePage, setActivePage] = useState("home");
  const [userPlan, setUserPlan] = useState("free");
  const [generationCount, setGenerationCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(Infinity);
  const [promptsUsed, setPromptsUsed] = useState(0);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data();
        setUserData(data);

        let plan = data?.plan || "free";
        let limit = Infinity;

        const planExpiry = data?.planExpiry?.toDate?.();
        const today = new Date();

        if ((plan === "extra" || plan === "premium") && planExpiry && planExpiry < today) {
          await updateDoc(userRef, { plan: "free" });
          plan = "free";
        }

        if (plan === "free" || plan === "download") limit = 5;
        else if (plan === "extra") limit = 15;

        setUserPlan(plan);
        setDailyLimit(limit);
        setPromptsUsed(data?.prompts_used || 0);
      } else {
        navigate("/signin");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!projectId) {
      alert("❌ Missing project ID in URL.");
      navigate("/dashboard");
    }
  }, [projectId]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!userId || !projectId) return;

      const docRef = doc(db, "users", userId, "projects", projectId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        setProjectName(data.title || "");
        setPrompt(data.prompt || "");
        setPages(data.pages || {});
        setEnhancedPrompt(data.enhanced_prompt || "");
        setBackendCode(data.backend_code || "");
        setGenerationCount(data.generation_count || 0);

        const updates: any = {};
        if (!data.pages) updates.pages = {};
        if (!data.enhanced_prompt) updates.enhanced_prompt = "";
        if (!data.backend_code) updates.backend_code = "";
        if (!data.metadata) updates.metadata = { theme: "default", industry: "general", multipage: true };
        if (!data.created_at) updates.created_at = serverTimestamp();
        updates.updated_at = serverTimestamp();

        if (Object.keys(updates).length > 0) await updateDoc(docRef, updates);
      }
      setInitialLoad(false);
    };
    fetchProject();
  }, [userId, projectId]);

  const handleGenerate = async () => {
  if (!userId || !projectId || !prompt || !userData) {
    alert("Missing required fields or user not loaded");
    return;
  }

  const today = new Date();
  const lastUsedDate = userData.lastPromptDate?.toDate?.() || new Date(0);
  const isSameDay = today.toDateString() === lastUsedDate.toDateString();

  if (!isSameDay) {
    await updateDoc(doc(db, "users", userId), {
      prompts_used: 0,
      lastPromptDate: serverTimestamp(),
    });
    setPromptsUsed(0);
  }

  if (promptsUsed >= dailyLimit) {
    alert("⚠️ You've reached your prompt generation limit for today.");
    return;
  }

  setIsGenerating(true);

  try {
    const res = await fetch("http://localhost:5000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, userId, projectId }),
    });

    if (!res.ok) {
      const error = await res.json();

      // 🧠 Show special popup if rate limited
      if (res.status === 429) {
        toast.warn("🚧 Our servers are undergoing maintenance. Please try again after 12:00 AM IST.");
        return;
      }

      throw new Error(error.error || "Generation failed");
    }

    const data = await res.json();

    // 🧪 Log what backend returned
    console.log("🔍 Raw generation response:", data);
    console.log("📄 HTML:", data.html);
    console.log("🎨 CSS:", data.css);
    console.log("⚙️ JS:", data.js);

    // ❗ Abort if all content is missing
    if (!data.html && !data.css && !data.js) {
      toast.error("⚠️ No content returned. AI may have misunderstood your prompt.");
      return;
    }

    const updatedPages = {
      html: data.html || "",
      css: data.css || "",
      js: data.js || "",
    };

    setPages((prev) => ({ ...prev, home: updatedPages }));
    setEnhancedPrompt(data.enhanced_prompt || "");

    const projectUpdates: any = {
      pages: { home: updatedPages },
      generation_count: generationCount + 1,
      updated_at: serverTimestamp(),
    };

    if (data.enhanced_prompt !== undefined) {
      projectUpdates.enhanced_prompt = data.enhanced_prompt;
    }

    if (data.backend_code !== undefined) {
      projectUpdates.backend_code = data.backend_code;
    }

    if (data.metadata !== undefined) {
      projectUpdates.metadata = data.metadata;
    }

    if (projectName) {
      projectUpdates.title = projectName;
    }

    await updateDoc(doc(db, "users", userId, "projects", projectId), projectUpdates);

    await updateDoc(doc(db, "users", userId), {
      prompts_used: promptsUsed + 1,
      lastPromptDate: serverTimestamp(),
    });

    setGenerationCount((prev) => prev + 1);
    setPromptsUsed((prev) => prev + 1);
  } catch (err: any) {
    alert(`Generation failed: ${err.message}`);
    console.error("🛑 Generation error:", err);
  } finally {
    setIsGenerating(false);
  }
};



  const handleDownload = async () => {
  if (!userId || !projectId) return;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  if (!userData) {
    alert("User data not found.");
    return;
  }

  const plan = userData.plan;
  const downloadUsed = userData.downloadUsed || 0;
  const planExpiry = userData.planExpiry?.toDate?.();

  // ⛔ Block for free users
  if (plan === "free") {
    alert("🚫 Downloads are only available in paid plans.");
    navigate("/pricing");
    return;
  }

  // ⛔ Block for download/extra plans if already used
  if ((plan === "download" || plan === "extra") && downloadUsed >= 1) {
    alert("⚠️ You’ve already used your one-time download.");
    return;
  }

  // ⛔ Restrict extra plan to same-day download
  if (plan === "extra" && planExpiry) {
    const today = new Date().toDateString();
    const expiryDateStr = planExpiry.toDateString();
    if (today !== expiryDateStr) {
      alert("⚠️ Your download access has expired.");
      return;
    }
  }

  // ✅ Proceed with download
  window.open(
    `http://localhost:5000/api/download?userId=${userId}&projectId=${projectId}`,
    "_blank"
  );
};

  const generateIframeHTML = () => {
  const { html, css, js } = pages[activePage] || {};

  const safeJS = js?.trim();

  // 🧠 Optional wrapper that handles undefined references gracefully
  const scriptBlock = safeJS
    ? `
      <script type="text/javascript">
        try {
          // Optional feature guards (example: animateOnScroll)
          if (typeof animateOnScroll === "function") {
            animateOnScroll();
          }

          // Inject user JS inside an IIFE
          (function() {
            ${safeJS}
          })();
        } catch(e) {
          console.warn("⚠️ JS Runtime Error:", e.message);
        }
      </script>
    `
    : ""; // Skip if JS is completely empty

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          ${css || ""}
        </style>
      </head>
      <body>
        ${html || "<div style='padding:2rem;color:red'>⚠️ No HTML content</div>"}
        ${scriptBlock}
      </body>
    </html>
  `;
};




const handleOpenFullPreview = () => {
  const { html, css, js } = pages[activePage] || {};
  const win = window.open("", "_blank");
  if (!win) return;

  const safeJS = js?.trim();
  const scriptBlock = safeJS
    ? `
      <script type="text/javascript">
        try {
          (function() {
            ${safeJS}
          })();
        } catch(e) {
          console.error("⛔ JS Error:", e);
        }
      </script>
    `
    : "";

  win.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          ${css || ""}
        </style>
      </head>
      <body>
        ${html || "<div style='padding:2rem;color:red'>⚠️ No HTML content</div>"}
        ${scriptBlock}
      </body>
    </html>
  `);

  win.document.close();
};






  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1f1f1f] text-white animate-fade-in">
      <Header />
      <main className="container mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-10">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-4xl font-extrabold text-white drop-shadow-md">Prompt Builder</h1>
            <p className="text-gray-400 text-sm">Let AI build your dream website — describe your vision.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur border border-border/30 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-white font-semibold">Project Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Project Name</Label>
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="rounded-xl" />
                </div>
                <div>
                  <Label>Prompt</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[200px] rounded-xl"
                    placeholder="e.g., Modern e-commerce site with dark mode and animations..."
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt || isGenerating}
                  className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isGenerating ? "Generating..." : "Generate Website"}
                </Button>

                <Button
                  onClick={handleOpenFullPreview}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-slate-600 to-slate-800 text-white font-semibold shadow-md hover:shadow-lg"
                >
                  🔍 Open Full View
                </Button>

                {userPlan !== "premium" && (
                  <div className="text-sm text-center text-muted-foreground mt-2">
                    Prompt Usage: {promptsUsed}/{dailyLimit} prompts
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(promptsUsed / dailyLimit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur border border-border/30 shadow-xl rounded-2xl h-full">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-xl text-white font-semibold">Live Preview</CardTitle>
                <Button
                  onClick={handleDownload}
                  className="rounded-md text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2"
                >
                  ⬇️ Download Project ZIP
                </Button>
              </CardHeader>
              <CardContent className="rounded-xl h-[70vh] overflow-hidden p-0">
  {isGenerating ? (
    <PreviewLoader />
  ) : pages[activePage]?.html || pages[activePage]?.css || pages[activePage]?.js ? (
    <iframe
      ref={previewRef}
      title="Website Preview"
      srcDoc={generateIframeHTML()}
      sandbox="allow-scripts allow-same-origin"
      className="w-full h-full border-none rounded-xl bg-white"
    />
  ) : (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
      Your generated website will be shown here
    </div>
  )}
</CardContent>

            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PromptBuilder;
