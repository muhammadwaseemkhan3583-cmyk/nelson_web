import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth-middleware";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const authStatus = await verifyAuth(request);
    if (!authStatus.authenticated || authStatus.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized Admin access required." }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, email, password, access } = body;

    if (!email || !password || !access) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    // 1. Create User in Firebase Auth (Firebase hashes this internally)
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set Custom Claim
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: access });

    // 3. SECURE HASHING: Hash the password for our Firestore record
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Save to Firestore with ONLY the Hashed Password
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      code,
      email,
      role: access,
      password: hashedPassword, // Storing hashed version for database record
      status: "Active",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "User enrolled with high-security encryption." }, { status: 201 });

  } catch (error: any) {
    console.error("Firebase Admin Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}