import React, { useState, useEffect, useRef } from "react";
import { Book, Bookmark as BookmarkType, Highlight, Note } from "../types";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut, Search, Highlighter, Plus, Save, Trash2, Sliders, Volume2, BookOpen, Download, HelpCircle, FileDown, BookMarked, Settings } from "lucide-react";

interface ReaderProps {
  userId: string;
  book: Book;
  onClose: () => void;
  subscriptionPlan: "free" | "premium";
  onProgressUpdate: (bookId: string, lastPageRead: number, totalPages: number, secondsSpent: number) => void;
  onActivityLog: (action: string, details: string) => void;
}

export default function ReaderComponent({
  userId,
  book,
  onClose,
  subscriptionPlan,
  onProgressUpdate,
  onActivityLog,
}: ReaderProps) {
  // Page Navigation
  const [currentPage, setCurrentPage] = useState(0);

  // Styling & Themes
  const [readingTheme, setReadingTheme] = useState<"light" | "dark" | "sepia">("light");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("serif");
  const [zoomFactor, setZoomFactor] = useState(100); // 100%
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search within book
  const [searchQuery, setSearchQuery] = useState("");

  // Highlights, Bookmarks, Notes
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [activeHighlightColor, setActiveHighlightColor] = useState("bg-yellow-500/30");
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState("");

  // Control sidebars
  const [showConfigSidebar, setShowConfigSidebar] = useState(false);
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);

  // Time tracking
  const timeRef = useRef<number>(0);

  // Load reading state from API on mount
  useEffect(() => {
    const fetchReaderActionsAndProgress = async () => {
      try {
        // Fetch progress
        const progRes = await fetch(`/api/reading-progress/${userId}`);
        const progData = await progRes.json();
        if (progData.progress && progData.progress[book.id]) {
          const lastPage = progData.progress[book.id].lastPageRead;
          if (lastPage >= 0 && lastPage < book.pages.length) {
            setCurrentPage(lastPage);
          }
        }

        // Fetch actions
        const actionsRes = await fetch(`/api/books/actions/${userId}/${book.id}`);
        const actionsData = await actionsRes.json();
        if (actionsRes.ok) {
          setBookmarks(actionsData.bookmarks.map((b: any) => b.pageNumber));
          setHighlights(actionsData.highlights || []);
          setNotes(actionsData.notes || []);
        }
      } catch (err) {
        console.error("Error reading initial state:", err);
      }
    };
    fetchReaderActionsAndProgress();

    // Start interval to track time spent
    const interval = setInterval(() => {
      timeRef.current += 1;
    }, 1000);

    return () => {
      clearInterval(interval);
      // Synchronize reading progress on unmount or close
      if (timeRef.current > 0) {
        onProgressUpdate(book.id, currentPage, book.pages.length, timeRef.current);
      }
    };
  }, [book.id, userId]);

  // Sync progress on page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= book.pages.length) return;

    // Save previous time chunk
    onProgressUpdate(book.id, newPage, book.pages.length, timeRef.current);
    timeRef.current = 0; // reset

    setCurrentPage(newPage);
  };

  // Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Bookmark toggler
  const toggleBookmark = async () => {
    const isBookmarked = bookmarks.includes(currentPage);
    try {
      if (isBookmarked) {
        await fetch("/api/books/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "remove-bookmark",
            userId,
            bookId: book.id,
            details: { pageNumber: currentPage }
          })
        });
        setBookmarks(bookmarks.filter((b) => b !== currentPage));
        onActivityLog("Unbookmark", `Removed bookmark from page ${currentPage + 1} of "${book.title}"`);
      } else {
        await fetch("/api/books/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "bookmark",
            userId,
            bookId: book.id,
            details: { pageNumber: currentPage }
          })
        });
        setBookmarks([...bookmarks, currentPage]);
        onActivityLog("Bookmark", `Bookmarked page ${currentPage + 1} of "${book.title}"`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Highlight Text
  const handleHighlightSelection = async () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === "") return;

    const selectedText = selection.toString().trim();
    try {
      const response = await fetch("/api/books/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "highlight",
          userId,
          bookId: book.id,
          details: {
            pageNumber: currentPage,
            text: selectedText,
            color: activeHighlightColor
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        setHighlights([data.highlight, ...highlights]);
        onActivityLog("Highlight", `Highlighted text: "${selectedText.slice(0, 30)}..." inside "${book.title}"`);
      }
    } catch (err) {
      console.error(err);
    }
    selection.removeAllRanges();
  };

  const handleRemoveHighlight = async (id: string) => {
    try {
      await fetch("/api/books/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove-highlight",
          userId,
          bookId: book.id,
          details: { highlightId: id }
        })
      });
      setHighlights(highlights.filter((h) => h.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Note/Annotation submit
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      const response = await fetch("/api/books/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "note",
          userId,
          bookId: book.id,
          details: {
            pageNumber: currentPage,
            text: newNoteText.trim()
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        setNotes([data.note, ...notes]);
        setNewNoteText("");
        onActivityLog("Add Note", `Saved reading annotation on page ${currentPage + 1} of "${book.title}"`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await fetch("/api/books/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-note",
          userId,
          bookId: book.id,
          details: { noteId: id }
        })
      });
      setNotes(notes.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Premium PDF Generation Sim
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const triggerPDFDownload = () => {
    if (subscriptionPlan !== "premium") {
      alert("Subscription Plan Required: Please upgrade to Premium under Settings to unlock offline PDF/EPUB downloads.");
      return;
    }

    setDownloading(true);
    setDownloadProgress(10);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloading(false);
            setDownloadProgress(0);
            onActivityLog("PDF Export", `Successfully compiled and downloaded "${book.title}" as PDF format.`);
            alert(`Download Completed: "${book.title}.pdf" was saved to your device offline storage.`);
          }, 500);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Simple highlighted search terms inside page renderer
  const renderPageText = () => {
    const text = book.pages[currentPage] || "";
    if (!searchQuery.trim()) return text;

    // Split text by matching term case-insensitively
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return (
      <>
        {parts.map((part, i) => {
          const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
          return isMatch ? (
            <mark key={i} className="bg-yellow-300 text-slate-900 rounded px-0.5 font-bold animate-pulse">
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </>
    );
  };

  // Dynamic Theme Palette Definitions
  const palette = {
    light: {
      bg: "bg-[#FAFAF9]",
      text: "text-slate-800",
      header: "bg-white text-slate-800 border-slate-200/80",
      sidebar: "bg-[#FAFAF9] text-slate-700 border-slate-200/80",
      footer: "bg-white text-slate-800 border-slate-200/80",
      btn: "bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:bg-slate-50 disabled:text-slate-300 border-slate-200/50",
      input: "bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-600",
      card: "bg-white border-slate-200 text-slate-700 shadow-sm",
      tip: "bg-slate-900 text-slate-200 border-slate-800",
      accent: "text-indigo-600",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    dark: {
      bg: "bg-slate-950",
      text: "text-slate-200",
      header: "bg-slate-950 text-slate-100 border-slate-900",
      sidebar: "bg-slate-900 text-slate-300 border-slate-950",
      footer: "bg-slate-950 text-slate-100 border-slate-900",
      btn: "bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:bg-slate-950 disabled:text-slate-600 border-slate-800/40",
      input: "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600 focus:bg-slate-900 focus:border-emerald-500",
      card: "bg-slate-950 border-slate-850 text-slate-300 shadow-none",
      tip: "bg-slate-900 text-slate-200 border-slate-800",
      accent: "text-emerald-400",
      badge: "bg-emerald-950/40 text-emerald-400 border-emerald-900/30",
    },
    sepia: {
      bg: "bg-[#F4ECD8]",
      text: "text-[#4A321A]",
      header: "bg-[#ECE2CC] text-[#4A321A] border-[#DCD0B4]",
      sidebar: "bg-[#F1E7CF] text-[#4A321A] border-[#DCD0B4]",
      footer: "bg-[#ECE2CC] text-[#4A321A] border-[#DCD0B4]",
      btn: "bg-[#E6DBBE] hover:bg-[#DBCFB0] text-[#4A321A] disabled:bg-[#ECE2CC] disabled:text-[#BCAEA0] border-[#DCD0B4]/60",
      input: "bg-[#FAF5E6] border-[#DCD0B4] text-[#4A321A] placeholder-[#9C8A70] focus:bg-white focus:border-[#4A321A]",
      card: "bg-[#FAF5E6] border-[#DCD0B4] text-[#4A321A] shadow-sm",
      tip: "bg-[#4A321A] text-[#FAF5E6] border-[#4A321A]",
      accent: "text-[#8B5A2B]",
      badge: "bg-[#E6DBBE] text-[#4A321A] border-[#DCD0B4]/80",
    }
  };

  const currentColors = palette[readingTheme];

  const fontClasses = {
    sans: "font-sans tracking-wide leading-relaxed",
    serif: "font-serif tracking-normal leading-loose",
    mono: "font-mono tracking-tight leading-normal"
  };

  const sizeClasses = {
    sm: "text-xs md:text-sm",
    md: "text-sm md:text-base",
    lg: "text-base md:text-lg",
    xl: "text-lg md:text-2xl"
  };

  return (
    <div className={`fixed inset-0 z-40 flex flex-col justify-between transition-colors duration-350 ${currentColors.bg} ${currentColors.text} font-sans`}>

      {/* Top Header Controls */}
      <header className={`p-4 border-b flex items-center justify-between transition-colors duration-350 ${currentColors.header}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${currentColors.btn}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className={`block text-[9px] font-bold uppercase tracking-wider ${currentColors.accent}`}>{book.category}</span>
            <h1 className="text-xs font-bold line-clamp-1">{book.title}</h1>
          </div>
        </div>

        {/* Mid Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs font-semibold opacity-75">
          <span>Page {currentPage + 1} of {book.pages.length}</span>
          <span>•</span>
          <span>{book.author}</span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom Out / In */}
          <div className="flex items-center gap-1.5 border-r border-slate-350/20 pr-3 mr-1">
            <button
              onClick={() => setZoomFactor(Math.max(75, zoomFactor - 10))}
              className={`p-1.5 rounded transition-colors cursor-pointer ${currentColors.btn}`}
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold font-mono min-w-[28px] text-center">{zoomFactor}%</span>
            <button
              onClick={() => setZoomFactor(Math.min(150, zoomFactor + 10))}
              className={`p-1.5 rounded transition-colors cursor-pointer ${currentColors.btn}`}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-lg cursor-pointer transition-all border ${
              bookmarks.includes(currentPage)
                ? "bg-indigo-650/15 text-indigo-600 border-indigo-200"
                : `${currentColors.btn}`
            }`}
            title="Bookmark this page"
          >
            <BookMarked className="w-4 h-4" />
          </button>

          {/* Notes sidebar toggle */}
          <button
            onClick={() => setShowNotesSidebar(!showNotesSidebar)}
            className={`p-2 rounded-lg cursor-pointer transition-all border ${
              showNotesSidebar
                ? "bg-indigo-650/15 text-indigo-600 border-indigo-200"
                : `${currentColors.btn}`
            }`}
            title="Annotations & Highlights"
          >
            <FileDown className="w-4 h-4" />
          </button>

          {/* Preferences Settings toggle */}
          <button
            onClick={() => setShowConfigSidebar(!showConfigSidebar)}
            className={`p-2 rounded-lg cursor-pointer transition-all border ${
              showConfigSidebar
                ? "bg-indigo-650/15 text-indigo-600 border-indigo-200"
                : `${currentColors.btn}`
            }`}
            title="Reader Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${currentColors.btn}`}
            title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Preference Settings Panel */}
        {showConfigSidebar && (
          <aside className={`w-64 border-r p-5 space-y-6 overflow-y-auto shrink-0 z-10 transition-colors duration-350 ${currentColors.sidebar}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${currentColors.accent}`}>Theme Preferences</h3>

            <div className="space-y-4">
              {/* Background theme */}
              <div className="space-y-1.5">
                <span className="text-[10px] opacity-60 font-bold uppercase block">Color Palette</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setReadingTheme("light")}
                    className={`py-1.5 text-xs font-semibold rounded border text-center transition-all cursor-pointer ${
                      readingTheme === "light" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white/40 border-slate-200/50"
                    }`}
                  >
                    Paper
                  </button>
                  <button
                    onClick={() => setReadingTheme("dark")}
                    className={`py-1.5 text-xs font-semibold rounded border text-center transition-all cursor-pointer ${
                      readingTheme === "dark" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    Midnight
                  </button>
                  <button
                    onClick={() => setReadingTheme("sepia")}
                    className={`py-1.5 text-xs font-semibold rounded border text-center transition-all cursor-pointer ${
                      readingTheme === "sepia" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-[#ECE2CC] border-[#DCD0B4]"
                    }`}
                  >
                    Sepia
                  </button>
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-1.5">
                <span className="text-[10px] opacity-60 font-bold uppercase block">Type Family</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setFontFamily("sans")}
                    className={`py-1 text-xs rounded border transition-all cursor-pointer ${
                      fontFamily === "sans" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-200/20 border-slate-200/40"
                    }`}
                  >
                    Sans
                  </button>
                  <button
                    onClick={() => setFontFamily("serif")}
                    className={`py-1 text-xs rounded border transition-all cursor-pointer ${
                      fontFamily === "serif" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-200/20 border-slate-200/40"
                    }`}
                  >
                    Serif
                  </button>
                  <button
                    onClick={() => setFontFamily("mono")}
                    className={`py-1 text-xs rounded border transition-all cursor-pointer ${
                      fontFamily === "mono" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-200/20 border-slate-200/40"
                    }`}
                  >
                    Mono
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-1.5">
                <span className="text-[10px] opacity-60 font-bold uppercase block">Text Size</span>
                <div className="grid grid-cols-4 gap-1">
                  {["sm", "md", "lg", "xl"].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz as any)}
                      className={`py-1.5 text-[10px] font-bold rounded border capitalize transition-all cursor-pointer ${
                        fontSize === sz ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-200/20 border-slate-200/40"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search tool */}
              <div className="space-y-1.5 pt-4 border-t border-slate-350/20">
                <span className="text-[10px] opacity-60 font-bold uppercase block">Search this page</span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 opacity-40" />
                  <input
                    type="text"
                    placeholder="Keywords match..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full border rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none transition-all ${currentColors.input}`}
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-[9px] text-indigo-600 hover:underline cursor-pointer font-bold"
                  >
                    Clear Match Filters
                  </button>
                )}
              </div>

              {/* Offline Document download */}
              <div className="space-y-2 pt-4 border-t border-slate-350/20">
                <span className="text-[10px] opacity-60 font-bold uppercase block">Document Export</span>

                {downloading ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] opacity-75">
                      <span>Generating PDF...</span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-350/15 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={triggerPDFDownload}
                    className={`w-full py-2 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${currentColors.btn}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download EPUB/PDF</span>
                  </button>
                )}
                {subscriptionPlan === "free" && (
                  <p className="text-[9px] opacity-50 italic">Premium plan required for PDF exports.</p>
                )}
              </div>

            </div>
          </aside>
        )}

        {/* Core Book Stage Canvas */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto relative">

          {/* Highlight prompt tooltip */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 px-3.5 py-2 rounded-full flex items-center gap-1.5 shadow-md select-none pointer-events-none opacity-80 z-10 text-center max-w-[90%]">
            <Highlighter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Mouse-drag select any text inside the page block to save highlight annotations!</span>
          </div>

          <div
            onMouseUp={handleHighlightSelection}
            className="w-full max-w-2xl bg-white/5 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-slate-350/10 shadow-sm transition-all duration-300"
            style={{
              transform: `scale(${zoomFactor / 100})`,
              maxWidth: `${680 * (zoomFactor / 100)}px`
            }}
          >
            {/* Book Page Text */}
            <article className={`${fontClasses[fontFamily]} ${sizeClasses[fontSize]} text-justify leading-relaxed whitespace-pre-wrap select-text selection:bg-indigo-500/20`}>
              {renderPageText()}
            </article>
          </div>

          {/* Quick Highlighter color select */}
          <div className={`mt-6 flex items-center gap-3 px-3.5 py-2 border rounded-full shadow-sm ${currentColors.card}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Active Highlight Tint:</span>
            <div className="flex gap-1.5">
              {[
                { name: "Yellow", class: "bg-yellow-400/40 border-yellow-300" },
                { name: "Green", class: "bg-emerald-400/40 border-emerald-300" },
                { name: "Pink", class: "bg-pink-400/40 border-pink-300" }
              ].map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setActiveHighlightColor(color.class);
                    onActivityLog("Tint Select", `Switched active highlight color to ${color.name}.`);
                  }}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${color.class} ${
                    activeHighlightColor === color.class ? "scale-110 ring-2 ring-indigo-500" : "opacity-85"
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Right Annotations Notes Sidebar */}
        {showNotesSidebar && (
          <aside className={`w-72 border-l p-4 space-y-6 overflow-y-auto shrink-0 z-10 flex flex-col justify-between transition-colors duration-350 ${currentColors.sidebar}`}>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${currentColors.accent}`}>
                  <FileDown className="w-4 h-4" />
                  <span>Annotations Hub</span>
                </h3>
              </div>

              {/* Bookmarks Section */}
              <div className="space-y-2">
                <span className="text-[10px] opacity-60 font-bold uppercase block">Page Bookmarks</span>
                {bookmarks.length === 0 ? (
                  <p className="text-[10px] opacity-50 italic">No bookmarks on this book.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {bookmarks.map((pNum) => (
                      <button
                        key={pNum}
                        onClick={() => handlePageChange(pNum)}
                        className={`px-3 py-1 text-xs border rounded-lg font-bold transition-all cursor-pointer ${
                          currentPage === pNum ? "bg-indigo-600 border-indigo-650 text-white" : `${currentColors.btn}`
                        }`}
                      >
                        Pg {pNum + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Highlights Section */}
              <div className="space-y-2 pt-4 border-t border-slate-350/20">
                <span className="text-[10px] opacity-60 font-bold uppercase block">Saved Highlights</span>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {highlights.length === 0 ? (
                    <p className="text-[10px] opacity-50 italic">Highlight words directly inside the main text block.</p>
                  ) : (
                    highlights.map((h) => (
                      <div key={h.id} className={`p-2.5 rounded-xl border relative group ${currentColors.card}`}>
                        <p className={`text-[10px] line-clamp-2 px-1 rounded ${h.color}`}>{h.text}</p>
                        <div className="flex justify-between items-center text-[8px] opacity-50 pt-1">
                          <span>Page {h.pageNumber + 1}</span>
                          <button
                            onClick={() => handleRemoveHighlight(h.id)}
                            className="text-red-500 hover:text-red-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Custom Margin Notes */}
              <div className="space-y-2 pt-4 border-t border-slate-350/20">
                <span className="text-[10px] opacity-60 font-bold uppercase block">Reader Margin Notes</span>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-[10px] opacity-50 italic">No margin notes created for this page yet.</p>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-xl border space-y-1 relative group ${currentColors.card}`}>
                        <div className="flex justify-between items-center text-[8px] opacity-50">
                          <span className={`font-bold ${currentColors.accent}`}>Page {n.pageNumber + 1}</span>
                          <button
                            onClick={() => handleDeleteNote(n.id)}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] leading-relaxed">{n.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Note creation input */}
            <form onSubmit={handleSaveNote} className="space-y-1.5 pt-4 border-t border-slate-350/20">
              <span className="text-[10px] opacity-60 font-bold uppercase block">Write page margin Note</span>
              <textarea
                required
                placeholder="Write a private note..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={2}
                className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:bg-white transition-all ${currentColors.input}`}
              />
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Sticky Note</span>
              </button>
            </form>
          </aside>
        )}

      </div>

      {/* Bottom Footer Pagination */}
      <footer className={`p-4 border-t flex items-center justify-between transition-colors duration-350 ${currentColors.footer}`}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${currentColors.btn}`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev Page</span>
        </button>

        <span className="text-xs font-bold opacity-70">
          Page {currentPage + 1} of {book.pages.length}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === book.pages.length - 1}
          className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${currentColors.btn}`}
        >
          <span>Next Page</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

    </div>
  );
}
