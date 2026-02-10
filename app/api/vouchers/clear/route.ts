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
        return NextResponse.json({ success: false, message: "Unauthorized: Only Finance Officers can clear vouchers." }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing voucher ID." }, { status: 400 });
    }

    const updatedVoucher = await prisma.voucherRecord.update({
      where: { id },
      data: { status: "Cleared" },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Voucher cleared successfully. Amount added back to balance.",
      voucher: updatedVoucher
    }, { status: 200 });

  } catch (error: any) {
    console.error("Clear Voucher Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to clear voucher." 
    }, { status: 500 });
  }
}
