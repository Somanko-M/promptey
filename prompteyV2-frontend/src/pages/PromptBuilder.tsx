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
 

type Message = {
  role: "user" | "ai" | "status";
  content: string;
};

const PromptBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("id");
  const previewRef = useRef<HTMLIFrameElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pages, setPages] = useState<Record<string, { html: string; css: string; js: string }>>({});
  const [backendCode, setBackendCode] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [userPlan, setUserPlan] = useState("free");
  const [generationCount, setGenerationCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(Infinity);
  const [promptsUsed, setPromptsUsed] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    const fetchProject = async () => {
      if (!userId || !projectId) return;

      const docRef = doc(db, "users", userId, "projects", projectId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        
        setPrompt(data.prompt || "");
        setPages(data.pages || {});
        setEnhancedPrompt(data.enhanced_prompt || "");
        setBackendCode(data.backend_code || "");
        setGenerationCount(data.generation_count || 0);
      }
    };
    fetchProject();
  }, [userId, projectId]);

  const handleGenerate = async () => {
  if (!userId || !projectId || !prompt || !userData) {
    toast.error("❌ Missing required fields");
    return;
  }

  setIsGenerating(true);
  setMessages((prev) => [...prev, { role: "user", content: prompt }]);
  setPrompt(""); // Clear input after sending


  // Show a delay message after 2 minutes
  const waitMsgTimeout = setTimeout(() => {
    setMessages((prev) => [
      ...prev,
      {
        role: "status",
        content: "⏳ Still working... good websites take time to build! 🚧",
      },
    ]);
  }, 120000); // 2 minutes

  try {
    const res = await fetch("http://localhost:5000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, userId, projectId }),
    });

    clearTimeout(waitMsgTimeout);

    const data = await res.json();

    if (!data || (!data.html && !data.css && !data.js)) {
      toast.error("⚠️ AI did not return valid content.");
      return;
    }

    // 🧠 Clean enhanced prompt to remove any code blocks (optional improvement)
    const cleanedEnhanced =
      data.enhanced_prompt?.replace(/```[\s\S]*?```/g, "").trim() || "";

    if (cleanedEnhanced) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `🧠 Enhanced Prompt: ${cleanedEnhanced}`,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "✅ Prompt accepted, building your website..." },
      ]);
    }

    const updatedPages = {
      html: data.html,
      css: data.css,
      js: data.js,
    };

    setPages((prev) => ({ ...prev, home: updatedPages }));

    const projectUpdates: any = {
      pages: { home: updatedPages },
      updated_at: serverTimestamp(),
      generation_count: generationCount + 1,
    };

    if (data.enhanced_prompt) projectUpdates.enhanced_prompt = data.enhanced_prompt;
    if (data.backend_code) projectUpdates.backend_code = data.backend_code;

    await updateDoc(doc(db, "users", userId, "projects", projectId), projectUpdates);
    await updateDoc(doc(db, "users", userId), {
      prompts_used: (promptsUsed || 0) + 1,
      lastPromptDate: serverTimestamp(),
    });

    setGenerationCount((prev) => prev + 1);
    setPromptsUsed((prev) => prev + 1);
  } catch (err: any) {
    toast.error("❌ Generation failed");
    console.error("💥 Generation Error:", err);
  } finally {
    setIsGenerating(false);
  }
};

  const generateIframeHTML = () => {
  const { html, css, js } = pages[activePage] || {};
  const safeJS = js?.trim();

  const fallbackImageFix = `
    <script>
      window.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("img").forEach(img => {
          const src = img.getAttribute("src");
          if (!src || !src.includes("images.unsplash.com")) {
            img.src = "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=800&q=80";
            img.alt = "Fallback AI image";
          }
        });
      });
    </script>
  `;

  const scriptBlock = safeJS
    ? `
    <script type="text/javascript">
      try {
        (function() {
          ${safeJS}
        })();
      } catch(e) {
        console.warn("⚠️ JS Runtime Error:", e.message);
      }
    </script>`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { margin: 0; padding: 0; box-sizing: border-box; }
          ${css || ""}
        </style>
      </head>
      <body>
        ${html || "<div style='padding:2rem;color:red'>⚠️ No HTML content</div>"}
        ${scriptBlock}
        ${fallbackImageFix}
      </body>
    </html>
  `;
};


  const handleOpenFullPreview = () => {
    const { html, css, js } = pages[activePage] || {};
    const win = window.open("", "_blank");
    if (!win) return;

    const scriptBlock = js?.trim()
      ? `<script>try{(function(){${js}})();}catch(e){console.error("⛔ JS Error:", e);}</script>`
      : "";
    const fallbackImageFix = `
    <script>
      window.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("img").forEach(img => {
          const src = img.getAttribute("src");
          if (!src || !src.includes("images.unsplash.com")) {
            img.src = "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=800&q=80";
            img.alt = "Fallback AI image";
          }
        });
      });
    </script>
  `;

    win.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { margin: 0; padding: 0; box-sizing: border-box; }
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

  const handleDownload = async () => {
    if (!userId || !projectId) return;

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData) return toast.error("User not found");

    const plan = userData.plan;
    const downloadUsed = userData.downloadUsed || 0;
    const expiry = userData.planExpiry?.toDate?.();

    if (plan === "free") {
      toast.warn("🚫 Upgrade to download projects.");
      navigate("/pricing");
      return;
    }

    if ((plan === "download" || plan === "extra") && downloadUsed >= 1) {
      toast.error("⚠️ Download already used.");
      return;
    }

    if (plan === "extra" && expiry && new Date().toDateString() !== expiry.toDateString()) {
      toast.warn("⚠️ Your extra plan expired.");
      return;
    }

    window.open(
      `http://localhost:5000/api/download?userId=${userId}&projectId=${projectId}`,
      "_blank"
    );
  };
 



  return (
  <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1f1f1f] text-white animate-fade-in">
    <Header />
    <main className="container mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 19L5 12L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-4xl font-extrabold text-white drop-shadow-md">
            Prompt Builder
          </h1>
          <p className="text-gray-400 text-sm">
            Let AI build your dream website — describe your vision.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 👈 Left Side - Chat UI */}
        <div className="flex flex-col space-y-4">
          <Card className="flex flex-col flex-1 bg-white/5 backdrop-blur border border-border/30 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white font-semibold">
                Chat with the Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col overflow-hidden space-y-3 max-h-[600px]">
              {/* 💬 Chat Messages */}
              <div className="overflow-y-auto max-h-[350px] space-y-3 p-3 rounded-lg bg-background border border-border/30 custom-scroll">
                {messages.length === 0 && (
                  <div className="text-muted-foreground text-sm text-center">
                    Start by describing your website...
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-sky-700 text-white text-right ml-auto max-w-[80%]"
                        : msg.role === "ai"
                        ? "bg-muted test-foreground mr-auto max-w-[80%]"
                        : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* ✍️ Prompt Input */}
              <Textarea
                placeholder="e.g. Add an animated testimonial section with client photos"
                className="rounded-xl text-white bg-background border border-border/30"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />

              {/* 🔘 Buttons */}
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt || isGenerating}
                  className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isGenerating ? "Generating..." : "Send Prompt & Generate"}
                </Button>

                <Button
                  onClick={handleOpenFullPreview}
                  className="w-full rounded-xl bg-gradient-to-r from-slate-600 to-slate-800 text-white font-semibold shadow-md hover:shadow-lg"
                >
                  🔍 Open Full View
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 📊 Prompt Usage */}
          {userPlan !== "premium" && (
            <div className="text-sm text-muted-foreground text-center mt-2">
              Prompt Usage: {promptsUsed}/{dailyLimit}
              <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                  style={{
                    width: `${(promptsUsed / dailyLimit) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* 👉 Right Side - Preview */}
        <div>
          <Card className="bg-white/5 backdrop-blur border border-border/30 shadow-xl rounded-2xl h-full">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-xl text-white font-semibold">
                Live Preview
              </CardTitle>
              <Button
                onClick={handleDownload}
                className="rounded-md text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2"
              >
                ⬇️ Download ZIP
              </Button>
            </CardHeader>
            <CardContent className="rounded-xl h-[70vh] overflow-hidden p-0">
              {isGenerating ? (
                <PreviewLoader />
              ) : pages[activePage]?.html ||
                pages[activePage]?.css ||
                pages[activePage]?.js ? (
                <iframe
                  title="Website Preview"
                  srcDoc={generateIframeHTML()}
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-full border-none rounded-xl bg-white"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Your generated website will appear here.
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
