import { Router, Request, Response } from "express";
import axios from "axios";
import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import serviceAccount from "../firebase/serviceAccountKey.json";

const router = Router();

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount as ServiceAccount) });
}
const db = getFirestore();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const QWEN_MODEL = "qwen/qwen-plus:free";
const DEEPSEEK_MODEL = "deepseek/deepseek-chat-v3-0324:free";

function insertBeforeFooter(existingHtml: string, patchHtml: string): string {
  const footerMatch = existingHtml.match(/<footer[\s\S]*?<\/footer>/i);
  if (footerMatch && footerMatch.index !== undefined) {
    const start = footerMatch.index;
    return (
      existingHtml.slice(0, start) +
      patchHtml +
      "\n" +
      existingHtml.slice(start)
    );
  }
  const bodyMatch = existingHtml.match(/<\/body\s*>/i);
  if (bodyMatch) {
    return existingHtml.replace(/<\/body\s*>/i, `${patchHtml}\n</body>`);
  }
  return existingHtml + "\n" + patchHtml;
}
router.post("/", async (req: Request, res: Response) => {
  const { prompt, userId, projectId } = req.body;

  if (!prompt || !userId || !projectId) {
    return res.status(400).json({ error: "Missing prompt, userId, or projectId" });
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

    const user = userSnap.data()!;
    const plan = user.plan || "free";
    const todayStr = new Date().toISOString().split("T")[0];
    const lastGenDate = user.lastPromptDate || null;
    const currentCount = user.dailyPromptCount || 0;

    const limits: Record<string, number> = {
      free: 5,
      download: 5,
      extra: 15,
      premium: Infinity,
    };
    const limit = limits[plan] ?? 5;

    if (!lastGenDate || lastGenDate !== todayStr) {
      await userRef.update({ lastPromptDate: todayStr, dailyPromptCount: 1 });
    } else {
      if (currentCount >= limit) {
        return res.status(403).json({ error: "Daily prompt limit reached for your plan." });
      }
      await userRef.update({ dailyPromptCount: FieldValue.increment(1) });
    }

    const projectRef = db.collection("users").doc(userId).collection("projects").doc(projectId);
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists) return res.status(404).json({ error: "Project not found" });

    const projectData = projectSnap.data();
    const existingPages = projectData?.pages?.home;

    await projectRef.update({
      status: {
        chat: FieldValue.arrayUnion({
          role: "assistant",
          content: "🧠 Enhancing your prompt for best results.",
          ts: Date.now(),
        }),
      },
    });

    let enhancedPrompt = prompt;
    try {
      const enhancedResponse = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: QWEN_MODEL,
          messages: [
            {
              role: "system",
              content: `You are an expert website  strategist. Clarify and enrich vague prompts into detailed creative briefs , make sure the prompt entered by the user is understood and then acted upon. Never assume a rigid layout type. Focus on intent and usability.Make sure the section you add includes real data (not just headings). Use Unsplash images and realistic text. Do not leave sections empty or incomplete. The user expects functional, visual results.
`,
            },
            { role: "user", content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const maybe = enhancedResponse.data.choices?.[0]?.message?.content?.trim();
      if (maybe && !maybe.includes("<html") && !maybe.includes("<script")) {
        enhancedPrompt = maybe;
      }

      enhancedPrompt = enhancedPrompt
        .replace(/```[\s\S]*?```/g, "")
        .replace(/<\/?[^>]+>/g, "")
        .trim();
    } catch (e) {
      console.warn("⚠️ Qwen enhancement failed.");
    }
    await projectRef.update({
      status: {
        chat: FieldValue.arrayUnion({
          role: "assistant",
          content: "🚀 Generating your website. This may take 1–2 minutes for best quality.",
          ts: Date.now(),
        }),
      },
    });

    let systemPrompt = "";

    if (existingPages?.html || existingPages?.css || existingPages?.js) {
      systemPrompt = `
You are an expert frontend developer working on an existing website. You are given the current HTML, CSS, and JavaScript.

Your task is to update the website based on the user’s latest request.

🛠️ IMPORTANT:
- Modify ONLY what is required. Do NOT return full layout or repeat existing code.
- If the user says "remove", remove that section.
- If the user says "add", clearly insert the new section.
- ⚠️ If your changes involve interactivity (JS), make sure it doesn’t break existing features.
- Do NOT re-declare variables, duplicate classes or IDs.

💡 Image Rules:
- All <img> tags MUST use direct Unsplash image URLs: https://images.unsplash.com/...
- ❌ Never use placeholder names like "image.jpg", "assets/banner.png", or relative paths.

📦 Return Format:
- Updated HTML wrapped inside <body> or <section> only
- Updated CSS wrapped in <style>
- Updated JS wrapped in <script>
- ⚠️ Do NOT include explanations.
- If no change is needed, return an empty string.

📄 Existing HTML:
${existingPages.html}

🎨 Existing CSS:
${existingPages.css}

🧠 Existing JS:
${existingPages.js}

🗣️ User’s Follow-Up Prompt:
${enhancedPrompt}
`.trim();

    } else {
      systemPrompt = `
You are a professional web developer. Create a fully structured, modern, and responsive website using HTML, CSS, and JavaScript.

Requirements:
- Visually beautiful UI with sections like header, hero, features, about, contact, footer.
- Responsive layout with clean spacing and mobile-friendly design.
- Include animations, transitions, or interactive elements.
- ⚠️ Use only direct image URLs from https://images.unsplash.com
- ❌ Do NOT use placeholder names like "image1.jpg", "banner.png", or relative/local paths.
- 📸 If you're unsure, use this fallback image:
  https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=800&q=80

Image Tag Requirements:
- All <img> tags MUST have:
  - "src" with a valid Unsplash URL
  - "alt" describing the image
  - responsive class like class="w-full h-auto rounded-md"

Do not explain. Only return:
- HTML (inside full <html> tag)
- CSS (inside <style>)
- JS (inside <script>)
User Prompt:
${enhancedPrompt}`.trim();
    }

    const deepSeekResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: DEEPSEEK_MODEL,
        messages: [{ role: "system", content: systemPrompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = deepSeekResponse.data.choices?.[0]?.message?.content || "";

    let html =
      result.match(/<html[\s\S]*?<\/html>/i)?.[0] ||
      result.match(/<body[\s\S]*?<\/body>/i)?.[0] ||
      result.match(/<section[\s\S]*?<\/section>/i)?.[0] ||
      "";

    const css = result.match(/<style[\s\S]*?<\/style>/i)?.[0] || "";
    let js = result.match(/<script[\s\S]*?<\/script>/i)?.[0] || "";
    js = js.replace(/<\/?script[^>]*>/gi, "").trim();

    if (!js || js.length < 20 || js.includes("})(); } catch(e)") || !/[a-zA-Z0-9]/.test(js)) {
      js = "";
    }

    if (existingPages?.html && html?.startsWith("<section")) {
  html = insertBeforeFooter(existingPages.html, html);
} else if (!html && existingPages?.html) {
  html = existingPages.html;
}

    let backend_code = "";
    try {
      const backendRes = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: QWEN_MODEL,
          messages: [
            {
              role: "system",
              content: `You’re a backend developer. If user needs dynamic logic (e.g. chat, form, database), return Express.js API routes. Otherwise, return "NO_BACKEND".`,
            },
            { role: "user", content: enhancedPrompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      const maybeBackend = backendRes.data.choices?.[0]?.message?.content?.trim();
      if (maybeBackend && !maybeBackend.includes("NO_BACKEND")) {
        backend_code = maybeBackend;
      }
    } catch (err) {
      console.warn("⚠️ Backend generation skipped.");
    }

    if (!html && !css && !js) {
  return res.status(200).json({
    message: "⚠️ AI returned no usable code. Try rephrasing your prompt.",
    html: "",
    css: "",
    js: "",
    enhanced_prompt: enhancedPrompt,
  });
}


    await projectRef.set(
      {
        pages: {
          home: {
            prompt,
            enhanced_prompt: enhancedPrompt,
            html,
            css,
            js,
          },
        },
        backend_code,
        updated_at: Timestamp.now(),
        status: {
          chat: FieldValue.arrayUnion({
            role: "assistant",
            content: "✅ Your website is ready!",
            ts: Date.now(),
          }),
        },
      },
      { merge: true }
    );

    return res.status(200).json({
      message: "Website generated successfully",
      html,
      css,
      js,
      enhanced_prompt: enhancedPrompt,
      backend_code,
    });
  } catch (err: any) {
    console.error("🔥 Generation error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
