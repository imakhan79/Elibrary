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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-slate-800 rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden">
        
        {/* Left Side: Brand Visual Card */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-950 p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
          
          <div className="flex items-center gap-2 relative z-10">
            <div className="p-2.5 bg-emerald-500/20 backdrop-blur-md rounded-xl text-emerald-400 border border-emerald-500/20">
              <Library className="w-6 h-6" id="brand-logo-icon" />
            </div>
            <span className="font-semibold text-lg tracking-wider text-emerald-300">SMART E-LIBRARY</span>
          </div>

          <div className="my-12 relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-4">
              Step into the <br />
              <span className="text-emerald-400">Future of Reading</span>
            </h1>
            <p className="text-slate-300/90 text-sm leading-relaxed max-w-sm">
              Connect immediately, study, bookmark your books, and chat with Sarah—our state-of-the-art conversational AI support.
            </p>
          </div>

          <div className="flex flex-col gap-3 relative z-10 pt-4 border-t border-slate-700/40">
            <span className="text-xs text-emerald-300/80 font-medium tracking-widest uppercase">Platform capabilities</span>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="px-2.5 py-1 rounded-full bg-slate-900/50">Online Book Reader</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900/50">AI Support Sarah</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900/50">Admin Analytics</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900/50">Offline PDF Export</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Forms */}
        <div className="p-8 flex flex-col justify-center bg-slate-800/80">
          
          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-100">
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
                <label className="block text-xs text-slate-400 mb-1 font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Abigail Chief"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@library.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {isRegistering && !isForgotPassword && (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Default Registration Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
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
                    className="accent-emerald-500 rounded border-slate-700 bg-slate-900"
                  />
                  <span>Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="hover:text-emerald-400 transition-colors"
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
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-slate-100 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
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
            <div className="mt-5 pt-4 border-t border-slate-700/40">
              <span className="block text-center text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3">Or Connect via Social Identity</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => simulateSocialLogin("Google")}
                  className="py-1.5 px-3 bg-slate-900 hover:bg-slate-950 border border-slate-700/60 rounded-lg text-xs text-slate-300 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="text-rose-500 font-extrabold text-xs">G</span> Google Sign-In
                </button>
                <button
                  type="button"
                  onClick={() => simulateSocialLogin("GitHub")}
                  className="py-1.5 px-3 bg-slate-900 hover:bg-slate-950 border border-slate-700/60 rounded-lg text-xs text-slate-300 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="text-emerald-400 font-extrabold text-xs">🐙</span> GitHub login
                </button>
              </div>
            </div>
          )}

          {/* Toggle Register */}
          <div className="text-center text-xs text-slate-400 mt-4">
            {isForgotPassword ? (
              ""
            ) : isRegistering ? (
              <span>
                Already have an account?{" "}
                <button onClick={() => setIsRegistering(false)} className="text-emerald-400 hover:underline">
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to the platform?{" "}
                <button onClick={() => setIsRegistering(true)} className="text-emerald-400 hover:underline">
                  Register Now
                </button>
              </span>
            )}
          </div>

          {/* Demo Access Button Row */}
          {!isForgotPassword && (
            <div className="mt-6 pt-5 border-t border-slate-700/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Instant Demo Roles</span>
                </span>
                <span className="text-[10px] text-slate-500">No passwords required</span>
              </div>
              
              <div className="grid grid-cols-5 gap-1">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleDemoLogin(acc.role)}
                    title={`${acc.name} - ${acc.desc}`}
                    className="p-1.5 bg-slate-900 hover:bg-emerald-950/60 hover:border-emerald-500/40 border border-slate-700/60 rounded-lg text-[10px] text-slate-300 text-center font-bold capitalize transition-all cursor-pointer truncate"
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
