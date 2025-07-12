import { Router, Request, Response } from "express";
import archiver from "archiver";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { ServiceAccount } from "firebase-admin";
import serviceAccountRaw from "../firebase/serviceAccountKey.json";

const router = Router();

// 🔐 Firebase Admin Initialization
const serviceAccount = serviceAccountRaw as ServiceAccount;
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

router.get("/", async (req: Request, res: Response) => {
  const { userId, projectId } = req.query;

  if (!userId || !projectId) {
    return res.status(400).json({ error: "Missing userId or projectId" });
  }

  try {
    // 🔍 Fetch user info
    const userRef = db.collection("users").doc(String(userId));
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

    const userData = userSnap.data();
    const plan = userData?.plan || "free";
    const downloadUsed = userData?.downloadUsed || 0;

    // ⛔ Restrict free users
    if (plan === "free") {
      return res.status(403).json({ error: "Free users cannot download projects" });
    }

    // ⛔ One-time download enforcement
    if ((plan === "download" || plan === "extra") && downloadUsed >= 1) {
      return res.status(403).json({ error: "Download limit reached for your plan" });
    }

    // 📦 Get project
    const projectRef = userRef.collection("projects").doc(String(projectId));
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists) return res.status(404).json({ error: "Project not found" });

    const projectData = projectSnap.data();
    if (!projectData || !projectData.pages) {
      return res.status(404).json({ error: "Project data incomplete" });
    }

    const pages = projectData.pages as Record<string, { html: string; css: string; js: string }>;
    const backendCode = projectData.backend_code || "";

    // ✅ Track download usage if needed
    if (plan === "download" || plan === "extra") {
      await userRef.update({ downloadUsed: (downloadUsed || 0) + 1 });
    }

    // 🗜 Prepare zip stream
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=PromptEy_Project.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    // 📄 Add HTML pages
    for (const [pageName, { html, css, js }] of Object.entries(pages)) {
      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${pageName}</title>
    <style>${css || ""}</style>
  </head>
  <body>
    ${html || ""}
    <script>${js || ""}</script>
  </body>
</html>`;
      archive.append(fullHtml.trim(), { name: `${pageName}.html` });
    }

    // 📦 Add backend code if present
    if (backendCode && backendCode.trim()) {
      archive.append(backendCode.trim(), { name: "backend_code.ts" });
    }

    // 📄 Add a readme
    archive.append("Thanks for using PromptEy!\nVisit us again soon. 🚀", {
      name: "README.txt",
    });

    await archive.finalize();
  } catch (error: any) {
    console.error("❌ Download error:", error.message);
    res.status(500).json({ error: "Failed to generate download", details: error.message });
  }
});

export default router;
