import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function verifyAuth(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { authenticated: false, error: "Missing authentication token." };
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return { authenticated: true, uid: decodedToken.uid, role: decodedToken.role };
  } catch (error) {
    console.error("Auth Verification Error:", error);
    return { authenticated: false, error: "Invalid or expired token." };
  }
}
