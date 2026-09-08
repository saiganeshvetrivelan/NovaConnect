"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
    LayoutDashboard, 
    BookOpen, 
    MessageSquare, 
    FileText, 
    Folder, 
    Mail, 
    UserCheck, 
    BarChart3, 
    Settings,
    Menu,
    X,
    Users
} from 'lucide-react';

interface SidebarProps {
    /** @deprecated kept for backwards compat; routing is now URL-based */
    activePage?: string;
    /** @deprecated kept for backwards compat */
    setActivePage?: (page: string) => void;
    role: string;
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard',        icon: LayoutDashboard, roles: ['Student', 'Faculty'] },
    { href: '/dashboard', label: 'Admin Panel',      icon: LayoutDashboard, roles: ['Admin'], adminOnly: true },
    { href: '/courses',   label: 'My Courses',       icon: BookOpen,        roles: ['Student', 'Faculty'] },
    { href: '/forum',     label: 'Discussion Forum', icon: MessageSquare,   roles: ['Student', 'Faculty'] },
    { href: '/assignments', label: 'Assignments',    icon: FileText,        roles: ['Student', 'Faculty'] },
    { href: '/resources', label: 'Resources',        icon: Folder,          roles: ['Student', 'Faculty'] },
    { href: '/messages',  label: 'Messages',         icon: Mail,            roles: ['Student', 'Faculty'] },
    { href: '/attendance',label: 'Attendance',       icon: UserCheck,       roles: ['Student', 'Faculty'] },
    { href: '/analytics', label: 'Analytics',        icon: BarChart3,       roles: ['Admin'] },
    { href: '/users',     label: 'User Directory',   icon: Users,           roles: ['Admin'] },
    { href: '/settings',  label: 'System Config',    icon: Settings,        roles: ['Admin'] },
];

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const filtered = navItems.filter(item => {
        if (item.adminOnly && role !== 'Admin') return false;
        if (!item.adminOnly && item.roles.includes(role)) {
            // hide duplicates: show Admin‑only item only for Admin
            if (item.roles.length === 1 && !item.roles.includes(role)) return false;
            return true;
        }
        return false;
    });

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 flex items-center justify-between">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 tracking-tight flex items-center gap-2">
                    <span className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-xl shadow-md text-lg">N</span>
                    NovaConnect
                </h1>
                <button className="md:hidden text-gray-400 hover:text-gray-700 transition-colors" onClick={() => setMobileOpen(false)}>
                    <X size={20} />
                </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
                {filtered.map((item) => {
                    const Icon = item.icon;
                    // Consider active if pathname starts with the href (handles nested like /courses/123)
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href + item.label}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                isActive 
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Help box */}
            <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full blur-2xl opacity-50 -mr-8 -mt-8"></div>
                <h4 className="text-xs font-bold text-indigo-900 mb-1 z-10 relative">Need help?</h4>
                <p className="text-[10px] text-indigo-600 mb-3 z-10 relative">Check our institutional documentation.</p>
                <button className="w-full py-1.5 bg-white rounded-lg text-xs font-bold text-indigo-700 shadow-sm hover:shadow transition-all border border-indigo-100">
                    Support Center
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile hamburger */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-xl shadow-md p-2 border border-gray-100"
                onClick={() => setMobileOpen(true)}
            >
                <Menu size={20} className="text-indigo-600" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </div>

            {/* Desktop sidebar */}
            <div className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col h-full shadow-sm z-10 transition-all shrink-0">
                <SidebarContent />
            </div>
        </>
    );
}
