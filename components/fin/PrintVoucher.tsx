"use client";

import { useState, useEffect } from "react";
import VoucherPrintModal from "./VoucherPrintModal";
import { authenticatedFetch } from "@/lib/utils";

export default function GenerateVoucher() {
  const [selectedDate, setSelectedDate] = useState("");
  const [voucherType, setVoucherType] = useState<"Petty Cash" | "Cash Voucher">("Petty Cash");
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDatesLoading, setIsDatesLoading] = useState(true);
  
  const [voucherData, setVoucherData] = useState<any[]>([]);
  const [serial, setSerial] = useState("");
  const [total, setTotal] = useState(0);
  const [expenseIds, setExpenseIds] = useState<string[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Fetch dates that have pending (unvouchered) expenses
  useEffect(() => {
    const fetchPendingDates = async () => {
      setIsDatesLoading(true);
      try {
        const response = await authenticatedFetch(`/api/vouchers/pending-dates?type=${voucherType}`);
        const result = await response.json();
        if (result.success) {
          setPendingDates(result.dates);
          setSelectedDate(result.dates.length > 0 ? result.dates[0] : "");
        }
      } catch (error) {
        console.error("Error fetching dates:", error);
      } finally {
        setIsDatesLoading(false);
      }
    };
    fetchPendingDates();
    setIsGenerated(false);
  }, [voucherType]);

  const handleGenerate = async () => {
    if (!selectedDate) {
        alert("Please select a date.");
        return;
    }
    setIsLoading(true);
    setIsGenerated(false);
    try {
      const response = await authenticatedFetch(`/api/vouchers/generate?date=${selectedDate}&type=${voucherType}`);
      const result = await response.json();
      
      if (result.success) {
        setVoucherData(result.items);
        setSerial(result.serial);
        setTotal(result.total);
        setExpenseIds(result.expenseIds);
        setIsGenerated(true);
      } else {
        alert(result.message || "Could not generate voucher.");
      }
    } catch (error) {
      alert("Network Error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndPrint = async () => {
    if (!isGenerated) return;
    setIsSaving(true);
    try {
      const response = await authenticatedFetch("/api/vouchers/save", {
        method: "POST",
        body: JSON.stringify({ serial, date: selectedDate, total, items: voucherData, expenseIds, type: voucherType })
      });
      const result = await response.json();
      if (result.success || response.status === 409) {
        // Now show modal for printing
        setShowPrintModal(true);
        setIsGenerated(false);
        setPendingDates(prev => prev.filter(d => d !== selectedDate));
        setSelectedDate("");
      } else {
        alert("Save Error: " + result.message);
      }
    } catch (err) {
      alert("Database connection error.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animate-fadeIn text-gray-900">
      
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-900 p-8 text-white text-center">
              <h2 className="text-xl font-black uppercase tracking-widest">Voucher Generation Studio</h2>
              <p className="text-xs font-bold text-gray-500 uppercase mt-2 tracking-tighter">Prepare financial summaries for processing</p>
          </div>

          <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Type</label>
                      <select 
                          value={voucherType} 
                          onChange={(e) => setVoucherType(e.target.value as any)}
                          className="w-full bg-gray-50 border-2 border-gray-100 focus:border-orange-600 rounded-2xl px-5 py-4 text-sm font-black uppercase outline-none transition-all cursor-pointer"
                      >
                          <option value="Petty Cash">Petty Cash Summary</option>
                          <option value="Cash Voucher">Cash Voucher Summary</option>
                      </select>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Pending Date</label>
                      <select 
                          value={selectedDate}
                          disabled={isDatesLoading || pendingDates.length === 0}
                          onChange={(e) => { setSelectedDate(e.target.value); setIsGenerated(false); }}
                          className={`w-full border-2 rounded-2xl px-5 py-4 text-sm font-black outline-none transition-all ${pendingDates.length > 0 ? 'border-gray-100 bg-gray-50 focus:border-orange-600' : 'border-red-100 bg-red-50 text-red-400 cursor-not-allowed'}`}
                      >
                          {isDatesLoading ? (
                              <option>Scanning Database...</option>
                          ) : pendingDates.length > 0 ? (
                              <>
                                  <option value="">Pick a date...</option>
                                  {pendingDates.map(date => (
                                      <option key={date} value={date}>{new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</option>
                                  ))}
                              </>
                          ) : (
                              <option>All caught up!</option>
                          )}
                      </select>
                  </div>
              </div>

              {!isGenerated ? (
                  <button 
                      onClick={handleGenerate} 
                      disabled={isLoading || !selectedDate} 
                      className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${isLoading || !selectedDate ? "bg-gray-100 text-gray-400" : "bg-gray-900 text-white hover:bg-orange-600 shadow-xl active:scale-95"}`}
                  >
                      {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </>
                      ) : "Generate Voucher Preview"}
                  </button>
              ) : (
                  <div className="flex flex-col gap-4 animate-slideUp">
                      <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 text-center">
                          <p className="text-xs font-bold text-orange-800 uppercase tracking-widest">Voucher Ready: <span className="font-black underline">{serial}</span></p>
                          <p className="text-[10px] text-orange-600 mt-1 uppercase font-bold">Total Amount: PKR {total.toLocaleString()}.00</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={handleSaveAndPrint}
                            disabled={isSaving}
                            className="py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2zM12 17h.01"></path></svg>
                              Save & Print
                          </button>
                          <button 
                            onClick={() => setShowPrintModal(true)}
                            className="py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                              Preview Only
                          </button>
                      </div>
                      <button onClick={() => setIsGenerated(false)} className="text-[10px] font-black uppercase text-gray-400 hover:text-red-600 transition-all">Cancel & Re-select</button>
                  </div>
              )}
          </div>
      </div>

      {pendingDates.length === 0 && !isDatesLoading && (
          <div className="mt-8 px-8 py-4 bg-green-50 rounded-full border border-green-100 flex items-center gap-3 animate-bounce">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">
                  Excellent! System is up to date for {voucherType}.
              </p>
          </div>
      )}

      {/* PRINT MODAL */}
      {showPrintModal && (
          <VoucherPrintModal 
            voucher={{ serialNumber: serial, date: selectedDate, type: voucherType, totalAmount: total, items: voucherData }}
            onClose={() => setShowPrintModal(false)}
          />
      )}
    </div>
  );
}