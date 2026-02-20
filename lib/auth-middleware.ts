import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export interface AuthStatus {
  authenticated: boolean;
  uid?: string;
  role?: string;
  name?: string;
  canReturnable?: boolean;
  canNonReturnable?: boolean;
  canOutdoorWork?: boolean;
  error?: string;
}

export async function verifyAuth(request: Request): Promise<AuthStatus> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { authenticated: false, error: "Missing authentication token." };
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return { 
      authenticated: true, 
      uid: decodedToken.uid, 
      role: decodedToken.role as string,
      name: decodedToken.name as string,
      canReturnable: !!decodedToken.canReturnable,
      canNonReturnable: !!decodedToken.canNonReturnable,
      canOutdoorWork: !!decodedToken.canOutdoorWork
    };
  } catch (error) {
    console.error("Auth Verification Error:", error);
    return { authenticated: false, error: "Invalid or expired token." };
  }
}