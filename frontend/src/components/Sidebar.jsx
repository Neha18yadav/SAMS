import { LayoutDashboard, Users, FileText, LogOut, Camera, ShieldCheck, Brain, Sparkles, Command } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Sidebar = ({ userRole }) => {
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'user'] },
        { name: 'Mark Attendance', icon: Camera, path: '/attendance', roles: ['admin'] },
        { name: 'Student Roster', icon: Users, path: '/students', roles: ['admin'] },
        { name: 'AI Intelligence', icon: Brain, path: '/ai-insights', roles: ['admin'], isAI: true },
        { name: 'Reports Archive', icon: FileText, path: '/reports', roles: ['admin'] },
    ];

    const visibleItems = menuItems.filter(item => item.roles.includes(userRole || 'user'));

    return (
        <div className="w-[280px] bg-white/40 dark:bg-[#111111]/40 backdrop-blur-3xl border-r border-[#d2d2d7]/30 dark:border-white/10 h-full flex flex-col relative z-20 transition-colors duration-500">
            {/* SAMS Branding */}
            <div className="p-10 pb-8 flex flex-col gap-6">
                <Link to="/" className="flex items-center gap-3 group px-2 cursor-pointer outline-none">
                    <div className="w-9 h-9 rounded-xl bg-[#1d1d1f] dark:bg-white text-white dark:text-black flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 shadow-sm">
                        <Command size={18} />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold text-[#1d1d1f] dark:text-white tracking-tighter leading-none">SAMS</h1>
                        <p className="text-[9px] font-bold text-[#86868b] uppercase tracking-[0.2em] mt-1 ml-0.5">Intelligence</p>
                    </div>
                </Link>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 border border-[#d2d2d7]/50 dark:border-white/10 rounded-full w-fit mx-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <ShieldCheck size={12} className="text-[#0071e3]" />
                    <span className="text-[10px] font-bold text-[#1d1d1f] dark:text-white uppercase tracking-widest">{userRole || 'Admin'} Profile</span>
                </div>
            </div>

            {/* Navigation Navigation */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                <p className="px-6 text-[10px] font-bold text-[#86868b] uppercase tracking-[0.15em] mb-4">Core Modules</p>
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.includes(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center justify-between px-6 py-3.5 rounded-2xl transition-all duration-300 font-semibold tracking-tight group ${
                                isActive
                                    ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-black shadow-lg'
                                    : 'text-[#86868b] hover:bg-white/60 dark:hover:bg-white/10 hover:text-[#1d1d1f] dark:hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={18} className={isActive ? 'text-[#0071e3]' : 'group-hover:text-[#1d1d1f] dark:group-hover:text-white'} />
                                <span className="text-[14px]">{item.name}</span>
                            </div>
                            {item.isAI && !isActive && (
                                <Sparkles size={12} className="text-[#0071e3] transition-transform group-hover:scale-125" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Session */}
            <div className="p-8 border-t border-[#d2d2d7]/20 dark:border-white/10">
                <div className="mb-6 flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.1em]">Appearance</span>
                    <ThemeToggle />
                </div>
                <button 
                  onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
                  className="flex items-center gap-3 px-6 py-4 text-[#ff3b30] hover:bg-[#ff3b30]/5 rounded-2xl w-full transition-all group font-semibold text-[14px]"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Terminate Session</span>
                </button>
                <p className="mt-4 text-center text-[10px] text-[#86868b] font-medium tracking-tight">SAMS v2.4.0 · Production</p>
            </div>
        </div>
    );
};

export default Sidebar;
