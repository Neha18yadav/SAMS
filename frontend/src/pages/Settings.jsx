import { Settings as SettingsIcon, ShieldCheck } from 'lucide-react';

const Settings = () => {
    return (
        <div className="p-8 md:p-12 space-y-12 animate-sams-fade max-w-[1600px] mx-auto bg-transparent relative z-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-[#d2d2d7]/50 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                        <SettingsIcon size={24} className="text-[#1d1d1f]" />
                    </div>
                    <div>
                        <h1 className="text-[28px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-tight">System Settings</h1>
                        <p className="text-[12px] text-[#86868b] font-bold uppercase tracking-widest mt-1">Profile & Preferences</p>
                    </div>
                </div>
            </header>

            <div className="bg-white/40 backdrop-blur-xl border border-white/40 p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.01)] min-h-[500px] flex flex-col items-center justify-center text-center">
                <ShieldCheck size={48} className="text-[#34c759] opacity-50 mb-6" />
                <h2 className="text-[20px] font-bold text-[#1d1d1f] dark:text-white mb-2">Profile Secured</h2>
                <p className="text-[14px] text-[#86868b] max-w-md">Your biometric identity and preference configurations conform to SAMS core security standards. Advanced parameters are locked.</p>
            </div>
        </div>
    );
};

export default Settings;
