"use client";
import { useState, useEffect, useRef } from 'react';
import { Send, Users, Inbox, ChevronRight, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Messaging({ user }: { user: any }) {
    const { token } = useApp();
    const [messages, setMessages] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchMessages = async (tab: string) => {
        if (!token) return;
        setLoading(true);
        try {
            const endpoint = tab === 'inbox' ? 'inbox' : 'sent';
            const res = await fetch(`http://localhost:5000/api/messages/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setMessages(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/messages/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (activeTab !== 'compose') {
            fetchMessages(activeTab);
        } else {
            fetchUsers();
        }
    }, [activeTab]);

    const sendMessage = async () => {
        if (!token || !selectedUser || !newMessage.trim()) return;

        try {
            const res = await fetch('http://localhost:5000/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiver_id: selectedUser.id,
                    content: newMessage
                })
            });
            if (res.ok) {
                setNewMessage('');
                setActiveTab('sent');
                setSelectedUser(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleColor = (role: string) => {
        if (role === 'Faculty') return 'bg-blue-100 text-blue-800';
        if (role === 'Admin') return 'bg-purple-100 text-purple-800';
        return 'bg-emerald-100 text-emerald-800';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
                    <button
                        onClick={() => { setActiveTab('compose'); setSelectedUser(null); setNewMessage(''); }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Send size={16} /> Compose
                    </button>
                </div>

                {activeTab !== 'compose' && (
                    <div className="flex gap-6 mt-5 border-b border-gray-100">
                        <button onClick={() => setActiveTab('inbox')} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'inbox' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
                            <span className="flex items-center gap-1.5"><Inbox size={15} /> Inbox</span>
                            {activeTab === 'inbox' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                        <button onClick={() => setActiveTab('sent')} className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'sent' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
                            <span className="flex items-center gap-1.5"><Send size={15} /> Sent</span>
                            {activeTab === 'sent' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                {/* INBOX / SENT View */}
                {activeTab !== 'compose' && (
                    <div className="p-6 space-y-3">
                        {loading && <div className="text-center py-10 text-gray-400 font-medium animate-pulse">Loading messages...</div>}
                        {!loading && messages.length === 0 && (
                            <div className="text-center py-16 text-gray-400">
                                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Inbox size={28} className="text-gray-300" />
                                </div>
                                <p className="font-medium">{activeTab === 'inbox' ? 'Your inbox is empty.' : 'No sent messages yet.'}</p>
                            </div>
                        )}
                        {messages.map(m => {
                            const otherPerson = activeTab === 'inbox' ? m.sender : m.receiver;
                            return (
                                <div key={m.id} className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl transition-all hover:shadow-md flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-sm">
                                        {otherPerson?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-gray-900 text-sm">{otherPerson?.name || 'Unknown'}</p>
                                                {otherPerson?.role && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${getRoleColor(otherPerson.role)}`}>{otherPerson.role}</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-medium shrink-0">{new Date(m.timestamp).toLocaleString()}</p>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{m.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* COMPOSE View */}
                {activeTab === 'compose' && (
                    <div className="p-6 flex flex-col gap-5 max-w-2xl mx-auto">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Users size={18} className="text-indigo-500" /> New Message</h3>

                        {/* Recipient selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Send To</label>
                            {selectedUser ? (
                                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm">{selectedUser.name.charAt(0)}</div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 text-sm">{selectedUser.name}</p>
                                        <p className="text-xs text-gray-500">{selectedUser.email}</p>
                                    </div>
                                    <button onClick={() => setSelectedUser(null)} className="text-xs text-red-500 font-bold hover:text-red-700">Change</button>
                                </div>
                            ) : (
                                <div>
                                    <div className="relative mb-2">
                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            placeholder="Search by name or email..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 border ring-1 ring-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm max-h-48 overflow-y-auto">
                                        {filteredUsers.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">No users found.</p>}
                                        {filteredUsers.map(u => (
                                            <button key={u.id} onClick={() => { setSelectedUser(u); setSearch(''); }}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 border-b border-gray-50 last:border-0 transition-colors text-left">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-black flex items-center justify-center text-xs">{u.name.charAt(0)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 text-sm truncate">{u.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getRoleColor(u.role)}`}>{u.role}</span>
                                                <ChevronRight size={14} className="text-gray-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Message body */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Message</label>
                            <textarea
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Write your message here..."
                                rows={6}
                                className="w-full border ring-1 ring-gray-200 rounded-xl p-4 text-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                            />
                        </div>

                        <button
                            onClick={sendMessage}
                            disabled={!selectedUser || !newMessage.trim()}
                            className="self-end bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
                        >
                            <Send size={16} /> Send Message
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
