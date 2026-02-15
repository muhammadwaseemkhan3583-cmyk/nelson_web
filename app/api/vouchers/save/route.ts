import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { serial, date, total, items, expenseIds, type } = body;

    // Get User Name from Firestore
    const userDoc = await adminDb.collection("users").doc(auth.uid!).get();
    const userName = userDoc.exists ? userDoc.data()?.name : "Finance Officer";

    console.log(">>> Saving Voucher:", { serial, date, type, expenseCount: expenseIds?.length });

    if (!serial || !date || !total || !expenseIds || !Array.isArray(expenseIds)) {
      return NextResponse.json({ success: false, message: "Invalid or missing voucher data." }, { status: 400 });
    }

    // 1. Transaction to ensure both record save and expense linking succeed
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the record
      const savedRecord = await tx.voucherRecord.create({
        data: {
          serialNumber: serial,
          date: new Date(date),
          totalAmount: parseFloat(total),
          items: items,
          type: type || "Petty Cash",
          status: "Pending",
          preparedBy: userName
        }
      });

      // Link expenses to this voucher using the SERIAL NUMBER
      if (expenseIds.length > 0) {
          await tx.expense.updateMany({
            where: {
              id: { in: expenseIds }
            },
            data: {
              voucherId: serial
            }
          });
      }

      return savedRecord;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Voucher saved and expenses linked.",
      id: result.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error(">>> Voucher Save CRITICAL Error:", error);
    
    // Check for unique constraint on serialNumber
    if (error.code === 'P2002') {
        return NextResponse.json({ success: false, message: "Voucher Serial already exists. Please regenerate." }, { status: 409 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to save record." 
    }, { status: 500 });
  }
}
