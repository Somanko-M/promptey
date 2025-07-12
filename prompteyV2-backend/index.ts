// src/index.ts
import dotenv from "dotenv";
dotenv.config(); // ✅ Load environment variables

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import generateRouter from "./routes/generate";
import downloadRoute from "./routes/download";
import checkoutRoute from "./routes/checkout";

import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ✅ Initialize Firebase Admin only once (prevents duplicate error)
if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
}
const db = getFirestore();

// ✅ Create Express app
const app = express();

// ✅ Enable CORS
app.use(
  cors({
    origin: "https://prompteyv2.netlify.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);


// ✅ Parse JSON requests
app.use(express.json());

// ✅ Health check route
app.get("/", (req: Request, res: Response) => {
  res.send("🔥 Backend is running!");
});

// ✅ Razorpay payment success webhook/handler
app.post("/api/payment-success", async (req: Request, res: Response) => {
  try {
    const { razorpay_payment_id, userId, plan, planExpiry } = req.body;

    if (!razorpay_payment_id || !userId || !plan) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userRef = db.collection("users").doc(userId);

    const updateData: any = {
      plan,
      lastPaymentId: razorpay_payment_id,
      updatedAt: new Date(),
    };

    if (plan === "premium" && planExpiry) {
      updateData.planExpiry = Timestamp.fromDate(new Date(planExpiry));
    }

    await userRef.set(updateData, { merge: true });

    console.log(`✅ Plan updated for user: ${userId}`);
    res.status(200).json({ message: "Plan updated successfully" });
  } catch (err: any) {
    console.error("💥 Error in /api/payment-success:", err.message || err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ✅ Attach all main routes
app.use("/api/generate", generateRouter);
app.use("/api/download", downloadRoute);
app.use("/api/checkout", checkoutRoute);

// ✅ Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("💥 Global Error:", err.stack || err.message);
  res.status(500).json({ error: "Something went wrong", message: err.message });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

});
