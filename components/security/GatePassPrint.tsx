"use client";

import { useRef, useMemo } from "react";

export default function GatePassPrint({ pass, onClose }: { pass: any, onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isOutdoor = pass.type === "Outdoor";
  const items = Array.isArray(pass.items) ? pass.items : [];
  const minRows = 5;
  const emptyRowsNeeded = Math.max(0, minRows - items.length);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 print-modal-container">
      <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md modal-overlay print:hidden" onClick={onClose}></div>
      
      <div className="relative bg-gray-100 rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-auto flex flex-col p-12 print:p-0 print:bg-white animate-slideUp print:overflow-visible text-gray-900">
        
        <div className="flex justify-between items-center mb-8 print:hidden text-gray-900 modal-controls">
          <button onClick={onClose} className="flex items-center gap-2 text-gray-500 font-black uppercase text-[10px] hover:text-gray-900 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Close Preview
          </button>
          <button 
            onClick={handlePrint}
            className="bg-orange-600 text-white px-8 py-2.5 rounded-full font-black uppercase text-xs shadow-xl shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2zM12 17h.01"></path>
            </svg>
            Print Gate Pass
          </button>
        </div>

        <div id="print-area" className={`mx-auto bg-white p-4 shadow-2xl print:shadow-none relative text-gray-900 border-2 border-dashed border-gray-200 print:border-none print:m-0 print:top-0 ${isOutdoor ? 'w-[105mm] min-h-[148mm]' : 'w-[210mm] min-h-[105mm] h-auto'}`}>
          <div className="border-2 border-gray-900 p-4 flex flex-col h-full relative box-border">
            
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -rotate-12">
                <span className={`${isOutdoor ? 'text-6xl' : 'text-8xl'} font-black uppercase tracking-[0.2em]`}>{pass.type}</span>
            </div>

            {/* Header */}
            <div className={`flex justify-between items-end mb-0 border-b-2 border-gray-900 pb-1 ${isOutdoor ? 'flex-col items-center gap-2' : ''}`}>
              <div className="flex items-center gap-3 text-gray-900">
                <div>
                  <h1 className={`${isOutdoor ? 'text-base' : 'text-lg'} font-black uppercase tracking-tighter leading-none`}>Admin<span className="text-orange-500">Soft</span></h1>
                  <p className="text-[7px] text-gray-900 font-bold uppercase tracking-widest mt-1">Industrial Excellence Systems</p>
                </div>
              </div>
              
              <div className="flex-grow text-center pb-1">
                <h2 className={`${isOutdoor ? 'text-sm' : 'text-base'} font-black uppercase tracking-[0.1em] underline underline-offset-4`}>
                  {pass.type} Gate Pass
                </h2>
              </div>

              <div className={`text-right text-gray-900 leading-tight ${isOutdoor ? 'w-full flex justify-between border-t border-gray-100 pt-1' : ''}`}>
                <p className="text-[9px] font-black italic uppercase">Pass No: {pass.passNumber}</p>
                <p className="text-[8px] font-bold uppercase font-mono text-center">Date: {new Date(pass.date).toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            {/* Subject Information Section */}
            <div className={`grid ${isOutdoor ? 'grid-cols-1' : 'grid-cols-2'} border-b-2 border-gray-900 text-[9px] font-bold uppercase`}>
              <div className={`${isOutdoor ? 'border-b-2' : 'border-r-2'} border-gray-900 p-2 space-y-1`}>
                {isOutdoor ? (
                  <>
                    <p><span className="font-black">Employee:</span> {pass.employeeName}</p>
                    <p><span className="font-black">ID:</span> {pass.employeeId} | <span className="font-black">Desig:</span> {pass.employeeDesignation}</p>
                    <p><span className="font-black">Dept:</span> {pass.department}</p>
                  </>
                ) : (
                  <>
                    <p><span className="font-black">Department:</span> {pass.department}</p>
                    <p><span className="font-black">Carrier:</span> {pass.carrierName || "N/A"}</p>
                    <p><span className="font-black">Vehicle No:</span> {pass.vehicleNumber || "N/A"}</p>
                  </>
                )}
              </div>
              <div className="p-2 space-y-1">
                <p><span className="font-black">{isOutdoor ? "Destination:" : "Recipient / To Place:"}</span> {pass.whereToGo || pass.toPlace}</p>
                <p><span className="font-black">Purpose:</span> {pass.purpose}</p>
                {!isOutdoor && pass.type === 'Returnable' && (
                  <p className="text-orange-600 font-black"><span className="text-gray-900">Exp. Return:</span> {new Date(pass.expectedReturnDate).toLocaleDateString('en-GB')}</p>
                )}
              </div>
            </div>

            {/* Table for Items (If not outdoor) */}
            {!isOutdoor && (
              <div className="flex-grow text-[9px] text-gray-900 mt-0">
                <table className="w-full border-collapse border-b-2 border-gray-900">
                  <thead>
                    <tr className="bg-gray-100 uppercase">
                      <th className="border-r-2 border-gray-900 px-2 py-1 w-10 text-center font-black">Sr#</th>
                      <th className="border-r-2 border-gray-900 px-2 py-1 text-left font-black">Material Description</th>
                      <th className="px-2 py-1 text-center w-20 font-black">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold uppercase">
                    {items.map((item: any, index: number) => (
                      <tr key={index} className="h-5 border-t-2 border-gray-900">
                        <td className="border-r-2 border-gray-900 px-2 py-0.5 text-center">{index + 1}</td>
                        <td className="border-r-2 border-gray-900 px-2 py-0.5">{item.item}</td>
                        <td className="px-2 py-0.5 text-center font-black">{item.qty}</td>
                      </tr>
                    ))}
                    {Array.from({ length: emptyRowsNeeded }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-5 border-t-2 border-gray-900">
                        <td className="border-r-2 border-gray-900"></td>
                        <td className="border-r-2 border-gray-900"></td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Outdoor specific spacing if needed */}
            {isOutdoor && <div className="flex-grow py-6 flex items-center justify-center border-b-2 border-gray-900">
               <div className="text-center italic opacity-30 text-[10px] font-black tracking-[0.3em] uppercase">Official Personnel Movement Pass</div>
            </div>}

            {/* Status & Remarks */}
            <div className={`p-2 border-b-2 border-gray-900 bg-gray-50 flex flex-wrap justify-between items-center text-[7px] font-black uppercase gap-2`}>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>Status: <span className="underline">{pass.status}</span></span>
                  {pass.outTime && <span>Out-Time: {pass.outTime}</span>}
                  {(pass.clearanceDate || pass.securityClearByReturnDate) && (
                    <span>Security Clearance: {new Date(pass.clearanceDate || pass.securityClearByReturnDate).toLocaleTimeString('en-GB')}</span>
                  )}
                </div>
                {pass.securityRemarks && <span className="italic normal-case text-gray-500">Remarks: {pass.securityRemarks}</span>}
            </div>

            {/* Signatures */}
            <div className={`grid grid-cols-3 gap-4 mt-2 text-gray-900 items-end`}>
              <div className="text-center">
                <div className="text-[9px] font-black uppercase mb-1 h-4 flex items-end justify-center">
                    {pass.issuerName}
                </div>
                <div className="border-t border-gray-900 pt-1 text-[7px] font-black uppercase">Prepared</div>
              </div>
              
              <div className="text-center">
                <div className="text-[9px] font-black uppercase mb-1 h-4 flex items-end justify-center">
                    {pass.securityClearBy || pass.securityClearedBy || ""}
                </div>
                <div className="border-t border-gray-900 pt-1 text-[7px] font-black uppercase">Security</div>
              </div>

              <div className="text-center">
                <div className="text-[9px] font-black uppercase mb-1 h-4 flex items-end justify-center">
                    {pass.authorizedBy}
                </div>
                <div className="border-t border-gray-900 pt-1 text-[7px] font-black uppercase">Authorized</div>
              </div>
            </div>

            <div className="mt-4 flex justify-between text-[5px] font-bold uppercase tracking-[0.2em] text-gray-900">
              <span>AdminSoft Secure System</span>
              <span>Ref: {pass.id ? pass.id.substring(0,8).toUpperCase() : "AUTO-GATE"}</span>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          .print-modal-container, .print-modal-container *, #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            ${isOutdoor ? 'width: 105mm !important; min-height: 148mm !important;' : 'width: 210mm !important; min-height: 105mm !important;'}
            height: auto !important;
            margin: 0 !important;
            padding: 5mm !important;
            border: none !important;
            box-shadow: none !important;
          }
          body, .print-modal-container { background: white !important; }
        }
      `}} />
    </div>
  );
}
