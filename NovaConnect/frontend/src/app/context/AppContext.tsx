"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserSession = {
    id: number;
    name: string;
    email: string;
    role: string;
    roll_number?: string;
};

type AppContextType = {
    user: UserSession | null;
    token: string | null;
    login: (token: string, userData: UserSession) => void;
    logout: () => void;
    isLoadingAuth: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserSession | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    useEffect(() => {
        // Attempt to rehydrate from localStorage on first mount
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
            } catch(e) { console.error("Could not parse user session"); }
        }
        setIsLoadingAuth(false);
    }, []);

    const login = (newToken: string, userData: UserSession) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AppContext.Provider value={{ user, token, login, logout, isLoadingAuth }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
