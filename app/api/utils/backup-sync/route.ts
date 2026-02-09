import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { google } from "googleapis";

export async function POST(request: Request) {
  return NextResponse.json({ success: true, message: "Backup functionality is currently disabled." });
  
  /* 
  try {
    // 1. Verify Secret Key (Security)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    if (secret !== process.env.BACKUP_SECRET) {
        return NextResponse.json({ success: false, message: "Unauthorized backup request." }, { status: 401 });
    }

    // 2. Setup Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // 3. Fetch Data from Database
    const [expenses, vouchers] = await Promise.all([
        prisma.expense.findMany({ orderBy: { date: "desc" } }),
        prisma.voucherRecord.findMany({ orderBy: { date: "desc" } })
    ]);

    // 4. Prepare Data for Sheet
    // Sheet 1: Expenses
    const expenseRows = [
        ["ID", "Date", "Type", "Category", "Dept", "EmpCode", "EmpName", "Amount", "Remarks", "VoucherID"],
        ...expenses.map(e => [
            e.id, 
            e.date.toISOString(), 
            e.type, 
            e.category || "", 
            e.department || "", 
            e.empCode || "", 
            e.empName || "", 
            e.amount, 
            e.remarks || "", 
            e.voucherId || ""
        ])
    ];

    // Sheet 2: Vouchers
    const voucherRows = [
        ["ID", "Serial", "Date", "Total", "PreparedBy", "Status", "Created At"],
        ...vouchers.map(v => [
            v.id, 
            v.serialNumber, 
            v.date.toISOString(), 
            v.totalAmount, 
            v.preparedBy || "", 
            v.status, 
            v.createdAt.toISOString()
        ])
    ];

    // 5. Push to Google Sheets (Overwriting for a fresh backup)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Expenses!A1",
      valueInputOption: "RAW",
      requestBody: { values: expenseRows },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Vouchers!A1",
      valueInputOption: "RAW",
      requestBody: { values: voucherRows },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Backup complete. ${expenses.length} expenses and ${vouchers.length} vouchers synced.` 
    });

  } catch (error: any) {
    console.error("Backup Sync Error:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  */
}