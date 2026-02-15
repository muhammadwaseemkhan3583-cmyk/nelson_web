"use client";

import { useState, useEffect, useMemo } from "react";
import VoucherPrintModal from "./VoucherPrintModal";
import { authenticatedFetch } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export default function VoucherRecords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeframe, setTimeframe] = useState("Last 5 Days");
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

  const handlePasswordSubmit = () => {
      if (voucherToSync) {
          handleSyncVoucher();
      } else {
          handleClearVoucher();
      }
  };

  const filteredRecords = useMemo(() => {
    return vouchers.filter((rec: any) => {
      const matchSerial = rec.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Timeframe Logic
      const rowDate = new Date(rec.date);
      const now = new Date();
      const diffMs = now.getTime() - rowDate.getTime();
      const diffDays = diffMs / (1000 * 3600 * 24);

      if (timeframe === "Last 5 Days" && diffDays > 5) return false;
      if (timeframe === "1 Month" && diffDays > 30) return false;
      if (timeframe === "3 Months" && diffDays > 90) return false;
      if (timeframe === "6 Months" && diffDays > 180) return false;
      if (timeframe === "1 Year" && diffDays > 365) return false;

      return matchSerial;
    });
  }, [searchTerm, timeframe, vouchers]);

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
                    <option>All</option>
                </select>
            </div>
        </div>

        <button onClick={() => fetchVouchers()} className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">Refresh Sync</button>
      </div>

      {/* LIST TABLE */}
      <div className="flex-grow bg-white border-x border-b border-gray-200 rounded-b-xl overflow-hidden flex flex-col h-[70vh]">
        <div className="flex-grow overflow-auto bg-gray-50 p-px custom-scrollbar">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-200 text-gray-600 shadow-sm">
                        <th className="w-12 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">#</th>
                        <th className="w-48 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-4">Voucher Serial Number</th>
                        <th className="w-32 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Issue Date</th>
                        <th className="w-40 border border-gray-300 py-3 text-[9px] font-black uppercase text-right px-4">Net Amount</th>
                        <th className="w-40 border border-gray-300 py-3 text-[9px] font-black uppercase text-left px-4">Officer</th>
                        <th className="w-24 border border-gray-300 py-3 text-[9px] font-black uppercase text-center">Status</th>
                        <th className="border border-gray-300 py-3 text-[9px] font-black uppercase text-center text-gray-400">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {isLoading ? (
                        <tr><td colSpan={7} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Fetching records...</td></tr>
                    ) : filteredRecords.length > 0 ? (
                        filteredRecords.map((rec: any, index: number) => {
                            const isCashVoucher = rec.type === "Cash Voucher";
                            
                            return (
                                <tr key={rec.id} className="hover:bg-blue-50 transition-colors group">
                                    <td className="border-r border-gray-200 text-center text-[10px] font-bold text-gray-400 bg-gray-50/50">{index + 1}</td>
                                    <td className="border-r border-gray-200 px-4 py-3 text-xs font-black text-gray-900 uppercase tracking-tight">
                                        <div className="flex items-center gap-2">
                                            <span>{rec.serialNumber}</span>
                                            <span className={`text-[7px] font-black px-1 py-0.5 rounded border ${isCashVoucher ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                {isCashVoucher ? 'CV' : 'PC'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="border-r border-gray-200 text-center text-xs font-bold text-gray-500 font-mono">{new Date(rec.date).toLocaleDateString('en-GB')}</td>
                                    <td className="border-r border-gray-200 px-4 py-3 text-xs font-black text-orange-600 text-right tabular-nums">PKR {rec.totalAmount.toLocaleString()}.00</td>
                                    <td className="border-r border-gray-200 px-4 py-3 text-xs font-medium text-gray-600 uppercase">{rec.preparedBy}</td>
                                    <td className="border-r border-gray-200 text-center px-2">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${isCashVoucher ? 'bg-blue-100 text-blue-700' : rec.status === 'Cleared' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {isCashVoucher ? 'Recorded' : (rec.status || 'Pending')}
                                        </span>
                                    </td>
                                    <td className="text-center px-4 flex items-center justify-center gap-2 py-3">
                                        <button 
                                            onClick={() => handleInspectVoucher(rec)}
                                            className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors border border-blue-100 px-3 py-1 rounded hover:bg-blue-100"
                                        >
                                            Inspect
                                        </button>
                                        {userRole === 'Finance' && rec.needsSync && (
                                            <button 
                                                onClick={() => handleOpenSyncModal(rec)}
                                                className="text-[9px] font-black uppercase text-orange-600 hover:text-orange-800 transition-colors border border-orange-100 px-3 py-1 rounded hover:bg-orange-100 animate-pulse"
                                            >
                                                Update Voucher
                                            </button>
                                        )}
                                        {!isCashVoucher && rec.status !== 'Cleared' && userRole === 'Finance' && (
                                            <button 
                                                onClick={() => handleOpenClearModal(rec.id)}
                                                className="text-[9px] font-black uppercase text-green-600 hover:text-green-800 transition-colors border border-green-100 px-3 py-1 rounded hover:bg-green-100"
                                            >
                                                Clear
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
    </div>
  );
}
