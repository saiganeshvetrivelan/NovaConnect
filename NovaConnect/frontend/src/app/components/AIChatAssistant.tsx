"use client";
import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, ChevronDown, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Link from 'next/link';

const NAV_MAP: Record<string, string> = {
    'Go to Assignments': '/assignments',
    'View my submissions': '/assignments',
    'Check deadlines': '/assignments',
    'View attendance records': '/attendance',
    'Check attendance percentage': '/attendance',
    'Browse my courses': '/courses',
    'Open course forum': '/forum',
    'View resources': '/resources',
    'Open Messages': '/messages',
    'Compose new message': '/messages',
    'View Dashboard': '/dashboard',
    'Check Assignments': '/assignments',
    'Browse Courses': '/courses',
};

interface Message { role: 'user' | 'ai'; text: string; suggestions?: string[]; ts: Date; }

export default function AIChatAssistant() {
    const { user } = useApp();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm **Nova**, your AI academic assistant. Ask me anything about the platform, your courses, assignments, or attendance!`, suggestions: ['What is my attendance?', 'How do I submit an assignment?', 'Where are my courses?'], ts: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [unread, setUnread] = useState(0);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) { setUnread(0); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); inputRef.current?.focus(); }
    }, [open, messages]);

    const sendMessage = async (text?: string) => {
        const msg = (text || input).trim();
        if (!msg) return;
        setInput('');
        const userMsg: Message = { role: 'user', text: msg, ts: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:8000/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, user_role: user?.role || 'Student', conversation_history: [] })
            });
            if (res.ok) {
                const data = await res.json();
                const aiMsg: Message = { role: 'ai', text: data.response, suggestions: data.suggested_actions, ts: new Date() };
                setMessages(prev => [...prev, aiMsg]);
                if (!open) setUnread(u => u + 1);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting right now. Please try again in a moment.", ts: new Date() }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'ai', text: "I'm offline at the moment. The AI service may not be running. Please try again later.", ts: new Date() }]);
        }
        setIsLoading(false);
    };

    const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const renderText = (text: string) => {
        // Bold markdown **text**
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p);
    };

    return (
        <>
            {/* Floating toggle button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-full shadow-2xl shadow-indigo-300 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                title="AI Assistant"
            >
                {open ? <X size={22} /> : <Bot size={22} />}
                {!open && unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                        {unread}
                    </span>
                )}
            </button>

            {/* Chat window */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl shadow-indigo-200/50 border border-indigo-100 flex flex-col overflow-hidden"
                    style={{ height: '520px' }}>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-black text-sm">Nova AI Assistant</p>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-indigo-200 text-xs font-medium">Online & ready</span>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors p-1">
                            <ChevronDown size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {msg.role === 'ai' && (
                                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-full flex items-center justify-center shrink-0 mt-1">
                                        <Sparkles size={12} className="text-white" />
                                    </div>
                                )}
                                <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                    }`}>
                                        {renderText(msg.text)}
                                    </div>
                                    <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.ts)}</span>
                                    {/* Suggested actions */}
                                    {msg.suggestions && msg.suggestions.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {msg.suggestions.map((s, si) => {
                                                const href = NAV_MAP[s];
                                                if (href) return (
                                                    <Link key={si} href={href} onClick={() => setOpen(false)}
                                                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                                                        <ExternalLink size={10} /> {s}
                                                    </Link>
                                                );
                                                return (
                                                    <button key={si} onClick={() => sendMessage(s)}
                                                        className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                                                        {s}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2 items-center">
                                <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-full flex items-center justify-center">
                                    <Sparkles size={12} className="text-white" />
                                </div>
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 shadow-sm">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Ask Nova anything..."
                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
