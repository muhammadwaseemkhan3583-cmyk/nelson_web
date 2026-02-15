import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";
import { aggregateVoucherItems } from "@/lib/vouchers";

export async function PUT(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const { serialNumber } = await request.json();

    if (!serialNumber) {
      return NextResponse.json({ success: false, message: "Serial number is required." }, { status: 400 });
    }

    // 1. Fetch Voucher info to get its type
    const voucher = await prisma.voucherRecord.findUnique({
        where: { serialNumber }
    });

    if (!voucher) {
        return NextResponse.json({ success: false, message: "Voucher not found." }, { status: 404 });
    }

    // 2. Fetch all expenses linked to this voucher
    const expenses = await prisma.expense.findMany({
      where: { voucherId: serialNumber }
    });

    if (expenses.length === 0) {
        return NextResponse.json({ success: false, message: "No expenses found for this voucher." }, { status: 404 });
    }

    // 3. Aggregate items correctly for printing
    const liveItems = aggregateVoucherItems(expenses, voucher.type);
    const newTotal = liveItems.reduce((sum: number, item: any) => sum + item.amount, 0);

    // 4. Update Voucher Record with new total and aggregated items
    await prisma.voucherRecord.update({
      where: { serialNumber: serialNumber },
      data: {
        totalAmount: newTotal,
        items: liveItems, // Storing as JSON object (Prisma handles this)
        needsSync: false
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Voucher synchronized with updated entries.",
      newTotal 
    });

  } catch (error: any) {
    console.error("Voucher Sync Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
