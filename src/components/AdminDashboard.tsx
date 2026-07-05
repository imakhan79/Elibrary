import React, { useState, useEffect } from "react";
import { UserProfile, Book, FAQItem, UnansweredQuestion, UserActivityLog } from "../types";
import { Shield, Users, BookOpen, Key, Activity, Heart, HelpCircle, FileText, Plus, Edit, Trash2, Download, Upload, AlertCircle, RefreshCw, Layers, CheckCircle2, Save, FileJson, BarChart2 } from "lucide-react";

interface AdminDashboardProps {
  user: UserProfile;
  books: Book[];
  onRefreshBooks: () => void;
  onActivityLog: (action: string, details: string) => void;
}

export default function AdminDashboardComponent({
  user,
  books,
  onRefreshBooks,
  onActivityLog,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "books" | "faqs" | "unanswered" | "logs" | "backups">("stats");

  // Admin DB Stats states
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalBooks: 0,
    totalFaqs: 0,
    unansweredCount: 0,
    rolesBreakdown: {},
    plansBreakdown: {}
  });

  // Entities state
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [faqList, setFaqList] = useState<FAQItem[]>([]);
  const [unansweredList, setUnansweredList] = useState<UnansweredQuestion[]>([]);
  const [logsList, setLogsList] = useState<UserActivityLog[]>([]);

  // Editing forms state
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    category: "Technology",
    genre: "General",
    publisher: "Apex Publishing",
    language: "English",
    year: 2026,
    description: "",
    coverUrl: "",
    pageCount: 3,
    pagesText: "Page 1 content\n---\nPage 2 content\n---\nPage 3 content"
  });

  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [editingFAQId, setEditingFAQId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "platform" as any,
    synonymsText: ""
  });

  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const refreshAllAdminData = async () => {
    try {
      // Stats & Logs
      const statsRes = await fetch("/api/admin/stats");
      const statsData = await statsRes.json();
      setStats(statsData);
      setLogsList(statsData.logs || []);

      // Users
      const usersRes = await fetch("/api/admin/users");
      const usersData = await usersRes.json();
      setUserList(usersData.users || []);

      // FAQs
      const faqsRes = await fetch("/api/chatbot/faqs");
      const faqsData = await faqsRes.json();
      setFaqList(faqsData.faqs || []);

      // Unanswered
      const unRes = await fetch("/api/chatbot/unanswered");
      const unData = await unRes.json();
      setUnansweredList(unData.unanswered || []);

    } catch (err) {
      console.error("Error refreshing admin console:", err);
    }
  };

  useEffect(() => {
    refreshAllAdminData();
  }, [activeTab]);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3500);
  };

  // User role modify
  const handleChangeRole = async (targetUid: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: targetUid,
          role: newRole,
          adminUserId: user.uid,
          adminUserName: user.name
        })
      });
      if (!res.ok) throw new Error("Could not update role");
      showStatus("User role and privileges updated!");
      refreshAllAdminData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Subscription plan modify
  const handleChangeSubscription = async (targetUser: any, newPlan: "free" | "premium") => {
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: targetUser.uid,
          name: targetUser.name,
          subscriptionPlan: newPlan
        })
      });
      if (!res.ok) throw new Error("Could not update subscription plan");
      showStatus(`Subscription upgraded for ${targetUser.name}!`);
      refreshAllAdminData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Book Edit / Add Save
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pagesArray = bookForm.pagesText.split("\n---\n").map(p => p.trim());
      const payloadBook = {
        title: bookForm.title,
        author: bookForm.author,
        category: bookForm.category,
        genre: bookForm.genre,
        publisher: bookForm.publisher,
        language: bookForm.language,
        year: Number(bookForm.year),
        description: bookForm.description,
        coverUrl: bookForm.coverUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80",
        pageCount: pagesArray.length,
        pages: pagesArray
      };

      if (editingBookId) {
        // Edit existing
        const res = await fetch(`/api/books/${editingBookId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book: payloadBook, userId: user.uid, userName: user.name })
        });
        if (!res.ok) throw new Error("Edit book request failed");
        showStatus("Book details successfully updated.");
      } else {
        // Create new
        const res = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book: payloadBook, userId: user.uid, userName: user.name })
        });
        if (!res.ok) throw new Error("Create book request failed");
        showStatus(`"${payloadBook.title}" added to the library catalogue!`);
      }

      // Reset
      setIsAddingBook(false);
      setEditingBookId(null);
      setBookForm({
        title: "",
        author: "",
        category: "Technology",
        genre: "General",
        publisher: "Apex Publishing",
        language: "English",
        year: 2026,
        description: "",
        coverUrl: "",
        pageCount: 3,
        pagesText: "Page 1 content\n---\nPage 2 content\n---\nPage 3 content"
      });
      onRefreshBooks();
      refreshAllAdminData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleEditBookClick = (book: Book) => {
    setEditingBookId(book.id);
    setBookForm({
      title: book.title,
      author: book.author,
      category: book.category,
      genre: book.genre,
      publisher: book.publisher,
      language: book.language,
      year: book.year,
      description: book.description,
      coverUrl: book.coverUrl,
      pageCount: book.pageCount,
      pagesText: book.pages.join("\n---\n")
    });
    setIsAddingBook(true);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Are you absolutely sure you want to delete this book? This will clear its content and reviews.")) return;
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, userName: user.name })
      });
      if (!res.ok) throw new Error("Delete book failed");
      showStatus("Book removed successfully.");
      onRefreshBooks();
      refreshAllAdminData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // FAQ CRUD Saves
  const handleSaveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const syns = faqForm.synonymsText.split(",").map(s => s.trim()).filter(s => s.length > 0);
      const payloadFAQ = {
        question: faqForm.question,
        answer: faqForm.answer,
        category: faqForm.category,
        synonyms: syns
      };

      if (editingFAQId) {
        // Edit existing
        const res = await fetch(`/api/chatbot/faqs/${editingFAQId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ faq: payloadFAQ })
        });
        if (!res.ok) throw new Error("Edit FAQ failed");
        showStatus("Knowledge FAQ entry successfully updated.");
      } else {
        // Create new
        const res = await fetch("/api/chatbot/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ faq: payloadFAQ })
        });
        if (!res.ok) throw new Error("Add FAQ failed");
        showStatus("FAQ query successfully registered into Sarah's brain!");
      }

      setIsAddingFAQ(false);
      setEditingFAQId(null);
      setFaqForm({ question: "", answer: "", category: "platform", synonymsText: "" });
      refreshAllAdminData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleEditFAQClick = (faq: FAQItem) => {
    setEditingFAQId(faq.id);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      synonymsText: faq.synonyms ? faq.synonyms.join(", ") : ""
    });
    setIsAddingFAQ(true);
  };

  const handleDeleteFAQ = async (faqId: string) => {
    try {
      const res = await fetch(`/api/chatbot/faqs/${faqId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete FAQ failed");
      showStatus("Knowledge base entry deleted.");
      refreshAllAdminData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Resolve Unanswered: Auto-load into FAQ Form to train Sarah
  const handleTrainUnanswered = (un: UnansweredQuestion) => {
    setFaqForm({
      question: un.question,
      answer: "",
      category: "general",
      synonymsText: ""
    });
    setIsAddingFAQ(true);
    // Delete unanswered query on training load
    handleDeleteUnanswered(un.id);
  };

  const handleDeleteUnanswered = async (id: string) => {
    try {
      await fetch(`/api/chatbot/unanswered/${id}`, { method: "DELETE" });
      refreshAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Backup JSON paste / restore
  const [backupJSONInput, setBackupJSONInput] = useState("");
  const handleRestoreDatabase = async () => {
    if (!backupJSONInput.trim()) {
      showError("Please paste a valid JSON backup string");
      return;
    }
    try {
      const parsed = JSON.parse(backupJSONInput);
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsed })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Restore failed");

      showStatus("Database recovery completed! Refreshing catalog...");
      setBackupJSONInput("");
      onRefreshBooks();
      refreshAllAdminData();
    } catch (err: any) {
      showError(`Restore Error: ${err.message}. Ensure valid JSON structure.`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Title bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <Shield className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-100">Librarian & Admin Dashboard</h2>
            <p className="text-xs text-slate-400 mt-0.5">Welcome, Admin {user.name}. You hold full operational oversight.</p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex gap-2">
          <button
            onClick={refreshAllAdminData}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-px">
        {[
          { id: "stats", label: "Stats & Analytics", icon: BarChart2 },
          { id: "users", label: "Users & Subscriptions", icon: Users },
          { id: "books", label: "Book Inventory Manager", icon: BookOpen },
          { id: "faqs", label: "Sarah Knowledge FAQs", icon: HelpCircle },
          { id: "unanswered", label: `Sarah Training (${unansweredList.length})`, icon: Key },
          { id: "logs", label: "System Activity Logs", icon: Activity },
          { id: "backups", label: "Backup & Recovery", icon: Layers }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsAddingBook(false);
                setIsAddingFAQ(false);
                setEditingBookId(null);
                setEditingFAQId(null);
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "border-emerald-500 text-emerald-400 bg-slate-800/40 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels content */}
      <div className="bg-slate-850/30 p-1.5 rounded-2xl">
        
        {/* STATS & REPORTS TAB */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-800 rounded-xl border border-slate-700/40">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Registered Readers</span>
                <span className="block text-2xl font-extrabold text-emerald-400 mt-2">{stats.totalUsers}</span>
                <span className="text-[9px] text-slate-400 block mt-1">Unified login accounts database</span>
              </div>
              <div className="p-5 bg-slate-800 rounded-xl border border-slate-700/40">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Books Catalog</span>
                <span className="block text-2xl font-extrabold text-emerald-400 mt-2">{stats.totalBooks}</span>
                <span className="text-[9px] text-slate-400 block mt-1">Assigned categories & readable text</span>
              </div>
              <div className="p-5 bg-slate-800 rounded-xl border border-slate-700/40">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Chatbot FAQ rules</span>
                <span className="block text-2xl font-extrabold text-emerald-400 mt-2">{stats.totalFaqs}</span>
                <span className="text-[9px] text-slate-400 block mt-1">RAG Context matches search rules</span>
              </div>
              <div className="p-5 bg-slate-800 rounded-xl border border-slate-700/40">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Monitored Unanswered queries</span>
                <span className="block text-2xl font-extrabold text-emerald-400 mt-2">{stats.unansweredCount}</span>
                <span className="text-[9px] text-slate-400 block mt-1">Sarah auto-logged logs training</span>
              </div>
            </div>

            {/* Visual simple chart metrics breakdowns */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Roles Breakdown */}
              <div className="p-5 bg-slate-800 rounded-xl border border-slate-700/40 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">System Roles Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(stats.rolesBreakdown || {}).map(([role, val]: any) => (
                    <div key={role} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span className="capitalize font-bold">{role}</span>
                        <span>{val} Users ({Math.round((val / stats.totalUsers) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${(val / stats.totalUsers) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plans Breakdown */}
              <div className="p-5 bg-slate-800 rounded-xl border border-slate-700/40 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Subscription Tier Breakdown</h4>
                <div className="space-y-3">
                  {Object.entries(stats.plansBreakdown || {}).map(([plan, val]: any) => (
                    <div key={plan} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span className="capitalize font-bold">{plan} Tier</span>
                        <span>{val} Accounts ({Math.round((val / stats.totalUsers) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${(val / stats.totalUsers) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS & SUBSCRIPTIONS TAB */}
        {activeTab === "users" && (
          <div className="bg-slate-800 rounded-xl border border-slate-700/40 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-3">User & Email</th>
                  <th className="p-3">Role Level</th>
                  <th className="p-3">Subscription</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {userList.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-750 transition-colors">
                    <td className="p-3 flex items-center gap-3">
                      <img src={u.avatar} className="w-8 h-8 rounded-full border border-slate-700" alt="" />
                      <div>
                        <span className="font-bold text-slate-200 block">{u.name}</span>
                        <span className="text-[10px] text-slate-500">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                        u.role === "admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        u.role === "librarian" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`capitalize font-semibold ${u.subscriptionPlan === "premium" ? "text-amber-400" : "text-slate-400"}`}>
                        {u.subscriptionPlan} Plan
                      </span>
                    </td>
                    <td className="p-3 text-[10px] text-slate-500">
                      {new Date(u.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {/* Change Role selectors */}
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.uid, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-[10px] rounded px-1.5 py-1 text-slate-300 focus:outline-none"
                      >
                        <option value="student">Student</option>
                        <option value="reader">Reader</option>
                        <option value="premium">Premium</option>
                        <option value="librarian">Librarian</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Upgrade Plan buttons */}
                      <button
                        onClick={() => handleChangeSubscription(u, u.subscriptionPlan === "premium" ? "free" : "premium")}
                        className={`text-[10px] border px-2 py-1 rounded font-bold cursor-pointer transition-colors ${
                          u.subscriptionPlan === "premium"
                            ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                            : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        }`}
                      >
                        {u.subscriptionPlan === "premium" ? "Downgrade free" : "Upgrade premium"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BOOK INVENTORY MANAGER TAB */}
        {activeTab === "books" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider">Digital Book Database ({books.length})</h4>
              {!isAddingBook && (
                <button
                  onClick={() => setIsAddingBook(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Book</span>
                </button>
              )}
            </div>

            {isAddingBook ? (
              <form onSubmit={handleSaveBook} className="bg-slate-800 p-6 rounded-xl border border-slate-700/40 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                  <h5 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
                    {editingBookId ? "Modify Digital Book" : "Register Book Entry"}
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBook(false);
                      setEditingBookId(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel Forms
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Book Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Modern Javascript"
                      value={bookForm.title}
                      onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Author Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Douglas Crockford"
                      value={bookForm.author}
                      onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Library Category</label>
                    <select
                      value={bookForm.category}
                      onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="Technology">Technology</option>
                      <option value="Science Fiction">Science Fiction</option>
                      <option value="Self-Help">Self-Help</option>
                      <option value="History">History</option>
                      <option value="Literature">Literature</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Release Year</label>
                    <input
                      type="number"
                      required
                      value={bookForm.year}
                      onChange={(e) => setBookForm({ ...bookForm, year: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Description / Summary</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Brief synopsis..."
                      value={bookForm.description}
                      onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Page-by-page text (Split pages by '---' line divider)</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Welcome to Page 1!\n---\nWelcome to Page 2!\n---\nWelcome to Page 3!"
                      value={bookForm.pagesText}
                      onChange={(e) => setBookForm({ ...bookForm, pagesText: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-right pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold text-xs rounded-xl flex items-center gap-1.5 ml-auto cursor-pointer shadow-lg shadow-emerald-950/40"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Book Entry</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {books.map((b) => (
                  <div key={b.id} className="p-4 bg-slate-800 rounded-xl border border-slate-700/45 flex gap-3 relative group">
                    <img src={b.coverUrl} className="w-12 h-18 object-cover rounded shadow border border-slate-700" alt="" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="block text-[9px] text-emerald-400 font-bold uppercase">{b.category}</span>
                      <h5 className="font-bold text-xs text-slate-100 truncate">{b.title}</h5>
                      <p className="text-[10px] text-slate-400 truncate">By {b.author}</p>
                      
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleEditBookClick(b)}
                          className="text-[10px] font-bold text-slate-300 hover:text-emerald-400 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBook(b.id)}
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SARAH KNOWLEDGE FAQs TAB */}
        {activeTab === "faqs" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider">FAQ Knowledge Base ({faqList.length})</h4>
              {!isAddingFAQ && (
                <button
                  onClick={() => setIsAddingFAQ(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add FAQ Query</span>
                </button>
              )}
            </div>

            {isAddingFAQ ? (
              <form onSubmit={handleSaveFAQ} className="bg-slate-800 p-5 rounded-xl border border-slate-700/40 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                  <h5 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
                    {editingFAQId ? "Modify Knowledge rule" : "Register Knowledge FAQ"}
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFAQ(false);
                      setEditingFAQId(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel Forms
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">User Question Formulation</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. What are the physical library operating hours?"
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Knowledge Group Category</label>
                    <select
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="books">Books & Catalogue</option>
                      <option value="accounts">User Accounts & Auth</option>
                      <option value="platform">Reader & Platform Features</option>
                      <option value="general">General Helpdesk & Timing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Synonyms or Alternate question phrases (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. hours, timings, open hours, operating times"
                      value={faqForm.synonymsText}
                      onChange={(e) => setFaqForm({ ...faqForm, synonymsText: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Sarah's Verified Answer reply</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Provide the exact verified answer for Sarah to repeat..."
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold text-xs rounded-xl flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Train Sarah on FAQ</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2.5">
                {faqList.map((f) => (
                  <div key={f.id} className="p-4 bg-slate-800 rounded-xl border border-slate-700/40 flex justify-between items-start gap-4">
                    <div className="space-y-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-[9px] text-emerald-400 font-bold capitalize">
                        {f.category}
                      </span>
                      <h5 className="font-bold text-xs text-slate-100">{f.question}</h5>
                      <p className="text-[10px] text-slate-400 leading-normal">{f.answer}</p>
                      {f.synonyms && f.synonyms.length > 0 && (
                        <p className="text-[9px] text-slate-500">Synonyms: {f.synonyms.join(", ")}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEditFAQClick(f)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-750 border border-slate-700 rounded text-slate-400 hover:text-slate-200"
                        title="Edit FAQ"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFAQ(f.id)}
                        className="p-1.5 bg-slate-900 hover:bg-red-950/40 border border-slate-700 rounded text-red-500 hover:text-red-400"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI TRAINING & UNANSWERED QUESTIONS MONITOR TAB */}
        {activeTab === "unanswered" && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/40 flex items-center gap-3">
              <AlertCircle className="w-5.5 h-5.5 text-amber-400 shrink-0" />
              <div>
                <h5 className="text-xs font-extrabold text-slate-200 uppercase tracking-wide">Continuous Learning AI system</h5>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Sarah AI automatically flags queries that are not matched in our FAQ knowledge base or trigger low confidence. You can immediately resolve these and train Sarah.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {unansweredList.length === 0 ? (
                <div className="p-8 text-center bg-slate-800/30 rounded-xl border border-slate-800/80">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-bold">Excellent! Sarah is fully trained</p>
                  <p className="text-[10px] text-slate-500 mt-1">There are no pending unanswered questions in the continuous log.</p>
                </div>
              ) : (
                unansweredList.map((un) => (
                  <div key={un.id} className="p-4 bg-slate-850 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-500 font-semibold uppercase">Asked {un.count} times • Recent: {new Date(un.askedAt).toLocaleDateString()}</span>
                      <h5 className="font-bold text-xs text-slate-200">"{un.question}"</h5>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTrainUnanswered(un)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold text-[10px] rounded-lg cursor-pointer"
                      >
                        Write Answer & Train
                      </button>
                      <button
                        onClick={() => handleDeleteUnanswered(un.id)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-750 rounded-lg text-slate-400 hover:text-slate-200 text-[10px] font-semibold cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SYSTEM ACTIVITY LOGS TAB */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider">System Activity Logs (Last 50)</h4>
              <button
                onClick={async () => {
                  if (confirm("Clear live activity logs?")) {
                    await fetch("/api/admin/clear-logs", { method: "POST" });
                    refreshAllAdminData();
                  }
                }}
                className="text-[10px] text-red-400 hover:text-red-300 font-semibold"
              >
                Flush Logs Cache
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-[10px] font-mono text-slate-300">
              <div className="p-2.5 bg-slate-950 font-bold border-b border-slate-800 flex justify-between">
                <span>Action & Details</span>
                <span>User & Timestamp</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-850">
                {logsList.map((log) => (
                  <div key={log.id} className="p-2.5 hover:bg-slate-850/40 flex justify-between gap-4">
                    <div>
                      <span className="text-emerald-400 font-bold uppercase mr-2">[{log.action}]</span>
                      <span>{log.details}</span>
                    </div>
                    <div className="text-right text-slate-500 shrink-0">
                      <span>{log.userName} • {new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BACKUP & RECOVERY TAB */}
        {activeTab === "backups" && (
          <div className="space-y-6 p-4">
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Export Panel */}
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/40 space-y-4">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Export Database Backup</h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Download a snapshot of the entire library state—including accounts, custom books, annotations, and chatbot FAQs—into a unified backup JSON file.
                </p>
                <a
                  href="/api/admin/backup"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  <FileJson className="w-4 h-4" />
                  <span>Download Backup JSON File</span>
                </a>
              </div>

              {/* Restore Panel */}
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/40 space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Restore database recovery</h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Paste the JSON backup content into the field below to immediately restore or overwrite the active library catalogue databases.
                </p>
                
                <textarea
                  placeholder='Paste JSON data e.g. { "users": {}, "books": [] }...'
                  rows={4}
                  value={backupJSONInput}
                  onChange={(e) => setBackupJSONInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleRestoreDatabase}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-slate-100 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Trigger Recovery Restore
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
