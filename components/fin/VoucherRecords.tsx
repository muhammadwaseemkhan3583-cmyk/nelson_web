"use client";

import { useState, useEffect, useMemo } from "react";
import VoucherPrintModal from "./VoucherPrintModal";
import { authenticatedFetch } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function VoucherRecords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeframe, setTimeframe] = useState("Last 5 Days");
  const [selectedType, setSelectedType] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // Password Modal State for Clearing
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [passError, setPassError] = useState("");
  const [voucherToClear, setVoucherToClear] = useState<string | null>(null);
  const [voucherToSync, setVoucherToSync] = useState<string | null>(null);
  const [syncPreview, setSyncPreview] = useState<any | null>(null);

  // Forwarding State
  const [forwardModal, setForwardModal] = useState<{ id: string, nextStatus: string, message: string } | null>(null);

  // Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [voucherToDeleteId, setVoucherToDeleteId] = useState<string | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/api/vouchers/list");
      const result = await response.json();
      if (result.success) {
        setVouchers(result.vouchers);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
    
    // Fetch User Role and Name
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role);
          setCurrentUserName(data.name);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleInspectVoucher = (rec: any) => {
      // If DB has generic name, use current user name for print context
      const augmentedVoucher = {
          ...rec,
          preparedBy: (rec.preparedBy === "Finance Officer" || !rec.preparedBy) ? currentUserName : rec.preparedBy
      };
      setSelectedVoucher(augmentedVoucher);
  };

  const handleOpenClearModal = (id: string) => {
      setVoucherToClear(id);
      setVoucherToSync(null);
      setIsPassModalOpen(true);
      setPassError("");
      setPassword("");
  };

  const handleOpenForwardModal = (rec: any) => {
      let nextStatus = "";
      let message = "";
      const currentStatus = rec.status || "Pending";

      if (currentStatus === "Pending" || currentStatus === "Recorded") {
          nextStatus = "Hold BY Atif Shamsi";
          message = "Do you want to Forward voucher TO Atif Shamsi?";
      } else if (currentStatus === "Hold BY Atif Shamsi") {
          nextStatus = "Hold By Mehmood Seed";
          message = "Do you want to Forward voucher TO Mehmood Sb?";
      } else if (currentStatus === "Hold By Mehmood Seed") {
          nextStatus = "Pending with Finance";
          message = "Do you want to forward with Finance Officer?";
      }

      if (nextStatus) {
          setForwardModal({ id: rec.id, nextStatus, message });
      }
  };

  const handleForwardVoucher = async () => {
      if (!forwardModal) return;

      try {
          const response = await authenticatedFetch("/api/vouchers/forward", {
              method: "PUT",
              body: JSON.stringify({ id: forwardModal.id, nextStatus: forwardModal.nextStatus })
          });
          const result = await response.json();
          if (result.success) {
              setForwardModal(null);
              fetchVouchers();
          } else {
              alert(result.message);
          }
      } catch (error) {
          console.error("Forward Error:", error);
      }
  };

  const handleOpenSyncModal = (rec: any) => {
      setSyncPreview(rec);
      setVoucherToSync(rec.serialNumber);
      setVoucherToClear(null);
      setIsPassModalOpen(false); // Open preview first
  };

  const handleConfirmSyncPreview = () => {
      setIsPassModalOpen(true);
      setPassError("");
      setPassword("");
  };

  const handleSyncVoucher = async () => {
    const user = auth.currentUser;
    if (!user || !user.email || !voucherToSync) return;

    setIsVerifying(true);
    setPassError("");

    try {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        
        const response = await authenticatedFetch("/api/vouchers/sync", {
            method: "PUT",
            body: JSON.stringify({ serialNumber: voucherToSync })
        });
        const result = await response.json();
        if (result.success) {
            alert("Voucher updated successfully according to entries.");
            setIsPassModalOpen(false);
            setSyncPreview(null);
            fetchVouchers();
        } else {
            setPassError(result.message);
        }
    } catch (error: any) {
        setPassError("Incorrect password. Access denied.");
    } finally {
        setIsVerifying(false);
    }
  };

  const handleClearVoucher = async () => {
      const user = auth.currentUser;
      if (!user || !user.email || !voucherToClear) return;

      setIsVerifying(true);
      setPassError("");

      try {
          const credential = EmailAuthProvider.credential(user.email, password);
          await reauthenticateWithCredential(user, credential);
          
          const response = await authenticatedFetch("/api/vouchers/clear", {
              method: "PUT",
              body: JSON.stringify({ id: voucherToClear })
          });
          const result = await response.json();
          if (result.success) {
              alert("Voucher cleared successfully.");
              setIsPassModalOpen(false);
              fetchVouchers();
          } else {
              setPassError(result.message);
          }
      } catch (error: any) {
          setPassError("Incorrect password. Access denied.");
      } finally {
          setIsVerifying(false);
      }
  };

  const handleOpenDeleteModal = (id: string) => {
      setVoucherToDeleteId(id);
      setIsDeleteModalOpen(true);
      setDeleteConfirmInput("");
  };

  const handleDeleteVoucher = async () => {
      if (!voucherToDeleteId || deleteConfirmInput.toLowerCase() !== "yes") return;

      setIsDeleting(true);
      try {
          const response = await authenticatedFetch("/api/vouchers/delete", {
              method: "DELETE",
              body: JSON.stringify({ id: voucherToDeleteId })
          });
          const result = await response.json();
          if (result.success) {
              alert("Voucher and its entries deleted successfully.");
              setIsDeleteModalOpen(false);
              fetchVouchers();
          } else {
              alert(result.message);
          }
      } catch (error) {
          console.error("Delete Error:", error);
          alert("Failed to delete voucher.");
      } finally {
          setIsDeleting(false);
      }
  };

  const handlePasswordSubmit = () => {
      if (voucherToSync) {
          handleSyncVoucher();
      } else {
          handleClearVoucher();
      }
  };

  const handleDownloadExcel = async () => {
    if (filteredRecords.length === 0) {
        alert("No data available to export.");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Vouchers");

    // Define Columns
    worksheet.columns = [
        { header: "Sr#", key: "sr", width: 5 },
        { header: "Voucher Serial Number", key: "serial", width: 25 },
        { header: "Type", key: "type", width: 10 },
        { header: "Issue Date", key: "date", width: 15 },
        { header: "Net Amount", key: "amount", width: 15 },
        { header: "Officer", key: "officer", width: 25 },
        { header: "Status", key: "status", width: 20 },
        { header: "Last Updated", key: "updatedAt", width: 25 }
    ];

    // Add Rows
    filteredRecords.forEach((rec, index) => {
        worksheet.addRow({
            sr: index + 1,
            serial: rec.serialNumber,
            type: rec.type === "Cash Voucher" ? "CV" : "PC",
            date: new Date(rec.date).toLocaleDateString('en-GB'),
            amount: rec.totalAmount,
            officer: rec.preparedBy || "-",
            status: rec.status || "Pending",
            updatedAt: new Date(rec.statusUpdatedAt || rec.createdAt).toLocaleString('en-GB')
        });
    });

    // Style Header (Blue Background, White Bold Text)
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E40AF' }
        };
        cell.font = {
            color: { argb: 'FFFFFFFF' },
            bold: true,
            size: 11
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Auto-fit column widths
    worksheet.columns.forEach(column => {
        let maxColumnLength = 0;
        column.eachCell!({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxColumnLength) {
                maxColumnLength = columnLength;
            }
        });
        column.width = maxColumnLength < 10 ? 10 : maxColumnLength + 2;
    });

    // Generate Buffer and Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Voucher_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredRecords = useMemo(() => {
    const filtered = vouchers.filter((rec: any) => {
      // 1. Type Filter
      const matchType = selectedType === "All" || rec.type === selectedType;
      if (!matchType) return false;

      // 2. Search Filter
      const matchSerial = rec.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSerial) return false;

      // 3. Timeframe Filter
      // If it's NOT Cleared, always show it (bypass timeframe filter)
      const isCleared = rec.status === "Cleared";
      if (!isCleared) return true;
      
      // If it IS Cleared, apply Timeframe Logic
      const rowDate = new Date(rec.date);
      const now = new Date();
      
      if (timeframe === "Range") {
          if (fromDate && toDate) {
              const start = new Date(fromDate);
              const end = new Date(toDate);
              end.setHours(23, 59, 59, 999);
              return rowDate >= start && rowDate <= end;
          }
          return true; // Show all if range selected but dates not set
      }

      const diffMs = now.getTime() - rowDate.getTime();
      const diffDays = diffMs / (1000 * 3600 * 24);

      if (timeframe === "Last 5 Days" && diffDays > 5) return false;
      if (timeframe === "1 Month" && diffDays > 30) return false;
      if (timeframe === "3 Months" && diffDays > 90) return false;
      if (timeframe === "6 Months" && diffDays > 180) return false;
      if (timeframe === "1 Year" && diffDays > 365) return false;

      return true;
    });

    // Sort: Non-Cleared (Pending, Hold BY, etc.) first, then by Date Desc
    return [...filtered].sort((a, b) => {
        const isACleared = a.status === "Cleared";
        const isBCleared = b.status === "Cleared";

        if (isACleared && !isBCleared) return 1;
        if (!isACleared && isBCleared) return -1;

        // If both same status group, sort by date desc
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [searchTerm, timeframe, selectedType, fromDate, toDate, vouchers]);

  const totalSum = filteredRecords.reduce((s: number, r: any) => s + r.totalAmount, 0);

  return (
    <div className="flex flex-col h-full animate-fadeIn w-[90vw] mx-auto overflow-hidden relative text-gray-900">
      
      {/* Search and Action Bar */}
      <div className="bg-white p-6 rounded-t-xl border border-gray-200 shadow-sm flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Serial Search</span>
                <input 
                    type="text" 
                    placeholder="Search Serial..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-2 border-gray-100 rounded-lg px-4 py-2 text-xs font-bold focus:border-orange-600 outline-none w-48 transition-all"
                />
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-gray-900">Voucher Type</span>
                <select 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value)} 
                    className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-1.5 text-xs font-black uppercase text-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer shadow-lg"
                >
                    <option value="All">All Record</option>
                    <option value="Cash Voucher">Cash Voucher</option>
                    <option value="Petty Cash">Petty Cash</option>
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-gray-900">Timeframe</span>
                <select 
                    value={timeframe} 
                    onChange={(e) => setTimeframe(e.target.value)} 
                    className="bg-orange-600 border border-orange-500 rounded-lg px-4 py-1.5 text-xs font-black uppercase text-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer shadow-lg"
                >
                    <option>Last 5 Days</option>
                    <option>1 Month</option>
                    <option>3 Months</option>
                    <option>6 Months</option>
                    <option>1 Year</option>
                    <option value="Range">Range</option>
                    <option>All</option>
                </select>
            </div>
            {timeframe === "Range" && (
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border-2 border-gray-100">
                    <input 
                        type="date" 
                        value={fromDate} 
                        onChange={(e) => setFromDate(e.target.value)} 
                        className="bg-transparent border-none text-[10px] font-black uppercase outline-none cursor-pointer w-32"
                    />
                    <span className="text-gray-400 text-[8px] font-black">TO</span>
                    <input 
                        type="date" 
                        value={toDate} 
                        onChange={(e) => setToDate(e.target.value)} 
                        className="bg-transparent border-none text-[10px] font-black uppercase outline-none cursor-pointer w-32"
                    />
                </div>
            )}
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={handleDownloadExcel} 
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-900/10"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download Excel
            </button>
            <button onClick={() => fetchVouchers()} className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">Refresh Sync</button>
        </div>
      </div>

      {/* LIST TABLE */}
      <div className="flex-grow bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[70vh] shadow-sm">
        <div className="flex-grow overflow-auto bg-white custom-scrollbar">
            <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20">
                    <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                        <th className="w-12 py-4 text-[10px] font-black uppercase text-center border-b border-gray-200">#</th>
                        <th className="w-48 py-4 text-[10px] font-black uppercase text-left px-4 border-b border-gray-200">Voucher Serial Number</th>
                        <th className="w-32 py-4 text-[10px] font-black uppercase text-center border-b border-gray-200">Issue Date</th>
                        <th className="w-40 py-4 text-[10px] font-black uppercase text-right px-4 border-b border-gray-200">Net Amount</th>
                        <th className="w-40 py-4 text-[10px] font-black uppercase text-left px-4 border-b border-gray-200">Officer</th>
                        <th className="w-32 py-4 text-[10px] font-black uppercase text-center border-b border-gray-200">Status Tracking</th>
                        <th className="py-4 text-[10px] font-black uppercase text-center border-b border-gray-200">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                        <tr><td colSpan={7} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Fetching records...</td></tr>
                    ) : filteredRecords.length > 0 ? (
                        filteredRecords.map((rec: any, index: number) => {
                            const isCashVoucher = rec.type === "Cash Voucher";
                            
                            return (
                                <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="text-center text-[10px] font-bold text-gray-400 py-4">{index + 1}</td>
                                    <td className="px-4 py-4 text-xs font-black text-gray-900 uppercase tracking-tight">
                                        <div className="flex items-center gap-2">
                                            <span>{rec.serialNumber}</span>
                                            <span className={`text-[7px] font-black px-1 py-0.5 rounded border ${isCashVoucher ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                {isCashVoucher ? 'CV' : 'PC'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-center text-xs font-bold text-gray-500 font-mono py-4">{new Date(rec.date).toLocaleDateString('en-GB')}</td>
                                    <td className="px-4 py-4 text-xs font-black text-orange-600 text-right tabular-nums">PKR {rec.totalAmount.toLocaleString()}.00</td>
                                    <td className="px-4 py-4 text-xs font-medium text-gray-600 uppercase">{rec.preparedBy}</td>
                                    <td className="text-center px-4 py-4">
                                        {(() => {
                                            let textColor = "text-gray-600";
                                            let dotColor = "bg-gray-400";
                                            const currentStatus = rec.status || "Pending";
                                            const isLive = currentStatus !== "Cleared";

                                            if (currentStatus === "Pending" || currentStatus === "Recorded") {
                                                textColor = isCashVoucher ? "text-blue-700" : "text-orange-700";
                                                dotColor = isCashVoucher ? "bg-blue-500" : "bg-orange-500";
                                            } else if (currentStatus === "Hold BY Atif Shamsi") {
                                                textColor = "text-amber-700";
                                                dotColor = "bg-amber-500";
                                            } else if (currentStatus === "Hold By Mehmood Seed") {
                                                textColor = "text-purple-700";
                                                dotColor = "bg-purple-500";
                                            } else if (currentStatus === "Pending with Finance") {
                                                textColor = "text-indigo-700";
                                                dotColor = "bg-indigo-500";
                                            } else if (currentStatus === "Cleared") {
                                                textColor = "text-emerald-700";
                                                dotColor = "bg-emerald-500";
                                            }

                                            return (
                                                <div className={`flex flex-col items-center gap-1 ${textColor}`}>
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isLive ? 'animate-pulse' : ''}`}></span>
                                                        <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                                                            {currentStatus}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[8px] font-black opacity-40 uppercase tracking-widest leading-none">
                                                        <span>{new Date(rec.statusUpdatedAt || rec.createdAt).toLocaleString('en-GB', { 
                                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
                                                        }).replace(',', '')}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="text-center px-4 flex items-center justify-center gap-2 py-4">
                                        <button 
                                            onClick={() => handleInspectVoucher(rec)}
                                            className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors border border-blue-100 px-3 py-1.5 rounded hover:bg-blue-50"
                                        >
                                            Inspect
                                        </button>

                                        {userRole === 'Finance' && (
                                            <button 
                                                onClick={() => handleOpenDeleteModal(rec.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors p-1.5 rounded hover:bg-red-50 border border-red-100"
                                                title="Delete Voucher"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        )}
                                        
                                        {userRole === 'Finance' && rec.status !== 'Cleared' && (
                                            <>
                                                {((rec.status || "Pending") === "Pending" || rec.status === "Recorded" || rec.status === "Hold BY Atif Shamsi" || rec.status === "Hold By Mehmood Seed") ? (
                                                    <button 
                                                        onClick={() => handleOpenForwardModal(rec)}
                                                        className="text-[9px] font-black uppercase text-orange-600 hover:text-orange-800 transition-colors border border-orange-100 px-3 py-1.5 rounded hover:bg-orange-50"
                                                    >
                                                        Forward
                                                    </button>
                                                ) : rec.status === "Pending with Finance" ? (
                                                    <button 
                                                        onClick={() => handleOpenClearModal(rec.id)}
                                                        className="text-[9px] font-black uppercase text-green-600 hover:text-green-800 transition-colors border border-green-100 px-3 py-1.5 rounded hover:bg-green-50"
                                                    >
                                                        Clear
                                                    </button>
                                                ) : null}
                                            </>
                                        )}

                                        {userRole === 'Finance' && rec.status !== 'Cleared' && rec.needsSync && (
                                            <button 
                                                onClick={() => handleOpenSyncModal(rec)}
                                                className="text-[9px] font-black uppercase text-orange-600 hover:text-orange-800 transition-colors border border-orange-100 px-3 py-1.5 rounded hover:bg-orange-50 animate-pulse"
                                            >
                                                Update
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr><td colSpan={7} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs bg-white">No vouchers found for this period</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <div className="mt-4 px-2 flex justify-between items-center text-gray-900">
          <div className="flex gap-10">
              <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Saved</span>
                  <span className="text-sm font-black tracking-tight">{filteredRecords.length} Documents</span>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Accumulated Amount</span>
                  <span className="text-sm font-black tracking-tight text-orange-600">PKR {totalSum.toLocaleString()}.00</span>
              </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AdminSoft Record System</span>
      </div>

      {/* SHARED VOUCHER PRINT MODAL */}
      {selectedVoucher && (
        <VoucherPrintModal 
          voucher={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}

      {/* SYNC PREVIEW MODAL */}
      {syncPreview && !isPassModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp border border-gray-100">
                  <div className="bg-orange-600 p-6 text-center">
                      <div className="w-12 h-12 bg-white text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      </div>
                      <h3 className="text-white font-black uppercase tracking-widest text-sm leading-none">Sync Detection</h3>
                      <p className="text-white/60 text-[9px] font-bold uppercase mt-2 tracking-tighter">Modifications detected in ledger entries</p>
                  </div>
                  
                  <div className="p-8">
                      <div className="space-y-6">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                              <div className="text-center flex-1">
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Current Total</span>
                                  <span className="text-sm font-black text-gray-400 line-through">PKR {syncPreview.totalAmount.toLocaleString()}</span>
                              </div>
                              <div className="px-4">
                                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                              </div>
                              <div className="text-center flex-1">
                                  <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest block mb-1">New Total</span>
                                  <span className="text-lg font-black text-orange-600 animate-pulse">PKR {syncPreview.liveTotal.toLocaleString()}</span>
                              </div>
                          </div>

                          <div className="space-y-3">
                              <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest block">Detailed Comparison</span>
                              <div className="max-h-[200px] overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2 custom-scrollbar">
                                  <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                          <p className="text-[7px] font-black text-gray-400 uppercase">Old Items</p>
                                          {syncPreview.items.map((it: any, i: number) => (
                                              <div key={i} className="text-[8px] font-bold text-gray-500 border-b border-white pb-1 truncate">{it.detail} - Rs.{it.amount}</div>
                                          ))}
                                      </div>
                                      <div className="space-y-1">
                                          <p className="text-[7px] font-black text-orange-600 uppercase">New Live Items</p>
                                          {syncPreview.liveItems.map((it: any, i: number) => (
                                              <div key={i} className="text-[8px] font-black text-orange-600 border-b border-white pb-1 truncate">{it.detail} - Rs.{it.amount}</div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                              <button 
                                  onClick={() => setSyncPreview(null)}
                                  className="py-3 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 transition-all"
                              >
                                  Cancel
                              </button>
                              <button 
                                  onClick={handleConfirmSyncPreview}
                                  className="py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-100 transition-all active:scale-95"
                              >
                                  Confirm Changes
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* PASSWORD VERIFICATION MODAL FOR CLEARING & VOUCHER SYNC */}

      {isPassModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp border border-gray-100">
                  <div className={voucherToSync ? "bg-orange-600 p-6 text-center" : "bg-gray-900 p-6 text-center"}>
                      <div className={`w-12 h-12 ${voucherToSync ? 'bg-white text-orange-600' : 'bg-green-600 text-white'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg flex items-center justify-center`}>
                        {voucherToSync ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        )}
                      </div>
                      <h3 className="text-white font-black uppercase tracking-widest text-sm leading-none">{voucherToSync ? 'Sync Entries' : 'Voucher Clearing'}</h3>
                      <p className="text-white/60 text-[9px] font-bold uppercase mt-2 tracking-tighter">{voucherToSync ? `Updating voucher data based on current ledger entries` : 'Enter password to return amount to balance'}</p>
                  </div>
                  
                  <div className="p-8">
                      <div className="space-y-4">
                          <div className="space-y-1">
                              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Current User Password</label>
                              <input 
                                  type="password" 
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className={`w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all ${voucherToSync ? 'focus:border-orange-600' : 'focus:border-green-600'}`}
                                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                  autoFocus
                              />
                          </div>
                          
                          {passError && <p className="text-red-500 text-[9px] font-black uppercase text-center animate-pulse">{passError}</p>}

                          <div className="grid grid-cols-2 gap-3 pt-2">
                              <button 
                                  onClick={() => { setIsPassModalOpen(false); setSyncPreview(null); }}
                                  className="py-3 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 transition-all"
                              >
                                  Cancel
                              </button>
                              <button 
                                  onClick={handlePasswordSubmit}
                                  disabled={isVerifying || !password}
                                  className={`py-3 ${voucherToSync ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:shadow-none`}
                              >
                                  {isVerifying ? (
                                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                  ) : voucherToSync ? "Update Now" : "Clear Voucher"}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* FORWARDING MODAL */}
      {forwardModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp border border-gray-100">
                  <div className="bg-orange-600 p-6 text-center">
                      <div className="w-12 h-12 bg-white text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                      </div>
                      <h3 className="text-white font-black uppercase tracking-widest text-sm leading-none">Forward Voucher</h3>
                  </div>
                  
                  <div className="p-8">
                      <p className="text-center font-bold text-gray-700 text-sm mb-8">{forwardModal.message}</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <button 
                              onClick={() => setForwardModal(null)}
                              className="py-3 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 transition-all"
                          >
                              No
                          </button>
                          <button 
                              onClick={handleForwardVoucher}
                              className="py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-100 transition-all active:scale-95"
                          >
                              Yes
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slideUp border border-gray-100">
                  <div className="bg-red-600 p-6 text-center">
                      <div className="w-12 h-12 bg-white text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </div>
                      <h3 className="text-white font-black uppercase tracking-widest text-sm leading-none">Delete Voucher</h3>
                      <p className="text-white/60 text-[9px] font-bold uppercase mt-2 tracking-tighter">This action will permanently remove the voucher and all its entries.</p>
                  </div>
                  
                  <div className="p-8">
                      <div className="space-y-4">
                          <p className="text-center font-bold text-gray-700 text-sm">Do you want to delete this voucher? This cannot be undone.</p>
                          
                          <div className="space-y-1">
                              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Type "YES" to confirm</label>
                              <input 
                                  type="text" 
                                  value={deleteConfirmInput}
                                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                                  placeholder="YES"
                                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-red-600 transition-all text-center uppercase"
                                  onKeyDown={(e) => e.key === 'Enter' && deleteConfirmInput.toLowerCase() === 'yes' && handleDeleteVoucher()}
                                  autoFocus
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                              <button 
                                  onClick={() => setIsDeleteModalOpen(false)}
                                  className="py-3 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:bg-gray-50 transition-all"
                              >
                                  Cancel
                              </button>
                              <button 
                                  onClick={handleDeleteVoucher}
                                  disabled={isDeleting || deleteConfirmInput.toLowerCase() !== 'yes'}
                                  className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:shadow-none"
                              >
                                  {isDeleting ? (
                                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                  ) : "Delete Now"}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
