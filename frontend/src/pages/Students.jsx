import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Camera, Users, X, RefreshCw, UserMinus, ShieldCheck, Search, Command, Activity, Sparkles } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', roll_no: '', section: '', student_group: '', photo: null });
    const [loading, setLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/students`);
            setStudents(res.data);
        } catch (err) {
            console.error("Roster synchronization failed.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
        return () => stopCamera();
    }, [fetchStudents]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            await axios.delete(`${API}/api/students/${id}`);
            setStudents(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert("Deletion protocol failed.");
        }
    };

    const startCamera = async () => {
        try {
            setIsCameraOpen(true);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (err) {
            alert("Optical hardware inaccessible.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                const file = new File([blob], "biometric_sample.jpg", { type: "image/jpeg" });
                setNewStudent({ ...newStudent, photo: file });
                setCapturedImage(URL.createObjectURL(blob));
                stopCamera();
            }, 'image/jpeg');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEnrolling) return;
        
        setIsEnrolling(true);
        const formData = new FormData();
        formData.append('name', newStudent.name);
        formData.append('roll_no', newStudent.roll_no);
        formData.append('section', newStudent.section);
        formData.append('student_group', newStudent.student_group);
        formData.append('photo', newStudent.photo);

        try {
            await axios.post(`${API}/api/students`, formData);
            setShowModal(false);
            setCapturedImage(null);
            fetchStudents();
            setNewStudent({ name: '', roll_no: '', section: '', student_group: '', photo: null });
        } catch (err) {
            alert(`Enrollment failed: ${err.response?.data?.error || 'System error. Please ensure the student is well-lit and not already registered.'}`);
        } finally {
            setIsEnrolling(false);
        }
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.roll_no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 md:p-12 space-y-12 animate-sams-fade max-w-[1600px] mx-auto min-h-screen bg-transparent">
            
            {/* ── Students Header ───────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1d1d1f] dark:bg-white text-white dark:text-black rounded-xl">
                            <Users size={24} />
                        </div>
                        <h1 className="text-[34px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-none">Student Roster</h1>
                    </div>
                    <p className="text-[17px] text-[#86868b] font-medium">Biometric database of authenticated entities.</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2d2d7] group-focus-within:text-[#0071e3] transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Query name or roll number..." 
                            className="w-full pl-12 pr-6 py-3.5 bg-white/40 border border-[#d2d2d7]/30 rounded-full focus:bg-white focus:border-[#0071e3]/30 outline-none transition-all text-[14px] font-medium text-[#1d1d1f] dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#1d1d1f] dark:bg-white text-white dark:text-black px-8 py-3.5 rounded-full flex items-center gap-2.5 hover:bg-slate-800 transition-all shadow-xl active:scale-95 shrink-0 font-bold text-[13px]"
                    >
                        <Plus size={18} />
                        <span>ENROLL ENTITY</span>
                    </button>
                </div>
            </div>

            {/* ── Tactical Overview ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Total Enrolled', value: students.length, accent: 'blue', icon: Users },
                    { label: 'System Integrity', value: 'Optimal', accent: 'green', icon: ShieldCheck },
                    { label: 'Network Pulse', value: 'LiveSync', accent: 'purple', icon: Activity },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-8 flex items-center gap-6 group hover:bg-white transition-all duration-500">
                        <div className={`p-3.5 rounded-2xl bg-white shadow-sm border border-[#d2d2d7]/30 transition-transform duration-500 group-hover:rotate-6`}>
                            <stat.icon size={24} className={stat.accent === 'blue' ? 'text-[#0071e3]' : stat.accent === 'green' ? 'text-[#34c759]' : 'text-[#af52de]'} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.1em] mb-1">{stat.label}</p>
                            <p className="text-[26px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight leading-none">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Data Ledger ─────────────────────────────────────────── */}
            <div className="glass-card overflow-hidden border-[#d2d2d7]/30 shadow-[0_15px_40px_rgba(0,0,0,0.03)]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f5f5f7]/50 border-b border-[#d2d2d7]/30">
                                <th className="px-10 py-5 text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em]">Biometric Profile</th>
                                <th className="px-10 py-5 text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em]">Identification UID</th>
                                <th className="px-10 py-5 text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em]">Academic Cohort</th>
                                <th className="px-10 py-5 text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em]">Security Status</th>
                                <th className="px-10 py-5 text-[11px] font-black text-[#86868b] uppercase tracking-[0.2em] text-right">Database Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5f5f7]">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="py-24 text-center">
                                        <RefreshCw className="animate-spin text-[#0071e3] mx-auto mb-4" size={32} />
                                        <p className="text-[13px] font-black text-[#86868b] uppercase tracking-[0.2em]">Syncing SAMS Core...</p>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-24 text-center">
                                        <div className="opacity-20 space-y-4">
                                            <UserMinus size={48} className="mx-auto" />
                                            <p className="text-[13px] font-black uppercase tracking-widest">No matching entities found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s) => (
                                    <tr key={s.id} className="hover:bg-[#f5f5f7]/30 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-white border border-[#d2d2d7]/50 shadow-sm overflow-hidden flex items-center justify-center shrink-0 transform group-hover:scale-110 transition-transform duration-500">
                                                    {s.photo_path ? (
                                                        <img 
                                                           src={`${API}/${s.photo_path.replace('app/', '')}`} 
                                                           alt={s.name} 
                                                           className="w-full h-full object-cover"
                                                           onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                                        />
                                                    ) : null}
                                                    <Users size={22} className="text-[#d2d2d7] hidden" />
                                                </div>
                                                <div>
                                                    <p className="text-[16px] font-bold text-[#1d1d1f] dark:text-white tracking-tight">{s.name}</p>
                                                    <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mt-1">Registry PK: {s.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="font-mono text-[14px] font-bold text-[#0071e3] bg-[#0071e3]/5 px-3 py-1.5 rounded-xl border border-[#0071e3]/10">
                                                {s.roll_no}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div>
                                                <p className="text-[13px] font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider">{s.section || 'Unassigned'}</p>
                                                <p className="text-[11px] font-bold text-[#86868b] mt-1">Group {s.student_group || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
                                                <span className="text-[11px] font-black text-[#34c759] uppercase tracking-widest px-2.5 py-1 bg-[#34c759]/5 rounded-full border border-[#34c759]/10">
                                                    Authorized
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button 
                                                onClick={() => handleDelete(s.id, s.name)}
                                                className="p-3 bg-[#ff3b30]/5 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white rounded-[1.2rem] transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Enrollment Portal (Modal) ──────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-[fadeIn_0.3s_ease-out]">
                    <div className="glass-card bg-white p-12 w-full max-w-[640px] max-h-[90vh] overflow-y-auto relative animate-[zoomIn_0.4s_cubic-bezier(0.2,0.8,0.2,1)] shadow-[0_40px_100px_rgba(0,0,0,0.15)]">
                        <button 
                           onClick={() => { setShowModal(false); stopCamera(); }} 
                           className="absolute top-8 right-8 p-2 hover:bg-[#f5f5f7] rounded-full transition-colors text-[#86868b]"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-12 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#1d1d1f] dark:bg-white text-white dark:text-black rounded-xl">
                                    <Command size={18} />
                                </div>
                                <h2 className="text-[28px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-tight">Biometric Enrollment</h2>
                            </div>
                            <p className="text-[15px] text-[#86868b] font-medium">Capture facial data for AI-driven identification.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest ml-1">Full Legal Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        className="w-full px-6 py-4 bg-[#f5f5f7] border border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#0071e3]/30 outline-none text-[15px] font-semibold text-[#1d1d1f] dark:text-white transition-all"
                                        value={newStudent.name}
                                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest ml-1">Identifier UID</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. 2024-SYS-05"
                                        className="w-full px-6 py-4 bg-[#f5f5f7] border border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#0071e3]/30 outline-none text-[15px] font-semibold text-[#1d1d1f] dark:text-white transition-all"
                                        value={newStudent.roll_no}
                                        onChange={(e) => setNewStudent({ ...newStudent, roll_no: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest ml-1">Section</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 23BDA-2"
                                        className="w-full px-6 py-4 bg-[#f5f5f7] border border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#0071e3]/30 outline-none text-[15px] font-semibold text-[#1d1d1f] dark:text-white transition-all"
                                        value={newStudent.section}
                                        onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest ml-1">Student Group</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. A"
                                        className="w-full px-6 py-4 bg-[#f5f5f7] border border-transparent rounded-[1.5rem] focus:bg-white focus:border-[#0071e3]/30 outline-none text-[15px] font-semibold text-[#1d1d1f] dark:text-white transition-all"
                                        value={newStudent.student_group}
                                        onChange={(e) => setNewStudent({ ...newStudent, student_group: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Activity size={14} className="text-[#0071e3]" />
                                    Optical Sample Capture
                                </label>
                                
                                {!isCameraOpen && !capturedImage && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="h-40 bg-[#f5f5f7] border-2 border-dashed border-[#d2d2d7] rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:bg-white hover:border-[#0071e3]/40 transition-all group active:scale-[0.98]"
                                        >
                                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-[#d2d2d7] group-hover:text-[#0071e3] transition-colors">
                                                <Camera size={24} />
                                            </div>
                                            <span className="font-bold text-[12px] tracking-[0.1em] text-[#86868b] uppercase">Activate Lens</span>
                                        </button>

                                        <div className="relative h-40 bg-[#f5f5f7] border-2 border-dashed border-[#d2d2d7] rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:bg-white group overflow-hidden">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                                onChange={(e) => {
                                                    if(e.target.files?.[0]) {
                                                        setNewStudent({ ...newStudent, photo: e.target.files[0] });
                                                        setCapturedImage(URL.createObjectURL(e.target.files[0]));
                                                    }
                                                }}
                                            />
                                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-[#d2d2d7] group-hover:text-[#0071e3] transition-colors">
                                                <RefreshCw size={24} />
                                            </div>
                                            <span className="font-bold text-[12px] tracking-[0.1em] text-[#86868b] uppercase">Upload Sample</span>
                                        </div>
                                    </div>
                                )}

                                {isCameraOpen && (
                                    <div className="relative rounded-[2.5rem] overflow-hidden bg-[#1d1d1f] aspect-video shadow-2xl border border-white/10 group">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center p-1 shadow-2xl active:scale-90 transition-all border-4 border-black/20"
                                        >
                                            <div className="w-full h-full rounded-full border-4 border-white bg-[#ff3b30]" />
                                        </button>
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                )}

                                {capturedImage && (
                                    <div className="relative rounded-[2.5rem] overflow-hidden aspect-video shadow-2xl border border-[#d2d2d7]/50 group">
                                        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => { setCapturedImage(null); startCamera(); }}
                                                className="bg-white text-[#1d1d1f] dark:text-white px-6 py-3 rounded-full text-[12px] font-bold shadow-xl active:scale-95 flex items-center gap-2"
                                            >
                                                <RefreshCw size={16} /> RECAPTURE
                                            </button>
                                        </div>
                                        <div className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2 bg-[#34c759] text-white rounded-full text-[10px] font-black tracking-widest shadow-lg">
                                            <ShieldCheck size={14} /> BIOMETRY VERIFIED
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-6 pt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); stopCamera(); }}
                                    className="flex-1 px-8 py-4.5 bg-[#f5f5f7] text-[#86868b] rounded-[1.5rem] font-bold text-[12px] tracking-[0.1em] hover:bg-[#d2d2d7]/30 transition-all active:scale-95 uppercase"
                                >
                                    Cancel
                                </button>
                                 <button
                                    type="submit"
                                    disabled={!newStudent.photo || isEnrolling}
                                    className={`flex-[2] py-4.5 rounded-[1.5rem] font-bold text-[12px] tracking-[0.1em] shadow-xl transition-all active:scale-[0.98] uppercase flex items-center justify-center gap-3 ${
                                        newStudent.photo && !isEnrolling
                                        ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-black hover:bg-slate-800' 
                                        : 'bg-[#f5f5f7] cursor-not-allowed text-[#d2d2d7]'
                                    }`}
                                >
                                    {isEnrolling && <RefreshCw className="animate-spin" size={16} />}
                                    <span>{isEnrolling ? 'Processing...' : 'Finalize Enrollment'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Students;
