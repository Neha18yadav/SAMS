import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, ShieldAlert, CheckCircle, XCircle, Plus, Send, X, User as UserIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const LeaveRequests = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('user');
    const [showForm, setShowForm] = useState(false);
    
    // Form State
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if(token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
            }
            const res = await axios.get(`${API}/api/leaves`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaves(res.data);
        } catch (err) {
            console.error("Failed to fetch leaves");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API}/api/leaves`, {
                date_from: dateFrom,
                date_to: dateTo,
                reason: reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowForm(false);
            setDateFrom('');
            setDateTo('');
            setReason('');
            fetchLeaves();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to submit leave.");
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/api/leaves/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLeaves();
        } catch (err) {
            alert("Action failed.");
        }
    };

    const StatusBadge = ({ status }) => {
        if (status === 'Approved') return <span className="bg-[#34c759]/10 text-[#34c759] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><CheckCircle size={10} /> {status}</span>;
        if (status === 'Rejected') return <span className="bg-[#ff3b30]/10 text-[#ff3b30] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><XCircle size={10} /> {status}</span>;
        return <span className="bg-[#f5f5f7] border border-[#d2d2d7]/50 text-[#86868b] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-max"><Clock size={10} /> {status}</span>;
    };

    return (
        <div className="p-8 md:p-12 space-y-8 animate-sams-fade max-w-[1400px] mx-auto bg-transparent relative z-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-[#d2d2d7]/50 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                        <Clock size={24} className="text-[#af52de]" />
                    </div>
                    <div>
                        <h1 className="text-[28px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-tight">Leave Portal</h1>
                        <p className="text-[12px] text-[#86868b] font-bold uppercase tracking-widest mt-1">Absence Management & Requests</p>
                    </div>
                </div>
                {userRole === 'user' && !showForm && (
                    <button 
                        onClick={() => setShowForm(true)}
                        className="bg-[#1d1d1f] text-white px-6 py-3 rounded-2xl text-[13px] font-bold shadow-lg shadow-black/5 hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Draft New Request
                    </button>
                )}
            </header>

            {showForm && userRole === 'user' && (
                <div className="bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.01)] animate-sams-fade">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[16px] font-bold text-[#1d1d1f]">Draft Leave Application</h2>
                        <button onClick={() => setShowForm(false)} className="p-2 bg-white rounded-full text-[#86868b] hover:text-[#1d1d1f] shadow-sm"><X size={16} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-widest mb-2">From Date</label>
                                <input type="date" required value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-white/60 border border-[#d2d2d7]/50 rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:border-[#af52de] focus:ring-2 focus:ring-[#af52de]/20 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-widest mb-2">To Date</label>
                                <input type="date" required min={dateFrom} value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full bg-white/60 border border-[#d2d2d7]/50 rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:border-[#af52de] focus:ring-2 focus:ring-[#af52de]/20 transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-widest mb-2">Reason</label>
                            <textarea required value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide a detailed reason for your absence..." rows="3" className="w-full bg-white/60 border border-[#d2d2d7]/50 rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:border-[#af52de] focus:ring-2 focus:ring-[#af52de]/20 transition-all resize-none"></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button disabled={submitting} type="submit" className="bg-[#af52de] text-white px-8 py-3 rounded-xl text-[13px] font-bold shadow-sm shadow-[#af52de]/20 hover:bg-[#9745c1] transition-all disabled:opacity-50 flex items-center gap-2">
                                {submitting ? 'Submitting...' : <><Send size={16} /> Submit Application</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden">
                {loading ? (
                    <div className="p-16 flex justify-center opacity-40 animate-pulse"><Clock size={32} className="text-[#86868b]" /></div>
                ) : leaves.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <ShieldAlert size={48} className="text-[#af52de] opacity-40 mb-4" />
                        <h2 className="text-[18px] font-bold text-[#1d1d1f] mb-1">No Active Records</h2>
                        <p className="text-[13px] text-[#86868b] max-w-sm">No leave applications or historical absence approvals have been logged.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#d2d2d7]/20">
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#86868b] uppercase tracking-widest">Date Submitted</th>
                                    {userRole === 'admin' && <th className="px-6 py-4 text-[11px] font-bold text-[#86868b] uppercase tracking-widest">Student Info</th>}
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#86868b] uppercase tracking-widest">Duration</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#86868b] uppercase tracking-widest w-1/3">Reason</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-[#86868b] uppercase tracking-widest">Status</th>
                                    {userRole === 'admin' && <th className="px-6 py-4 text-[11px] font-bold text-[#86868b] uppercase tracking-widest text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map((leave) => (
                                    <tr key={leave.id} className="border-b border-[#d2d2d7]/10 hover:bg-white/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-[#1d1d1f]">{leave.created_at}</td>
                                        {userRole === 'admin' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-[14px] font-bold text-[#1d1d1f]">{leave.student_name}</p>
                                                <p className="text-[11px] font-medium text-[#86868b] mt-0.5">{leave.roll_no}</p>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-[#1d1d1f]">{leave.date_from} <span className="text-[#86868b] mx-1">to</span> {leave.date_to}</td>
                                        <td className="px-6 py-4 text-[13px] text-[#86868b]">{leave.reason}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={leave.status} /></td>
                                        {userRole === 'admin' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {leave.status === 'Pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => updateStatus(leave.id, 'Approved')} className="p-2 bg-[#34c759]/10 text-[#248a3d] hover:bg-[#34c759]/20 rounded-xl transition-all"><CheckCircle size={16} /></button>
                                                        <button onClick={() => updateStatus(leave.id, 'Rejected')} className="p-2 bg-[#ff3b30]/10 text-[#d70015] hover:bg-[#ff3b30]/20 rounded-xl transition-all"><XCircle size={16} /></button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveRequests;
