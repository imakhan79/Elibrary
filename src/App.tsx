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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row relative font-sans">
      
      {/* Interactive Toast banner */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-medium shadow-xl flex items-center gap-2 animate-bounce border border-slate-800">
          <CheckCircle className="w-4 h-4 text-indigo-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Side Menu */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          
          {/* Platform Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
              <Library className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900">SMART E-LIBRARY</span>
          </div>

          {/* User Profile Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
            <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover shrink-0" />
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-800 truncate">{user.name}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{user.role} Account</span>
              <div className="flex items-center gap-1 mt-1">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  user.subscriptionPlan === "premium" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-200 text-slate-600"
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
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{nav.label}</span>
                  </div>
                  {nav.id === "shelf" && (favorites.length + wishlist.length > 0) && (
                    <span className="bg-indigo-100 text-[9px] text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">
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
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeSection === "admin"
                    ? "bg-rose-50 text-rose-700 font-bold shadow-sm border border-rose-100"
                    : "text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Backoffice</span>
              </button>
            )}

            {/* General FAQs Help */}
            <button
              onClick={() => setActiveSection("help")}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                activeSection === "help"
                  ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>General Knowledge FAQs</span>
            </button>
          </nav>

        </div>

        {/* Bottom Panel Actions */}
        <div className="pt-4 border-t border-slate-100 mt-6">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-50 hover:bg-red-50 border border-slate-250 hover:border-red-200 text-xs font-bold text-slate-600 hover:text-red-600 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main className="flex-1 bg-[#F8FAFC] p-5 md:p-8 overflow-y-auto">
        
        {/* Daily Progress Dashboard Metrics (Unified Dashboard) */}
        {activeSection !== "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* Daily Study Goal */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Daily Study Goal</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-800">{minutesReadToday}</span>
                  <span className="text-xs text-slate-500">/ {user.readingGoalsMinutes} mins</span>
                </div>
                <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (minutesReadToday / user.readingGoalsMinutes) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Active Daily Streak */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Active Daily Streak</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-800">{streakDays}</span>
                  <span className="text-xs text-slate-500">days read</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">Maintain daily book opens!</span>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shadow-inner">
                <Flame className="w-5 h-5 fill-current" />
              </div>
            </div>

            {/* Unlocked Badges */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Unlocked Badges</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-bold text-slate-800">Bronze scholar</span>
                  <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">Unlocked</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">Read 3 books for Silver</span>
              </div>
              <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl shadow-inner">
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
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-light text-slate-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                <span>My Favorites Bookshelf ({favorites.length})</span>
              </h3>

              {favorites.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 shadow-sm">
                  You haven't favorited any books yet. Browse the library catalog and click the heart icon.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {books.filter(b => favorites.includes(b.id)).map(b => (
                    <div key={b.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <img src={b.coverUrl} className="w-full aspect-[3/4] object-cover rounded-xl mb-3 shadow-sm border border-slate-100" alt="" />
                      <h4 className="font-bold text-xs text-slate-800 truncate">{b.title}</h4>
                      <p className="text-[10px] text-slate-400 mb-3 truncate">By {b.author}</p>
                      <button
                        onClick={() => {
                          setActiveReaderBookId(b.id);
                          logActivity("Open Reader", `Launched online reader for book "${b.id}".`);
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors text-center uppercase tracking-wider shadow-sm"
                      >
                        Read Book
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reading wishlist */}
            <div className="space-y-4 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-serif font-light text-slate-800 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-500 fill-current" />
                <span>Reading Wishlist ({wishlist.length})</span>
              </h3>

              {wishlist.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 shadow-sm">
                  Your wishlist is empty. Add books to your wishlist to read them later.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {books.filter(b => wishlist.includes(b.id)).map(b => (
                    <div key={b.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <img src={b.coverUrl} className="w-full aspect-[3/4] object-cover rounded-xl mb-3 shadow-sm border border-slate-100" alt="" />
                      <h4 className="font-bold text-xs text-slate-800 truncate">{b.title}</h4>
                      <p className="text-[10px] text-slate-400 mb-3 truncate">By {b.author}</p>
                      <button
                        onClick={() => {
                          setActiveReaderBookId(b.id);
                          logActivity("Open Reader", `Launched online reader for book "${b.id}".`);
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors text-center uppercase tracking-wider shadow-sm"
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
              <h3 className="text-2xl font-serif font-light text-slate-800 tracking-tight">Flexible Membership Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-normal">
                Upgrade to Premium and unlock offline PDF/EPUB compiler downloads, unlimited notes, early catalog releases, and first-line live desk routing.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-6">
              
              {/* Free Plan */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Standard Tier</span>
                  <h4 className="text-2xl font-serif font-light text-slate-800">Free Access</h4>
                  <p className="text-xs text-slate-400">Perfect for casual self-study and general reading catalog.</p>
                  
                  <ul className="text-xs text-slate-600 space-y-2.5 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2">✓ Read all 5 pre-installed core books</li>
                    <li className="flex items-center gap-2">✓ Sarah AI support virtual assist</li>
                    <li className="flex items-center gap-2 text-slate-350">✗ Offline PDF / EPUB compiling export</li>
                    <li className="flex items-center gap-2 text-slate-355">✗ Advanced custom notes annotations</li>
                  </ul>
                </div>

                <div className="pt-6">
                  {user.subscriptionPlan === "free" ? (
                    <div className="text-center py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl uppercase tracking-wider">
                      Your Active Subscription
                    </div>
                  ) : (
                    <button
                      onClick={handleDowngradeToFree}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 font-bold text-xs rounded-xl cursor-pointer border border-slate-200 uppercase tracking-wider transition-all"
                    >
                      Downgrade to Standard Free
                    </button>
                  )}
                </div>
              </div>

              {/* Premium Plan */}
              <div className="bg-white p-6 rounded-2xl border-2 border-indigo-600 relative flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
                <div className="absolute -top-3 right-5 bg-indigo-600 text-white font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                  Recommended
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest block">Advanced Tier</span>
                  <h4 className="text-2xl font-serif font-light text-slate-800">Premium Scholar</h4>
                  <p className="text-xs text-slate-400 font-normal">Unlock the full operational capabilities of the digital reader.</p>
                  
                  <ul className="text-xs text-slate-600 space-y-2.5 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2 text-indigo-600 font-medium">✓ Full compilation EPUB / PDF downloads</li>
                    <li className="flex items-center gap-2">✓ Unlimited highlighted notes sticky annotations</li>
                    <li className="flex items-center gap-2">✓ First-line live help desk routing logs</li>
                    <li className="flex items-center gap-2">✓ Fully personalized reading stats and daily streak</li>
                  </ul>
                </div>

                <div className="pt-6">
                  {user.subscriptionPlan === "premium" ? (
                    <div className="text-center py-2.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl uppercase tracking-wider">
                      Your Active Premium Subscription
                    </div>
                  ) : (
                    <button
                      onClick={handleUpgradeToPremium}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md uppercase tracking-wider"
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
              <h3 className="text-2xl font-serif font-light text-slate-800 tracking-tight">Platform Knowledge Base</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-normal">
                Read our pre-configured guidelines for account management, physical operating times, online reader tips, and chatbot queries.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4 pt-6">
              {[
                { q: "How do I read a book online?", a: "Simply visit the Explore Catalog tab, click on any book to open its detail drawer, and click 'Open Digital Reader Now'. Your progress is saved automatically!" },
                { q: "Are my highlights and notes private?", a: "Yes, all sticky annotations, notes, and colored highlights are bound securely to your user account and are only visible to you on your bookshelf." },
                { q: "What are the physical operating hours of the actual library?", a: "The physical library facility is open from Monday to Friday, 8:00 AM to 8:00 PM, and Saturday from 9:00 AM to 5:00 PM." },
                { q: "Can I download books for offline reading?", a: "Yes, but you must be a Premium Scholar member. Premium tier unlocks the PDF compiling export tool directly inside the digital reader's configuration bar." }
              ].map((faq, i) => (
                <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-1.5 hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-xs text-slate-800 font-sans">{faq.q}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans font-normal">{faq.a}</p>
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
