import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function DELETE(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    if (auth.role !== "Finance") {
        return NextResponse.json({ success: false, message: "Unauthorized: Only Finance Officers can delete vouchers." }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing voucher ID." }, { status: 400 });
    }

    // Perform deletion in a transaction
    await prisma.$transaction(async (tx) => {
        // 1. Delete associated expenses
        await tx.expense.deleteMany({
            where: { voucherId: id }
        });

        // 2. Delete the voucher record
        await tx.voucherRecord.delete({
            where: { id }
        });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Voucher and its entries deleted successfully."
    }, { status: 200 });

  } catch (error: any) {
    console.error("Delete Voucher Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to delete voucher." 
    }, { status: 500 });
  }
}
