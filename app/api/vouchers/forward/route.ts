import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function PUT(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    if (auth.role !== "Finance") {
        return NextResponse.json({ success: false, message: "Unauthorized: Only Finance Officers can forward vouchers." }, { status: 403 });
    }

    const { id, nextStatus } = await request.json();

    if (!id || !nextStatus) {
      return NextResponse.json({ success: false, message: "Missing required data." }, { status: 400 });
    }

    const updatedVoucher = await prisma.voucherRecord.update({
      where: { id },
      data: { 
        status: nextStatus,
        statusUpdatedAt: new Date()
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Voucher forwarded to ${nextStatus}.`,
      voucher: updatedVoucher
    }, { status: 200 });

  } catch (error: any) {
    console.error("Forward Voucher Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to forward voucher." 
    }, { status: 500 });
  }
}
