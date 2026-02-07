import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(request: Request) {
  try {
    const authStatus = await verifyAuth(request);
    if (!authStatus.authenticated || authStatus.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized Admin access required." }, { status: 401 });
    }

    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ success: false, message: "User UID is required." }, { status: 400 });
    }

    // 1. Delete from Firebase Authentication
    await adminAuth.deleteUser(uid);

    // 2. Delete profile from Firestore
    await adminDb.collection("users").doc(uid).delete();

    return NextResponse.json({ 
      success: true, 
      message: "User permanently removed." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Delete Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Deletion failed." 
    }, { status: 500 });
  }
}
