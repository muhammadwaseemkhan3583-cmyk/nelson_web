import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const { serial, date, total, items, expenseIds, type } = await request.json();

    if (!serial || !date || !total || !expenseIds) {
      return NextResponse.json({ success: false, message: "Missing voucher data." }, { status: 400 });
    }

    // 1. Transaction to ensure both record save and expense linking succeed
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the record
      const savedRecord = await tx.voucherRecord.create({
        data: {
          serialNumber: serial,
          date: new Date(date),
          totalAmount: total,
          items: items,
          type: type || "Petty Cash",
          status: "Pending",
          preparedBy: "Finance Officer"
        }
      });

      // Link expenses to this voucher so they don't appear in future generations
      await tx.expense.updateMany({
        where: {
          id: { in: expenseIds }
        },
        data: {
          voucherId: savedRecord.id
        }
      });

      return savedRecord;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Voucher saved and expenses linked.",
      id: result.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Voucher Save Error:", error.message);
    if (error.code === 'P2002') {
        return NextResponse.json({ success: false, message: "This voucher has already been saved." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Failed to save record." }, { status: 500 });
  }
}