"use client";
import { useState } from 'react';
import { Settings as SettingsIcon, Shield, Server, Bell } from 'lucide-react';

export default function Settings({ user }: { user: any }) {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)]">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2"><SettingsIcon className="text-indigo-600"/> System Settings</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">Configure global platform behavior.</p>
            </div>
            <div className="flex-1 overflow-y-auto w-full custom-scrollbar p-6 bg-gray-50/30">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                <Server size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Maintenance Mode</h3>
                                <p className="text-sm text-gray-500 mt-1">Disable access for non-admin users across the platform.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Strict Registration</h3>
                                <p className="text-sm text-gray-500 mt-1">Require admin approval for new faculty signups.</p>
                            </div>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
