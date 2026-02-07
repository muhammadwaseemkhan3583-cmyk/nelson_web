import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  try {
    const authStatus = await verifyAuth(request);
    if (!authStatus.authenticated) {
      return NextResponse.json({ success: false, message: authStatus.error }, { status: 401 });
    }

    const vouchers = await prisma.voucherRecord.findMany({
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      vouchers 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Voucher List Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to load records." 
    }, { status: 500 });
  }
}
