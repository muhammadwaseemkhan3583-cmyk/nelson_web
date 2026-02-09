"use client";

import { formatCurrencyToWords } from "@/lib/utils";

interface VoucherPrintModalProps {
  voucher: {
    serialNumber: string;
    date: string | Date;
    type: string;
    totalAmount: number;
    items: any[];
    id?: string;
  };
  onClose: () => void;
}

export default function VoucherPrintModal({ voucher, onClose }: VoucherPrintModalProps) {
  const handlePrint = () => {
    window.print();
  };

    const itemCount = voucher.items.length;

    // Dynamic sizing logic

    const tableFontSize = itemCount > 20 ? 'text-[8px]' : itemCount > 12 ? 'text-[9px]' : 'text-[11px]';

    const rowHeight = itemCount > 20 ? 'h-5' : itemCount > 12 ? 'h-6' : 'h-8';

  

    return (

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print-modal-container">

        {/* Overlay - Hidden on Print */}

        <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md modal-overlay print:hidden" onClick={onClose}></div>

        

        <div className="relative bg-gray-100 rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-auto flex flex-col p-12 print:p-0 print:bg-white animate-slideUp print:overflow-visible">

          

          {/* Modal Controls - Hidden on Print */}

          <div className="flex justify-between items-center mb-8 print:hidden text-gray-900 modal-controls">

            <button onClick={onClose} className="flex items-center gap-2 text-gray-500 font-black uppercase text-[10px] hover:text-gray-900 transition-all">

              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>

              </svg>

              Back to Dashboard

            </button>

            <button 

              onClick={handlePrint}

              className="bg-orange-600 text-white px-8 py-2.5 rounded-full font-black uppercase text-xs shadow-xl shadow-orange-900/20 hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-2"

            >

              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2zM12 17h.01"></path>

              </svg>

              Print Voucher

            </button>

          </div>

  

          {/* The Voucher Area */}

          <div id="print-area" className="mx-auto w-[210mm] min-h-[148.5mm] h-auto bg-white p-6 shadow-2xl print:shadow-none relative text-gray-900 border-2 border-dashed border-gray-200 print:border-none print:m-0">

            <div className="border-2 border-gray-900 p-6 flex flex-col h-full min-h-[130mm] relative box-border">

              

              {/* Header */}

              <div className="flex justify-between items-start mb-4 border-b-2 border-gray-900 pb-3">

                <div className="flex items-center gap-3 text-gray-900">

                  <div>

                    <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Admin<span className="text-orange-500">Soft</span></h1>

                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">Industrial Excellence Systems</p>

                  </div>

                </div>

                <div className="text-right ml-auto text-gray-900">

                  <p className="text-[10px] font-black italic uppercase">Voucher No: {voucher.serialNumber}</p>

                  <p className="text-[9px] font-bold uppercase mt-0.5 border-t border-gray-100 pt-0.5 font-mono text-center">Date: {new Date(voucher.date).toLocaleDateString('en-GB')}</p>

                </div>

              </div>

  

              {/* Title */}

              <div className="text-center mb-4 text-gray-900">

                <h2 className="text-xl font-black uppercase tracking-[0.2em] underline underline-offset-4 text-center">

                  {voucher.type === "Petty Cash" ? "Petty Cash Summary" : "Cash Voucher Summary"}

                </h2>

              </div>

  

              {/* Table */}

              <div className={`flex-grow ${tableFontSize} text-gray-900 mb-4`}>

                <table className="w-full border-collapse border-2 border-gray-900">

                  <thead>

                    <tr className="bg-gray-100 uppercase">

                      <th className="border-2 border-gray-900 px-2 py-1.5 w-10 text-center font-black">Sr#</th>

                      <th className="border-2 border-gray-900 px-2 py-1.5 text-left font-black">Expense Detail</th>

                      <th className="border-2 border-gray-900 px-2 py-1.5 text-right w-28 font-black">Amount</th>

                      <th className="border-2 border-gray-900 px-2 py-1.5 text-left w-36 font-black">Remarks</th>

                    </tr>

                  </thead>

                  <tbody className="font-bold">

                    {voucher.items.map((item: any) => (

                      <tr key={item.srNo} className={rowHeight}>

                        <td className="border-2 border-gray-900 px-2 py-0.5 text-center text-gray-400 font-normal">{item.srNo}</td>

                        <td className="border-2 border-gray-900 px-2 py-1 uppercase tracking-tight truncate max-w-[200px]">{item.detail}</td>

                        <td className="border-2 border-gray-900 px-2 py-0.5 text-right font-black">PKR {item.amount.toLocaleString()}.00</td>

                        <td className="border-2 border-gray-900 px-2 py-0.5 italic text-gray-500 font-normal leading-tight">{item.remarks}</td>

                      </tr>

                    ))}

                    {/* Fill empty space if few items */}

                    {itemCount < 8 && Array.from({ length: 8 - itemCount }).map((_, i) => (

                      <tr key={`empty-${i}`} className={rowHeight}>

                        <td className="border-2 border-gray-900"></td>

                        <td className="border-2 border-gray-900"></td>

                        <td className="border-2 border-gray-900"></td>

                        <td className="border-2 border-gray-900"></td>

                      </tr>

                    ))}

                  </tbody>

                  <tfoot>

                    <tr className="bg-gray-50 font-black h-10">

                      <td colSpan={2} className="border-2 border-gray-900 px-3 py-1 text-right text-[9px] uppercase tracking-wider text-gray-500">Net Aggregate Amount:</td>

                      <td className="border-2 border-gray-900 px-2 py-1 text-right text-sm text-orange-600 tabular-nums">PKR {voucher.totalAmount.toLocaleString()}.00</td>

                      <td className="border-2 border-gray-900"></td>

                    </tr>

                  </tfoot>

                </table>

              </div>

  

              {/* Amount in Words */}

              <div className="mt-auto mb-6 flex items-center gap-2 border-b border-dashed border-gray-300 pb-1 text-gray-900">

                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">Amount in Words:</span>

                <span className="text-xs font-bold italic text-gray-900 capitalize flex-grow font-serif">

                  {formatCurrencyToWords(voucher.totalAmount)}

                </span>

              </div>

  

              {/* Footer Signatures */}

              <div className="grid grid-cols-3 gap-6 mt-2 text-gray-900">

                <div className="text-center"><div className="border-t border-gray-900 pt-1 text-[8px] font-black uppercase">Prepared</div></div>

                <div className="text-center"><div className="border-t border-gray-900 pt-1 text-[8px] font-black uppercase">Checked</div></div>

                <div className="text-center"><div className="border-t border-gray-900 pt-1 text-[8px] font-black uppercase text-orange-600">Authorized</div></div>

              </div>

  

              {/* Security Note */}

              <div className="mt-4 flex justify-between text-[6px] font-bold text-gray-300 uppercase tracking-[0.2em] text-gray-900">

                <span>AdminSoft Secure Output</span>

                <span>Verification: {voucher.id ? voucher.id.substring(0,8).toUpperCase() : "AUTO-GEN-2026"}</span>

              </div>

            </div>

          </div>

        </div>

  

        <style dangerouslySetInnerHTML={{ __html: `

          @media print {

            @page { size: A4 portrait; margin: 0; }

            

            body * {

              visibility: hidden;

            }

  

            .print-modal-container, 

            .print-modal-container *,

            #print-area, 

            #print-area * {

              visibility: visible !important;

            }

  

            #print-area {

              position: absolute !important;

              top: 0 !important;

              left: 0 !important;

              width: 210mm !important;

              min-height: 148.5mm !important;

              height: auto !important;

              margin: 0 !important;

              padding: 10mm !important;

              border: none !important;

              box-shadow: none !important;

            }

  

            body, .print-modal-container {

              background: white !important;

            }

          }

        `}} />

      </div>

    );

  }

  