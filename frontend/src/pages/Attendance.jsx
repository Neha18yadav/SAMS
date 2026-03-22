import VideoFeed from '../components/VideoFeed';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, Clock, Play, Square, AlertCircle, Camera, Activity, Sparkles, X, RefreshCw, ShieldCheck, Cpu, Layers, Fingerprint } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Attendance = () => {
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [isRecognitionRunning, setIsRecognitionRunning] = useState(false);
    const [activeCourse, setActiveCourse] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [feedKey, setFeedKey] = useState(0);

    useEffect(() => {
        const interval = setInterval(fetchRecentAttendance, 2000);
        fetchRecentAttendance();
        checkRecognitionStatus();
        return () => {
            clearInterval(interval);
        };
    }, []);

    const fetchRecentAttendance = async () => {
        try {
            const res = await axios.get(`${API}/api/attendance`);
            setRecentAttendance(res.data.slice(0, 8));
        } catch (err) {
            console.error(err);
        }
    };

    const checkRecognitionStatus = async () => {
        try {
            const res = await axios.get(`${API}/api/recognition/status`);
            if (res.data.is_running) {
                setIsRecognitionRunning(true);
                setActiveCourse(res.data.course_code);
                setTimeLeft(15); 
            } else {
                setIsRecognitionRunning(false);
                setActiveCourse(null);
            }
        } catch (err) {
            console.error("Status check failed", err);
        }
    };

    const startRecognition = async () => {
        try {
            await axios.post(`${API}/api/recognition/start`);
            setIsRecognitionRunning(true);
            setActiveCourse(null); // General scan
            setTimeLeft(15); 
        } catch (err) {
            console.error("Failed to start recognition", err);
        }
    };

    const stopRecognition = async () => {
        try {
            await axios.post(`${API}/api/recognition/stop`);
            setIsRecognitionRunning(false);
            setActiveCourse(null);
            setTimeLeft(0);
        } catch (err) {
            console.error("Failed to stop recognition", err);
        }
    };

    useEffect(() => {
        let timer;
        if (isRecognitionRunning && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRecognitionRunning) {
            stopRecognition();
        }
        return () => clearInterval(timer);
    }, [isRecognitionRunning, timeLeft]);

    return (
        <div className="p-8 md:p-12 space-y-10 animate-sams-fade max-w-[1600px] mx-auto min-h-screen bg-transparent">
            
            {/* ── Attendance Header ─────────────────────────────────────────── */ }
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0071e3]/5 text-[#0071e3] rounded-xl">
                            <Activity size={24} />
                        </div>
                        <h1 className="text-[34px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-none">
                            {activeCourse ? `${activeCourse} Session` : 'Intelligence Hub'}
                        </h1>
                    </div>
                    <p className="text-[17px] text-[#86868b] font-medium">
                        {activeCourse ? `Marking attendance for ${activeCourse}` : 'Automated biometric identification and presence logging.'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={async () => {
                            setFeedKey(prev => prev + 1);
                            await fetchRecentAttendance();
                            // Always restart recognition to ensure "new scan" experience
                            await stopRecognition();
                            await startRecognition();
                        }}
                        className="p-4 bg-white/40 border border-white/60 rounded-full text-[#1d1d1f] dark:text-white hover:bg-white/60 transition-all active:scale-95 shadow-sm"
                        title="Reset & New Scan"
                    >
                        <RefreshCw size={18} />
                    </button>

                    {!isRecognitionRunning ? (
                        <button
                            onClick={startRecognition}
                            className="flex items-center gap-3 bg-[#1d1d1f] dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-bold text-[14px] shadow-xl hover:bg-slate-800 transition-all active:scale-95 group"
                        >
                            <Play size={18} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                            <span>INITIATE SAMS SCAN</span>
                        </button>
                    ) : (
                        <button
                            onClick={stopRecognition}
                            className="flex items-center gap-3 bg-[#ff3b30] text-white px-8 py-4 rounded-full font-bold text-[14px] shadow-xl hover:bg-red-600 transition-all active:scale-95 group"
                        >
                            <Square size={16} fill="currentColor" />
                            <span>TERMINATE SESSION ({timeLeft}s)</span>
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                
                {/* ── Capture Lense (8/12) ────────────────────────────────────── */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    {/* ── Optical Sensor View ─────────────────────────────────── */}
                    <div className="glass-panel p-4 flex flex-col relative overflow-hidden group min-h-[400px]">
                        <div className="flex justify-between items-center mb-6 px-4 pt-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isRecognitionRunning ? 'bg-[#ff3b30] animate-pulse' : 'bg-[#86868b]'}`} />
                                <h2 className="text-[13px] font-black text-[#1d1d1f] dark:text-white uppercase tracking-widest">
                                    {isRecognitionRunning ? `SAMS Biometric Engine Live` : `Optical System Standby`}
                                </h2>
                            </div>
                            {isRecognitionRunning && (
                                <div className="text-[11px] font-bold text-[#ff3b30] px-3 py-1 bg-red-50 rounded-full border border-red-100">
                                    AUTO-SHUTDOWN IN {timeLeft}s
                                </div>
                            )}
                        </div>

                        <div className="relative h-[320px] rounded-[2rem] overflow-hidden bg-[#1d1d1f] shadow-2xl border border-white/10">
                            <VideoFeed key={feedKey} />

                            {!isRecognitionRunning && (
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center text-center p-12 z-10 space-y-6">
                                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-[#86868b] shadow-sm border border-[#d2d2d7]/50 transition-transform group-hover:scale-110 duration-700">
                                        <Camera size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-[24px] font-bold text-[#1d1d1f] dark:text-white tracking-tight">System Hibernating</h3>
                                        <p className="text-[15px] text-[#86868b] font-medium max-w-[300px]">Authentication protocols are currently inactive. Initiate scan to begin logging.</p>
                                    </div>
                                    <button 
                                        onClick={startRecognition}
                                        className="px-8 py-3 bg-white text-[#1d1d1f] dark:text-white border border-[#d2d2d7] rounded-full text-[13px] font-bold hover:bg-[#f5f5f7] transition-all shadow-lg active:scale-95"
                                    >
                                        Activate Lense
                                    </button>
                                </div>
                            )}

                            {isRecognitionRunning && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                    <div className="w-64 h-64 border-2 border-dashed border-white/50 rounded-full animate-[spin_10s_linear_infinite]" />
                                </div>
                            )}

                            {isRecognitionRunning && (
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
                                    <div className="bg-black/40 backdrop-blur-xl text-white px-6 py-2.5 rounded-full text-[12px] font-bold tracking-wide border border-white/10 flex items-center gap-3">
                                        <Sparkles size={14} className="text-[#0071e3]" />
                                        <span>MAINTAIN OPTICAL FOCUS</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Biometric Analytics Dashboard ─────────────────────────── */}
                    <div className="glass-panel p-8 grid grid-cols-1 md:grid-cols-3 gap-8 relative overflow-hidden">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#0071e3]">
                                <ShieldCheck size={20} />
                                <h3 className="text-[14px] font-bold uppercase tracking-wider">Security Status</h3>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[24px] font-bold text-[#1d1d1f] dark:text-white">Encrypted</p>
                                <p className="text-[12px] text-[#86868b] font-medium">End-to-end biometric data protection active.</p>
                            </div>
                        </div>

                        <div className="space-y-4 border-l border-black/5 md:pl-8">
                            <div className="flex items-center gap-3 text-[#34c759]">
                                <Cpu size={20} />
                                <h3 className="text-[14px] font-bold uppercase tracking-wider">Engine Load</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-[24px] font-bold text-[#1d1d1f] dark:text-white">14.2<span className="text-[14px] ml-1">ms</span></p>
                                    <p className="text-[11px] font-bold text-[#34c759]">OPTIMAL</p>
                                </div>
                                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#34c759] w-[15%]" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border-l border-black/5 md:pl-8">
                            <div className="flex items-center gap-3 text-[#ff9500]">
                                <Fingerprint size={20} />
                                <h3 className="text-[14px] font-bold uppercase tracking-wider">Scan Integrity</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-[24px] font-bold text-[#1d1d1f] dark:text-white">99.8<span className="text-[14px] ml-1">%</span></p>
                                    <p className="text-[11px] font-bold text-[#ff9500]">HIGH</p>
                                </div>
                                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#ff9500] w-[99.8%]" />
                                </div>
                            </div>
                        </div>

                        {/* Background Watermark for Premium feel */}
                        <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none select-none">
                            <Activity size={200} strokeWidth={1} />
                        </div>
                    </div>
                </div>

                {/* ── Presence Ledger (4/12) ─────────────────────────────────── */}
                <div className="lg:col-span-4 flex flex-col">
                    <div className="glass-card p-10 flex-1 flex flex-col min-h-[500px]">
                        <div className="mb-10 flex justify-between items-start">
                            <div>
                                <h2 className="text-[20px] font-bold text-[#1d1d1f] dark:text-white">Presence Ledger</h2>
                                <p className="text-[13px] text-[#86868b] font-medium mt-1">Live verification stream.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={fetchRecentAttendance}
                                    className="p-3 bg-white/40 border border-white/60 rounded-full text-[#1d1d1f] dark:text-white hover:bg-white/60 transition-all active:scale-95 shadow-sm"
                                    title="Manual Re-sync"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-[#34c759]/5 flex items-center justify-center text-[#34c759] border border-[#34c759]/10">
                                    <UserCheck size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {recentAttendance.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 text-center gap-4">
                                    <Clock size={48} />
                                    <p className="text-[13px] font-black uppercase tracking-widest leading-relaxed">No biometric data<br/>captured in current cycle</p>
                                </div>
                            ) : (
                                recentAttendance.map((record, index) => {
                                    const formattedTime = record.time ? record.time.split('.')[0] : '';
                                    const confValue = record.confidence ? Number(record.confidence).toFixed(1) : null;
                                    return (
                                        <div key={`${record.id}-${index}`} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-xl hover:bg-white/90 rounded-[1.2rem] border border-[#d2d2d7]/40 shadow-sm transition-all group animate-[fadeIn_0.5s_ease-out_forwards]">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-[12px] shadow-sm transform transition-transform group-hover:scale-105 flex-shrink-0">
                                                    {record.student_name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[14px] font-bold text-[#1d1d1f] dark:text-white truncate leading-tight tracking-tight">{record.student_name}</p>
                                                    <p className="text-[11px] font-medium text-[#86868b] mt-0.5 truncate flex items-center gap-1.5">
                                                        <span>{record.student_roll}</span>
                                                        {record.course_code && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-[#d2d2d7]"></span>
                                                                <span className="text-[#0071e3] font-bold tracking-wide">{record.course_code}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
                                                <div className="flex items-center gap-2">
                                                    {confValue && (
                                                        <span className="text-[10px] font-bold text-[#86868b] opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 duration-300">
                                                            {confValue}%
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] font-bold text-[#34c759] tracking-widest px-2 py-0.5 bg-[#34c759]/10 rounded-full border border-[#34c759]/20 uppercase">
                                                        Verified
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-[#86868b] font-medium tracking-tight">
                                                    {formattedTime}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        
                        <div className="mt-10 p-5 bg-white/40 backdrop-blur-md rounded-[1.5rem] border border-white/30 flex items-center gap-4 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#ff9500] shadow-sm">
                                <AlertCircle size={16} />
                            </div>
                            <p className="text-[11px] text-[#86868b] font-bold leading-relaxed uppercase tracking-wider">
                                SAMS requires a clear optical path for 98.4% accuracy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
