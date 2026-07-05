import React, { useState, useEffect, useRef } from "react";
import { Book, Bookmark, Highlight, Note } from "../types";
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
  const [readingTheme, setReadingTheme] = useState<"light" | "dark" | "sepia">("dark");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("serif");
  const [zoomFactor, setZoomFactor] = useState(100); // 100%
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search within book
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultsCount, setSearchResultsCount] = useState(0);

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
        const response = await fetch("/api/books/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "bookmark",
            userId,
            bookId: book.id,
            details: { pageNumber: currentPage }
          })
        });
        const data = await response.json();
        if (response.ok) {
          setBookmarks([...bookmarks, currentPage]);
          onActivityLog("Bookmark", `Bookmarked page ${currentPage + 1} of "${book.title}"`);
        }
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
            <mark key={i} className="bg-yellow-400 text-slate-900 rounded px-0.5 font-bold animate-pulse">
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </>
    );
  };

  // Theme styling dictionaries
  const themeClasses = {
    light: "bg-[#F9F6F0] text-[#2C2A29] border-[#E8DCC4]",
    dark: "bg-slate-950 text-slate-100 border-slate-900",
    sepia: "bg-[#F4ECD8] text-[#5C4033] border-[#E5D3B3]"
  };

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
    <div className={`fixed inset-0 z-40 flex flex-col justify-between ${themeClasses[readingTheme]}`}>
      
      {/* Top Header Controls */}
      <header className="p-4 border-b flex items-center justify-between bg-slate-900 text-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{book.category}</span>
            <h1 className="text-xs font-bold line-clamp-1">{book.title}</h1>
          </div>
        </div>

        {/* Mid Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-400">
          <span>Page {currentPage + 1} of {book.pages.length}</span>
          <span>•</span>
          <span>{book.author}</span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom Out / In */}
          <div className="flex items-center gap-1.5 border-r border-slate-800 pr-2 mr-2">
            <button
              onClick={() => setZoomFactor(Math.max(75, zoomFactor - 10))}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold font-mono text-slate-400">{zoomFactor}%</span>
            <button
              onClick={() => setZoomFactor(Math.min(150, zoomFactor + 10))}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-lg cursor-pointer transition-all ${
              bookmarks.includes(currentPage)
                ? "bg-emerald-600/20 text-emerald-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Bookmark this page"
          >
            <BookMarked className="w-4 h-4" />
          </button>

          {/* Notes sidebar toggle */}
          <button
            onClick={() => setShowNotesSidebar(!showNotesSidebar)}
            className={`p-2 rounded-lg cursor-pointer transition-all ${
              showNotesSidebar ? "bg-emerald-600/20 text-emerald-400" : "text-slate-400 hover:text-slate-200"
            }`}
            title="Annotations & Highlights"
          >
            <FileDown className="w-4 h-4" />
          </button>

          {/* Preferences Settings toggle */}
          <button
            onClick={() => setShowConfigSidebar(!showConfigSidebar)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
            title="Reader Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
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
          <aside className="w-64 border-r bg-slate-900 text-slate-200 p-5 space-y-6 overflow-y-auto shrink-0 z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Reader Theme Settings</h3>
            
            <div className="space-y-4">
              {/* Background theme */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Color Theme</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setReadingTheme("light")}
                    className={`py-1.5 text-xs font-semibold rounded border text-center ${
                      readingTheme === "light" ? "bg-emerald-600 border-emerald-500 text-slate-100" : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    Paper
                  </button>
                  <button
                    onClick={() => setReadingTheme("dark")}
                    className={`py-1.5 text-xs font-semibold rounded border text-center ${
                      readingTheme === "dark" ? "bg-emerald-600 border-emerald-500 text-slate-100" : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    Midnight
                  </button>
                  <button
                    onClick={() => setReadingTheme("sepia")}
                    className={`py-1.5 text-xs font-semibold rounded border text-center ${
                      readingTheme === "sepia" ? "bg-emerald-600 border-emerald-500 text-slate-100" : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    Sepia
                  </button>
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Typography</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setFontFamily("sans")}
                    className={`py-1 text-xs rounded border ${
                      fontFamily === "sans" ? "bg-emerald-600 border-emerald-500" : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    Sans
                  </button>
                  <button
                    onClick={() => setFontFamily("serif")}
                    className={`py-1 text-xs rounded border ${
                      fontFamily === "serif" ? "bg-emerald-600 border-emerald-500" : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    Serif
                  </button>
                  <button
                    onClick={() => setFontFamily("mono")}
                    className={`py-1 text-xs rounded border ${
                      fontFamily === "mono" ? "bg-emerald-600 border-emerald-500" : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    Mono
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Text Size</span>
                <div className="grid grid-cols-4 gap-1">
                  {["sm", "md", "lg", "xl"].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz as any)}
                      className={`py-1 text-xs rounded border capitalize ${
                        fontSize === sz ? "bg-emerald-600 border-emerald-500 text-slate-100" : "bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search tool */}
              <div className="space-y-1.5 pt-4 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Search active page</span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Keywords match..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-[9px] text-slate-500 hover:text-slate-300 underline"
                  >
                    Clear Match Filters
                  </button>
                )}
              </div>

              {/* Offline Document download */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Offline Reader File Export</span>
                
                {downloading ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Generating PDF...</span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={triggerPDFDownload}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download EPUB/PDF</span>
                  </button>
                )}
                {subscriptionPlan === "free" && (
                  <p className="text-[9px] text-slate-500 italic">Free plan allows read-only access. Upgrade to PDF download.</p>
                )}
              </div>

            </div>
          </aside>
        )}

        {/* Core Book Stage Canvas */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto relative">
          
          {/* Highlight prompt tooltip */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500/20 text-[10px] text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg select-none pointer-events-none opacity-80">
            <Highlighter className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tip: Select any text with your mouse inside the page to trigger highlight annotations!</span>
          </div>

          <div
            onMouseUp={handleHighlightSelection}
            className={`w-full max-w-2xl bg-white/5 backdrop-blur-sm shadow-xl p-8 md:p-12 rounded-2xl border transition-all duration-300`}
            style={{
              transform: `scale(${zoomFactor / 100})`,
              maxWidth: `${680 * (zoomFactor / 100)}px`
            }}
          >
            {/* Book Page Text */}
            <article className={`${fontClasses[fontFamily]} ${sizeClasses[fontSize]} text-justify leading-relaxed whitespace-pre-wrap select-text selection:bg-emerald-500/30`}>
              {renderPageText()}
            </article>
          </div>

          {/* Quick Highlighter color select */}
          <div className="mt-6 flex items-center gap-3 bg-slate-900 text-slate-300 px-3.5 py-2 border border-slate-800 rounded-full shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Highlight Tint:</span>
            <div className="flex gap-1.5">
              {[
                { name: "Yellow", class: "bg-yellow-500/40 border-yellow-400" },
                { name: "Green", class: "bg-emerald-500/40 border-emerald-400" },
                { name: "Pink", class: "bg-pink-500/40 border-pink-400" }
              ].map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setActiveHighlightColor(color.class);
                    onActivityLog("Tint Select", `Switched active highlight color to ${color.name}.`);
                  }}
                  className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${color.class} ${
                    activeHighlightColor === color.class ? "scale-110 ring-2 ring-emerald-500" : "opacity-80"
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Right Annotations Notes Sidebar */}
        {showNotesSidebar && (
          <aside className="w-72 border-l bg-slate-900 text-slate-200 p-4 space-y-6 overflow-y-auto shrink-0 z-10 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <FileDown className="w-4 h-4" />
                  <span>Reader Annotations</span>
                </h3>
              </div>

              {/* Bookmarks Section */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Page Bookmarks</span>
                {bookmarks.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">No bookmarks on this book.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {bookmarks.map((pNum) => (
                      <button
                        key={pNum}
                        onClick={() => handlePageChange(pNum)}
                        className={`px-2.5 py-1 text-xs border rounded-lg font-bold transition-all cursor-pointer ${
                          currentPage === pNum ? "bg-emerald-600 border-emerald-500 text-slate-100" : "bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        Pg {pNum + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Highlights Section */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Recent Highlights</span>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {highlights.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">Highlight words in the page text.</p>
                  ) : (
                    highlights.map((h) => (
                      <div key={h.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1 relative group">
                        <p className={`text-[10px] line-clamp-2 px-1 rounded ${h.color}`}>{h.text}</p>
                        <div className="flex justify-between items-center text-[8px] text-slate-500">
                          <span>Page {h.pageNumber + 1}</span>
                          <button
                            onClick={() => handleRemoveHighlight(h.id)}
                            className="text-red-500 hover:text-red-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Page Notes & Sticky Notes</span>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {notes.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">No notes created for this book yet.</p>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1 relative group">
                        <div className="flex justify-between items-center text-[8px] text-slate-500">
                          <span className="font-bold text-emerald-400">Page {n.pageNumber + 1}</span>
                          <button
                            onClick={() => handleDeleteNote(n.id)}
                            className="text-red-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-normal">{n.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Note creation input */}
            <form onSubmit={handleSaveNote} className="space-y-1.5 pt-4 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Write a note for Page {currentPage + 1}</span>
              <textarea
                required
                placeholder="Write a private note or review annotation..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold text-[10px] rounded-lg flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Sticky Note</span>
              </button>
            </form>
          </aside>
        )}

      </div>

      {/* Bottom Footer Pagination */}
      <footer className="p-4 border-t flex items-center justify-between bg-slate-900 text-slate-100">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 disabled:bg-slate-950 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev Page</span>
        </button>

        <span className="text-xs font-semibold text-slate-400">
          Page {currentPage + 1} of {book.pages.length}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === book.pages.length - 1}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 disabled:bg-slate-950 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>Next Page</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

    </div>
  );
}
