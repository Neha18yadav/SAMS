import { useState } from 'react';
import { Lock, User, ArrowRight, Loader2, ShieldCheck, Command } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Login = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [signupRole, setSignupRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/api/login' : '/api/signup';
        try {
            const payload = { username, password };
            if (!isLogin) payload.role = signupRole;

            const res = await axios.post(`${API}${endpoint}`, payload);

            if (isLogin) {
                const userRole = res.data.role || 'user';
                onLogin(userRole, res.data.token);
                navigate('/dashboard');
            } else {
                setIsLogin(true);
                setPassword('');
                setError('Identity secured. Please authenticate.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication denied.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-transparent flex items-center justify-center p-6 animate-sams-fade relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-[440px] relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <div className="w-16 h-16 bg-[#1d1d1f] text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl transform hover:rotate-12 transition-transform duration-700">
                        <Command size={32} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-[32px] font-bold text-[#1d1d1f] tracking-tighter">SAMS Intelligence</h1>
                        <p className="text-[14px] text-[#86868b] font-medium tracking-tight">Smart Automated Management System</p>
                    </div>
                </div>

                <div className="glass-card p-10 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border-white/60">
                    <div className="mb-8">
                        <h2 className="text-[20px] font-bold text-[#1d1d1f] tracking-tight">
                            {isLogin ? 'Authenticate' : 'Initialize Identity'}
                        </h2>
                        <p className="text-[13px] text-[#86868b] font-medium mt-1">
                            {isLogin ? 'Access the biometric gateway.' : 'Register a new security profile.'}
                        </p>
                    </div>

                    {error && (
                        <div className={`mb-8 p-4 rounded-2xl text-[12px] font-bold uppercase tracking-widest text-center ${error.includes('secured') ? 'bg-[#34c759]/5 text-[#34c759]' : 'bg-[#ff3b30]/5 text-[#ff3b30] border border-[#ff3b30]/10'}`}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div className="flex bg-[#f5f5f7] p-1.5 rounded-2xl border border-[#d2d2d7]/30">
                                <button
                                    type="button"
                                    onClick={() => setSignupRole('user')}
                                    className={`flex-1 py-3 rounded-[14px] text-[11px] font-bold uppercase tracking-widest transition-all ${signupRole === 'user' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'}`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSignupRole('admin')}
                                    className={`flex-1 py-3 rounded-[14px] text-[11px] font-bold uppercase tracking-widest transition-all ${signupRole === 'admin' ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'}`}
                                >
                                    Faculty
                                </button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest ml-1">Identity Handle</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-[#d2d2d7] group-focus-within:text-[#0071e3] transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-13 pr-6 py-4 bg-[#f5f5f7]/50 border border-transparent rounded-[1.2rem] focus:bg-white focus:border-[#0071e3]/30 outline-none transition-all text-[15px] font-medium text-[#1d1d1f]"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest ml-1">Security Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#d2d2d7] group-focus-within:text-[#0071e3] transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-13 pr-6 py-4 bg-[#f5f5f7]/50 border border-transparent rounded-[1.2rem] focus:bg-white focus:border-[#0071e3]/30 outline-none transition-all text-[15px] font-medium text-[#1d1d1f]"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center bg-[#1d1d1f] text-white py-4.5 rounded-[1.2rem] font-bold text-[14px] tracking-tight hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-black/5 group mt-4"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin text-[#86868b]" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>{isLogin ? 'Authenticate Access' : 'Establish Identity'}</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center border-t border-[#f5f5f7] pt-8">
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); }}
                            className="text-[13px] font-semibold text-[#0071e3] hover:text-[#0071e3]/80 transition-colors"
                        >
                            {isLogin ? "New user? Request scope access" : "Already registered? Authentication gateway"}
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-[#86868b] font-bold uppercase tracking-[0.2em]">
                    SAMS Terminal · v2.4.0 High-Security
                </p>
            </div>

            <style>{`
                .pl-13 { padding-left: 3.25rem; }
            `}</style>
        </div>
    );
};

export default Login;
