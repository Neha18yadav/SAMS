import React, { useState } from 'react';
import { ArrowRight, Play, Activity, ShieldCheck, Zap, Users, ScanFace, CheckCircle2, Command, Cpu, Layers, Network, Globe, Lock, Shield, Key, FileText, Instagram, Linkedin, Github, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const Landing = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            q: "How accurate is the biometric recognition?",
            a: "SAMS Intelligence achieves 99.8% precision under optimal conditions using our proprietary vector hashing and neural pipeline. The system is designed to minimize false positives while maintaining high-speed identification."
        },
        {
            q: "Is student data stored securely?",
            a: "Yes. We never store raw biometric images. All data is converted into high-dimensional cryptographic hashes and protected by quantum-safe JWTs with rotating entropy keys, ensuring maximum privacy."
        },
        {
            q: "Can it integrate with existing ERP systems?",
            a: "Absolutely. Our Unified API provides RESTful endpoints that allow for seamless data synchronization with most institutional management software (IMS) and student records systems."
        },
        {
            q: "Does it work offline?",
            a: "Our Hybrid Edge-Cloud architecture allows for on-device processing, ensuring that biometric identification remains functional even during total network outages."
        },
        {
            q: "What are the hardware requirements?",
            a: "SAMS is designed to run on standard modern hardware. Our edge recognition module is highly optimized for efficiency, minimizing the need for specialized or expensive equipment."
        }
    ];

    return (
        <div className="relative min-h-screen w-full bg-transparent overflow-x-hidden font-sans text-[#1d1d1f] dark:text-white flex flex-col animate-sams-fade">

            {/* ── Ambient Background Layer (Handled Globally by App.jsx) ─────── */}
            <div className="fixed inset-0 pointer-events-none z-0" />

            {/* ── Navigation ─────────────────────────────────────────────────── */}
            <nav className="absolute top-0 w-full z-50 flex justify-between items-center px-8 md:px-16 py-10 bg-transparent">
                <Link to="/" className="flex items-center gap-3 group cursor-pointer outline-none">
                    <div className="w-10 h-10 rounded-xl bg-[#1d1d1f] dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                        <Command size={20} />
                    </div>
                    <div>
                        <span className="text-[20px] font-bold tracking-tighter leading-none block">SAMS</span>
                        <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.2em] mt-0.5 block">Intelligence</span>
                    </div>
                </Link>

                <div className="hidden lg:flex items-center gap-12 text-[13px] font-bold tracking-tight uppercase text-[#86868b]">
                    <a href="#architecture" className="hover:text-[#1d1d1f] dark:text-white transition-colors">Architecture</a>
                    <a href="#security" className="hover:text-[#1d1d1f] dark:text-white transition-colors">Security</a>
                    <a href="#performance" className="hover:text-[#1d1d1f] dark:text-white transition-colors">Performance</a>
                    <Link to="/login" className="text-[#0071e3] hover:opacity-80 transition-opacity">Access Terminal</Link>
                </div>

                <div className="flex items-center gap-6">
                    <ThemeToggle />
                    <Link to="/login">
                        <button className="flex items-center gap-3 bg-[#1d1d1f] dark:bg-white text-white dark:text-black px-7 py-3 rounded-full text-[13px] font-bold tracking-tight hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-black/5 group">
                            <span>Get Started</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
            </nav>

            {/* ── Hero Section ───────────────────────────────────────────────── */}
            <main className="relative z-10 w-full max-w-[1600px] mx-auto min-h-screen flex flex-col justify-center px-6 md:px-12 pt-32 pb-20">
                <div className="flex flex-col md:flex-row items-center justify-between w-full h-full gap-8">

                    {/* Left Side: Minimal Typography */}
                    <div className="w-full md:w-[40%] flex flex-col items-start justify-center z-30 mb-8 md:mb-0">
                        <h2 className="text-[11vw] md:text-[6vw] lg:text-[5vw] xl:text-[4.5vw] font-light text-[#1d1d1f] dark:text-white leading-[1.1] tracking-tight mb-10 text-left break-words animate-[fadeIn_0.8s_ease-out]">
                            Track smarter. <br /> Manage better.
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 animate-[fadeIn_1s_ease-out]">
                            <Link to="/login">
                                <button className="flex items-center space-x-2 bg-[#d7ff2e] text-black px-8 py-4 rounded-full text-sm font-extrabold uppercase tracking-wider hover:bg-[#cbf522] transition-all shadow-[0_10px_30px_rgba(215,255,46,0.1)] hover:-translate-y-1 active:translate-y-0">
                                    <span>Platform</span>
                                    <ArrowRight size={18} className="-rotate-45" />
                                </button>
                            </Link>
                            <a href="#performance">
                                <button className="flex items-center space-x-2 bg-[#1d1d1f] dark:bg-white text-white dark:text-black px-8 py-4 rounded-full text-sm font-extrabold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 border border-slate-800">
                                    <span>Explore</span>
                                    <ArrowRight size={18} className="rotate-90 md:rotate-0" />
                                </button>
                            </a>
                        </div>
                    </div>

                    {/* Center: Pure CSS / React UI Mockup Component */}
                    <div className="w-full md:w-[30%] flex justify-center items-center relative z-20 mb-16 md:mb-0 animate-[fadeIn_1.2s_ease-out]">
                        {/* Glass Widget Card */}
                        <div className="relative w-full max-w-[340px] glass-card p-8 transform rotate-3 hover:rotate-0 transition-transform duration-700 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border-white/80">

                            {/* App Header */}
                            <div className="flex items-center justify-between mb-8 pb-5 border-b border-[#f5f5f7]">
                                <div>
                                    <h3 className="font-bold text-xl text-[#1d1d1f] dark:text-white tracking-tight">Access Node</h3>
                                    <p className="text-[10px] text-[#0071e3] font-bold tracking-widest uppercase mt-1 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse mr-2" />
                                        Monitoring
                                    </p>
                                </div>
                                <div className="p-3 bg-[#f5f5f7] text-[#1d1d1f] dark:text-white rounded-2xl shadow-inner border border-[#d2d2d7]/50">
                                    <ScanFace size={22} className="opacity-80" />
                                </div>
                            </div>

                            {/* Identity Element */}
                            <div className="flex flex-col items-center justify-center space-y-6 relative py-4">
                                <div className="absolute inset-x-6 h-0.5 bg-gradient-to-r from-transparent via-[#0071e3]/40 to-transparent blur-[1px] shadow-[0_0_15px_rgba(0,113,227,0.4)] animate-pulse z-20" style={{ top: '35%' }} />

                                <div className="w-24 h-24 rounded-full bg-[#f5f5f7] border-4 border-white shadow-xl flex items-center justify-center relative z-10 overflow-hidden group">
                                    <Users size={40} className="text-[#d2d2d7] transition-colors group-hover:text-[#0071e3]" />
                                    {/* Scan Ring */}
                                    <div className="absolute inset-0 border-[3px] border-[#0071e3]/30 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                                </div>

                                <div className="text-center z-10">
                                    <p className="font-bold text-[#1d1d1f] dark:text-white text-lg tracking-tight">Active Entity</p>
                                    <p className="text-[11px] text-[#34c759] font-bold uppercase tracking-widest mt-1.5 flex items-center justify-center bg-[#34c759]/5 rounded-full px-3 py-1 border border-[#34c759]/10 shadow-sm">
                                        <CheckCircle2 size={12} className="mr-1.5" /> ID Verified 99.9%
                                    </p>
                                </div>
                            </div>

                            {/* Live Stats */}
                            <div className="mt-8 grid grid-cols-2 gap-3">
                                <div className="bg-[#f5f5f7]/60 rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
                                    <p className="text-[9px] text-[#86868b] uppercase font-black tracking-widest">Entry Time</p>
                                    <p className="font-bold text-[#1d1d1f] dark:text-white tracking-tighter mt-1 text-base">08:42 AM</p>
                                </div>
                                <div className="bg-[#f5f5f7]/60 rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
                                    <p className="text-[9px] text-[#86868b] uppercase font-black tracking-widest">Latency</p>
                                    <p className="font-bold text-[#1d1d1f] dark:text-white tracking-tighter mt-1 text-base">14ms</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Welcome Text */}
                    <div className="w-full md:w-[30%] flex flex-col items-start md:items-end justify-center text-left md:text-right z-30 animate-[fadeIn_1.4s_ease-out]">
                        <div className="max-w-[320px]">
                            <h3 className="text-[22px] font-bold uppercase text-[#1d1d1f] dark:text-white mb-5 tracking-tight leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">
                                Welcome To SAMS
                            </h3>
                            <p className="text-[15px] font-medium text-[#86868b] leading-relaxed tracking-tight">
                                A modern, intelligent attendance system designed to make tracking seamless, accurate, and beautifully simple.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Sub-component: Feature Card ────────────────────────────────── */}
            {(() => {
                const FeatureCard = ({ title, desc, icon: Icon, color, image }) => (
                    <div className="w-[380px] h-[520px] glass-card overflow-hidden group flex flex-col flex-shrink-0 transition-all duration-700 hover:shadow-[0_30px_90px_rgba(0,0,0,0.12)] border-white/60 mx-4">
                        <div className="h-[240px] w-full overflow-hidden relative">
                            <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1d1d1f]/40 to-transparent" />
                            <div className={`absolute top-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md border border-white/20 ${color === 'blue' ? 'bg-[#0071e3] text-white dark:text-black' :
                                color === 'green' ? 'bg-[#34c759] text-white dark:text-black' :
                                    color === 'amber' ? 'bg-[#ff9500] text-white dark:text-black' : 'bg-[#af52de] text-white dark:text-black'
                                }`}>
                                <Icon size={24} />
                            </div>
                        </div>
                        <div className="p-10 flex flex-col justify-between flex-1">
                            <div className="space-y-4">
                                <h3 className="text-[24px] font-bold text-[#1d1d1f] dark:text-white tracking-tight">{title}</h3>
                                <p className="text-[16px] text-[#86868b] font-medium leading-relaxed">{desc}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-[#1d1d1f] dark:text-white/30 group-hover:text-[#0071e3] transition-colors">
                                <span>Explore Module</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                );

                const MarqueeSection = ({ id, label, title, subtitle, items, colorClass }) => (
                    <section id={id} className="relative z-20 pt-32 pb-16 bg-transparent border-t border-[#f5f5f7]/50 overflow-hidden">
                        <div className="max-w-[1600px] mx-auto px-8 md:px-16 mb-8">
                            <div className="flex flex-col lg:flex-row justify-between items-end gap-10 border-b border-[#f5f5f7] pb-8">
                                <div className="max-w-2xl space-y-4">
                                    <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${colorClass}`}>{label}</span>
                                    <h2 className="text-[48px] md:text-[64px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-none" dangerouslySetInnerHTML={{ __html: title }} />
                                </div>
                                <p className="max-w-[320px] text-[16px] text-[#86868b] font-medium leading-relaxed font-sans">
                                    {subtitle}
                                </p>
                            </div>
                        </div>

                        <div className="relative flex overflow-hidden">
                            <div className="flex animate-marquee whitespace-nowrap py-4">
                                {[...items, ...items].map((f, i) => (
                                    <FeatureCard key={i} {...f} />
                                ))}
                            </div>
                        </div>
                    </section>
                );

                return (
                    <>
                        <MarqueeSection
                            id="architecture"
                            label="System Topology"
                            title="Hybrid Edge-Cloud. <br/> Distributed Intelligence."
                            subtitle="Our architecture bridges local biometric processing with cloud-scale analytics for ultimate reliability."
                            colorClass="text-[#af52de]"
                            items={[
                                { title: 'Edge Recognition', desc: 'On-device biometric processing for sub-50ms identification and offline resilience.', icon: Cpu, color: 'purple', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800' },
                                { title: 'SQL Core', desc: 'ACID-compliant data persistence with massive relational indexing for data integrity.', icon: Layers, color: 'blue', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=800' },
                                { title: 'Neural Pipeline', desc: 'Direct Groq/Llama-3 integration for real-time pedagogical analytics and insights.', icon: Network, color: 'green', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800' },
                                { title: 'Unified API', desc: 'Restful endpoints providing seamless interconnectivity across all institutional nodes.', icon: Globe, color: 'amber', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800' },
                            ]}
                        />

                        <MarqueeSection
                            id="performance"
                            label="The SAMS Engine"
                            title="Performance. <br/> Without Compromise."
                            subtitle="Our proprietary neural architecture scales instantly to your institutional demands."
                            colorClass="text-[#0071e3]"
                            items={[
                                { title: 'Neural Real-Time', desc: 'Watch metrics synchronize instantly with zero-latency biometric streaming.', icon: Activity, color: 'blue', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800' },
                                { title: 'Optical Precision', desc: '99.8% precision across varying lighting conditions and facial vectors.', icon: ShieldCheck, color: 'green', image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800' },
                                { title: 'Extreme Velocity', desc: 'Securely authenticate an entire population in micro-moments.', icon: Zap, color: 'amber', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800' },
                                { title: 'Infinite Scale', desc: 'Manage thousands of entities and active nodes from a single core.', icon: Users, color: 'purple', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800' },
                            ]}
                        />

                        <MarqueeSection
                            id="security"
                            label="Fortified Integrity"
                            title="Safety. <br/> By Design."
                            subtitle="Military-grade encryption and privacy-first protocols ensure student data remains strictly confidential."
                            colorClass="text-[#34c759]"
                            items={[
                                { title: 'Quantum-Safe JWT', desc: 'Industry-standard session tokens with rotating entropy keys and multi-factor validation.', icon: Key, color: 'blue', image: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&q=80&w=800' },
                                { title: 'Vector Hashing', desc: 'Biometric data is never stored as raw images—only high-dimension cryptographic hashes.', icon: Shield, color: 'green', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800' },
                                { title: 'RBAC Protocol', desc: 'Granular role-based access control enforced at the kernel level for every single endpoint.', icon: Lock, color: 'amber', image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800' },
                                { title: 'Audit Trails', desc: 'Immutable, time-stamped logging of every access event across the entire SAMS network.', icon: FileText, color: 'purple', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800' },
                            ]}
                        />
                    </>
                );
            })()}

            {/* ── FAQ Section ─────────────────────────────────────────────────── */}
            <section className="relative z-20 py-40 px-8">
                <div className="max-w-[1000px] mx-auto">
                    <div className="text-center mb-24 space-y-4">
                        <span className="text-[11px] font-black text-[#0071e3] uppercase tracking-[0.3em]">Common Queries</span>
                        <h2 className="text-[48px] md:text-[64px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-none">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {faqs.map((faq, i) => (
                            <div key={i} className="glass-card overflow-hidden border-white/60">
                                <button
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    className="w-full flex items-center justify-between p-8 text-left transition-colors hover:bg-white/40"
                                >
                                    <span className="text-[20px] font-bold tracking-tight text-[#1d1d1f] dark:text-white">{faq.q}</span>
                                    <ChevronDown
                                        className={`transition-transform duration-500 text-[#86868b] ${openIndex === i ? 'rotate-180' : ''}`}
                                        size={24}
                                    />
                                </button>
                                <div
                                    className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${openIndex === i ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="p-8 pt-0 text-[16px] text-[#86868b] font-medium leading-relaxed border-t border-[#f5f5f7]/50">
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ─────────────────────────────────────────────────── */}
            <section className="relative z-20 py-32 px-8 overflow-hidden">
                <div className="max-w-[1400px] mx-auto rounded-[3rem] bg-gradient-to-br from-[#1d1d1f] to-[#000] p-16 md:p-24 text-center relative overflow-hidden shadow-2xl">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-full bg-gradient-to-b from-blue-500/10 to-transparent blur-[120px] pointer-events-none" />

                    <div className="relative z-10 space-y-10 max-w-3xl mx-auto">
                        <h2 className="text-[40px] md:text-[60px] font-bold text-white tracking-tight leading-[1.1]">
                            Ready to transform your institutional attendance?
                        </h2>
                        <p className="text-[18px] md:text-[20px] text-white/90 font-medium">
                            Join hundreds of educational institutions that are tracking smarter with SAMS Intelligence.
                        </p>
                        <div className="pt-6">
                            <Link to="/login">
                                <button className="bg-white text-[#1d1d1f] px-10 py-5 rounded-full text-[15px] font-bold tracking-tight hover:bg-[#e8e8ed] transition-all active:scale-95 shadow-xl">
                                    Start for free
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer Section ─────────────────────────────────────────────── */}
            <footer className="relative z-20 pb-20 px-8">
                <div className="max-w-[1400px] mx-auto glass-card p-12 md:p-20 border-white/80">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">

                        {/* Brand & Mission */}
                        <div className="col-span-1 lg:col-span-5 space-y-10">
                            <Link to="/" className="flex items-center gap-3 outline-none cursor-pointer group">
                                <div className="w-10 h-10 rounded-xl bg-[#1d1d1f] dark:bg-white text-white dark:text-black flex items-center justify-center transition-transform duration-500 group-hover:rotate-12">
                                    <Command size={20} />
                                </div>
                                <div>
                                    <span className="text-[20px] font-bold tracking-tighter leading-none block">SAMS</span>
                                    <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-[0.2em] mt-0.5 block">Intelligence</span>
                                </div>
                            </Link>

                            <p className="text-[15px] text-[#86868b] font-medium leading-relaxed max-w-sm">
                                SAMS empowers institutions to transform attendance data into clear, actionable insights — making management easier to scale and understand.
                            </p>

                            <div className="flex items-center gap-6 text-[#1d1d1f] dark:text-white/60 hover:text-[#1d1d1f] dark:text-white">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="cursor-pointer hover:scale-110 transition-transform">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z" />
                                </svg>
                                <Instagram size={20} className="cursor-pointer hover:scale-110 transition-transform" />
                                <Linkedin size={20} className="cursor-pointer hover:scale-110 transition-transform" />
                                <Github size={20} className="cursor-pointer hover:scale-110 transition-transform" />
                            </div>
                        </div>

                        {/* Links Grid */}
                        <div className="col-span-1 lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-8">
                            <div className="space-y-6">
                                <h4 className="text-[13px] font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider">Product</h4>
                                <ul className="space-y-4 text-[14px] text-[#86868b] font-medium">
                                    <li><a href="#architecture" className="hover:text-[#1d1d1f] dark:text-white transition-colors">Architecture</a></li>
                                    <li><a href="#security" className="hover:text-[#1d1d1f] dark:text-white transition-colors">Security</a></li>
                                    <li><a href="#performance" className="hover:text-[#1d1d1f] dark:text-white transition-colors">Performance</a></li>
                                    <li><Link to="/login" className="hover:text-[#1d1d1f] dark:text-white transition-colors">Access Terminal</Link></li>
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[13px] font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider">Resources</h4>
                                <ul className="space-y-4 text-[14px] text-[#86868b] font-medium">
                                    <li className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors">Documentation</li>
                                    <li className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors">Tutorials</li>
                                    <li className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors">Blog</li>
                                    <li className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors">Support</li>
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[13px] font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider">Company</h4>
                                <ul className="space-y-4 text-[14px] text-[#86868b] font-medium">
                                    <li className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors">About</li>
                                    <li className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors">Careers</li>
                                    <li className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors">Contact</li>
                                    <li className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors">Partners</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-20 pt-10 border-t border-[#f5f5f7] flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[13px] text-[#86868b] font-medium">
                            © 2026 SAMS Intelligence. All rights reserved.
                        </p>
                        <div className="flex items-center gap-8 text-[13px] text-[#86868b] font-bold">
                            <span className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors underline-offset-4 hover:underline">Privacy Policy</span>
                            <span className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors underline-offset-4 hover:underline">Terms of Service</span>
                            <span className="hover:text-[#1d1d1f] dark:text-white cursor-pointer transition-colors underline-offset-4 hover:underline">Cookies Settings</span>
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    display: flex;
                    animation: marquee 40s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes zoomIn {
                    from { opacity: 0; scale: 0.95; }
                    to { opacity: 1; scale: 1; }
                }
            `}</style>
        </div>
    );
};

export default Landing;
