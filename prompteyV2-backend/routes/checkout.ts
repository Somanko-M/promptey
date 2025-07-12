// src/routes/checkout.ts
import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import shortid from "shortid";

const router = express.Router();

const Razorpay = require("razorpay") as any;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

const PRICES = {
  INR: {
    download: 5000,  // ₹50.00
    extra: 7500,     // ₹75.00
    premium: 15000   // ₹150.00
  },
  USD: {
    download: 499,   // $4.99
    extra: 699,      // $6.99
    premium: 1399    // $13.99
  },
};

router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, plan, isINR } = req.body;

    if (!userId || !plan || !["download", "extra", "premium"].includes(plan)) {
      return res.status(400).json({ error: "Missing or invalid userId or plan." });
    }

    const currency = (isINR ? "INR" : "USD") as "INR" | "USD";
    const amount = PRICES[currency][plan as keyof typeof PRICES["INR"]];

    const options = {
      amount,
      currency,
      receipt: shortid.generate(),
      notes: {
        userId,
        plan,
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error("❌ Razorpay Order Error:", err);
    res.status(500).json({ error: "Failed to create Razorpay order", message: err.message });
  }
});

export default router;
