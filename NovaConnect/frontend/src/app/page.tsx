"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./context/AppContext";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [message, setMessage] = useState("");
  const { login, user, isLoadingAuth } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth && user) {
      router.push("/dashboard");
    }
  }, [user, isLoadingAuth, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, roll_number: rollNo }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        setMessage("");
        router.push("/dashboard");
      } else {
        setMessage(data.error || "Login Failed");
      }
    } catch {
      setMessage("Cannot connect to server.");
    }
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
  }

  // --- Auth View ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-all duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
          NovaConnect
        </h2>
        <p className="mt-3 text-center text-md text-gray-500 font-medium">
          AI-Integrated Academic Collaboration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md transition-all duration-500">
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl py-8 px-4 sm:px-10 sm:rounded-2xl border border-white/50">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Roll No</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="7181XXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@srec.ac.in"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col gap-4 mt-8">
                <button
                  onClick={handleLogin}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                    Secure Sign In
                  </span>
                </button>
                <div className="text-center text-sm text-gray-500 mt-2">
                    <a href="#" className="hover:text-indigo-600 transition-colors">Forgot your password?</a>
                    <span className="mx-2">|</span>
                    <a href="#" className="hover:text-indigo-600 transition-colors">Contact IT Support</a>
                </div>
              </div>
            </div>

          {message && (
            <div className="mt-4 p-3 rounded bg-blue-50 text-blue-800 text-sm border border-blue-200 text-center">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
