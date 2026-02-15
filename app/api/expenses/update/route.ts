import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function PUT(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const { id, updates } = await request.json();

    if (!id || !updates) {
      return NextResponse.json({ success: false, message: "Missing ID or updates." }, { status: 400 });
    }

    // Format date if it exists in updates
    const formattedUpdates = { ...updates };
    if (formattedUpdates.date) {
        formattedUpdates.date = new Date(formattedUpdates.date);
    }
    if (formattedUpdates.numPersons) formattedUpdates.numPersons = parseInt(formattedUpdates.numPersons) || 0;
    if (formattedUpdates.numDays) formattedUpdates.numDays = parseInt(formattedUpdates.numDays) || 0;
    if (formattedUpdates.amount) formattedUpdates.amount = parseFloat(formattedUpdates.amount) || 0;

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: formattedUpdates,
    });

    // If this expense is part of a voucher, mark the voucher for sync
    if (updatedExpense.voucherId) {
        await prisma.voucherRecord.updateMany({
            where: {
                OR: [
                    { serialNumber: updatedExpense.voucherId },
                    { id: updatedExpense.voucherId }
                ]
            },
            data: { needsSync: true }
        });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Record updated successfully.",
      expense: updatedExpense
    }, { status: 200 });

  } catch (error: any) {
    console.error("Update Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to update record." 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
      const auth = await verifyAuth(request);
      if (!auth.authenticated) {
        return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
      }
  
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
  
      if (!id) {
        return NextResponse.json({ success: false, message: "Missing ID." }, { status: 400 });
      }

      // Find the expense first to check if it has a voucherId
      const expense = await prisma.expense.findUnique({
          where: { id }
      });
  
      await prisma.expense.delete({
        where: { id },
      });

      if (expense?.voucherId) {
          await prisma.voucherRecord.updateMany({
              where: {
                  OR: [
                      { serialNumber: expense.voucherId },
                      { id: expense.voucherId }
                  ]
              },
              data: { needsSync: true }
          });
      }
  
      return NextResponse.json({ 
        success: true, 
        message: "Record deleted successfully." 
      }, { status: 200 });
  
    } catch (error: any) {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to delete record." 
      }, { status: 500 });
    }
  }
