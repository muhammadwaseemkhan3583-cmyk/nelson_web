import admin from "firebase-admin";

const initAdmin = () => {
  if (admin.apps.length) return admin.app();

  // Dono patterns check karein (Aapki .env.local ke mutabiq)
  const projectId = process.env.FIREBASE_PROJECT_ID 
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL 
  let privateKey = process.env.FIREBASE_PRIVATE_KEY 

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Missing Firebase Admin Credentials in .env.local");
    console.log("Details found:");
    console.log("- Project ID:", !!projectId);
    console.log("- Client Email:", !!clientEmail);
    console.log("- Private Key:", !!privateKey);
    return null;
  }

  try {
    const formattedKey = privateKey.replace(/\\n/g, "\n").replace(/^['"](.*)['"]$/, '$1');
    
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error("❌ Firebase Admin Initialization Error:", error.message);
    return null;
  }
};

const app = initAdmin();

// Agar app initialize nahi hui toh empty functions dein taake crash na ho
export const adminAuth = app ? admin.auth() : {} as admin.auth.Auth;
export const adminDb = app ? admin.firestore() : {} as admin.firestore.Firestore;
export const adminStorage = app ? admin.storage() : {} as admin.storage.Storage;

export const hashConfig = {
  algorithm: "SCRYPT" as const,
  key: Buffer.from("/wdP0Emp60jj4QStQ+Fw8UBEW1xTT0Tskr6lCkaU7v9G1vL8CO6PM+V8TL2wJF/3NHCGLrwYr/ef7wbykMjkvw==", "base64"),
  saltSeparator: Buffer.from("Bw==", "base64"),
  rounds: 8,
  memoryCost: 14,
};