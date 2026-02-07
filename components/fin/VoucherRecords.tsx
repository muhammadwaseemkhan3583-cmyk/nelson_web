"use client";

import { useState, useEffect, useMemo } from "react";
import VoucherPrintModal from "./VoucherPrintModal";
import { authenticatedFetch } from "@/lib/utils";

export default function VoucherRecords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeframe, setTimeframe] = useState("Last 5 Days");
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
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
    fetchVouchers();
  }, []);

  const filteredRecords = useMemo(() => {
    return vouchers.filter(rec => {
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
                    placeholder="VC-..."
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

        <button onClick={() => window.location.reload()} className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">Refresh Sync</button>
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
                        <th className="border border-gray-300 py-3 text-[9px] font-black uppercase text-center text-gray-400">View</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {isLoading ? (
                        <tr><td colSpan={6} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Fetching records...</td></tr>
                    ) : filteredRecords.length > 0 ? (
                        filteredRecords.map((rec, index) => (
                            <tr key={rec.id} className="hover:bg-blue-50 transition-colors group">
                                <td className="border-r border-gray-200 text-center text-[10px] font-bold text-gray-400 bg-gray-50/50">{index + 1}</td>
                                <td className="border-r border-gray-200 px-4 py-3 text-xs font-black text-gray-900 uppercase tracking-tight">{rec.serialNumber}</td>
                                <td className="border-r border-gray-200 text-center text-xs font-bold text-gray-500 font-mono">{new Date(rec.date).toLocaleDateString('en-GB')}</td>
                                <td className="border-r border-gray-200 px-4 py-3 text-xs font-black text-orange-600 text-right tabular-nums">PKR {rec.totalAmount.toLocaleString()}.00</td>
                                <td className="border-r border-gray-200 px-4 py-3 text-xs font-medium text-gray-600 uppercase">{rec.preparedBy}</td>
                                <td className="text-center px-4">
                                    <button 
                                        onClick={() => setSelectedVoucher(rec)}
                                        className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 mx-auto border border-blue-100 px-3 py-1 rounded hover:bg-blue-100"
                                    >
                                        Inspect Voucher
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={6} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs bg-white">No vouchers found for this period</td></tr>
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
    </div>
  );
}
