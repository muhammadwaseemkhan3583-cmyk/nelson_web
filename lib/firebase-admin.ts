import admin from "firebase-admin";

const initAdmin = () => {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Missing Firebase Admin Credentials");
    return null;
  }

  try {
    // Sabse robust cleaning logic
    let cleanKey = privateKey.trim();
    
    // 1. Agar aakhir mein comma hai (aapki .env mein hai), usse remove karein
    if (cleanKey.endsWith(',')) {
      cleanKey = cleanKey.slice(0, -1).trim();
    }
    
    // 2. Surrounding quotes remove karein
    cleanKey = cleanKey.replace(/^['"](.*)['"]$/, '$1');
    
    // 3. Literal \n ko actual newlines mein convert karein
    cleanKey = cleanKey.replace(/\\n/g, '\n');

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: cleanKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error("❌ Firebase Admin Initialization Error:", error.message);
    return null;
  }
};

const app = initAdmin();

export const adminAuth = app ? admin.auth() : {} as admin.auth.Auth;
export const adminDb = app ? admin.firestore() : {} as admin.firestore.Firestore;
export const adminStorage = app ? admin.storage() : {} as admin.storage.Storage;
