import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText, Calendar, Clock, User, Hash, Activity, RefreshCw, BookOpen } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Reports = () => {
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await axios.get(`${API}/api/attendance`);
            setAttendance(res.data);
        } catch (err) {
            console.error("Archive sync failure.");
        }
    };

    const downloadCSV = () => {
        const headers = ['Student ID', 'Name', 'Roll No', 'Subject', 'Date', 'Time', 'Status'];
        const rows = attendance.map(a => [a.id, a.student_name, a.student_roll, a.course_code || 'General', a.date, a.time, a.status]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "SAMS_Intelligence_Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 md:p-12 space-y-10 animate-sams-fade max-w-[1600px] mx-auto min-h-screen bg-transparent">
            
            {/* ── Reports Header ─────────────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1d1d1f] dark:bg-white text-white dark:text-black rounded-xl">
                            <FileText size={24} />
                        </div>
                        <h1 className="text-[34px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-none">Archive Ledger</h1>
                    </div>
                    <p className="text-[17px] text-[#86868b] dark:text-gray-400 font-medium">Historical attendance records and biometric audit trails.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchAttendance}
                        className="p-3.5 bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-full text-[#1d1d1f] dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm"
                        title="Re-sync Archive"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-3 bg-white dark:bg-[#111111] border border-[#d2d2d7] dark:border-white/10 text-[#1d1d1f] dark:text-white px-6 py-3.5 rounded-full font-bold text-[13px] shadow-sm hover:bg-[#f5f5f7] dark:hover:bg-white/5 transition-all active:scale-95 group"
                    >
                        <Download size={18} className="text-[#0071e3] group-hover:translate-y-0.5 transition-transform" />
                        <span>EXPORT SAMS DATA</span>
                    </button>
                </div>
            </header>

            {/* ── Data Table Section ─────────────────────────────────────────── */}
            <div className="glass-card overflow-hidden border-[#d2d2d7]/30 shadow-[0_15px_40px_rgba(0,0,0,0.03)]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f5f5f7]/50 dark:bg-white/5 border-b border-[#d2d2d7]/30 dark:border-white/5">
                                <th className="px-8 py-5 text-[11px] font-black text-[#86868b] dark:text-gray-400 uppercase tracking-[0.2em]">
                                   <div className="flex items-center gap-2"><Calendar size={12} /> Date</div>
                                </th>
                                <th className="px-8 py-5 text-[11px] font-black text-[#86868b] dark:text-gray-400 uppercase tracking-[0.2em]">
                                   <div className="flex items-center gap-2"><Clock size={12} /> Time</div>
                                </th>
                                <th className="px-8 py-5 text-[11px] font-black text-[#86868b] dark:text-gray-400 uppercase tracking-[0.2em]">
                                   <div className="flex items-center gap-2"><User size={12} /> Student Entity</div>
                                </th>
                                <th className="px-8 py-5 text-[11px] font-black text-[#86868b] dark:text-gray-400 uppercase tracking-[0.2em]">
                                   <div className="flex items-center gap-2"><Hash size={12} /> UID</div>
                                </th>
                                <th className="px-8 py-5 text-[11px] font-black text-[#86868b] dark:text-gray-400 uppercase tracking-[0.2em]">
                                   <div className="flex items-center gap-2"><BookOpen size={12} /> Subject</div>
                                </th>
                                <th className="px-8 py-5 text-[11px] font-black text-[#86868b] dark:text-gray-400 uppercase tracking-[0.2em]">
                                   <div className="flex items-center gap-2"><Activity size={12} /> Status</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5f5f7] dark:divide-white/5">
                            {attendance.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-20">
                                            <FileText size={48} />
                                            <p className="text-[13px] font-black uppercase tracking-widest">No historical data available</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                attendance.map((record) => (
                                    <tr key={record.id} className="group hover:bg-[#f5f5f7]/30 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-8 py-5 text-[14px] font-medium text-[#86868b] dark:text-gray-400 font-mono tracking-tight">
                                            {record.date}
                                        </td>
                                        <td className="px-8 py-5 text-[14px] font-medium text-[#86868b] dark:text-gray-400 font-mono tracking-tight">
                                            {record.time}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded-full bg-white dark:bg-[#111111] border border-[#d2d2d7]/50 dark:border-white/10 flex items-center justify-center text-[11px] font-bold text-[#1d1d1f] dark:text-white shadow-sm">
                                                    {record.student_name.charAt(0)}
                                                </div>
                                                <span className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white">{record.student_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-[14px] font-bold text-[#1d1d1f] dark:text-white opacity-60">
                                            {record.student_roll}
                                        </td>
                                        <td className="px-8 py-5 text-[14px] font-bold text-[#0071e3] opacity-80">
                                            {record.course_code || 'General'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                                                <span className="text-[11px] font-black text-[#34c759] uppercase tracking-widest px-2.5 py-1 bg-[#34c759]/5 rounded-full border border-[#34c759]/10">
                                                    {record.status}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <footer className="flex justify-center pt-4">
                 <p className="text-[10px] text-[#86868b] dark:text-gray-400 font-bold uppercase tracking-[0.2em]">SAMS Database Integrity Protocol Active</p>
            </footer>
        </div>
    );
};

export default Reports;
