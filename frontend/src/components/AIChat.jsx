import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const SUGGESTIONS = [
  'Who was absent today?',
  'Show at-risk students',
  'Today\'s attendance rate',
  'Who are the top performers?',
];

const AIChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "👋 Hi! I'm SAMS, your intelligent attendance assistant.\nHow can I help you today?",
      ts: '',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');

    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newUserMsg = { role: 'user', text: msg, ts };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    const history = updatedMessages.slice(1).map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }));

    try {
      const res = await axios.post(`${API}/api/ai/chat`, {
        message: msg,
        history: history.slice(0, -1),
      });
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: res.data.reply, ts: res.data.timestamp || ts }
      ]);
    } catch {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: '⚠️ SAMS engine connection error. Please try again.', ts }
      ]);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Minimalist Toggle Button ───────────────────────────────────────── */}
      <button
        id="ai-chat-toggle"
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full shadow-lg
          bg-[#1d1d1f] text-white flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95
          ${open ? 'rotate-0' : 'rotate-0'}`}
        aria-label="Toggle SAMS AI"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* ── Minimalist Chat Panel ──────────────────────────────────────────── */}
      <div
        className={`fixed bottom-[100px] right-8 z-50 w-[380px] h-[600px] max-h-[80vh] flex flex-col
          bg-white/95 backdrop-blur-2xl border border-[#d2d2d7]/50
          rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)]
          transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] origin-bottom-right
          ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f5f7]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#0071e3]">
              <Sparkles size={16} fill="currentColor" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1d1d1f]">SAMS Intelligence</p>
              <p className="text-[11px] text-[#86868b] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" /> Online
              </p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-[#86868b] hover:text-[#1d1d1f] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-[1.2rem] text-[14px] leading-relaxed
                ${m.role === 'bot'
                  ? 'bg-[#f5f5f7] text-[#1d1d1f] rounded-bl-none'
                  : 'bg-[#0071e3] text-white rounded-br-none shadow-sm'}`}>
                {m.text}
              </div>
              {m.ts && <span className="text-[10px] text-[#86868b] mt-1.5 mx-1 font-medium">{m.ts}</span>}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start">
              <div className="bg-[#f5f5f7] rounded-[1.2rem] rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map(d => (
                    <span key={d} className="w-1.5 h-1.5 bg-[#86868b]/40 rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion pills (only if few messages) */}
        {messages.length <= 2 && (
          <div className="px-6 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-[12px] px-4 py-2 bg-white border border-[#d2d2d7] text-[#1d1d1f] font-medium rounded-full hover:bg-[#f5f5f7] transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="p-6">
          <div className="flex items-center gap-2 bg-[#f5f5f7] rounded-2xl px-4 py-3 border border-transparent focus-within:border-[#0071e3]/30 focus-within:bg-white transition-all shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message SAMS..."
              className="flex-1 bg-transparent text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none font-medium"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className={`p-1.5 rounded-full transition-all ${
                input.trim() && !isTyping ? 'text-[#0071e3]' : 'text-[#d2d2d7]'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d2d2d7; border-radius: 10px; }
      `}</style>
    </>
  );
};

export default AIChat;
