import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, CheckCircle, Activity, BookOpen, Clock, 
  Sparkles, ShieldAlert, ArrowUpRight, GraduationCap, X, LayoutGrid, BarChart3, TrendingUp, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const StatCard = ({ title, value, subtext, icon: Icon, accent = 'blue' }) => {
  const accentColors = {
    blue: 'text-[#0071e3] bg-[#0071e3]/5',
    green: 'text-[#34c759] bg-[#34c759]/5',
    purple: 'text-[#af52de] bg-[#af52de]/5',
    red: 'text-[#ff3b30] bg-[#ff3b30]/5',
  };
  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] flex flex-col gap-6 group hover:bg-white/60 transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accentColors[accent]} transition-transform duration-500 group-hover:scale-110`}>
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

const SubjectCard = ({ subject }) => {
  const isOptimal = subject.rate >= 75;
  
  return (
    <div className={`bg-white/40 backdrop-blur-xl p-6 rounded-[1.8rem] border transition-all group overflow-hidden relative shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-sm ${isOptimal ? 'border-white/80 hover:bg-white/70' : 'border-[#ff3b30]/10 hover:bg-[#ff3b30]/5'}`}>
        <div className="relative z-10 flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-white shadow-sm border border-[#d2d2d7]/20 group-hover:rotate-3 transition-transform`}>
                <BookOpen size={20} className={isOptimal ? 'text-[#0071e3]' : 'text-[#ff3b30]'} />
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-[#86868b] uppercase tracking-widest">Rate</p>
                <p className={`text-[16px] font-bold mt-1 tracking-tight ${isOptimal ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}>{subject.rate}%</p>
            </div>
        </div>
        
        <div className="relative z-10 mb-6">
            <h3 className="text-[16px] font-bold text-[#1d1d1f] dark:text-white mb-1 truncate">{subject.course_code}</h3>
            <p className="text-[12px] font-medium text-[#86868b]">
               {subject.present} of {subject.total} classes attended
            </p>
        </div>
        
        <div className={`relative z-10 px-4 py-3 rounded-xl flex items-center gap-3 border ${subject.leaves_allowed >= 0 ? 'bg-[#34c759]/5 border-[#34c759]/10 text-[#248a3d]' : 'bg-[#ff3b30]/5 border-[#ff3b30]/10 text-[#d70015]'}`}>
            {subject.leaves_allowed >= 0 ? <CheckCircle size={14} className="shrink-0" /> : <ShieldAlert size={14} className="shrink-0" />}
            <p className="text-[11px] font-semibold tracking-tight">
               {subject.status_text}
            </p>
        </div>
    </div>
  );
};

const StudentDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const navigate = useNavigate();

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/api/student/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
            setError('');
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                setError(err.response?.data?.error || 'Failed to sync intelligence core.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(() => {
            const token = localStorage.getItem('token');
            if(token) {
                axios.get(`${API}/api/student/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).then(res => setData(res.data)).catch(err => console.error(err));
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen pt-32 flex flex-col items-center opacity-40 animate-pulse">
                <Activity size={32} className="text-[#0071e3] mb-4" />
                <p className="text-[12px] font-bold text-[#86868b] uppercase tracking-[0.2em]">Syncing Biometric Profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 md:p-12 max-w-[1600px] mx-auto animate-sams-fade">
                <div className="bg-[#ff3b30]/5 border border-[#ff3b30]/10 p-10 rounded-3xl flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto mt-20">
                    <ShieldAlert size={48} className="text-[#ff3b30]" />
                    <div>
                        <h2 className="text-[18px] font-bold text-[#1d1d1f] mb-2">Access Restricted</h2>
                        <p className="text-[13px] text-[#86868b] font-medium">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Line Chart Data
    const trendData = {
        labels: (data.attendance_trend || []).map(t => t.date),
        datasets: [
            {
                fill: true,
                label: 'Classes Attended',
                data: (data.attendance_trend || []).map(t => t.count),
                borderColor: '#0071e3',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(0, 113, 227, 0.15)');
                    gradient.addColorStop(1, 'rgba(0, 113, 227, 0.0)');
                    return gradient;
                },
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#0071e3',
                pointBorderWidth: 2,
            },
        ],
    };

    const trendOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                titleColor: '#86868b',
                bodyColor: '#1d1d1f',
                borderColor: 'rgba(0,0,0,0.05)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                displayColors: false,
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10, weight: '600' }, color: '#86868b' } },
            y: { grid: { borderDash: [4, 4], color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 10, weight: '600' }, color: '#86868b', stepSize: 1 }, beginAtZero: true }
        }
    };

    return (
        <div className="p-8 md:p-12 space-y-10 animate-sams-fade max-w-[1400px] mx-auto bg-transparent relative z-10">
            
            {/* ── Intelligence Banner ────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-[#0071e3]/5 to-[#af52de]/5 border border-white/50 px-8 py-5 rounded-full flex flex-col md:flex-row items-center gap-4 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/30 backdrop-blur-md" />
                <div className="relative z-10 flex items-center justify-center p-2 rounded-full bg-white shadow-sm border border-black/5 text-[#0071e3]">
                    <Sparkles size={18} />
                </div>
                <div className="relative z-10 flex-1 flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase text-[#0071e3] tracking-widest shrink-0">Insight</span>
                    <p className="text-[13px] text-[#1d1d1f] dark:text-white font-medium tracking-tight truncate">{data.ai_insight}</p>
                </div>
            </div>

            {/* ── Dashboard Header ────────────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-[#d2d2d7]/50 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                        {data.student.photo_path ? (
                            <img 
                               src={`${API}/${data.student.photo_path.replace('app/', '')}`} 
                               alt={data.student.name} 
                               className="w-full h-full object-cover"
                               onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                            />
                        ) : null}
                        <User size={24} className="text-[#d2d2d7] hidden" />
                    </div>
                    <div>
                        <h1 className="text-[28px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-tight">{data.student.name}</h1>
                        <p className="text-[12px] text-[#86868b] font-bold uppercase tracking-widest mt-1">{data.student.roll_no}</p>
                    </div>
                </div>
            </header>

            {/* ── Global Summary Statistics ───────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard 
                   title="Overall Rate" 
                   value={`${data.overall_rate}%`} 
                   subtext="Global Average" 
                   icon={Activity} 
                   accent={data.overall_rate >= 75 ? 'green' : 'red'} 
                />
                <StatCard 
                   title="Classes Attended" 
                   value={data.present_classes} 
                   subtext={`out of ${data.total_classes}`} 
                   icon={CheckCircle} 
                   accent="blue" 
                />
                <StatCard 
                   title="Classes Missed" 
                   value={data.total_classes - data.present_classes} 
                   subtext="Total Leaves" 
                   icon={User} 
                   accent="purple" 
                />
            </div>

            {/* ── Trend & Schedule Row ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 7-Day Trend (8 cols) */}
                <div className="lg:col-span-8 bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.01)] min-h-[340px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-[16px] font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                <TrendingUp size={16} className="text-[#0071e3]" />
                                Attendance Trend
                            </h2>
                            <p className="text-[12px] text-[#86868b] font-medium mt-1">Activity over the last 7 days.</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[200px]">
                        <Line data={trendData} options={trendOptions} />
                    </div>
                </div>

                {/* Schedule Widget (4 cols) */}
                <div className="lg:col-span-4 bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.01)] min-h-[340px] flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-[16px] font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                <Calendar size={16} className="text-[#af52de]" />
                                Live Schedule
                            </h2>
                        </div>
                        
                        {data.current_class ? (
                            <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-5 rounded-[1.5rem] relative overflow-hidden">
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#0071e3]/10 text-[#0071e3] px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3]"></div> LIVE
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#0071e3] mb-1">Happening Now</p>
                                <h3 className="text-[15px] font-bold text-[#1d1d1f] truncate pr-16">{data.current_class.title}</h3>
                                <p className="text-[12px] text-[#86868b] font-medium mt-1">{data.current_class.start} - {data.current_class.end}</p>
                            </div>
                        ) : data.next_class ? (
                            <div className="bg-[#f5f5f7]/50 border border-black/5 p-5 rounded-[1.5rem] relative">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#86868b] mb-1">Up Next</p>
                                <h3 className="text-[15px] font-bold text-[#1d1d1f] truncate">{data.next_class.title}</h3>
                                <p className="text-[12px] text-[#86868b] font-medium mt-1">{data.next_class.start} - {data.next_class.end}</p>
                            </div>
                        ) : (
                            <div className="border border-dashed border-[#d2d2d7] p-8 rounded-[1.5rem] text-center opacity-70">
                                <p className="text-[12px] font-bold text-[#86868b] uppercase tracking-widest">No upcoming classes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Lower Area: Leaves & Activity ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Subject Wise Grid & Chart (8/12 cols) */}
                <div className="lg:col-span-8 bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.01)] min-h-[460px]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-[16px] font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                                <BookOpen size={16} className="text-[#0071e3]" />
                                Safe Leave Balances
                            </h2>
                            <p className="text-[12px] text-[#86868b] font-medium mt-1">Leaves maintaining global 75% boundary.</p>
                        </div>
                        <div className="flex bg-[#f5f5f7]/80 p-1 relative rounded-xl border border-black/5">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                            >
                                <LayoutGrid size={12} /> Grid
                            </button>
                            <button
                                onClick={() => setViewMode('chart')}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'chart' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                            >
                                <BarChart3 size={12} /> Chart
                            </button>
                        </div>
                    </div>
                    
                    {data.subject_breakdown.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-[#86868b] opacity-50">
                            <BookOpen size={48} className="mb-4" />
                            <p className="text-[12px] font-bold uppercase tracking-widest">No classes attended yet</p>
                        </div>
                    ) : (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-sams-fade">
                                {data.subject_breakdown.map((subj, idx) => (
                                    <SubjectCard key={idx} subject={subj} />
                                ))}
                            </div>
                        ) : (
                            <div className="h-[300px] animate-sams-fade relative top-4">
                                <Bar 
                                    data={{
                                        labels: data.subject_breakdown.map(s => s.course_code),
                                        datasets: [{
                                            label: 'Safe Leaves Allowed',
                                            data: data.subject_breakdown.map(s => s.leaves_allowed),
                                            backgroundColor: data.subject_breakdown.map(s => s.leaves_allowed >= 0 ? 'rgba(52, 199, 89, 0.7)' : 'rgba(255, 59, 48, 0.7)'),
                                            borderRadius: 6,
                                            barThickness: 32,
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false }, tooltip: {
                                            backgroundColor: 'white', titleColor: '#86868b', bodyColor: '#1d1d1f', borderColor: 'rgba(0,0,0,0.05)', borderWidth: 1, padding: 12, cornerRadius: 8, displayColors: false,
                                            callbacks: { label: function(context) { const val = context.raw; if (val >= 0) return `Safe to leave: ${val} classes`; return `Need to attend: ${-val} classes`; } }
                                        }},
                                        scales: {
                                            y: { grid: { borderDash: [4, 4], color: 'rgba(0,0,0,0.03)' }, ticks: { font: { size: 10, weight: '600' }, color: '#86868b', stepSize: 1 } },
                                            x: { grid: { display: false }, ticks: { font: { size: 10, weight: '600' }, color: '#86868b' } }
                                        }
                                    }}
                                />
                            </div>
                        )
                    )}
                </div>

                {/* Activity Stream (4/12 cols) */}
                <div className="lg:col-span-4 bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.01)] min-h-[460px] flex flex-col">
                    <div className="mb-6">
                        <h2 className="text-[16px] font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
                            <Clock size={16} className="text-[#86868b]" />
                            Recent Logs
                        </h2>
                    </div>
                    
                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {data.recent_activity.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30 gap-4">
                                <Clock size={24} />
                                <p className="text-[10px] font-bold uppercase tracking-widest">No recent logs</p>
                            </div>
                        ) : (
                            data.recent_activity.map((record, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/80 hover:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-colors">
                                    <div>
                                        <p className="text-[13px] font-bold text-[#1d1d1f]">{record.course_code}</p>
                                        <p className="text-[10px] font-semibold text-[#86868b] mt-0.5">{record.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${record.status === 'Present' ? 'bg-[#34c759]/10 text-[#34c759]' : 'bg-[#ff3b30]/10 text-[#ff3b30]'}`}>
                                            {record.status}
                                        </span>
                                        <p className="text-[10px] text-[#86868b] font-bold mt-1 uppercase">{record.time}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default StudentDashboard;
