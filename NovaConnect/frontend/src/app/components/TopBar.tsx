"use client";
import { useState } from 'react';
import { Search, Bell, MessageSquare, ChevronDown } from 'lucide-react';

interface TopBarProps {
    user: { name: string, role: string };
    onLogout: () => void;
}

export default function TopBar({ user, onLogout }: TopBarProps) {
    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
            
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                        type="search" 
                        placeholder="Search courses, discussions, people..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100 focus:bg-white border focus:border-indigo-300 border-transparent rounded-full text-sm text-gray-800 transition-all outline-none focus:ring-4 focus:ring-indigo-500/10"
                    />
                </div>
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center gap-6">
                
                <div className="flex items-center gap-2">
                    <button className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                        <MessageSquare size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
                    </button>
                    <button className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200"></div>

                <div className="flex items-center gap-3 cursor-pointer group relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-200 ring-2 ring-white">
                        {user.name.charAt(0)}
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-bold text-gray-800 leading-tight">{user.name}</p>
                        <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">{user.role}</p>
                    </div>
                    <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 ml-1" />
                    
                    {/* Hover Dropdown (Simplified) */}
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 transform origin-top-right">
                        <div className="p-2 space-y-1">
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Profile Profile</button>
                            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Account Settings</button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-bold">Sign Out</button>
                        </div>
                    </div>
                </div>

            </div>
        </header>
    );
}
