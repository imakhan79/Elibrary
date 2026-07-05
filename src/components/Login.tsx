import React, { useState } from "react";
import { Library, LogIn, Mail, Lock, User, KeyRound, ShieldAlert, Sparkles, CheckCircle } from "lucide-react";
import { UserRole } from "../types";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("reader");
  const [rememberMe, setRememberMe] = useState(true);

  // Status states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { role: "student" as UserRole, name: "Student Demo", desc: "Access standard books & stats" },
    { role: "reader" as UserRole, name: "Reader Demo", desc: "Access personal bookshelf & history" },
    { role: "premium" as UserRole, name: "Premium Demo", desc: "Unlock downloads & PDF features" },
    { role: "librarian" as UserRole, name: "Librarian Demo", desc: "Manage catalog & approvals" },
    { role: "admin" as UserRole, name: "Admin Demo", desc: "Full control & AI Chat Training" }
  ];

  const handleDemoLogin = async (demoRole: UserRole) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDemo: true, demoRole })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      
      setSuccess("Successfully connected to demo account!");
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 600);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isForgotPassword) {
        const response = await fetch("/api/auth/recovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Recovery request failed");
        setSuccess(data.message);
        setTimeout(() => setIsForgotPassword(false), 3000);
        return;
      }

      if (isRegistering) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, password, role })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Registration failed");
        setSuccess("Account successfully created! Please login now.");
        setIsRegistering(false);
      } else {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Login failed");
        
        setSuccess("Welcome back!");
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 600);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const simulateSocialLogin = (provider: string) => {
    setLoading(true);
    setError("");
    setTimeout(() => {
      // Create a mock registered user
      const mockSocialUser = {
        uid: `social-${Date.now()}`,
        email: `guest-${provider}@smartlibrary.org`,
        name: `${provider} Reader`,
        role: "reader",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        subscriptionPlan: "free",
        readingGoalsMinutes: 30,
        joinedAt: new Date().toISOString()
      };
      setSuccess(`Authenticated successfully via ${provider}!`);
      setTimeout(() => {
        onLoginSuccess(mockSocialUser);
      }, 600);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        
        {/* Left Side: Brand Visual Card */}
        <div className="bg-slate-900 p-8 flex flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)]" />
          
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl text-indigo-400 border border-white/10 shadow-sm">
              <Library className="w-5 h-5" id="brand-logo-icon" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">SMART E-LIBRARY</span>
          </div>

          <div className="my-12 relative z-10">
            <h1 className="text-3xl font-serif font-light tracking-tight leading-tight mb-4">
              Step into the <br />
              <span className="text-indigo-400 font-normal">Future of Reading</span>
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed max-w-sm font-sans font-light">
              Connect immediately, study, bookmark your books, and chat with Sarah—our state-of-the-art conversational AI support.
            </p>
          </div>

          <div className="flex flex-col gap-3 relative z-10 pt-4 border-t border-white/10">
            <span className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">Platform capabilities</span>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
              <span className="px-2.5 py-1 rounded-full bg-white/5">Online Book Reader</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5">AI Support Sarah</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5">Admin Analytics</span>
              <span className="px-2.5 py-1 rounded-full bg-white/5">Offline PDF Export</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Forms */}
        <div className="p-8 flex flex-col justify-center bg-white">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              {isForgotPassword ? "Account Recovery" : isRegistering ? "Create an Account" : "Access Platform"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isForgotPassword 
                ? "Enter your registered email and we'll send recovery steps." 
                : isRegistering 
                  ? "Sign up to begin keeping reading stats and logs." 
                  : "Sign in with credentials, social accounts, or choose a demo role below."
              }
            </p>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {isRegistering && !isForgotPassword && (
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Abigail Chief"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-450 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@library.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-450 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-450 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            {isRegistering && !isForgotPassword && (
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Default Registration Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-850 focus:outline-none focus:border-indigo-600 transition-colors"
                >
                  <option value="reader">Standard Reader</option>
                  <option value="student">Student Account</option>
                </select>
              </div>
            )}

            {!isForgotPassword && !isRegistering && (
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-indigo-600 rounded border-slate-300 bg-slate-50"
                  />
                  <span className="text-slate-500 font-medium">Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="hover:text-indigo-600 text-slate-500 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {isForgotPassword && (
              <div className="text-right text-xs">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm uppercase tracking-wider"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>
                    {isForgotPassword ? "Send Recovery Link" : isRegistering ? "Complete Registration" : "Sign In"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Social Sign-In */}
          {!isForgotPassword && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="block text-center text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-3">Or Connect via Social Identity</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => simulateSocialLogin("Google")}
                  className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="text-rose-500 font-extrabold text-xs">G</span> Google Sign-In
                </button>
                <button
                  type="button"
                  onClick={() => simulateSocialLogin("GitHub")}
                  className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="text-indigo-600 font-extrabold text-xs">🐙</span> GitHub login
                </button>
              </div>
            </div>
          )}

          {/* Toggle Register */}
          <div className="text-center text-xs text-slate-450 mt-4 font-medium">
            {isForgotPassword ? (
              ""
            ) : isRegistering ? (
              <span>
                Already have an account?{" "}
                <button onClick={() => setIsRegistering(false)} className="text-indigo-600 hover:underline font-bold">
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to the platform?{" "}
                <button onClick={() => setIsRegistering(true)} className="text-indigo-600 hover:underline font-bold">
                  Register Now
                </button>
              </span>
            )}
          </div>

          {/* Demo Access Button Row */}
          {!isForgotPassword && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant Demo Roles</span>
                </span>
                <span className="text-[9px] text-slate-400">No passwords required</span>
              </div>
              
              <div className="grid grid-cols-5 gap-1.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleDemoLogin(acc.role)}
                    title={`${acc.name} - ${acc.desc}`}
                    className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-lg text-[9px] text-slate-600 hover:text-indigo-700 text-center font-bold capitalize transition-all cursor-pointer truncate"
                  >
                    {acc.role}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
