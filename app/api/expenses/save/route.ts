import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const { expenses } = await request.json();

    if (!expenses || !Array.isArray(expenses)) {
      return NextResponse.json({ success: false, message: "Invalid data." }, { status: 400 });
    }

    const validExpenses = expenses.filter((exp: any) => 
      (exp.type === "Petty Cash" ? exp.category : exp.description) && exp.amount
    );
    
    if (validExpenses.length === 0) {
      return NextResponse.json({ success: false, message: "No valid data to save." }, { status: 400 });
    }

    const url = process.env.DATABASE_URL;
    console.log(">>> DB Check: URL Present:", !!url);
    if (url) {
        console.log(">>> DB Check: URL Starts With:", url.substring(0, 10));
        console.log(">>> DB Check: URL Ends With:", url.substring(url.length - 10));
    }

    console.log(">>> Database: Saving via Neon Adapter...");

    const createdExpenses = await prisma.expense.createMany({
      data: validExpenses.map((exp: any) => ({
        type: exp.type || "Petty Cash",
        date: new Date(exp.date),
        category: exp.category || null,
        department: exp.department || null,
        description: exp.description || null,
        vendorName: exp.vendorName || null,
        concernPerson: exp.concernPerson || null,
        billOfMonth: exp.billOfMonth || null,
        empCode: exp.empCode || null,
        empName: exp.empName || null,
        numPersons: parseInt(exp.numPersons) || 0,
        numDays: parseInt(exp.numDays) || 0,
        amount: parseFloat(exp.amount),
        remarks: exp.remarks || null,
        status: "Verified",
      })),
    });

    return NextResponse.json({ 
      success: true, 
      message: `${createdExpenses.count} records saved successfully.` 
    }, { status: 201 });

  } catch (error: any) {
    console.error(">>> Database Failure:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}