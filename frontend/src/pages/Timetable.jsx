import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Activity, CheckCircle, ShieldAlert, BookOpen, Sparkles, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const Timetable = () => {
    const [timetable, setTimetable] = useState({});
    const [attendanceMap, setAttendanceMap] = useState({});
    const [selectedDay, setSelectedDay] = useState(new Date().getDay() - 1);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [aiInsight, setAiInsight] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        // Ensure selected day is Mon-Fri
        let day = new Date().getDay() - 1;
        if (day < 0 || day > 4) day = 0;
        setSelectedDay(day);

        const fetchData = async () => {
            try {
                // Fetch base timetable
                const ttRes = await axios.get(`${API}/api/timetable`);
                setTimetable(ttRes.data);

                // Try to fetch student context if available
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const dashRes = await axios.get(`${API}/api/student/dashboard`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const breakdown = dashRes.data.subject_breakdown;
                        const map = {};
                        breakdown.forEach(s => {
                            map[s.course_code] = s;
                        });
                        setAttendanceMap(map);
                    } catch (e) {
                        // Probably an admin or session issue, safe to ignore for UI purposes
                        console.log("No student context available for timetable.");
                    }
                }
            } catch (err) {
                console.error("Failed to fetch timetable.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (Object.keys(timetable).length === 0) return;
        
        const fetchAiInsight = async () => {
            setAiLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const currentSchedule = timetable[selectedDay.toString()] || [];
                if (currentSchedule.length === 0) {
                    setAiInsight("You have no classes today. A strategic opportunity for independent research or active recovery.");
                    setAiLoading(false);
                    return;
                }

                const scheduleContext = currentSchedule.map(c => {
                    const att = attendanceMap[c.code] || { rate: 100 };
                    return `${c.title} (${c.start}-${c.end}) - Attendance: ${att.rate}%`;
                });

                const res = await axios.post(`${API}/api/ai/timetable-agent`, {
                    day: DAYS[selectedDay],
                    schedule: scheduleContext
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setAiInsight(res.data.response);
            } catch (e) {
                setAiInsight("SAMS AI Agent logic core is currently syncing. Focus on attending your scheduled modules.");
            } finally {
                setAiLoading(false);
            }
        };

        fetchAiInsight();
    }, [selectedDay, timetable, attendanceMap]);

    const isLive = (startStr, endStr, dayIndex) => {
        const now = currentTime;
        const currentDayIdx = now.getDay() - 1;
        if (dayIndex !== currentDayIdx) return false;

        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        return timeStr >= startStr && timeStr <= endStr;
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 flex flex-col items-center opacity-40 animate-pulse">
                <Activity size={32} className="text-[#0071e3] mb-4" />
                <p className="text-[12px] font-bold text-[#86868b] uppercase tracking-[0.2em]">Syncing Master Schedule...</p>
            </div>
        );
    }

    const schedule = timetable[selectedDay.toString()] || [];

    return (
        <div className="p-8 md:p-12 space-y-8 animate-sams-fade max-w-[1400px] mx-auto bg-transparent relative z-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-[#d2d2d7]/50 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                        <Calendar size={24} className="text-[#0071e3]" />
                    </div>
                    <div>
                        <h1 className="text-[28px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-tight">Master Schedule</h1>
                        <p className="text-[12px] text-[#86868b] font-bold uppercase tracking-widest mt-1">Real-time Academic Timetable</p>
                    </div>
                </div>
            </header>

            {/* ── Day Selector ────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 mb-8">
                {DAYS.map((dayName, idx) => {
                    const active = selectedDay === idx;
                    const isToday = (currentTime.getDay() - 1) === idx;
                    return (
                        <button 
                            key={idx}
                            onClick={() => setSelectedDay(idx)}
                            className={`px-6 py-3.5 rounded-2xl text-[13px] font-bold tracking-tight transition-all backdrop-blur-md border ${
                                active 
                                    ? 'bg-[#1d1d1f] text-white border-transparent shadow-[0_8px_20px_rgba(0,0,0,0.1)]' 
                                    : 'bg-white/40 text-[#86868b] hover:bg-white border-[#d2d2d7]/30 hover:text-[#1d1d1f]'
                            }`}
                        >
                            {dayName} {isToday && <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/20">Today</span>}
                        </button>
                    );
                })}
            </div>

            {/* ── Intelligence Banner ────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-[#1d1d1f] to-[#2d2d2f] border border-white/10 px-8 py-5 rounded-[2rem] flex flex-col md:flex-row items-center gap-5 shadow-2xl relative overflow-hidden group mb-8 animate-sams-fade">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-md" />
                <div className="relative z-10 flex items-center justify-center p-3 rounded-2xl bg-white/10 shadow-sm border border-white/10 text-white">
                    {aiLoading ? <Loader2 size={18} className="animate-spin text-[#0071e3]" /> : <Sparkles size={18} className="text-[#0071e3]" />}
                </div>
                <div className="relative z-10 flex-1">
                    <span className="text-[10px] font-bold uppercase text-[#86868b] tracking-widest mb-1 block">SAMS Agentic Analysis</span>
                    <p className="text-[14px] text-white font-medium tracking-tight leading-relaxed">
                        {aiLoading ? "Analyzing operational parameters and generating strategic insight..." : aiInsight}
                    </p>
                </div>
            </div>

            {/* ── Schedule Grid ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-5">
                    {schedule.length === 0 ? (
                        <div className="bg-white/40 backdrop-blur-xl border border-white/40 p-12 rounded-[2rem] text-center opacity-50">
                            <Clock size={32} className="mx-auto mb-4" />
                            <p className="text-[12px] font-bold uppercase tracking-widest">No classes scheduled</p>
                        </div>
                    ) : (
                        schedule.map((cls, idx) => {
                            const live = isLive(cls.start, cls.end, selectedDay);
                            const attendance = attendanceMap[cls.code] || attendanceMap['General'];
                            
                            return (
                                <div key={idx} className={`bg-white/40 backdrop-blur-xl border p-6 rounded-[2rem] transition-all flex flex-col md:flex-row gap-6 md:items-center relative overflow-hidden group hover:bg-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.01)] hover:shadow-sm ${live ? 'border-[#0071e3]/30 bg-[#0071e3]/5' : 'border-white/40'}`}>
                                    
                                    {/* Live Indicator */}
                                    {live && (
                                        <div className="absolute top-0 right-0 h-full w-1.5 bg-[#0071e3]"></div>
                                    )}

                                    {/* Timeline & Icon */}
                                    <div className="flex items-center gap-5 shrink-0 w-[180px]">
                                        <div className={`p-3.5 rounded-2xl shadow-sm border ${live ? 'bg-[#0071e3] text-white border-transparent shadow-blue-500/20' : 'bg-white text-[#86868b] border-[#d2d2d7]/30 group-hover:scale-105 transition-transform'}`}>
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className={`text-[11px] font-black tracking-widest uppercase mb-1 ${live ? 'text-[#0071e3]' : 'text-[#86868b]'}`}>
                                                {live ? 'Live Now' : cls.type}
                                            </p>
                                            <p className="text-[14px] font-bold text-[#1d1d1f]">{cls.start} - {cls.end}</p>
                                        </div>
                                    </div>

                                    {/* Class Info */}
                                    <div className="flex-1">
                                        <h3 className="text-[18px] font-bold text-[#1d1d1f] tracking-tight">{cls.title}</h3>
                                        <p className="text-[12px] font-semibold text-[#86868b] mt-1">{cls.code}</p>
                                    </div>

                                    {/* Contextual Attendance Badge */}
                                    {attendance && (
                                        <div className="shrink-0 flex items-center">
                                            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${attendance.rate >= 75 ? 'bg-[#34c759]/5 border-[#34c759]/10 text-[#248a3d]' : 'bg-[#ff3b30]/5 border-[#ff3b30]/10 text-[#d70015]'}`}>
                                                {attendance.rate >= 75 ? <CheckCircle size={14} /> : <ShieldAlert size={14} />}
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">Attendance</p>
                                                    <p className="text-[13px] font-bold leading-none">{attendance.rate}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── Side Widget ─────────────────────────────────────────────── */}
                <div className="lg:col-span-4">
                    <div className="bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                        
                        <div className="relative z-10 mb-8">
                            <BookOpen size={24} className="text-white/80 mb-4" />
                            <h2 className="text-[20px] font-bold tracking-tight">Academic Flow</h2>
                            <p className="text-[13px] text-white/60 font-medium mt-1">Your verified presence dictates the analytics algorithm.</p>
                        </div>
                        
                        <div className="relative z-10 space-y-4">
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#34c759] mb-1">Status Protocol</p>
                                <p className="text-[14px] font-medium leading-relaxed">Ensure physical presence during LIVE modules to automatically record SAMS biometrics.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Timetable;
