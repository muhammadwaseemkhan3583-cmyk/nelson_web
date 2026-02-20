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

    const { passes, type } = await request.json();

    if (!passes || !Array.isArray(passes) || !type) {
      return NextResponse.json({ success: false, message: "Invalid data." }, { status: 400 });
    }

    // Get User Name from Firestore
    const userDoc = await adminDb.collection("users").doc(auth.uid!).get();
    const userName = userDoc.exists ? userDoc.data()?.name : "Operation Executive";

    // Permissions check
    if (type === "Returnable" && !auth.canReturnable && auth.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized for Returnable Pass." }, { status: 403 });
    }
    if (type === "Non-Returnable" && !auth.canNonReturnable && auth.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized for Non-Returnable Pass." }, { status: 403 });
    }
    if (type === "Outdoor" && !auth.canOutdoorWork && auth.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized for Outdoor Pass." }, { status: 403 });
    }

    const db = prisma as any;
    const prefix = type === "Returnable" ? "RGN" : type === "Non-Returnable" ? "NRGP" : "ODGP";
    const model = type === "Returnable" ? prisma.returnablePass : type === "Non-Returnable" ? prisma.nonReturnablePass : prisma.outdoorPass;

    // Find the last pass of this type to get the next serial number
    const lastPass = await (model as any).findFirst({
      orderBy: { createdAt: 'desc' },
      select: { passNumber: true }
    });

    let nextSerialStart = 1;
    if (lastPass && lastPass.passNumber) {
      const parts = lastPass.passNumber.split('-');
      if (parts.length > 1) {
        const lastNum = parseInt(parts[1]);
        if (!isNaN(lastNum)) {
          nextSerialStart = lastNum + 1;
        }
      }
    }

    // Helper to generate pass number
    const genPassNum = (i: number) => `${prefix}-${(nextSerialStart + i).toString().padStart(4, '0')}`;

    // Prepare data based on type
    const dataToSave = passes.map((p: any, index: number) => {
      const common = {
        passNumber: genPassNum(index),
        date: new Date(p.date.split('/').reverse().join('-')), // Convert DD/MM/YYYY to YYYY-MM-DD
        purpose: p.purpose,
        authorizedBy: p.authorizedBy,
        issuerId: auth.uid!,
        issuerName: userName,
        status: "Issued"
      };

      if (type === "Returnable" || type === "Non-Returnable") {
        const itemData = {
          ...common,
          toPlace: p.toPlace,
          department: p.department || null,
          carrierName: p.carrierName || null,
          vehicleNumber: p.vehicleNumber || null,
          officerRemarks: p.remarks || null,
          items: p.items && Array.isArray(p.items) 
            ? p.items.map((it: any) => ({ item: it.item, qty: parseInt(it.qty) || 1 }))
            : [{ item: p.item, qty: parseInt(p.qty) || 1 }]
        };
        if (type === "Returnable") {
          return { ...itemData, expectedReturnDate: new Date(p.expectedReturnDate) };
        }
        return itemData;
      } else {
        return {
          ...common,
          employeeName: p.employeeName,
          employeeId: p.employeeId,
          employeeDesignation: p.employeeDesignation,
          whereToGo: p.destination,
          outTime: p.outTime
        };
      }
    });

    let count = 0;
    if (type === "Returnable") {
      const result = await prisma.returnablePass.createMany({ data: dataToSave as any });
      count = result.count;
    } else if (type === "Non-Returnable") {
      const result = await prisma.nonReturnablePass.createMany({ data: dataToSave as any });
      count = result.count;
    } else if (type === "Outdoor") {
      const result = await prisma.outdoorPass.createMany({ data: dataToSave as any });
      count = result.count;
    }

    return NextResponse.json({ 
      success: true, 
      message: `${count} ${type} passes issued successfully.` 
    }, { status: 201 });

  } catch (error: any) {
    console.error(">>> Batch Pass Save Failure:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}
