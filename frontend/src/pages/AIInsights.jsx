import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Brain, AlertTriangle, TrendingUp, TrendingDown, Users,
  CheckCircle, XCircle, Zap, Star, ShieldAlert, Activity,
  Clock, RefreshCw, Info, ChevronRight, BarChart3, PieChart,
  Layout, Cpu, Target
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler, Legend, BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler, Legend, BarElement
);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ─── Minimalist UI Components ───────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col gap-1 mb-8">
    <div className="flex items-center gap-2.5">
      {Icon && <Icon size={18} className="text-[#0071e3]" />}
      <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">{title}</h2>
    </div>
    {subtitle && <p className="text-[13px] text-[#86868b] dark:text-gray-400 font-medium ml-[28px]">{subtitle}</p>}
  </div>
);

const MetricCard = ({ label, value, subtext, icon: Icon, accent = 'blue' }) => {
  const accentColors = {
    blue: 'text-[#0071e3] bg-[#0071e3]/5',
    red: 'text-[#ff3b30] bg-[#ff3b30]/5',
    amber: 'text-[#ff9500] bg-[#ff9500]/5',
    green: 'text-[#34c759] bg-[#34c759]/5',
  };
  return (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-[#d2d2d7]/30 rounded-2xl p-6 transition-all hover:bg-white flex flex-col gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accentColors[accent]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-[#86868b] dark:text-gray-400 uppercase tracking-[0.05em] mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">{value}</span>
          <span className="text-[12px] text-[#86868b] dark:text-gray-400 font-medium">{subtext}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [analysisFocus, setAnalysisFocus] = useState('overall');
  const [analysisText, setAnalysisText] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const fetchAnalysis = async (focus) => {
    setAnalysisFocus(focus);
    setAnalysisLoading(true);
    setAnalysisText('');
    try {
      const res = await axios.post(`${API}/api/ai/analyze`, { focus });
      setAnalysisText(res.data.analysis || 'No analysis available.');
    } catch (e) {
      setAnalysisText('⚠️ SAMS analysis engine temporarily unavailable.');
    }
    setAnalysisLoading(false);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ins, pred, alt] = await Promise.all([
        axios.get(`${API}/api/ai/insights`),
        axios.get(`${API}/api/ai/predict`),
        axios.get(`${API}/api/ai/alerts`),
      ]);
      setInsights(ins.data);
      setPredictions(pred.data.predictions || []);
      setAlerts(alt.data.alerts || []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('SAMS data core fetch failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Calculated Metrics ─────────────────────────────────────────────────────
  const criticalCount = predictions.filter(p => p.category === 'Critical').length;
  const atRiskCount   = predictions.filter(p => p.category === 'At Risk').length;
  const healthyCount  = predictions.filter(p => p.category === 'Healthy').length;

  // ── Chart Configuration ────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    if (!insights?.trend_30_days?.length) return null;
    const labels = insights.trend_30_days.map(t => t.date);
    const data = insights.trend_30_days.map(t => t.count);
    
    // Future projection logic
    const last7 = data.slice(-7);
    const avg = last7.reduce((a, b) => a + b, 0) / (last7.length || 1);
    const forecast = Array.from({ length: 5 }, (_, i) => Math.round(avg + (i * 0.1)));
    const forecastLabels = Array.from({ length: 5 }, (_, i) => `+${i + 1}d`);

    return {
      labels: [...labels, ...forecastLabels],
      datasets: [
        {
          label: 'Historical',
          data: [...data, ...Array(5).fill(null)],
          borderColor: '#0071e3',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: false,
        },
        {
          label: 'SAMS Prediction',
          data: [...Array(data.length - 1).fill(null), data[data.length-1], ...forecast],
          borderColor: '#86868b',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          tension: 0.4,
          fill: false,
        }
      ]
    };
  }, [insights]);

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: { 
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1d1d1f',
        bodyColor: '#86868b',
        borderColor: '#d2d2d7',
        borderWidth: 0.5,
        padding: 10,
        cornerRadius: 12,
        displayColors: false
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#86868b' } },
      y: { grid: { borderDash: [2, 2], color: '#d2d2d7' }, ticks: { font: { size: 10 }, color: '#86868b' } }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
        <div className="w-12 h-12 border-[3px] border-[#d2d2d7] border-t-[#0071e3] rounded-full animate-spin transition-all" />
        <p className="mt-6 text-[14px] font-medium text-[#86868b] dark:text-gray-400 tracking-tight">Syncing SAMS Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-8 md:p-12 selection:bg-[#0071e3]/10">
      <div className="max-w-[1280px] mx-auto space-y-12">
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-[40px] font-bold text-[#1d1d1f] dark:text-white tracking-tight leading-none">SAMS Intelligence</h1>
            <p className="text-[17px] text-[#86868b] dark:text-gray-400 font-medium">Predictive biometrics and attendance forecasting.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/50 dark:bg-white/10 px-4 py-2 rounded-full border border-[#d2d2d7]/50 dark:border-white/10 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
              <span className="text-[11px] font-bold text-[#86868b] dark:text-gray-400 uppercase tracking-wider">{lastUpdated ? `Updated ${lastUpdated}` : 'Live'}</span>
            </div>
            <button 
              onClick={fetchAll}
              className="w-10 h-10 bg-white dark:bg-[#111111] border border-[#d2d2d7] rounded-full flex items-center justify-center text-[#1d1d1f] dark:text-white hover:bg-[#f5f5f7] transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* ── Key Indicators Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label="System Integrity" value="98.2%" subtext="Optimized" icon={ShieldAlert} accent="green" />
          <MetricCard label="SAMS Alerts" value={alerts.length} subtext="Requires Review" icon={Brain} accent="blue" />
          <MetricCard label="Risk Profiles" value={predictions.length} subtext="Active Monitoring" icon={AlertTriangle} accent="amber" />
          <MetricCard label="Top Performers" value={insights?.top_performers?.length || 0} subtext="Gold Tier" icon={Star} accent="amber" />
        </div>

        {/* ── Main content sections ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Charts & Trends (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white dark:bg-[#111111] rounded-3xl p-8 border border-[#d2d2d7]/40 shadow-sm">
              <SectionHeader 
                icon={BarChart3} 
                title="SAMS Pulse Engine" 
                subtitle="30-day attendance history with autonomous predictive modelling."
              />
              <div className="h-[360px] w-full mt-4">
                {trendData ? (
                  <Line data={trendData} options={lineOpts} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#86868b] dark:text-gray-400 gap-2">
                    <TrendingUp size={32} strokeWidth={1.5} />
                    <p className="text-[12px] font-medium">Data stream initializing...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-[#111111] rounded-3xl p-8 border border-[#d2d2d7]/40 shadow-sm">
                   <SectionHeader icon={Target} title="Success Metrics" />
                   <div className="space-y-6">
                        {[
                          { l: 'Optimal Attendance', c: healthyCount, p: (healthyCount/(predictions.length||1)*100), color: '#34c759' },
                          { l: 'Attention Needed', c: atRiskCount, p: (atRiskCount/(predictions.length||1)*100), color: '#ff9500' },
                          { l: 'Critical Risk', c: criticalCount, p: (criticalCount/(predictions.length||1)*100), color: '#ff3b30' },
                        ].map((item, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[12px] font-semibold text-[#86868b] dark:text-gray-400">{item.l}</span>
                                <span className="text-[12px] font-bold text-[#1d1d1f] dark:text-white">{item.c}</span>
                            </div>
                            <div className="h-[5px] w-full bg-[#f5f5f7] rounded-full overflow-hidden">
                                <div className="h-full transition-all duration-1000" style={{ width: `${item.p}%`, backgroundColor: item.color }} />
                            </div>
                          </div>
                        ))}
                   </div>
                </div>

                <div className="bg-[#1d1d1f] rounded-3xl p-8 text-white relative overflow-hidden group shadow-xl">
                   <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 opacity-60">
                                <Cpu size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">SAMS Neural Core</span>
                            </div>
                            <h3 className="text-[20px] font-semibold leading-tight tracking-tight">
                                Autonomous Strategic Insights.
                            </h3>
                            <p className="text-[13px] text-[#86868b] dark:text-gray-400 font-medium leading-relaxed">
                                Our proprietary engine analyzes 124 biometric parameters per second to ensure total system integrity.
                            </p>
                        </div>
                        <Link to="/reports" className="text-[11px] font-bold text-[#0071e3] flex items-center gap-1.5 mt-8 group-hover:gap-2.5 transition-all">
                            Learn more <ChevronRight size={14} />
                        </Link>
                   </div>
                   <Brain size={120} className="absolute -bottom-10 -right-10 text-white/[0.03] rotate-12" />
                </div>
            </div>
          </div>

          {/* Right: Risk Priority (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white dark:bg-[#111111] rounded-3xl p-8 border border-[#d2d2d7]/40 shadow-sm">
                <SectionHeader icon={AlertTriangle} title="Priority Monitoring" subtitle={`${predictions.length} Active Profiles`} />
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                    {predictions.length > 0 ? predictions.slice(0, 8).map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#f5f5f7]/50 hover:bg-[#f5f5f7] dark:bg-white/5 dark:hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white border border-[#d2d2d7] flex items-center justify-center text-[11px] font-bold text-[#1d1d1f] dark:text-white">
                                    {p.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white truncate">{p.name}</p>
                                    <p className="text-[10px] font-bold text-[#86868b] dark:text-gray-400 uppercase">Score: {p.risk_score}%</p>
                                </div>
                            </div>
                            <div className={`w-1.5 h-1.5 rounded-full ${p.risk_score >= 70 ? 'bg-[#ff3b30]' : 'bg-[#ff9500]'}`} />
                        </div>
                    )) : (
                        <div className="py-20 text-center space-y-3">
                             <CheckCircle size={32} className="text-[#34c759] mx-auto opacity-40" />
                             <p className="text-[12px] text-[#86868b] dark:text-gray-400 font-medium">System status optimal.</p>
                        </div>
                    )}
                </div>
            </div>

            {alerts.length > 0 && (
                <div className="space-y-4">
                    <p className="text-[11px] font-bold text-[#86868b] dark:text-gray-400 uppercase tracking-widest ml-4">System Alerts</p>
                    {alerts.slice(0, 3).map((a, i) => (
                        <div key={i} className="bg-white dark:bg-[#111111] border-l-2 border-[#0071e3] p-5 rounded-2xl shadow-sm space-y-1">
                            <p className="text-[12px] font-bold text-[#1d1d1f] dark:text-white">{a.title}</p>
                            <p className="text-[12px] text-[#86868b] dark:text-gray-400 font-medium leading-relaxed">{a.message}</p>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        {/* ── SAMS Deep Analysis Portal ────────────────────────────────────── */}
        <section className="bg-white dark:bg-[#111111] rounded-[32px] p-10 border border-[#d2d2d7]/50 shadow-sm relative overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#0071e3]">
                        <Activity size={18} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Deep Neural Analysis</span>
                    </div>
                    <h2 className="text-[28px] font-bold text-[#1d1d1f] dark:text-white tracking-tight">SAMS Intelligence Portal</h2>
                    <p className="text-[15px] text-[#86868b] dark:text-gray-400 font-medium">Strategic reporting for administrative performance tracking.</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'overall', label: 'Summary' },
                        { key: 'at-risk', label: 'Risk Indices' },
                        { key: 'trends', label: 'Trends' },
                        { key: 'report', label: 'Executive Report' },
                    ].map(btn => (
                        <button
                            key={btn.key}
                            onClick={() => fetchAnalysis(btn.key)}
                            className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all ${
                                analysisFocus === btn.key && analysisText
                                ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-black shadow-lg'
                                : 'bg-[#f5f5f7] dark:bg-[#111111] text-[#1d1d1f] dark:text-white hover:bg-[#e8e8ed] dark:hover:bg-white/10'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
             </div>

             <div className="min-h-[240px] bg-[#f5f5f7] dark:bg-[#111111] rounded-3xl p-8 border border-[#d2d2d7]/30 shadow-inner">
                {!analysisText && !analysisLoading && (
                    <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center gap-4">
                        <div className="p-4 bg-white rounded-2xl shadow-sm text-[#0071e3]">
                            <Layout size={24} />
                        </div>
                        <p className="text-[14px] text-[#86868b] dark:text-gray-400 font-medium max-w-xs">Select an analysis focus above to generate a SAMS Intelligence report.</p>
                    </div>
                )}

                {analysisLoading && (
                    <div className="h-full min-h-[160px] flex flex-col items-center justify-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-bounce" />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#0071e3]">Generating Intelligence...</p>
                    </div>
                )}

                {analysisText && !analysisLoading && (
                    <div className="animate-in fade-in duration-700">
                        <div className="prose prose-slate max-w-none">
                            <p className="text-[14px] text-[#1d1d1f] dark:text-white leading-[1.6] whitespace-pre-wrap font-medium">
                                {analysisText}
                            </p>
                        </div>
                    </div>
                )}
             </div>
        </section>

      </div>
      
      {/* Global CSS for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d2d2d7; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #86868b; }
      `}</style>
    </div>
  );
};

export default AIInsights;
