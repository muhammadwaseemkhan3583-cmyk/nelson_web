import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";
import { adminDb } from "@/lib/firebase-admin";

// Helper to get Pass model based on type
function getPassModel(db: any, type: string) {
  if (type === "Returnable") return db.returnablePass;
  if (type === "Non-Returnable") return db.nonReturnablePass;
  if (type === "Outdoor") return db.outdoorPass;
  throw new Error(`Unknown pass type: ${type}`);
}


export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { type, items, purpose, toPlace, authorizedBy, expectedReturnDate, officerRemarks, subject, employeeId, employeeDesignation, whereToGo, outTime } = body;

    // Get User Name from Firestore
    const userDoc = await adminDb.collection("users").doc(auth.uid!).get();
    const userName = userDoc.exists ? userDoc.data()?.name : "Operation Executive";

    // Permissions check
    if (type === "Returnable" && !auth.canReturnable && auth.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized to issue Returnable Pass." }, { status: 403 });
    }
    if (type === "Non-Returnable" && !auth.canNonReturnable && auth.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized to issue Non-Returnable Pass." }, { status: 403 });
    }
    if (type === "Outdoor" && !auth.canOutdoorWork && auth.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized to issue Outdoor Pass." }, { status: 403 });
    }

    const db = prisma as any;
    const model = getPassModel(db, type);

    // Generate Sequential Pass Number
    const prefix = type === "Returnable" ? "RGN" : type === "Non-Returnable" ? "NRGP" : "ODGP";
    
    // Find the last pass of this type to get the next serial number
    const lastPass = await model.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { passNumber: true }
    });

    let nextSerial = 1;
    if (lastPass && lastPass.passNumber) {
      const parts = lastPass.passNumber.split('-');
      if (parts.length > 1) {
        const lastNum = parseInt(parts[1]);
        if (!isNaN(lastNum)) {
          nextSerial = lastNum + 1;
        }
      }
    }

    const passNumber = `${prefix}-${nextSerial.toString().padStart(4, '0')}`;

    let newPassData: any = {
      passNumber,
      date: new Date(),
      purpose,
      authorizedBy,
      issuerId: auth.uid!,
      issuerName: userName,
      status: "Issued"
    };

    if (type === "Returnable" || type === "Non-Returnable") {
      if (!items || !toPlace) {
        return NextResponse.json({ success: false, message: "Missing required fields for Item Pass." }, { status: 400 });
      }
      newPassData = { ...newPassData, items, toPlace };
      if (type === "Returnable") {
        if (!expectedReturnDate) {
          return NextResponse.json({ success: false, message: "Expected Return Date is required for Returnable Pass." }, { status: 400 });
        }
        newPassData = { ...newPassData, expectedReturnDate: new Date(expectedReturnDate) };
      }
    } else if (type === "Outdoor") {
      if (!subject || !employeeId || !employeeDesignation || !whereToGo || !outTime) {
        return NextResponse.json({ success: false, message: "Missing required fields for Outdoor Pass." }, { status: 400 });
      }
      newPassData = {
        ...newPassData,
        employeeName: subject, // subject is employee name
        employeeId,
        employeeDesignation,
        whereToGo,
        outTime
      };
    }

    const newPass = await model.create({ data: newPassData });

    return NextResponse.json({ success: true, message: "Gate pass issued.", pass: newPass }, { status: 201 });

  } catch (error: any) {
    console.error(`Gate Pass (${request.url}) Save Error:`, error);
    return NextResponse.json({ success: false, message: "Failed to issue pass." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view"); // "personal" or "security"
    const type = searchParams.get("type"); // "Returnable", "Non-Returnable", "Outdoor"

    if (!type) {
        return NextResponse.json({ success: false, message: "Pass type is required." }, { status: 400 });
    }

    const db = prisma as any;
    const model = getPassModel(db, type);

    const query: any = {
      orderBy: { createdAt: 'desc' }
    };

    // Operation Executives only see their own passes for creation history
    if (view === "personal") {
        query.where = { issuerId: auth.uid! };
    } 
    // Security sees all passes of a specific type that are 'Issued' or 'Verified'
    else if (view === "security") {
        query.where = { 
            status: { in: ["Issued", "Verified"] } // Security doesn't need to see "Returned" in their active list
        };
    }

    const passes = await model.findMany(query);
    return NextResponse.json({ success: true, passes }, { status: 200 });

  } catch (error: any) {
    console.error(`Gate Pass (${request.url}) Fetch Error:`, error);
    return NextResponse.json({ success: false, message: "Failed to load passes." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, type, verifiedByName, securityRemarks } = body;

    if (!id || !action || !type) {
        return NextResponse.json({ success: false, message: "Missing required data." }, { status: 400 });
    }

    const db = prisma as any;
    const model = getPassModel(db, type);

    let updateData: any = {};
    let logAction = "";

    if (action === "verify" || action === "out") {
        if (type === "Returnable") {
            updateData = {
                status: "Verified",
                securityClearBy: auth.name || verifiedByName,
                clearanceDate: new Date(),
                securityRemarks: securityRemarks || null
            };
            logAction = "Marked OUT";
        } else if (type === "Non-Returnable") {
            updateData = {
                status: "Cleared",
                securityClearBy: auth.name || verifiedByName,
                clearanceDate: new Date(),
                securityRemarks: securityRemarks || null
            };
            logAction = "Cleared OUT";
        } else if (type === "Outdoor") {
            updateData = {
                status: "Cleared",
                securityClearedBy: auth.name || verifiedByName,
                clearanceDate: new Date(),
                securityRemarks: securityRemarks || null
            };
            logAction = "Cleared OUT";
        }
    } else if (action === "return" || action === "in") {
        if (type === "Returnable") {
            updateData = {
                status: "Returned",
                securityClearByReturnDate: new Date(),
                securityRemarks: securityRemarks ? `[RETURN] ${securityRemarks}` : null
            };
            logAction = "Marked IN";
        } else {
             return NextResponse.json({ success: false, message: "Only Returnable passes can be marked as IN." }, { status: 400 });
        }
    } else if (action === "clear" || action === "final_clear" || action === "received") { 
        updateData = {
            status: "Completed",
            clearanceDate: new Date(),
            securityRemarks: securityRemarks || null
        };
        if (action === "received") {
             // Specific logging for issuer receiving materials
             logAction = "Received by Issuer";
        } else if (action === "final_clear") {
             logAction = "Finalized by Op";
        } else {
            if (type === "Outdoor") {
                updateData.securityClearedBy = auth.name || verifiedByName;
            } else {
                updateData.securityClearBy = auth.name || verifiedByName;
            }
            logAction = "Cleared";
        }
    }

    const updatedPass = await model.update({
        where: { id },
        data: updateData,
    });

    // Create a security log entry
    await prisma.securityLog.create({
      data: {
        action: logAction || action,
        passId: updatedPass.id,
        passType: type,
        passNumber: updatedPass.passNumber,
        securityOfficerId: auth.uid!,
        securityOfficerName: auth.name || verifiedByName || "Unknown Officer",
        remarks: securityRemarks || null,
      },
    });

    return NextResponse.json({ success: true, message: `Pass ${logAction} successfully.`, pass: updatedPass }, { status: 200 });

  } catch (error: any) {
    console.error(`Gate Pass (${request.url}) Update Error:`, error);
    return NextResponse.json({ success: false, message: "Update failed." }, { status: 500 });
  }
}
