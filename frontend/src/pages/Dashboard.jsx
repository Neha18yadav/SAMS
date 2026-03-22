import { useState, useEffect } from 'react';
import VideoFeed from '../components/VideoFeed';
import AIChat from '../components/AIChat';
import { Users, CheckCircle, Activity, ShieldAlert, ArrowUpRight, TrendingUp, X, Sparkles, Clock, LayoutDashboard, RefreshCw, BookOpen, GraduationCap, Laptop, Cpu, Globe } from 'lucide-react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const StatCard = ({ title, value, subtext, icon: Icon, accent = 'blue' }) => {
  const accentColors = {
    blue: 'text-[#0071e3] bg-[#0071e3]/5',
    green: 'text-[#34c759] bg-[#34c759]/5',
    purple: 'text-[#af52de] bg-[#af52de]/5',
    red: 'text-[#ff3b30] bg-[#ff3b30]/5',
  };
  return (
    <div className="glass-card p-8 flex flex-col gap-6 group hover:bg-white transition-all duration-500">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accentColors[accent]} transition-transform duration-500 group-hover:rotate-6`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.1em] mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-4xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">{value}</h3>
          <span className="text-[12px] text-[#86868b] font-medium">{subtext}</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_students: 0,
        present_today: 0,
        recent_activity: [],
        attendance_trend: [],
        at_risk_students: 0,
    });
    const [alerts, setAlerts] = useState([]);
    const [showAlerts, setShowAlerts] = useState(true);
    const [timetable, setTimetable] = useState({});
    const [currentClass, setCurrentClass] = useState(null);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API}/api/dashboard-stats`);
            setStats(res.data);
        } catch (error) {
            console.error("Dashboard core sync failure.");
        }
    };

    const fetchTimetable = async () => {
        try {
            const res = await axios.get(`${API}/api/timetable`);
            setTimetable(res.data);
            updateCurrentClass(res.data);
        } catch (error) {
            console.error("Timetable sync failure.");
        }
    };

    const updateCurrentClass = (scheduleData) => {
        const now = new Date();
        const dayIdx = now.getDay() - 1;
        if (dayIdx < 0 || dayIdx > 4) {
            setCurrentClass(null);
            return;
        }
        const day = dayIdx.toString();
        if (scheduleData && scheduleData[day]) {
            const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
            const active = scheduleData[day].find(item => timeStr >= item.start && timeStr <= item.end);
            setCurrentClass(active || null);
        }
    };

    const startSubjectAttendance = async (courseCode) => {
        try {
            await axios.post(`${API}/api/recognition/start`, { course_code: courseCode });
            // Redirect or show status? For now we just trigger.
            window.location.href = '/attendance';
        } catch (error) {
            console.error("Failed to start subject attendance");
        }
    };

    const fetchAlerts = async () => {
        try {
            const res = await axios.get(`${API}/api/ai/alerts`);
            const important = (res.data.alerts || []).filter(a => a.severity !== 'info');
            setAlerts(important);
        } catch (error) {
            console.error("AI alert stream failure.");
        }
    };

    useEffect(() => {
        fetchStats();
        fetchAlerts();
        fetchTimetable();
        const interval = setInterval(fetchStats, 5000);
        const alertInterval = setInterval(fetchAlerts, 30000);
        const timeInterval = setInterval(() => updateCurrentClass(timetable), 60000);
        return () => { 
            clearInterval(interval); 
            clearInterval(alertInterval); 
            clearInterval(timeInterval);
        };
    }, []);

    const chartData = {
        labels: stats.attendance_trend.map(t => t.date),
        datasets: [
            {
                fill: true,
                label: 'Attendance',
                data: stats.attendance_trend.map(t => t.count),
                borderColor: '#0071e3',
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return 'rgba(0, 113, 227, 0.03)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(0, 113, 227, 0.25)');
                    gradient.addColorStop(1, 'rgba(0, 113, 227, 0.0)');
                    return gradient;
                },
                tension: 0.45,
                borderWidth: 3,
                pointRadius: (context) => (context.dataIndex === stats.attendance_trend.length - 1 ? 6 : 0),
                pointBackgroundColor: (context) => (context.dataIndex === stats.attendance_trend.length - 1 ? '#0071e3' : 'transparent'),
                pointBorderColor: (context) => (context.dataIndex === stats.attendance_trend.length - 1 ? '#ffffff' : 'transparent'),
                pointBorderWidth: (context) => (context.dataIndex === stats.attendance_trend.length - 1 ? 3 : 0),
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#0071e3',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 3,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 800,
            easing: 'easeOutQuart'
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1d1d1f',
                titleFont: { size: 13, weight: 'bold' },
                bodyColor: '#0071e3',
                bodyFont: { size: 14, weight: '900' },
                borderColor: 'rgba(0, 113, 227, 0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return `${context.parsed.y} Present`;
                    }
                }
            },
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: { 
                grid: { display: false }, 
                ticks: { font: { size: 11, weight: '600' }, color: '#86868b', padding: 10 } 
            },
            y: { 
                grid: { borderDash: [4, 4], color: 'rgba(0,0,0,0.03)' }, 
                ticks: { font: { size: 11, weight: '600' }, color: '#86868b', padding: 10, stepSize: 1 },
                beginAtZero: true 
            }
        }
    };

    return (
        <div className="p-8 md:p-12 space-y-12 animate-sams-fade max-w-[1600px] mx-auto bg-transparent">
            
            {/* ── Intelligence Alerts Area ────────────────────────────────────── */}
            {showAlerts && alerts.length > 0 && (
                <div className="space-y-3">
                    {alerts.map((a, i) => (
                        <div key={i} className="bg-white/70 backdrop-blur-xl border border-[#0071e3]/20 px-6 py-4 rounded-[1.5rem] flex items-center justify-between shadow-sm group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-[#0071e3]/10 text-[#0071e3] rounded-xl group-hover:rotate-12 transition-transform">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <span className="text-[11px] font-black uppercase text-[#0071e3] tracking-widest">{a.title}</span>
                                    <p className="text-[13px] text-[#1d1d1f] dark:text-white font-medium">{a.message}</p>
                                </div>
                            </div>
                            {i === 0 && (
                                <button onClick={() => setShowAlerts(false)} className="text-[#86868b] hover:text-[#1d1d1f] dark:text-white transition-all p-2 rounded-full hover:bg-black/5">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Dashboard Header ────────────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <LayoutDashboard size={24} className="text-[#0071e3]" />
                      <h1 className="text-[34px] font-bold text-[#1d1d1f] dark:text-white tracking-tight">Dashboard</h1>
                   </div>
                   <p className="text-[17px] text-[#86868b] font-medium">Real-time biometrics and system performance.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => { fetchStats(); fetchAlerts(); }}
                        className="p-3.5 bg-white/40 border border-white/60 dark:border-white/10 rounded-full text-[#1d1d1f] dark:text-white hover:bg-white/60 transition-all active:scale-95 shadow-sm"
                        title="Sync All Data"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <div className="flex items-center gap-4 text-[#86868b] text-[13px] font-bold bg-white/40 px-5 py-2.5 rounded-full border border-[#d2d2d7]/30">
                        <Clock size={16} />
                        <span className="uppercase tracking-widest">Live Sync Alpha</span>
                    </div>
                </div>
            </header>

            {/* ── Summary Statistics Grid ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                <StatCard title="Student Population" value={stats.total_students} subtext="Registered" icon={Users} accent="blue" />
                <StatCard title="Active Presence" value={stats.present_today} subtext="Present Today" icon={CheckCircle} accent="green" />
                <StatCard 
                  title="Retention Rate" 
                  value={stats.total_students ? Math.round((stats.present_today/stats.total_students)*100) + '%' : '0%'} 
                  subtext="Daily Avg" 
                  icon={Activity} 
                  accent="purple" 
                />
                <StatCard title="Anomaly Detection" value={stats.at_risk_students ?? 0} subtext="Priority Alerts" icon={ShieldAlert} accent="red" />
            </div>

            {/* ── Main Data Visualization Area ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* Visual Analytics & Feed (8/12 cols) */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="glass-card p-10">
                        <div className="flex justify-between items-center mb-10">
                             <div>
                                 <h2 className="text-[20px] font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5">
                                    <TrendingUp size={20} className="text-[#0071e3]" />
                                    Performance Analytics
                                </h2>
                                <p className="text-[13px] text-[#86868b] font-medium mt-1">Attendance frequency per cycle.</p>
                             </div>
                             <div className="flex items-center gap-4">
                                <button 
                                    onClick={fetchStats}
                                    className="p-3 bg-white/40 border border-white/60 dark:border-white/10 rounded-full text-[#1d1d1f] dark:text-white hover:bg-white/60 transition-all active:scale-95 shadow-sm"
                                    title="Refresh Analytics"
                                >
                                    <RefreshCw size={14} />
                                </button>
                                <div className="flex gap-2.5 items-center bg-[#0071e3]/10 px-3.5 py-1.5 rounded-full border border-[#0071e3]/20 shadow-[0_0_15px_rgba(0,113,227,0.1)]">
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0071e3] opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0071e3]"></span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase text-[#0071e3] tracking-wider">Live Tracking</span>
                                </div>
                             </div>
                        </div>
                        <div className="h-[340px] w-full">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    <div className="glass-panel p-8 min-h-[460px] flex flex-col justify-between border-[#d2d2d7]/20 bg-white/40 backdrop-blur-3xl">
                        <div className="flex justify-between items-center mb-8">
                             <div>
                                 <h2 className="text-[20px] font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5">
                                    <BookOpen size={20} className="text-[#0071e3]" />
                                    Academic Modules
                                </h2>
                                <p className="text-[13px] text-[#86868b] font-medium mt-1">Live curriculum attendance telemetry.</p>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {(timetable[new Date().getDay() - 1] || timetable["0"] || []).slice(0, 4).map((subj, idx) => (
                                <div key={idx} className={`glass-card p-6 rounded-[1.8rem] border shadow-sm hover:shadow-md transition-all group overflow-hidden relative ${currentClass?.code === subj.code ? 'border-[#0071e3] bg-white' : 'border-white/80 bg-white/60'}`}>
                                    <div className="relative z-10 flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-white shadow-sm border border-[#d2d2d7]/30 group-hover:rotate-6 transition-transform`}>
                                            <Laptop size={20} className={currentClass?.code === subj.code ? 'text-[#0071e3]' : 'text-[#86868b]'} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-[#86868b] uppercase tracking-widest">{subj.code}</p>
                                            <p className="text-[11px] font-bold text-[#86868b] mt-1">{subj.start} - {subj.end}</p>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-[15px] font-bold text-[#1d1d1f] dark:text-white mb-4 truncate">{subj.title}</h3>
                                        <button 
                                            onClick={() => startSubjectAttendance(subj.code)}
                                            className={`w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 ${currentClass?.code === subj.code ? 'bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/20' : 'bg-white border border-[#d2d2d7]/50 text-[#1d1d1f] dark:text-white hover:bg-[#f5f5f7]'}`}
                                        >
                                            Start Attendance
                                        </button>
                                    </div>
                                    {currentClass?.code === subj.code && (
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-[#0071e3] text-white rounded-full text-[9px] font-black uppercase tracking-tighter animate-pulse z-20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                            Live Now
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex items-center justify-between p-4 bg-[#f5f5f7]/50 rounded-2xl border border-[#d2d2d7]/30">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-[#86868b]" />
                                <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest">
                                    {currentClass ? `Current: ${currentClass.title} (${currentClass.code})` : 'No active class found at this time'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${currentClass ? 'bg-[#34c759] animate-pulse' : 'bg-[#d2d2d7]'}`} />
                                <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest">System Ready</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real-time Activity Stream (4/12 cols) */}
                <div className="lg:col-span-4 h-full">
                    <div className="glass-card p-10 h-full min-h-[600px] flex flex-col">
                        <div className="mb-10 flex justify-between items-start">
                            <div>
                                <h2 className="text-[20px] font-bold text-[#1d1d1f] dark:text-white">Live Stream</h2>
                                <p className="text-[13px] text-[#86868b] font-medium mt-1">Chronological biometric captures.</p>
                            </div>
                            <button 
                                onClick={fetchStats}
                                className="p-3 bg-white/40 border border-white/60 dark:border-white/10 rounded-full text-[#1d1d1f] dark:text-white hover:bg-white/60 transition-all active:scale-95 shadow-sm"
                                title="Re-sync Activity"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>
                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {stats.recent_activity.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30 gap-4">
                                    <Users size={48} />
                                    <p className="text-[13px] font-bold uppercase tracking-widest">No captures detected</p>
                                </div>
                            ) : (
                                stats.recent_activity.map((record) => (
                                    <div key={record.id} className="flex items-center justify-between p-5 bg-white/40 backdrop-blur-md hover:bg-white/60 rounded-[1.8rem] transition-all border border-white/30 shadow-sm group">
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="w-11 h-11 rounded-full bg-[#1d1d1f] flex items-center justify-center text-[12px] font-bold text-white shadow-sm group-hover:scale-110 transition-transform">
                                                {record.student_name.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white truncate">{record.student_name}</p>
                                                <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Roll {record.student_roll}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <div className="text-[10px] font-black text-[#0071e3] uppercase bg-[#0071e3]/5 px-3 py-1 rounded-full border border-[#0071e3]/10">
                                                {record.course_code || 'General'}
                                            </div>
                                            <p className="text-[10px] text-[#86868b] font-bold mt-2 uppercase tracking-tight">{record.time}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <Link to="/attendance" className="block w-full">
                            <button className="mt-8 py-4 w-full bg-[#1d1d1f] dark:bg-white text-white dark:text-black rounded-[1.5rem] font-bold text-[13px] hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-black/5">
                                Expand Full Ledger
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Dashboard Quick AI Actions (Sticky) ─────────────────────────── */}
            <div className="sticky bottom-6 z-40 mt-12 px-4 animate-[fadeIn_0.5s_ease-out_0.5s_forwards] opacity-0">
                <div className="bg-[#1d1d1f]/80 backdrop-blur-2xl border border-white/10 p-4 flex flex-col md:flex-row items-center gap-4 justify-between shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] rounded-[2rem] max-w-[1100px] mx-auto overflow-hidden relative">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-blue-500/10 to-purple-500/5 pointer-events-none" />
                    
                    <div className="flex items-center gap-4 relative z-10 pl-2">
                        <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-[#34c759] shadow-inner border border-white/10">
                            <Sparkles size={20} fill="currentColor" className="animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[12px] font-black uppercase text-white tracking-[0.2em]">SAMS CORE AI</p>
                            <p className="text-[11px] text-[#86868b] font-bold">Neural biometric synthesis active.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 justify-center relative z-10">
                        {['Who was absent?', "Today's rate", 'At-risk students', 'Export analysis'].map((q, i) => (
                            <button 
                                key={i}
                                onClick={() => {
                                    const toggle = document.getElementById('ai-chat-toggle');
                                    if (toggle) toggle.click();
                                }}
                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-[12px] font-bold text-white/90 rounded-full border border-white/10 transition-all active:scale-95 group flex items-center gap-2 hover:border-white/20 shadow-sm"
                            >
                                <span>{q}</span>
                                <ArrowUpRight size={12} className="text-[#86868b] group-hover:text-white transition-colors" />
                            </button>
                        ))}
                    </div>

                    <div className="hidden md:block pr-2 relative z-10">
                        <div className="flex items-center gap-2.5 text-[10px] font-black text-[#34c759] bg-[#34c759]/10 px-4 py-2 rounded-full border border-[#34c759]/20 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
                            LLM-SYNCHRONIZED
                        </div>
                    </div>
                </div>
            </div>

            {/* ── AI Intelligence Stream ─────────────────────────────────────────── */}
            <AIChat />
        </div>
    );
};

export default Dashboard;
