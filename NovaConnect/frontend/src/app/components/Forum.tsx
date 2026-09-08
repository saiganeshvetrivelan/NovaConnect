"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
    Send, Paperclip, Pin, Trash2, Reply, Search,
    X, ChevronRight, Hash, Wifi, WifiOff, Users, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// ── Helpers ────────────────────────────────────────────────────────────────────
const API = 'http://localhost:5000';

const ROLE_BADGE: Record<string, string> = {
    Faculty: 'bg-blue-100 text-blue-800 border border-blue-200',
    Admin: 'bg-purple-100 text-purple-800 border border-purple-200',
    Student: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

const AI_BADGE: Record<string, string> = {
    Exams: 'bg-red-100 text-red-700',
    Algorithms: 'bg-violet-100 text-violet-700',
    Announcement: 'bg-amber-100 text-amber-700',
    Assignment: 'bg-orange-100 text-orange-700',
    File: 'bg-sky-100 text-sky-700',
    General: 'bg-gray-100 text-gray-600',
};

function formatTime(dt: string) {
    const d = new Date(dt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dt: string) {
    const d = new Date(dt);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function Avatar({ name, role }: { name: string; role: string }) {
    const colors: Record<string, string> = {
        Faculty: 'bg-blue-600',
        Admin: 'bg-purple-600',
        Student: 'bg-indigo-500',
    };
    return (
        <div className={`w-9 h-9 rounded-full ${colors[role] || 'bg-gray-400'} text-white font-black flex items-center justify-center shrink-0 text-sm shadow-sm`}>
            {name?.charAt(0)?.toUpperCase()}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Forum({ user }: { user: any }) {
    const { token } = useApp();
    const [forums, setForums] = useState<any[]>([]);
    const [selectedForum, setSelectedForum] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [onlineCount, setOnlineCount] = useState(1);
    const [isConnected, setIsConnected] = useState(false);
    const [aiCategory, setAiCategory] = useState('General');
    const [isTypingAI, setIsTypingAI] = useState(false);
    const [pinnedMsg, setPinnedMsg] = useState<any | null>(null);
    const [uploading, setUploading] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Fetch accessible forums ──────────────────────────────────────────────

    useEffect(() => {
        if (!token) return;
        fetch(`${API}/api/forum/all`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setForums(data);
                    if (data.length > 0) setSelectedForum(data[0]);
                }
            })
            .catch(console.error);
    }, [token]);

    // ── Load message history ──────────────────────────────────────────────────
    const loadMessages = useCallback(async (forumId: number) => {
        if (!token) return;
        const res = await fetch(`${API}/api/forum-messages/${forumId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setMessages(data);
            // Find pinned message
            const pinned = data.find((m: any) => m.is_pinned);
            setPinnedMsg(pinned || null);
        }
    }, [token]);

    useEffect(() => {
        if (selectedForum) {
            setMessages([]);
            loadMessages(selectedForum.id);
        }
    }, [selectedForum, loadMessages]);

    // ── Socket.io connection ───────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;

        const socket = io(API, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('online_count', (count) => setOnlineCount(count));

        socket.on('new_message', (msg: any) => {
            setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                // If it's a reply append to parent's replies array
                if (msg.reply_to_id) {
                    return prev.map(m =>
                        m.id === msg.reply_to_id
                            ? { ...m, replies: [...(m.replies || []), msg] }
                            : m
                    );
                }
                return [...prev, msg];
            });
        });

        socket.on('message_deleted', ({ id }: { id: number }) => {
            setMessages(prev => prev.filter(m => m.id !== id));
        });

        socket.on('message_pinned', (updated: any) => {
            setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
            setPinnedMsg(updated.is_pinned ? updated : null);
        });

        return () => {
            socket.disconnect();
        };
    }, [token]);

    // ── Join/leave forum room on selection change ─────────────────────────────
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !selectedForum) return;
        socket.emit('join_forum', selectedForum.id);
        return () => {
            socket.emit('leave_forum', selectedForum.id);
        };
    }, [selectedForum]);

    // ── Scroll to bottom on new messages ─────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── AI Categorize on typing (debounced 600ms) ─────────────────────────────
    useEffect(() => {
        if (!text.trim() || text.length < 5) { setAiCategory('General'); return; }
        const timer = setTimeout(async () => {
            setIsTypingAI(true);
            try {
                const res = await fetch('http://localhost:8000/ai/categorize-query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ post_content: text })
                });
                if (res.ok) {
                    const d = await res.json();
                    setAiCategory(d.suggested_tags?.[0] || 'General');
                }
            } catch { setAiCategory('General'); }
            finally { setIsTypingAI(false); }
        }, 600);
        return () => clearTimeout(timer);
    }, [text]);

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!text.trim() || !selectedForum || !socketRef.current) return;
        socketRef.current.emit('send_message', {
            forum_id: selectedForum.id,
            course_id: selectedForum.course_id,
            message_text: text.trim(),
            ai_category: aiCategory,
            reply_to_id: replyTo?.id || null
        });
        setText('');
        setReplyTo(null);
        setAiCategory('General');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ── Upload attachment ─────────────────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedForum || !token) return;
        setUploading(true);
        const form = new FormData();
        form.append('file', file);
        form.append('forum_id', String(selectedForum.id));
        form.append('course_id', String(selectedForum.course_id));
        if (replyTo?.id) form.append('reply_to_id', String(replyTo.id));

        try {
            const res = await fetch(`${API}/api/forum-messages/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form
            });
            if (res.ok) {
                const msg = await res.json();
                // Broadcast via socket
                socketRef.current?.emit('send_message', {
                    forum_id: selectedForum.id,
                    course_id: selectedForum.course_id,
                    message_text: `📎 ${msg.attachment_name}`,
                    ai_category: 'File',
                });
                // Also add locally immediately
                setMessages(prev => [...prev, msg]);
                setReplyTo(null);
            }
        } catch (err) { console.error(err); }
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    // ── Moderation ────────────────────────────────────────────────────────────
    const handleDelete = (msgId: number) => {
        socketRef.current?.emit('delete_message', { id: msgId, forum_id: selectedForum?.id });
    };

    const handlePin = (msgId: number) => {
        socketRef.current?.emit('pin_message', { id: msgId, forum_id: selectedForum?.id });
    };

    // ── Filtered messages ─────────────────────────────────────────────────────
    const filteredMessages = search
        ? messages.filter(m => m.message_text?.toLowerCase().includes(search.toLowerCase()))
        : messages;

    // ── Group messages by date ────────────────────────────────────────────────
    const grouped = filteredMessages.reduce((acc: Record<string, any[]>, m) => {
        const key = formatDate(m.created_at);
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        return acc;
    }, {});

    return (
        <div className="flex h-[calc(100vh-140px)] gap-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* ── Left: Channel List ─────────────────────────────────────────── */}
            <div className="w-64 shrink-0 bg-gradient-to-b from-indigo-950 to-indigo-900 flex flex-col">
                <div className="p-5 border-b border-white/10">
                    <h2 className="text-white font-black text-lg tracking-tight">Discussion Forums</h2>
                    <p className="text-indigo-300 text-xs font-medium mt-0.5">Course channels</p>
                </div>
                <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
                    {forums.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSelectedForum(f)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${selectedForum?.id === f.id ? 'bg-white/20 text-white' : 'text-indigo-200 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Hash size={15} className="shrink-0 opacity-70" />
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{f.topic}</p>
                                <p className="text-[10px] opacity-60 truncate">{f.course?.course_code}</p>
                            </div>
                            {selectedForum?.id === f.id && <ChevronRight size={14} className="ml-auto shrink-0" />}
                        </button>
                    ))}
                    {forums.length === 0 && (
                        <p className="text-indigo-400 text-xs px-5 py-4">No forums available.</p>
                    )}
                </div>
                {/* Connection status */}
                <div className="p-4 border-t border-white/10 flex items-center gap-2">
                    {isConnected
                        ? <Wifi size={14} className="text-emerald-400" />
                        : <WifiOff size={14} className="text-red-400" />}
                    <span className={`text-xs font-bold ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isConnected ? 'Live' : 'Offline'}
                    </span>
                    {isConnected && (
                        <>
                            <Users size={13} className="text-indigo-300 ml-auto" />
                            <span className="text-indigo-300 text-xs font-bold">{onlineCount}</span>
                        </>
                    )}
                </div>
            </div>

            {/* ── Right: Chat Area ───────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                            <Hash size={18} className="text-indigo-500" />
                            {selectedForum?.topic || 'Select a channel'}
                        </h3>
                        <p className="text-gray-400 text-xs font-medium mt-0.5">{selectedForum?.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {showSearch && (
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search messages..."
                                    className="pl-8 pr-8 py-2 border ring-1 ring-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none w-52"
                                    autoFocus
                                />
                                {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X size={13} /></button>}
                            </div>
                        )}
                        <button onClick={() => setShowSearch(!showSearch)} className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'}`}>
                            <Search size={18} />
                        </button>
                    </div>
                </div>

                {/* Pinned message banner */}
                {pinnedMsg && (
                    <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                        <Pin size={14} className="text-amber-600 shrink-0" />
                        <p className="text-amber-900 text-xs font-bold flex-1 truncate">
                            <span className="font-black">Pinned:</span> {pinnedMsg.message_text}
                        </p>
                        {['Faculty', 'Admin'].includes(user?.role) && (
                            <button onClick={() => handlePin(pinnedMsg.id)} className="text-amber-500 text-xs font-bold hover:text-amber-700">Unpin</button>
                        )}
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-1 bg-gray-50/20">
                    {!selectedForum && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Hash size={40} className="mb-3 opacity-30" />
                            <p className="font-bold">Select a channel to start chatting</p>
                        </div>
                    )}

                    {Object.entries(grouped).map(([date, msgs]) => (
                        <div key={date}>
                            {/* Date divider */}
                            <div className="flex items-center gap-3 my-5">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{date}</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {msgs.map(m => {
                                const isMe = m.sender_id === user?.id;
                                return (
                                    <div key={m.id} className={`group flex gap-3 py-1.5 px-3 rounded-xl hover:bg-gray-100/60 transition-colors ${isMe ? 'flex-row-reverse' : ''}`}>
                                        {!isMe && <Avatar name={m.sender?.name} role={m.sender?.role} />}

                                        <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            {/* Name + badge + time */}
                                            <div className={`flex items-center gap-2 mb-1 flex-wrap ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <span className="font-bold text-gray-900 text-sm">{isMe ? 'You' : m.sender?.name}</span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${ROLE_BADGE[m.sender?.role] || ''}`}>
                                                    {m.sender?.role}
                                                </span>
                                                {m.ai_category && m.ai_category !== 'General' && (
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${AI_BADGE[m.ai_category] || 'bg-gray-100 text-gray-600'}`}>
                                                        🏷 {m.ai_category}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-gray-400 font-medium">{formatTime(m.created_at)}</span>
                                                {m.is_pinned && <Pin size={11} className="text-amber-500" />}
                                            </div>

                                            {/* Reply context */}
                                            {m.reply_to && (
                                                <div className="mb-1 px-3 py-1.5 bg-gray-100 border-l-2 border-indigo-400 rounded-lg text-xs text-gray-500 max-w-xs">
                                                    <span className="font-bold text-indigo-600">{m.reply_to.sender?.name}: </span>
                                                    {m.reply_to.message_text?.slice(0, 80)}{(m.reply_to.message_text?.length || 0) > 80 ? '…' : ''}
                                                </div>
                                            )}

                                            {/* Bubble */}
                                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                                                {m.attachment_url ? (
                                                    <a href={`${API}${m.attachment_url}`} target="_blank" rel="noopener noreferrer"
                                                        className={`flex items-center gap-2 font-bold underline ${isMe ? 'text-indigo-200' : 'text-indigo-600'}`}>
                                                        <Paperclip size={14} />
                                                        {m.attachment_name || m.message_text}
                                                    </a>
                                                ) : (
                                                    <p className="whitespace-pre-wrap">{m.message_text}</p>
                                                )}
                                            </div>

                                            {/* Threaded replies (if any) */}
                                            {m.replies?.length > 0 && (
                                                <div className="mt-2 ml-3 border-l-2 border-indigo-100 pl-3 space-y-1.5">
                                                    {m.replies.map((r: any) => (
                                                        <div key={r.id} className="flex gap-2 items-start">
                                                            <Avatar name={r.sender?.name} role={r.sender?.role} />
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-700">{r.sender?.name} <span className="text-gray-400 font-normal">{formatTime(r.created_at)}</span></p>
                                                                <p className="text-sm text-gray-700 bg-white border border-gray-100 px-3 py-2 rounded-xl">{r.message_text}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons (hover) */}
                                        <div className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 self-start mt-1 transition-opacity ${isMe ? 'mr-2' : 'ml-1'}`}>
                                            <button onClick={() => setReplyTo(m)} title="Reply" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-indigo-600 transition-colors">
                                                <Reply size={13} />
                                            </button>
                                            {['Faculty', 'Admin'].includes(user?.role) && (
                                                <>
                                                    <button onClick={() => handlePin(m.id)} title="Pin" className="p-1.5 rounded-lg hover:bg-amber-100 text-gray-500 hover:text-amber-600 transition-colors">
                                                        <Pin size={13} />
                                                    </button>
                                                    <button onClick={() => handleDelete(m.id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {filteredMessages.length === 0 && selectedForum && !search && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-300 pt-10">
                            <Hash size={36} className="mb-3" />
                            <p className="font-bold text-gray-400">No messages yet. Start the conversation!</p>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="px-6 pb-5 pt-3 bg-white border-t border-gray-100">
                    {/* Reply context bar */}
                    {replyTo && (
                        <div className="mb-2 flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
                            <Reply size={14} className="text-indigo-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="text-xs font-black text-indigo-700">{replyTo.sender?.name}: </span>
                                <span className="text-xs text-gray-600 truncate">{replyTo.message_text?.slice(0, 80)}</span>
                            </div>
                            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-end gap-2">
                        {/* File upload */}
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload}
                            accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xlsx,.pptx,.zip" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploading || !selectedForum}
                            className="shrink-0 p-3 rounded-xl border ring-1 ring-gray-200 hover:bg-gray-50 text-gray-500 hover:text-indigo-600 transition-all disabled:opacity-50"
                            title="Attach file">
                            {uploading
                                ? <div className="w-[18px] h-[18px] border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                : <Paperclip size={18} />}
                        </button>

                        {/* Text input */}
                        <div className="flex-1 relative">
                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                disabled={!selectedForum}
                                placeholder={selectedForum ? `Message #${selectedForum?.topic?.toLowerCase().replace(/ /g, '-')}…` : 'Select a channel first'}
                                className="w-full resize-none border-0 ring-1 ring-gray-200 rounded-xl pl-4 pr-4 py-3 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 outline-none leading-snug disabled:opacity-50 max-h-32 overflow-y-auto"
                                style={{ height: 'auto', minHeight: '48px' }}
                                onInput={e => {
                                    const t = e.currentTarget;
                                    t.style.height = 'auto';
                                    t.style.height = Math.min(t.scrollHeight, 128) + 'px';
                                }}
                            />
                            {/* AI tag indicator */}
                            {text.trim().length >= 5 && (
                                <div className="absolute right-3 bottom-3 flex items-center gap-1">
                                    {isTypingAI
                                        ? <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                        : <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${AI_BADGE[aiCategory] || 'bg-gray-100 text-gray-500'}`}>
                                            <Sparkles size={9} /> {aiCategory}
                                        </span>}
                                </div>
                            )}
                        </div>

                        {/* Send button */}
                        <button
                            onClick={handleSend}
                            disabled={!text.trim() || !selectedForum}
                            className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white flex items-center justify-center shadow-md shadow-indigo-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
