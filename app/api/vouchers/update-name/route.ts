import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";
import { adminDb } from "@/lib/firebase-admin";

export async function PUT(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    // Get User Name from Firestore
    const userDoc = await adminDb.collection("users").doc(auth.uid!).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, message: "User profile not found." }, { status: 404 });
    }
    const userData = userDoc.data();
    const userName = userData?.name || "Unknown Officer";

    // Update vouchers that have the generic "Finance Officer" placeholder
    const result = await prisma.voucherRecord.updateMany({
      where: {
        preparedBy: "Finance Officer"
      },
      data: {
        preparedBy: userName
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `System synchronized. ${result.count} records updated to your name.`,
      count: result.count
    });

  } catch (error: any) {
    console.error("Update Name Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
