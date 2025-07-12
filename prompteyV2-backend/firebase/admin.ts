// firebase/admin.ts
import * as admin from "firebase-admin";
import * as path from "path";

// Use correct path to your service account key
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "your-project-id.appspot.com", // 🔁 Replace with actual bucket name
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

export { admin, db, bucket };
