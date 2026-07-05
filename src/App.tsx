import React, { useState, useEffect } from "react";
import { UserProfile, Book } from "./types";
import Login from "./components/Login";
import LibraryComponent from "./components/Library";
import ReaderComponent from "./components/Reader";
import SupportChatComponent from "./components/SupportChat";
import AdminDashboardComponent from "./components/AdminDashboard";

import { Library, LogOut, User, BookOpen, Star, HelpCircle, Shield, Settings, Heart, Bookmark, BarChart2, Award, Clock, ArrowRight, Sparkles, Flame, CheckCircle, Smartphone } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Navigation Section
  const [activeSection, setActiveSection] = useState<"library" | "shelf" | "subscription" | "admin" | "help">("library");

  // Books catalogue
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  // Active reading book ID
  const [activeReaderBookId, setActiveReaderBookId] = useState<string | null>(null);

  // User bookshelf lists
  const [favorites, setFavorites] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // User reading stats
  const [streakDays, setStreakDays] = useState(4); // Seed with a small streak to make dashboard exciting!
  const [minutesReadToday, setMinutesReadToday] = useState(12);

  // Notifications/Toasts
  const [notification, setNotification] = useState("");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  // Fetch books from server API on mount
  const fetchLibraryBooks = async () => {
    try {
      const response = await fetch("/api/books");
      const data = await response.json();
      if (response.ok) {
        setBooks(data.books || []);
      }
    } catch (err) {
      console.error("Error loading books catalog:", err);
    } finally {
      setLoadingBooks(false);
    }
  };

  useEffect(() => {
    fetchLibraryBooks();

    // Check if session contains a remembered user
    const saved = localStorage.getItem("smart_library_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        // Load favorite keys
        const favs = localStorage.getItem(`favs_${parsed.uid}`);
        if (favs) setFavorites(JSON.parse(favs));
        const wish = localStorage.getItem(`wish_${parsed.uid}`);
        if (wish) setWishlist(JSON.parse(wish));
      } catch (e) {
        localStorage.removeItem("smart_library_user");
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    localStorage.setItem("smart_library_user", JSON.stringify(loggedInUser));

    // Load shelf lists
    const favs = localStorage.getItem(`favs_${loggedInUser.uid}`);
    setFavorites(favs ? JSON.parse(favs) : []);
    const wish = localStorage.getItem(`wish_${loggedInUser.uid}`);
    setWishlist(wish ? JSON.parse(wish) : []);

    logActivity("Login", `User ${loggedInUser.name} signed in successfully via ${loggedInUser.role} credentials.`, loggedInUser);
    showToast(`Welcome to Smart E-Library, ${loggedInUser.name}!`);
  };

  const handleLogout = () => {
    if (user) {
      logActivity("Logout", `User ${user.name} logged out from the application.`, user);
    }
    setUser(null);
    localStorage.removeItem("smart_library_user");
    setActiveSection("library");
    showToast("Successfully logged out.");
  };

  const logActivity = async (action: string, details: string, activeUser = user) => {
    if (!activeUser) return;
    try {
      await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          details,
          userId: activeUser.uid,
          userName: activeUser.name
        })
      });
    } catch (err) {
      console.error("Error logging activity on server:", err);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (bookId: string) => {
    if (!user) return;
    let updated: string[];
    if (favorites.includes(bookId)) {
      updated = favorites.filter(id => id !== bookId);
      logActivity("Shelf Action", `Removed book "${bookId}" from favorites shelf.`);
      showToast("Removed from Favorites");
    } else {
      updated = [...favorites, bookId];
      logActivity("Shelf Action", `Added book "${bookId}" to favorites shelf.`);
      showToast("Added to Favorites!");
    }
    setFavorites(updated);
    localStorage.setItem(`favs_${user.uid}`, JSON.stringify(updated));
  };

  // Toggle Wishlist
  const handleToggleWishlist = (bookId: string) => {
    if (!user) return;
    let updated: string[];
    if (wishlist.includes(bookId)) {
      updated = wishlist.filter(id => id !== bookId);
      logActivity("Shelf Action", `Removed book "${bookId}" from reading wishlist.`);
      showToast("Removed from Wishlist");
    } else {
      updated = [...wishlist, bookId];
      logActivity("Shelf Action", `Added book "${bookId}" to reading wishlist.`);
      showToast("Added to reading Wishlist!");
    }
    setWishlist(updated);
    localStorage.setItem(`wish_${user.uid}`, JSON.stringify(updated));
  };

  // Upgrading premium subscription plan
  const handleUpgradeToPremium = async () => {
    if (!user) return;
    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          name: user.name,
          subscriptionPlan: "premium"
        })
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem("smart_library_user", JSON.stringify(data.user));
        logActivity("Subscription", "Upgraded account tier to Premium plan!");
        showToast("Hooray! You are now a Premium Member. PDF Downloads are unlocked.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Downgrade Plan
  const handleDowngradeToFree = async () => {
    if (!user) return;
    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          name: user.name,
          subscriptionPlan: "free"
        })
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem("smart_library_user", JSON.stringify(data.user));
        logActivity("Subscription", "Downgraded account tier to standard Free plan.");
        showToast("Switched back to Free plan.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reading progress update
  const handleProgressUpdate = async (bookId: string, lastPageRead: number, totalPages: number, secondsSpent: number) => {
    if (!user) return;
    try {
      // Fetch current progress to append reading seconds
      const response = await fetch("/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          bookId,
          lastPageRead,
          totalPages,
          secondsSpent
        })
      });
      const data = await response.json();
      if (response.ok) {
        // Increment minutes read in dashboard
        const minutesAdded = Math.round(secondsSpent / 60);
        if (minutesAdded > 0) {
          setMinutesReadToday(prev => prev + minutesAdded);
        }
      }
    } catch (err) {
      console.error("Error syncing reading progress:", err);
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Book reader trigger
  const activeReadingBook = books.find(b => b.id === activeReaderBookId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      
      {/* Interactive Toast banner */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Side Menu */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          
          {/* Platform Identity */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Library className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm tracking-wider text-emerald-300">SMART E-LIBRARY</span>
          </div>

          {/* User Profile Card */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-slate-700 object-cover shrink-0" />
            <div className="min-w-0">
              <span className="block text-xs font-extrabold text-slate-200 truncate">{user.name}</span>
              <span className="text-[10px] text-slate-500 capitalize">{user.role} Account</span>
              <div className="flex items-center gap-1 mt-1">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  user.subscriptionPlan === "premium" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-400"
                }`}>
                  {user.subscriptionPlan} Plan
                </span>
              </div>
            </div>
          </div>

          {/* Core Navigation menu */}
          <nav className="space-y-1">
            {[
              { id: "library", label: "Explore Catalog", icon: BookOpen },
              { id: "shelf", label: "Personal Bookshelf", icon: Bookmark },
              { id: "subscription", label: "Membership Plans", icon: Award }
            ].map((nav) => {
              const Icon = nav.icon;
              const isActive = activeSection === nav.id;

              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveSection(nav.id as any)}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-slate-100 font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{nav.label}</span>
                  </div>
                  {nav.id === "shelf" && (favorites.length + wishlist.length > 0) && (
                    <span className="bg-slate-950 text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded-full border border-slate-800">
                      {favorites.length + wishlist.length}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Librarian / Admin toggle panel */}
            {(user.role === "admin" || user.role === "librarian") && (
              <button
                onClick={() => setActiveSection("admin")}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  activeSection === "admin"
                    ? "bg-rose-600 text-slate-100 font-bold"
                    : "text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/20"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Backoffice</span>
              </button>
            )}

            {/* General FAQs Help */}
            <button
              onClick={() => setActiveSection("help")}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeSection === "help"
                  ? "bg-emerald-600 text-slate-100 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>General Knowledge FAQs</span>
            </button>
          </nav>

        </div>

        {/* Bottom Panel Actions */}
        <div className="pt-4 border-t border-slate-800/80 mt-6">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-950 hover:bg-red-950/20 border border-slate-800 hover:border-red-500/25 text-xs font-bold text-slate-400 hover:text-red-400 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main className="flex-1 bg-slate-950/40 p-5 md:p-8 overflow-y-auto">
        
        {/* Daily Progress Dashboard Metrics (Unified Dashboard) */}
        {activeSection !== "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-950/40 to-teal-950/40 p-4 rounded-2xl border border-emerald-500/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">Daily Study Goal</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-slate-100">{minutesReadToday}</span>
                  <span className="text-xs text-slate-400">/ {user.readingGoalsMinutes} mins</span>
                </div>
                <div className="w-24 bg-slate-900 h-1 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (minutesReadToday / user.readingGoalsMinutes) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-950/30 to-slate-900 p-4 rounded-2xl border border-amber-500/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">Active Daily Streak</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-slate-100">{streakDays}</span>
                  <span className="text-xs text-slate-400">days read</span>
                </div>
                <span className="text-[9px] text-slate-500 block">Maintain daily book opens!</span>
              </div>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl animate-pulse">
                <Flame className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Unlocked Badges</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-extrabold text-slate-100">Bronze scholar</span>
                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Unlocked</span>
                </div>
                <span className="text-[9px] text-slate-500 block">Read 3 books to earn Silver</span>
              </div>
              <div className="p-2.5 bg-slate-850 text-slate-400 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* SECTION SWITCH */}
        {activeSection === "library" && (
          <LibraryComponent
            user={user}
            books={books}
            onReadBook={(bookId) => {
              setActiveReaderBookId(bookId);
              logActivity("Open Reader", `Launched online digital reader for book "${bookId}".`);
            }}
            favorites={favorites}
            wishlist={wishlist}
            onToggleFavorite={handleToggleFavorite}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {/* PERSONAL BOOKSHELF TAB */}
        {activeSection === "shelf" && (
          <div className="space-y-8">
            {/* Favorites shelf */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span>My Favorites Bookshelf ({favorites.length})</span>
              </h3>

              {favorites.length === 0 ? (
                <div className="p-6 text-center bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-500">
                  You haven't favorited any books yet. Browse the library and click the heart icon.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {books.filter(b => favorites.includes(b.id)).map(b => (
                    <div key={b.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
                      <img src={b.coverUrl} className="w-full aspect-[3/4] object-cover rounded-lg mb-2" alt="" />
                      <h4 className="font-bold text-xs text-slate-200 truncate">{b.title}</h4>
                      <p className="text-[10px] text-slate-500 mb-2 truncate">By {b.author}</p>
                      <button
                        onClick={() => {
                          setActiveReaderBookId(b.id);
                          logActivity("Open Reader", `Launched online reader for book "${b.id}".`);
                        }}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold text-[10px] rounded-lg cursor-pointer transition-colors text-center"
                      >
                        Read Book
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reading wishlist */}
            <div className="space-y-3 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-amber-500 fill-current" />
                <span>Reading Wishlist ({wishlist.length})</span>
              </h3>

              {wishlist.length === 0 ? (
                <div className="p-6 text-center bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-500">
                  Your wishlist is empty. Add books to read later.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {books.filter(b => wishlist.includes(b.id)).map(b => (
                    <div key={b.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
                      <img src={b.coverUrl} className="w-full aspect-[3/4] object-cover rounded-lg mb-2" alt="" />
                      <h4 className="font-bold text-xs text-slate-200 truncate">{b.title}</h4>
                      <p className="text-[10px] text-slate-500 mb-2 truncate">By {b.author}</p>
                      <button
                        onClick={() => {
                          setActiveReaderBookId(b.id);
                          logActivity("Open Reader", `Launched online reader for book "${b.id}".`);
                        }}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold text-[10px] rounded-lg cursor-pointer transition-colors text-center"
                      >
                        Read Book
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MEMBERSHIP PLANS TAB */}
        {activeSection === "subscription" && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="text-lg font-extrabold text-slate-100 tracking-tight">Flexible Membership Access</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Upgrade to Premium and unlock offline PDF/EPUB compiler downloads, unlimited notes, early catalog releases, and first-line live desk routing.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-4">
              
              {/* Free Plan */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase block">Standard Tier</span>
                  <h4 className="text-xl font-extrabold text-slate-200">Free Access</h4>
                  <p className="text-xs text-slate-400">Perfect for casual self-study and general reading catalog.</p>
                  
                  <ul className="text-xs text-slate-300 space-y-2.5 pt-4">
                    <li className="flex items-center gap-2">✓ Read all 5 pre-installed core books</li>
                    <li className="flex items-center gap-2">✓ Sarah AI support virtual assist</li>
                    <li className="flex items-center gap-2 text-slate-500">✗ Offline PDF / EPUB compiling export</li>
                    <li className="flex items-center gap-2 text-slate-500">✗ Advanced custom notes annotations</li>
                  </ul>
                </div>

                <div className="pt-6">
                  {user.subscriptionPlan === "free" ? (
                    <div className="text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                      Your Active Subscription
                    </div>
                  ) : (
                    <button
                      onClick={handleDowngradeToFree}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 font-semibold text-xs rounded-xl cursor-pointer"
                    >
                      Downgrade to Standard Free
                    </button>
                  )}
                </div>
              </div>

              {/* Premium Plan */}
              <div className="bg-slate-900 p-6 rounded-2xl border-2 border-amber-500/40 relative flex flex-col justify-between">
                <div className="absolute -top-3 right-5 bg-amber-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Recommended
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] text-amber-400 font-extrabold uppercase block">Advanced Tier</span>
                  <h4 className="text-xl font-extrabold text-amber-400">Premium Scholar</h4>
                  <p className="text-xs text-slate-400">Unlock the full operational capabilities of the digital reader.</p>
                  
                  <ul className="text-xs text-slate-300 space-y-2.5 pt-4">
                    <li className="flex items-center gap-2 text-amber-300">✓ Full compilation EPUB / PDF downloads</li>
                    <li className="flex items-center gap-2">✓ Unlimited highlighted notes sticky annotations</li>
                    <li className="flex items-center gap-2">✓ First-line live help desk routing logs</li>
                    <li className="flex items-center gap-2">✓ Fully personalized reading stats and daily streak</li>
                  </ul>
                </div>

                <div className="pt-6">
                  {user.subscriptionPlan === "premium" ? (
                    <div className="text-center py-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-xl">
                      Your Active Premium Subscription
                    </div>
                  ) : (
                    <button
                      onClick={handleUpgradeToPremium}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-lg shadow-amber-950/40"
                    >
                      Upgrade to Premium Now
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* GENERAL KNOWLEDGE FAQs TAB */}
        {activeSection === "help" && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="text-lg font-extrabold text-slate-100 tracking-tight">Platform Knowledge Base</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Read our pre-configured guidelines for account management, physical operating times, online reader tips, and chatbot queries.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-3.5 pt-4">
              {[
                { q: "How do I read a book online?", a: "Simply visit the Explore Catalog tab, click on any book to open its detail drawer, and click 'Open Digital Reader Now'. Your progress is saved automatically!" },
                { q: "Are my highlights and notes private?", a: "Yes, all sticky annotations, notes, and colored highlights are bound securely to your user account and are only visible to you on your bookshelf." },
                { q: "What are the physical operating hours of the actual library?", a: "The physical library facility is open from Monday to Friday, 8:00 AM to 8:00 PM, and Saturday from 9:00 AM to 5:00 PM." },
                { q: "Can I download books for offline reading?", a: "Yes, but you must be a Premium Scholar member. Premium tier unlocks the PDF compiling export tool directly inside the digital reader's configuration bar." }
              ].map((faq, i) => (
                <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-xs text-slate-200">{faq.q}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIBRARIAN & ADMIN DASHBOARD SECTION */}
        {activeSection === "admin" && (
          <AdminDashboardComponent
            user={user}
            books={books}
            onRefreshBooks={fetchLibraryBooks}
            onActivityLog={logActivity}
          />
        )}

      </main>

      {/* Floating Interactive Chatbot Panel */}
      <SupportChatComponent
        user={user}
        currentBookTitle={activeReadingBook?.title}
        onActivityLog={logActivity}
      />

      {/* Active Reading Book fullscreen reader */}
      {activeReadingBook && (
        <ReaderComponent
          userId={user.uid}
          book={activeReadingBook}
          onClose={() => {
            setActiveReaderBookId(null);
            logActivity("Close Reader", `Closed online digital reader for "${activeReadingBook.title}".`);
          }}
          subscriptionPlan={user.subscriptionPlan}
          onProgressUpdate={handleProgressUpdate}
          onActivityLog={logActivity}
        />
      )}

    </div>
  );
}
