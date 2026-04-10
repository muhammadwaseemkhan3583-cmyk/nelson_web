"use client";

import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  setDoc,
  deleteDoc,
  doc,
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { authenticatedFetch } from "@/lib/utils";

/**
 * PERSONAL PERFORMANCE REPORTS COMPONENT
 * Manages monthly performance tracking, scrape sales, and masjid activities.
 */

export interface FridayBayanDetail {
  date: string;
  topic: string;
  remarks: string;
}

export interface IslahiBayanDetail {
  date: string;
  topic: string;
  remarks: string;
}

export interface ExtraWorkEntry {
  workDetail: string;
  assignedBy: string;
  date: string;
  remarks: string;
}

export interface ScrapeEntry {
  date: string;
  item: string;
  qty: string;
  unit: string;
  rate: string;
  amount: number;
  remarks: string;
}

export interface MasjidActivity {
  fridayBayanList: FridayBayanDetail[];
  islahiBayanList: IslahiBayanDetail[];
  islahiBayanat: number;
  tableghiJamat: number;
  ghast: number;
  taleemUlQuran: number; 
  nazraQaida: number;    
}

export default function PersonalReports() {
  const [activeTab, setActiveTab] = useState<"input" | "view">("input");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [personalDetail, setPersonalDetail] = useState({
    name: "Ubaidullah",
    designation: "Senior-Executive",
    code: "11"
  });
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [scrapeEntries, setScrapeEntries] = useState<ScrapeEntry[]>([{ date: "", item: "", qty: "", unit: "KG", rate: "", amount: 0, remarks: "" }]);
  const [masjidData, setMasjidData] = useState<MasjidActivity>({ 
    fridayBayanList: [{ date: "", topic: "", remarks: "" }], 
    islahiBayanList: [{ date: "", topic: "", remarks: "" }], 
    islahiBayanat: 0, 
    tableghiJamat: 0, 
    ghast: 0, 
    taleemUlQuran: 0, 
    nazraQaida: 0 
  });
  const [extraWorkEntries, setExtraWorkEntries] = useState<ExtraWorkEntry[]>([]);
  const [financeLedger, setFinanceLedger] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [currentSavedReport, setCurrentSavedReport] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchSavedReports(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchFinanceLedger = async () => {
    try {
        const response = await authenticatedFetch(`/api/expenses/list?timeframe=all`);
        const result = await response.json();
        if (result.success) {
            const filtered = result.expenses.filter((e: any) => {
                const d = new Date(e.date);
                return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
            });
            setFinanceLedger(filtered);
        }
    } catch (e) { console.error(e); }
  };

  const fetchSavedReports = async (uid: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, "personal_monthly_reports"), where("userId", "==", uid));
      const snap = await getDocs(q);
      const reports = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      reports.sort((a: any, b: any) => (Number(b.year) * 100 + Number(b.month)) - (Number(a.year) * 100 + Number(a.month)));
      setSavedReports(reports);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchSelectedMonthSavedData = () => {
    if (!currentUser || savedReports.length === 0) return;
    const matchingReport = savedReports.find(r => Number(r.month) === Number(selectedMonth) && Number(r.year) === Number(selectedYear));
    if (matchingReport) {
        setCurrentSavedReport(matchingReport);
        setScrapeEntries(matchingReport.scrape || [{ date: "", item: "", qty: "", unit: "KG", rate: "", amount: 0, remarks: "" }]);
        const archivedMasjid = matchingReport.masjid || {};
        setMasjidData({
            fridayBayanList: archivedMasjid.fridayBayanList || [{ date: "", topic: "", remarks: "" }],
            islahiBayanList: archivedMasjid.islahiBayanList || [{ date: "", topic: "", remarks: "" }],
            islahiBayanat: archivedMasjid.islahiBayanat || 0,
            tableghiJamat: archivedMasjid.tableghiJamat || 0,
            ghast: archivedMasjid.ghast || 0,
            taleemUlQuran: archivedMasjid.taleemUlQuran || 0,
            nazraQaida: archivedMasjid.nazraQaida || 0
        });
        setExtraWorkEntries(matchingReport.extraWork || []);
        if (matchingReport.userName) setPersonalDetail(prev => ({ ...prev, name: matchingReport.userName, designation: matchingReport.designation || prev.designation, code: matchingReport.officerCode || prev.code }));
    } else {
        setCurrentSavedReport(null);
    }
  };

  useEffect(() => {
    fetchFinanceLedger();
    fetchSelectedMonthSavedData();
  }, [selectedMonth, selectedYear, currentUser, savedReports]);

  const pettyCashTotal = useMemo(() => financeLedger.filter(e => e.type === "Petty Cash").reduce((s, e) => s + e.amount, 0), [financeLedger]);
  const cashVoucherTotal = useMemo(() => financeLedger.filter(e => e.type === "Cash Voucher").reduce((s, e) => s + e.amount, 0), [financeLedger]);
  const scrapeTotal = useMemo(() => scrapeEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0), [scrapeEntries]);
  const fridayBayanCount = useMemo(() => (masjidData.fridayBayanList || []).filter(b => b.topic || b.date).length, [masjidData.fridayBayanList]);
  const islahiBayanCount = useMemo(() => (masjidData.islahiBayanList || []).filter(b => b.topic || b.date).length, [masjidData.islahiBayanList]);
  const masjidTotalUnits = useMemo(() => {
    const { fridayBayanList, islahiBayanList, ...other } = masjidData;
    const baseCount = Object.values(other).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0);
    return baseCount + fridayBayanCount + islahiBayanCount;
  }, [masjidData, fridayBayanCount, islahiBayanCount]);

  const graphData = useMemo(() => {
    const categories: any = {};
    financeLedger.forEach(e => {
        const cat = (e.category || "GENERAL").toUpperCase().trim();
        if (cat && cat !== "NULL" && cat !== "UNDEFINED") { categories[cat] = (categories[cat] || 0) + e.amount; }
    });
    return Object.entries(categories).map(([name, amount]) => ({ name, amount: Number(amount) })).sort((a: any, b: any) => b.amount - a.amount).slice(0, 10);
  }, [financeLedger]);

  const handleUpdateScrape = (index: number, field: keyof ScrapeEntry, value: string | number) => {
    const updated = [...scrapeEntries];
    (updated[index] as any)[field] = value;
    if (field === 'qty' || field === 'rate') {
        const q = parseFloat(String(updated[index].qty)) || 0;
        const r = parseFloat(String(updated[index].rate)) || 0;
        updated[index].amount = q * r;
    }
    setScrapeEntries(updated);
  };

  const handlePasteScrape = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const rows = pasteData.split(/\r?\n/).filter(row => row.trim());
    const newEntries: ScrapeEntry[] = rows.map(row => {
        const cols = row.split('\t');
        const q = parseFloat(cols[2]) || 0;
        const r = parseFloat(cols[4]) || 0;
        return { date: cols[0] || "", item: cols[1] || "", qty: cols[2] || "0", unit: cols[3] || "KG", rate: cols[4] || "0", amount: q * r, remarks: cols[5] || "" };
    });
    setScrapeEntries(scrapeEntries.length === 1 && !scrapeEntries[0].item ? newEntries : [...scrapeEntries, ...newEntries]);
  };

  const generateProfessionalPDF = (report: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const monthName = new Date(2000, report.month - 1).toLocaleString('default', { month: 'long' });
    const blueHeader: [number, number, number] = [30, 58, 138];
    doc.setFillColor(blueHeader[0], blueHeader[1], blueHeader[2]);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255); 
    doc.setFontSize(20); doc.text("PERSONAL PERFORMANCE SUMMARY", 105, 15, { align: "center" });
    doc.setFontSize(10); 
    doc.text(`${monthName.toUpperCase()} ${report.year} | OFFICER: ${report.userName.toUpperCase()} (${report.officerCode})`, 105, 25, { align: "center" });
    doc.text(`DESIGNATION: ${(report.designation || personalDetail.designation).toUpperCase()}`, 105, 30, { align: "center" });

    const scrapeData = report.scrape || [];
    const reportScrapeTotal = Number(report.scrapeTotal) || 0;
    doc.setTextColor(0); doc.setFontSize(12); doc.text("1. SCRAPE SALES ACTIVITY", 14, 55);
    autoTable(doc, {
        startY: 58,
        head: [['Date', 'Item Detail', 'Qty', 'Unit', 'Amount (PKR)']],
        body: scrapeData.map((e: any) => [e.date || '-', e.item || 'N/A', e.qty || '0', e.unit || 'KG', (Number(e.amount) || 0).toLocaleString()]),
        foot: [['', '', '', 'TOTAL SCRAPE', `Rs. ${reportScrapeTotal.toLocaleString()}`]],
        theme: 'grid', headStyles: { fillColor: blueHeader }, footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 }
    });

    const currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12); doc.text("2. DEPARTMENTAL EXPENSE SUMMARY", 14, currentY);
    const targetFinance = (financeLedger.length > 0 && Number(selectedMonth) === Number(report.month) && Number(selectedYear) === Number(report.year)) ? financeLedger : (report.financeSnapshot || []);
    const groupedFinance = targetFinance.reduce((acc: any, curr: any) => {
        const dept = (curr.department || "Other").toUpperCase();
        const cat = (curr.category || "General").toUpperCase();
        if (!acc[dept]) acc[dept] = {};
        acc[dept][cat] = (acc[dept][cat] || 0) + curr.amount;
        return acc;
    }, {});
    const financeBody: any[] = [];
    Object.entries(groupedFinance).forEach(([dept, cats]: [string, any]) => {
        let deptTotal = 0;
        Object.entries(cats).forEach(([cat, amt]: [string, any]) => {
            financeBody.push([dept, cat, amt.toLocaleString()]);
            deptTotal += amt;
        });
        financeBody.push([{ content: `${dept} TOTAL`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: deptTotal.toLocaleString(), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
    });
    autoTable(doc, {
        startY: currentY + 5, head: [['Department', 'Category', 'Amount (PKR)']], body: financeBody, theme: 'grid', headStyles: { fillColor: blueHeader }, styles: { fontSize: 8 },
        didParseCell: (data) => {
            if (data.row.index > 0 && data.column.index === 0) {
                const prev = data.table.body[data.row.index - 1].cells[0].text[0];
                if (prev === data.cell.text[0] && !data.cell.text[0].includes("TOTAL")) { data.cell.text = [""]; }
            }
            if (data.cell.text[0].includes("TOTAL")) {
                data.cell.styles.fillColor = [255, 255, 0]; 
                data.cell.styles.textColor = [0, 0, 0];
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    const masjidY = (doc as any).lastAutoTable.finalY + 15;
    const reportMasjid = report.masjid || {};
    doc.setFontSize(12); doc.text("3. MASJID ACTIVITY PERFORMANCE", 14, masjidY);
    autoTable(doc, {
        startY: masjidY + 5,
        head: [['Activity Type', 'Count']],
        body: [['Friday Bayan Total', (reportMasjid.fridayBayanList || []).length], ['Islahi Bayanat Total', (reportMasjid.islahiBayanList || []).length], ['Tableghi Jamat', reportMasjid.tableghiJamat || 0], ['Ghast', reportMasjid.ghast || 0], ['Nazra Students', reportMasjid.taleemUlQuran || 0], ['Qaida Students', reportMasjid.nazraQaida || 0]],
        theme: 'striped', headStyles: { fillColor: [17, 24, 39] }, styles: { fontSize: 9 }
    });

    const fbDetails = reportMasjid.fridayBayanList || [];
    let lastY = (doc as any).lastAutoTable.finalY;
    if (fbDetails.length > 0) {
        const fbY = lastY + 15;
        doc.setFontSize(12); doc.text("4. FRIDAY BAYAN (DETAILED LOG)", 14, fbY);
        autoTable(doc, { startY: fbY + 5, head: [['Date', 'Topic / Mozu', 'Remarks']], body: fbDetails.map((b: any) => [b.date || '-', b.topic || '-', b.remarks || '-']), theme: 'grid', headStyles: { fillColor: [55, 65, 81] }, styles: { fontSize: 8 } });
        lastY = (doc as any).lastAutoTable.finalY;
    }

    const ibDetails = reportMasjid.islahiBayanList || [];
    if (ibDetails.length > 0) {
        const ibY = lastY + 15;
        doc.setFontSize(12); doc.text("5. ISLAHI BAYAN (DETAILED LOG)", 14, ibY);
        autoTable(doc, { startY: ibY + 5, head: [['Date', 'Topic / Mozu', 'Remarks']], body: ibDetails.map((b: any) => [b.date || '-', b.topic || '-', b.remarks || '-']), theme: 'grid', headStyles: { fillColor: [75, 85, 99] }, styles: { fontSize: 8 } });
        lastY = (doc as any).lastAutoTable.finalY;
    }

    const extraWork = report.extraWork || [];
    if (extraWork.length > 0) {
        const ewY = lastY + 15;
        doc.setFontSize(12); doc.text("6. EXTRA PROFESSIONAL / ADMIN WORK", 14, ewY);
        autoTable(doc, { startY: ewY + 5, head: [['Work Detail', 'Assigned By', 'Date', 'Remarks']], body: extraWork.map((w: any) => [w.workDetail || '-', w.assignedBy || '-', w.date || '-', w.remarks || '-']), theme: 'grid', headStyles: { fillColor: [15, 23, 42] }, styles: { fontSize: 8 } });
    }
    doc.save(`Performance_Report_${report.userName}_${monthName}.pdf`);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this archived report?")) return;
    try {
        await deleteDoc(doc(db, "personal_monthly_reports", reportId));
        alert("Report deleted successfully.");
        if (currentUser) fetchSavedReports(currentUser.uid);
    } catch (e) { console.error(e); }
  };

  const handleUpdateMasjidBayan = (index: number, field: keyof FridayBayanDetail, value: string) => {
    const updated = [...masjidData.fridayBayanList];
    updated[index][field] = value;
    setMasjidData({ ...masjidData, fridayBayanList: updated });
  };

  const handleUpdateIslahiBayan = (index: number, field: keyof IslahiBayanDetail, value: string) => {
    const updated = [...masjidData.islahiBayanList];
    updated[index][field] = value;
    setMasjidData({ ...masjidData, islahiBayanList: updated });
  };

  const handleUpdateExtraWork = (index: number, field: keyof ExtraWorkEntry, value: string) => {
    const updated = [...extraWorkEntries];
    (updated[index] as any)[field] = value;
    setExtraWorkEntries(updated);
  };

  const handleSaveReport = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const reportId = `${currentUser.uid}_${selectedYear}_${selectedMonth}`;
      const reportData = {
        userId: currentUser.uid, userName: personalDetail.name, officerCode: personalDetail.code, designation: personalDetail.designation,
        month: selectedMonth, year: selectedYear, createdAt: serverTimestamp(),
        scrape: scrapeEntries.filter(e => e.item), 
        masjid: { ...masjidData, fridayBayanList: masjidData.fridayBayanList.filter(b => b.topic || b.date), islahiBayanList: masjidData.islahiBayanList.filter(b => b.topic || b.date), islahiBayanat: islahiBayanCount },
        extraWork: extraWorkEntries.filter(w => w.workDetail),
        pettyTotal: pettyCashTotal, cashVoucherTotal: cashVoucherTotal, scrapeTotal: scrapeTotal, financeSnapshot: financeLedger.slice(0, 100)
      };
      await setDoc(doc(db, "personal_monthly_reports", reportId), reportData);
      alert("Performance record stored successfully.");
      await fetchSavedReports(currentUser.uid);
    } catch (e) { alert("Error saving"); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-black text-gray-900 overflow-hidden font-mono text-[11px] min-h-[800px]">
      <div className="flex border-b border-black">
          <button onClick={() => setActiveTab("input")} className={`px-10 py-4 font-black uppercase tracking-[0.2em] transition-all border-r border-black ${activeTab === "input" ? 'bg-black text-white' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>Data Entry</button>
          <button onClick={() => setActiveTab("view")} className={`px-10 py-4 font-black uppercase tracking-[0.2em] transition-all border-r border-black ${activeTab === "view" ? 'bg-black text-white' : 'bg-white text-gray-400 hover:bg-gray-100'}`}>Performance View</button>
      </div>

      <div className="p-4 overflow-auto h-full space-y-6">
        <div className="bg-gray-900 p-4 flex gap-6 items-end text-white border border-black">
            <div className="flex flex-col gap-1"><span className="text-[7px] font-black text-orange-500 uppercase tracking-widest">Target Month</span>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-black text-white px-4 py-1.5 border border-white/20 text-[10px] font-black uppercase outline-none">
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1"><span className="text-[7px] font-black text-orange-500 uppercase tracking-widest">Target Year</span>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-black text-white px-4 py-1.5 border border-white/20 text-[10px] font-black uppercase outline-none">
                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
        </div>

        {activeTab === "input" ? (
            <div className="space-y-4">
                <div className="bg-gray-50 p-3 border border-black grid grid-cols-3 gap-4 items-center">
                    <div className="flex flex-col gap-1"><span className="text-[7px] font-black text-gray-400 uppercase">Officer Name</span><input type="text" value={personalDetail.name} onChange={(e) => setPersonalDetail({...personalDetail, name: e.target.value})} className="bg-transparent border-none p-0 text-[11px] font-black uppercase outline-none" /></div>
                    <div className="flex flex-col gap-1"><span className="text-[7px] font-black text-gray-400 uppercase">Designation</span><input type="text" value={personalDetail.designation} onChange={(e) => setPersonalDetail({...personalDetail, designation: e.target.value})} className="bg-transparent border-none p-0 text-[11px] font-black uppercase outline-none" /></div>
                    <div className="flex flex-col gap-1"><span className="text-[7px] font-black text-gray-400 uppercase">Employee Code</span><input type="text" value={personalDetail.code} onChange={(e) => setPersonalDetail({...personalDetail, code: e.target.value})} className="bg-transparent border-none p-0 text-[11px] font-black uppercase outline-none" /></div>
                </div>

                <div className="border border-black">
                    <div className="bg-gray-100 px-6 py-2 border-b border-black flex justify-between items-center">
                        <h3 className="font-black uppercase tracking-widest text-[9px]">1. Scrape Sales Activity</h3>
                        <div className="flex gap-2">
                            <button onPaste={handlePasteScrape} className="text-[8px] font-black uppercase px-3 py-1 border border-black text-black hover:bg-black hover:text-white transition-all">Excel Paste</button>
                            <button onClick={() => setScrapeEntries([...scrapeEntries, { date: "", item: "", qty: "", unit: "KG", rate: "", amount: 0, remarks: "" }])} className="text-[8px] font-black uppercase px-3 py-1 bg-black text-white hover:bg-orange-600 transition-all">+ Add Row</button>
                        </div>
                    </div>
                    <div className="p-2 overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-black text-left">
                                    <th className="p-2 uppercase font-black text-gray-400 text-[9px]">Date</th>
                                    <th className="p-2 uppercase font-black text-gray-400 text-[9px]">Item detail</th>
                                    <th className="p-2 uppercase font-black text-gray-400 text-[9px] w-16 text-center">Qty</th>
                                    <th className="p-2 uppercase font-black text-gray-400 text-[9px] w-16 text-center">Unit</th>
                                    <th className="p-2 uppercase font-black text-gray-400 text-[9px] w-24 text-right">Price</th>
                                    <th className="p-2 uppercase font-black text-gray-400 text-[9px] text-right w-32">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scrapeEntries.map((row, i) => (
                                    <tr key={i} className="border-b border-gray-100 group">
                                        <td className="p-1"><input type="text" value={row.date} onChange={(e) => handleUpdateScrape(i, 'date', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" placeholder="DD/MM/YYYY" /></td>
                                        <td className="p-1"><input type="text" value={row.item} onChange={(e) => handleUpdateScrape(i, 'item', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                        <td className="p-1"><input type="text" value={row.qty} onChange={(e) => handleUpdateScrape(i, 'qty', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none text-center font-bold" /></td>
                                        <td className="p-1"><input type="text" value={row.unit} onChange={(e) => handleUpdateScrape(i, 'unit', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold uppercase text-center" /></td>
                                        <td className="p-1"><input type="text" value={row.rate} onChange={(e) => handleUpdateScrape(i, 'rate', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none text-right font-bold" /></td>
                                        <td className="p-2 text-right font-black">Rs. {row.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot><tr className="bg-gray-50 border-t border-black"><td colSpan={5} className="p-3 uppercase font-black text-[10px]">Accumulated Scrape Revenue</td><td className="p-3 text-right font-black text-orange-600 text-sm underline">Rs. {scrapeTotal.toLocaleString()}</td></tr></tfoot>
                        </table>
                    </div>
                </div>

                <div className="border border-black">
                    <div className="bg-gray-900 px-6 py-2 border-b border-black text-white">
                        <h3 className="font-black uppercase tracking-widest text-[9px]">2. Masjid Monthly Activity</h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 border-b border-black bg-gray-50">
                        {[
                            { label: "Islahi Bayanat", k: "islahiBayanat" },
                            { label: "Tableghi Jamat", k: "tableghiJamat" }, { label: "Ghast", k: "ghast" },
                            { label: "Nazra Students", k: "taleemUlQuran" }, { label: "Qaida Students", k: "nazraQaida" }
                        ].map(act => (
                            <div key={act.k} className="flex flex-col gap-1 border border-black p-2 bg-white">
                                <span className="text-[7px] font-black text-gray-400 uppercase text-center mb-1">{act.label}</span>
                                <div className="flex border border-black bg-white">
                                    <button onClick={() => setMasjidData({...masjidData, [act.k]: Math.max(0, (masjidData as any)[act.k] - 1)})} className="w-6 h-6 border-r border-black font-black text-[10px]">-</button>
                                    <input type="number" value={(masjidData as any)[act.k]} onChange={(e) => setMasjidData({...masjidData, [act.k]: Number(e.target.value)})} className="w-full text-center text-[10px] font-black outline-none bg-transparent" />
                                    <button onClick={() => setMasjidData({...masjidData, [act.k]: (masjidData as any)[act.k] + 1})} className="w-6 h-6 border-l border-black bg-black text-white font-black text-[10px]">+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center border-b border-black pb-2">
                            <h4 className="text-[9px] font-black uppercase text-gray-500">Friday Bayan Details (Total: {fridayBayanCount})</h4>
                            <button onClick={() => setMasjidData({...masjidData, fridayBayanList: [...masjidData.fridayBayanList, { date: "", topic: "", remarks: "" }]})} className="text-[7px] font-black uppercase px-2 py-1 bg-black text-white">+ Add Bayan</button>
                        </div>
                        <table className="w-full text-[9px]">
                            <thead>
                                <tr className="border-b border-black text-left text-gray-400 uppercase">
                                    <th className="p-2 w-32">Date</th>
                                    <th className="p-2">Mozu / Unwan</th>
                                    <th className="p-2">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {masjidData.fridayBayanList.map((row, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="p-1"><input type="text" value={row.date} onChange={(e) => handleUpdateMasjidBayan(i, 'date', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                        <td className="p-1"><input type="text" value={row.topic} onChange={(e) => handleUpdateMasjidBayan(i, 'topic', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                        <td className="p-1"><input type="text" value={row.remarks} onChange={(e) => handleUpdateMasjidBayan(i, 'remarks', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-between items-center border-b border-black pb-2 mt-6">
                            <h4 className="text-[9px] font-black uppercase text-gray-500">Islahi Bayan Details (Total: {islahiBayanCount})</h4>
                            <button onClick={() => setMasjidData({...masjidData, islahiBayanList: [...masjidData.islahiBayanList, { date: "", topic: "", remarks: "" }]})} className="text-[7px] font-black uppercase px-2 py-1 bg-black text-white">+ Add Islahi Bayan</button>
                        </div>
                        <table className="w-full text-[9px]">
                            <thead>
                                <tr className="border-b border-black text-left text-gray-400 uppercase">
                                    <th className="p-2 w-32">Date</th>
                                    <th className="p-2">Mozu / Unwan</th>
                                    <th className="p-2">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {masjidData.islahiBayanList.map((row, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="p-1"><input type="text" value={row.date} onChange={(e) => handleUpdateIslahiBayan(i, 'date', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                        <td className="p-1"><input type="text" value={row.topic} onChange={(e) => handleUpdateIslahiBayan(i, 'topic', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                        <td className="p-1"><input type="text" value={row.remarks} onChange={(e) => handleUpdateIslahiBayan(i, 'remarks', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="border border-black">
                    <div className="bg-gray-100 px-6 py-2 border-b border-black flex justify-between items-center">
                        <h3 className="font-black uppercase tracking-widest text-[9px]">3. Extra Professional / Admin Work</h3>
                        <button onClick={() => setExtraWorkEntries([...extraWorkEntries, { workDetail: "", assignedBy: "", date: "", remarks: "" }])} className="text-[8px] font-black uppercase px-3 py-1 bg-black text-white">+ Add Row</button>
                    </div>
                    <div className="p-2">
                        <table className="w-full border-collapse text-[9px]">
                            <thead>
                                <tr className="border-b border-black text-left text-gray-400 uppercase">
                                    <th className="p-2">Work Detail</th>
                                    <th className="p-2 w-32">Assigned By</th>
                                    <th className="p-2 w-32">Date</th>
                                    <th className="p-2">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extraWorkEntries.map((row, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="p-1"><input type="text" value={row.workDetail} onChange={(e) => handleUpdateExtraWork(i, 'workDetail', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                        <td className="p-1"><input type="text" value={row.assignedBy} onChange={(e) => handleUpdateExtraWork(i, 'assignedBy', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                        <td className="p-1"><input type="text" value={row.date} onChange={(e) => handleUpdateExtraWork(i, 'date', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                        <td className="p-1"><input type="text" value={row.remarks} onChange={(e) => handleUpdateExtraWork(i, 'remarks', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <button onClick={handleSaveReport} disabled={saving} className="w-full bg-black text-white py-4 font-black uppercase tracking-[0.3em] hover:bg-orange-600 disabled:bg-gray-300 border-2 border-black text-xs shadow-xl">Save Monthly Archive</button>
            </div>
        ) : (
            <div className="space-y-6">
                <div className="bg-white p-4 border border-black flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Performance Insight</span>
                        <span className="text-[11px] font-black uppercase">
                            {personalDetail.name} — {new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSaveReport} className="bg-black text-white px-6 py-1.5 text-[9px] font-black uppercase tracking-widest border border-black">Archive Sync</button>
                        <button onClick={() => generateProfessionalPDF(currentSavedReport || { 
                            month: selectedMonth, year: selectedYear, masjid: masjidData, 
                            scrape: scrapeEntries.filter(e => e.item), scrapeTotal: scrapeTotal, 
                            pettyTotal: pettyCashTotal, userName: personalDetail.name, officerCode: personalDetail.code, designation: personalDetail.designation 
                        })} className="bg-orange-600 text-white px-6 py-1.5 text-[9px] font-black uppercase tracking-widest border border-black">PDF Summary</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[350px]">
                    <div className="border border-black p-4 flex flex-col bg-white">
                        <h3 className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4">Expenditure Breakdown</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fontWeight: 900 }} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: '#f5f5f5'}} contentStyle={{ fontSize: '9px', fontWeight: 'bold', border: '1px solid black', borderRadius: '0px' }} />
                                <Bar dataKey="amount" fill="#000" barSize={25}>{graphData.map((entry, index) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#000' : '#F97316'} />)}</Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Scrape Revenue", val: `Rs. ${scrapeTotal.toLocaleString()}`, color: "text-orange-600" },
                            { label: "Petty Cash Total", val: `Rs. ${pettyCashTotal.toLocaleString()}`, color: "text-blue-700" },
                            { label: "Cash Voucher Total", val: `Rs. ${cashVoucherTotal.toLocaleString()}`, color: "text-green-700" },
                            { label: "Masjid Units", val: `${masjidTotalUnits} Units`, color: "text-black" }
                        ].map(stat => (
                            <div key={stat.label} className="border border-black p-4 flex flex-col justify-center bg-gray-50 hover:bg-white transition-all shadow-sm"><span className="text-[7px] font-black uppercase text-gray-400 mb-1">{stat.label}</span><span className={`text-base font-black ${stat.color}`}>{stat.val}</span></div>
                        ))}
                    </div>
                </div>

                {/* DETAILED DATA PREVIEW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-black bg-white overflow-hidden shadow-sm">
                        <div className="bg-gray-100 px-4 py-2 border-b border-black flex justify-between items-center">
                            <h3 className="text-[9px] font-black uppercase">Scrape Sales Preview</h3>
                            <span className="text-[8px] font-black text-gray-400">{(currentSavedReport?.scrape || []).length} Items</span>
                        </div>
                        <div className="max-h-[200px] overflow-auto">
                            <table className="w-full text-[9px]">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr className="border-b border-black text-left">
                                        <th className="p-2 font-black uppercase">Item</th>
                                        <th className="p-2 font-black uppercase text-right">Qty</th>
                                        <th className="p-2 font-black uppercase text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(currentSavedReport?.scrape || []).map((e: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="p-2 font-bold uppercase">{e.item}</td>
                                            <td className="p-2 text-right">{e.qty} {e.unit}</td>
                                            <td className="p-2 text-right font-black">Rs. {(Number(e.amount) || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {(!currentSavedReport || !currentSavedReport.scrape || currentSavedReport.scrape.length === 0) && <tr><td colSpan={3} className="p-4 text-center italic text-gray-400 uppercase">No archive data</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="border border-black bg-white overflow-hidden shadow-sm">
                        <div className="bg-gray-100 px-4 py-2 border-b border-black flex justify-between items-center">
                            <h3 className="text-[9px] font-black uppercase">Masjid Activity Preview</h3>
                            <span className="text-[8px] font-black text-gray-400">{masjidTotalUnits} Units Total</span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                            {[
                                { l: "Friday Bayan", v: fridayBayanCount },
                                { l: "Islahi Bayanat", v: islahiBayanCount },
                                { l: "Tableghi Jamat", v: masjidData.tableghiJamat },
                                { l: "Ghast", v: masjidData.ghast },
                                { l: "Taleem Quran", v: masjidData.taleemUlQuran },
                                { l: "Nazra Qaida", v: masjidData.nazraQaida },
                            ].map(act => (
                                <div key={act.l} className="flex justify-between items-center border-b border-gray-100 pb-1">
                                    <span className="text-[8px] font-black uppercase text-gray-500">{act.l}</span>
                                    <span className="text-[10px] font-black">{act.v || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border border-black overflow-hidden shadow-sm">
                    <div className="bg-gray-900 px-6 py-2 border-b border-black text-white flex justify-between items-center"><h3 className="text-[9px] font-black uppercase tracking-widest text-orange-500">History: Monthly Record Archive</h3></div>
                    <div className="divide-y divide-black max-h-[300px] overflow-auto">
                        {savedReports.map((r) => (
                            <div key={r.id} onClick={() => { setSelectedMonth(Number(r.month)); setSelectedYear(Number(r.year)); }} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer group">
                                <div className="flex gap-6 items-center">
                                    <span className="text-[10px] font-black uppercase text-gray-900 w-24">{new Date(2000, r.month - 1).toLocaleString('default', { month: 'long' })} {r.year}</span>
                                    <span className="text-[8px] font-bold text-gray-400 uppercase">Rev: Rs. {r.scrapeTotal?.toLocaleString()} | Petty: Rs. {r.pettyTotal?.toLocaleString()}</span>
                                </div>
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => generateProfessionalPDF(r)} className="text-[7px] font-black uppercase px-2 py-1 border border-black hover:bg-black hover:text-white transition-all">PDF</button>
                                    <button onClick={() => handleDeleteReport(r.id)} className="text-[7px] font-black uppercase px-2 py-1 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
