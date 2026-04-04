"use client";

import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  setDoc,
  doc,
  query, 
  where, 
  getDocs, 
  limit,
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { authenticatedFetch } from "@/lib/utils";

interface ScrapeEntry {
  date: string;
  item: string;
  qty: string;
  unit: string;
  rate: string;
  amount: number;
  remarks: string;
}

interface MasjidActivity {
  fridayBayan: number;
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
  
  // EDITABLE PERSONAL DETAILS
  const [personalDetail, setPersonalDetail] = useState({
    name: "Ubaidullah",
    designation: "Executive",
    code: "1208"
  });
  
  // SELECTION STATE (SHARED)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // DATA STATE
  const [scrapeEntries, setScrapeEntries] = useState<ScrapeEntry[]>([{ date: "", item: "", qty: "", unit: "KG", rate: "", amount: 0, remarks: "" }]);
  const [masjidData, setMasjidData] = useState<MasjidActivity>({ fridayBayan: 0, islahiBayanat: 0, tableghiJamat: 0, ghast: 0, taleemUlQuran: 0, nazraQaida: 0 });
  const [financeLedger, setFinanceLedger] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);

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
      reports.sort((a: any, b: any) => (b.year * 100 + b.month) - (a.year * 100 + a.month));
      setSavedReports(reports);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchSelectedMonthSavedData = async () => {
    if (!currentUser) return;
    try {
        const q = query(
            collection(db, "personal_monthly_reports"), 
            where("userId", "==", currentUser.uid),
            where("month", "==", selectedMonth),
            where("year", "==", selectedYear),
            limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            const data = snap.docs[0].data();
            setScrapeEntries(data.scrape || [{ date: "", item: "", qty: "", unit: "KG", rate: "", amount: 0, remarks: "" }]);
            setMasjidData(data.masjid || { fridayBayan: 0, islahiBayanat: 0, tableghiJamat: 0, ghast: 0, taleemUlQuran: 0, nazraQaida: 0 });
            if (data.userName) setPersonalDetail(prev => ({ ...prev, name: data.userName, designation: data.designation || prev.designation, code: data.officerCode || prev.code }));
        } else {
            setScrapeEntries([{ date: "", item: "", qty: "", unit: "KG", rate: "", amount: 0, remarks: "" }]);
            setMasjidData({ fridayBayan: 0, islahiBayanat: 0, tableghiJamat: 0, ghast: 0, taleemUlQuran: 0, nazraQaida: 0 });
        }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchFinanceLedger();
    fetchSelectedMonthSavedData();
  }, [selectedMonth, selectedYear, currentUser]);

  // CALCULATIONS
  const pettyCashTotal = useMemo(() => financeLedger.filter(e => e.type === "Petty Cash").reduce((s, e) => s + e.amount, 0), [financeLedger]);
  const cashVoucherTotal = useMemo(() => financeLedger.filter(e => e.type === "Cash Voucher").reduce((s, e) => s + e.amount, 0), [financeLedger]);
  const financeTotal = useMemo(() => financeLedger.reduce((s, e) => s + e.amount, 0), [financeLedger]);
  const scrapeTotal = useMemo(() => scrapeEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0), [scrapeEntries]);
  const masjidTotalUnits = useMemo(() => Object.values(masjidData).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0), [masjidData]);

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
        const q = parseFloat(updated[index].qty) || 0;
        const r = parseFloat(updated[index].rate) || 0;
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
        return { 
            date: cols[0] || "", 
            item: cols[1] || "", 
            qty: cols[2] || "0", 
            unit: cols[3] || "KG", 
            rate: cols[4] || "0", 
            amount: q * r, 
            remarks: cols[5] || "" 
        };
    });
    setScrapeEntries(scrapeEntries.length === 1 && !scrapeEntries[0].item ? newEntries : [...scrapeEntries, ...newEntries]);
  };

  const generateProfessionalPDF = (report: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const monthName = new Date(2000, report.month - 1).toLocaleString('default', { month: 'long' });
    const blueHeader: [number, number, number] = [30, 58, 138];

    // TOP HEADER
    doc.setFillColor(blueHeader[0], blueHeader[1], blueHeader[2]);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255); 
    doc.setFontSize(20); doc.text("PERSONAL PERFORMANCE SUMMARY", 105, 15, { align: "center" });
    doc.setFontSize(10); 
    doc.text(`${monthName.toUpperCase()} ${report.year} | OFFICER: ${report.userName.toUpperCase()} (${report.officerCode})`, 105, 25, { align: "center" });
    doc.text(`DESIGNATION: ${(report.designation || personalDetail.designation).toUpperCase()}`, 105, 30, { align: "center" });

    // SECTION 1: SCRAPE
    doc.setTextColor(0); doc.setFontSize(12); doc.text("1. SCRAPE SALES ACTIVITY", 14, 55);
    autoTable(doc, {
        startY: 58,
        head: [['Date', 'Item Detail', 'Qty', 'Unit', 'Amount (PKR)']],
        body: report.scrape.map((e: any) => [e.date || '-', e.item, e.qty, e.unit, e.amount.toLocaleString()]),
        foot: [['', '', '', 'TOTAL SCRAPE', `Rs. ${report.scrapeTotal?.toLocaleString() || 0}`]],
        theme: 'grid', headStyles: { fillColor: blueHeader }, footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 }
    });

    // SECTION 2: DEPARTMENTAL FINANCE
    const currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12); doc.text("2. DEPARTMENTAL EXPENSE SUMMARY (CONSOLIDATED)", 14, currentY);
    
    const targetFinance = (financeLedger.length > 0 && selectedMonth === report.month) ? financeLedger : (report.financeSnapshot || []);
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
        }
    });

    // SECTION 3: MASJID
    const masjidY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12); doc.text("3. MASJID ACTIVITY PERFORMANCE", 14, masjidY);
    autoTable(doc, {
        startY: masjidY + 5,
        head: [['Activity Type', 'Count']],
        body: [['Friday Bayan', report.masjid?.fridayBayan || 0], ['Islahi Bayanat', report.masjid?.islahiBayanat || 0], ['Tableghi Jamat', report.masjid?.tableghiJamat || 0], ['Ghast', report.masjid?.ghast || 0], ['Taleem ul Quran', report.masjid?.taleemUlQuran || 0], ['Nazra Qaida', report.masjid?.nazraQaida || 0]],
        theme: 'striped', headStyles: { fillColor: [17, 24, 39] }, styles: { fontSize: 9 }
    });

    doc.save(`Performance_Report_${report.userName}_${monthName}.pdf`);
  };

  const handleSaveReport = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const reportId = `${currentUser.uid}_${selectedYear}_${selectedMonth}`;
      const reportData = {
        userId: currentUser.uid, userName: personalDetail.name, officerCode: personalDetail.code, designation: personalDetail.designation,
        month: selectedMonth, year: selectedYear, createdAt: serverTimestamp(),
        scrape: scrapeEntries.filter(e => e.item), masjid: masjidData,
        pettyTotal: pettyCashTotal, cashVoucherTotal: cashVoucherTotal,
        scrapeTotal: scrapeTotal, financeSnapshot: financeLedger.slice(0, 100)
      };
      await setDoc(doc(db, "personal_monthly_reports", reportId), reportData);
      alert("Performance record stored/updated successfully.");
      await fetchSavedReports(currentUser.uid);
      await fetchSelectedMonthSavedData();
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
            <div className="flex flex-col gap-1"><span className="text-[7px] font-black text-gray-500 uppercase tracking-widest text-orange-500">Archive Target Month</span>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-black text-white px-4 py-1.5 border border-white/20 text-[10px] font-black uppercase outline-none cursor-pointer">
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1"><span className="text-[7px] font-black text-gray-500 uppercase tracking-widest text-orange-500">Archive Target Year</span>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-black text-white px-4 py-1.5 border border-white/20 text-[10px] font-black uppercase outline-none cursor-pointer">
                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <div className="ml-auto text-right font-black uppercase text-orange-500 tracking-widest">
                {activeTab === 'input' ? 'Editing records' : 'Data Insight'}
            </div>
        </div>

        {activeTab === "input" ? (
            <div className="space-y-4 animate-fadeIn">
                <div className="bg-gray-50 p-3 border border-black grid grid-cols-3 gap-4 items-center shadow-sm">
                    <div className="flex flex-col gap-1"><span className="text-[7px] font-black text-gray-400 uppercase">Officer Name</span><input type="text" value={personalDetail.name} onChange={(e) => setPersonalDetail({...personalDetail, name: e.target.value})} className="bg-transparent border-none p-0 text-[11px] font-black uppercase focus:ring-0 outline-none" /></div>
                    <div className="flex flex-col gap-1"><span className="text-[7px] font-black text-gray-400 uppercase">Designation</span><input type="text" value={personalDetail.designation} onChange={(e) => setPersonalDetail({...personalDetail, designation: e.target.value})} className="bg-transparent border-none p-0 text-[11px] font-black uppercase focus:ring-0 outline-none" /></div>
                    <div className="flex flex-col gap-1"><span className="text-[7px] font-black text-gray-400 uppercase">Employee Code</span><input type="text" value={personalDetail.code} onChange={(e) => setPersonalDetail({...personalDetail, code: e.target.value})} className="bg-transparent border-none p-0 text-[11px] font-black uppercase focus:ring-0 outline-none" /></div>
                </div>

                <div className="border border-black">
                    <div className="bg-gray-100 px-6 py-2 border-b border-black flex justify-between items-center text-white">
                        <h3 className="font-black uppercase tracking-widest text-[9px] text-black">1. Scrape Sales Activity Entry</h3>
                        <div className="flex gap-2">
                            <button onPaste={handlePasteScrape} className="text-[8px] font-black uppercase px-3 py-1 border border-black text-black hover:bg-black hover:text-white transition-all">Excel Paste</button>
                            <button onClick={() => setScrapeEntries([...scrapeEntries, { date: "", item: "", qty: "", unit: "KG", rate: "", amount: 0, remarks: "" }])} className="text-[8px] font-black uppercase px-3 py-1 bg-black text-white hover:bg-orange-600 transition-all">+ Add Row</button>
                        </div>
                    </div>
                    <div className="p-2 overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-black text-left">
                                    <th className="p-2 uppercase font-black text-gray-400 text-[9px]">Date (Plain)</th>
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
                                        <td className="p-1"><input type="text" value={row.date} onChange={(e) => handleUpdateScrape(i, 'date', e.target.value)} onPaste={handlePasteScrape} className="w-full border border-gray-200 p-1.5 outline-none focus:border-black font-bold group-hover:border-black" placeholder="DD/MM/YYYY" /></td>
                                        <td className="p-1"><input type="text" value={row.item} onChange={(e) => handleUpdateScrape(i, 'item', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none focus:border-black font-bold group-hover:border-black" placeholder="..." /></td>
                                        <td className="p-1"><input type="text" value={row.qty} onChange={(e) => handleUpdateScrape(i, 'qty', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none text-center font-bold group-hover:border-black" /></td>
                                        <td className="p-1"><input type="text" value={row.unit} onChange={(e) => handleUpdateScrape(i, 'unit', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none font-bold group-hover:border-black uppercase text-center" placeholder="KG" /></td>
                                        <td className="p-1"><input type="text" value={row.rate} onChange={(e) => handleUpdateScrape(i, 'rate', e.target.value)} className="w-full border border-gray-200 p-1.5 outline-none text-right font-bold group-hover:border-black" /></td>
                                        <td className="p-2 text-right font-black">Rs. {row.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot><tr className="bg-gray-50 border-t border-black"><td colSpan={5} className="p-3 uppercase font-black text-[10px]">Accumulated Scrape Revenue</td><td className="p-3 text-right font-black text-orange-600 text-sm tracking-widest underline">Rs. {scrapeTotal.toLocaleString()}</td></tr></tfoot>
                        </table>
                    </div>
                </div>

                <div className="border border-black">
                    <div className="bg-gray-900 px-6 py-2 border-b border-black text-white"><h3 className="font-black uppercase tracking-widest text-[9px]">2. Masjid Monthly Activity Performance</h3></div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-6 gap-3">
                        {[
                            { label: "Friday Bayan", k: "fridayBayan" }, { label: "Islahi Bayanat", k: "islahiBayanat" },
                            { label: "Tableghi Jamat", k: "tableghiJamat" }, { label: "Ghast", k: "ghast" },
                            { label: "Taleem Quran", k: "taleemUlQuran" }, { label: "Nazra Qaida", k: "nazraQaida" }
                        ].map(act => (
                            <div key={act.k} className="flex flex-col gap-1 border border-gray-200 p-2 bg-gray-50">
                                <span className="text-[7px] font-black text-gray-400 uppercase text-center mb-1">{act.label}</span>
                                <div className="flex border border-black bg-white">
                                    <button onClick={() => setMasjidData({...masjidData, [act.k]: Math.max(0, (masjidData as any)[act.k] - 1)})} className="w-6 h-6 border-r border-black font-black text-[10px] hover:bg-gray-100">-</button>
                                    <input type="number" value={(masjidData as any)[act.k]} onChange={(e) => setMasjidData({...masjidData, [act.k]: Number(e.target.value)})} className="w-full text-center text-[10px] font-black outline-none bg-transparent" />
                                    <button onClick={() => setMasjidData({...masjidData, [act.k]: (masjidData as any)[act.k] + 1})} className="w-6 h-6 border-l border-black bg-black text-white font-black text-[10px] hover:bg-gray-800 transition-all">+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleSaveReport} disabled={saving} className="w-full bg-black text-white py-4 font-black uppercase tracking-[0.3em] hover:bg-orange-600 transition-all active:scale-95 disabled:bg-gray-300 border-2 border-black text-xs shadow-xl">Confirm & Save Monthly Archive Record</button>
            </div>
        ) : (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-white p-4 border border-black flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Performance Insight</span><span className="text-[11px] font-black uppercase">{personalDetail.name} — {new Date(2000, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}</span></div>
                    <div className="flex gap-2">
                        <button onClick={handleSaveReport} className="bg-black text-white px-6 py-1.5 text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all border border-black">Archive Sync</button>
                        <button onClick={() => generateProfessionalPDF({ month: selectedMonth, year: selectedYear, masjid: masjidData, scrape: scrapeEntries.filter(e => e.item), scrapeTotal: scrapeTotal, pettyTotal: pettyCashTotal })} className="bg-orange-600 text-white px-6 py-1.5 text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all border border-black">Download PDF Summary</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[350px]">
                    <div className="border border-black p-4 flex flex-col bg-white">
                        <h3 className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-4">Expenditure Breakdown (Ledger Sync)</h3>
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

                <div className="border border-black overflow-hidden shadow-sm">
                    <div className="bg-gray-900 px-6 py-2 border-b border-black text-white flex justify-between items-center"><h3 className="text-[9px] font-black uppercase tracking-widest text-orange-500">History: Monthly Record Archive</h3><span className="text-[7px] font-bold text-gray-500 uppercase">{savedReports.length} records found</span></div>
                    <div className="divide-y divide-black max-h-[300px] overflow-auto custom-scrollbar">
                        {savedReports.map((r) => (
                            <div key={r.id} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors"><div className="flex gap-6 items-center"><span className="text-[10px] font-black uppercase text-gray-900 w-24">{new Date(2000, r.month - 1).toLocaleString('default', { month: 'long' })} {r.year}</span><span className="text-[8px] font-bold text-gray-400 uppercase">Rev: Rs. {r.scrapeTotal?.toLocaleString()} | Petty: Rs. {r.pettyTotal?.toLocaleString()}</span></div><button onClick={() => generateProfessionalPDF(r)} className="text-[8px] font-black uppercase px-4 py-1 border border-black hover:bg-black hover:text-white transition-all">Download Archive</button></div>
                        ))}
                        {savedReports.length === 0 && <div className="p-10 text-center text-[9px] font-black text-gray-300 uppercase italic opacity-30 tracking-[0.3em]">Archive collection empty</div>}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
