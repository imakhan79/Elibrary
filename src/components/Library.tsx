import React, { useState, useEffect } from "react";
import { Book, Review, UserProfile } from "../types";
import { Search, Filter, BookOpen, Star, Sparkles, Heart, ArrowRight, Bookmark, FileText, CheckCircle2, ChevronRight, MessageSquare, Plus, Clock } from "lucide-react";

interface LibraryProps {
  user: UserProfile;
  books: Book[];
  onReadBook: (bookId: string) => void;
  favorites: string[];
  wishlist: string[];
  onToggleFavorite: (bookId: string) => void;
  onToggleWishlist: (bookId: string) => void;
}

export default function LibraryComponent({
  user,
  books,
  onReadBook,
  favorites,
  wishlist,
  onToggleFavorite,
  onToggleWishlist,
}: LibraryProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  // Selected Book for Detail Drawer/Modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Review System states
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSuccess, setReviewSuccess] = useState("");

  // Populate mock reviews for books
  useEffect(() => {
    const mockReviews: Record<string, Review[]> = {
      "digital-fortress-1": [
        {
          id: "r1",
          bookId: "digital-fortress-1",
          userId: "student-uid",
          userName: "Sienna Martinez",
          userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          rating: 5,
          comment: "Incredibly insightful! The chapter on conversational media explains exactly what we are experiencing today with platforms like this.",
          createdAt: "2026-06-15T14:30:00.000Z",
        },
        {
          id: "r2",
          bookId: "digital-fortress-1",
          userId: "premium-uid",
          userName: "Dr. Penelope Sterling",
          userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          rating: 4,
          comment: "Well structured. Elena Vance manages to make deep cognitive and library systems feel easy to digest.",
          createdAt: "2026-06-28T09:12:00.000Z",
        },
      ],
      "mind-habits-3": [
        {
          id: "r3",
          bookId: "mind-habits-3",
          userId: "reader-uid",
          userName: "Raymond Chen",
          userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          rating: 5,
          comment: "This habit reprogramming loop actually works! The 1% progress rule is a game changer.",
          createdAt: "2026-07-02T18:22:00.000Z",
        },
      ],
    };
    setReviews(mockReviews);
  }, []);

  // Filter options lists
  const categories = ["All", ...Array.from(new Set(books.map((b) => b.category)))];
  const genres = ["All", ...Array.from(new Set(books.map((b) => b.genre)))];
  const languages = ["All", ...Array.from(new Set(books.map((b) => b.language)))];
  const years = ["All", ...Array.from(new Set(books.map((b) => b.year.toString())))];

  // Filtered books
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.publisher.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "All" || book.category === selectedCategory;
    const matchesGenre = selectedGenre === "All" || book.genre === selectedGenre;
    const matchesLanguage = selectedLanguage === "All" || book.language === selectedLanguage;
    const matchesYear = selectedYear === "All" || book.year.toString() === selectedYear;

    return matchesSearch && matchesCategory && matchesGenre && matchesLanguage && matchesYear;
  });

  // Featured / Trending / Recommended
  const featuredBooks = books.filter((b) => b.isFeatured);
  const trendingBooks = books.filter((b) => b.isTrending);
  const recommendedBooks = books.filter(
    (b) => b.category === "Technology" || b.id === "mind-habits-3"
  );

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !newReviewComment.trim()) return;

    const newReview: Review = {
      id: `review-${Date.now()}`,
      bookId: selectedBook.id,
      userId: user.uid,
      userName: user.name,
      userAvatar: user.avatar,
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      createdAt: new Date().toISOString(),
    };

    const currentBookReviews = reviews[selectedBook.id] || [];
    setReviews({
      ...reviews,
      [selectedBook.id]: [newReview, ...currentBookReviews],
    });

    setNewReviewComment("");
    setNewReviewRating(5);
    setReviewSuccess("Review submitted successfully!");
    setTimeout(() => setReviewSuccess(""), 3000);
  };

  const getBookReviews = (bookId: string) => {
    return reviews[bookId] || [];
  };

  const getAverageRating = (book: Book) => {
    const rList = getBookReviews(book.id);
    if (rList.length === 0) return book.rating;
    const sum = rList.reduce((acc, curr) => acc + curr.rating, 0);
    return Number((sum / rList.length).toFixed(1));
  };

  const getRelatedBooks = (book: Book) => {
    return books.filter((b) => b.id !== book.id && (b.category === book.category || b.author === book.author)).slice(0, 3);
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      
      {/* Featured Banner / Carousel */}
      {featuredBooks.length > 0 && (
        <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 md:p-8 shadow-md">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-40 md:w-48 shrink-0 shadow-2xl rounded-2xl overflow-hidden border border-white/10">
              <img
                src={featuredBooks[0].coverUrl}
                alt={featuredBooks[0].title}
                className="w-full aspect-[2/3] object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-4 text-center md:text-left relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Masterpiece</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-light text-white tracking-tight">{featuredBooks[0].title}</h2>
              <p className="text-xs text-slate-350">By <span className="text-white font-medium">{featuredBooks[0].author}</span> • {featuredBooks[0].category}</p>
              <p className="text-slate-300 text-xs leading-relaxed max-w-2xl font-light">{featuredBooks[0].description}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  onClick={() => onReadBook(featuredBooks[0].id)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer uppercase tracking-wider"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read Now</span>
                </button>
                <button
                  onClick={() => setSelectedBook(featuredBooks[0])}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, author, description, or publisher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 md:border-l border-slate-100 md:pl-4">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-700">Catalog Filters</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Category */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Publication Year */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid display of filtered books */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif font-light text-slate-800 flex items-center gap-2">
            <span>Library Catalogue</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-[10px] text-indigo-700 font-bold">
              {filteredBooks.length} Books
            </span>
          </h3>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 text-sm font-semibold">No books match your active filters</p>
            <p className="text-slate-450 text-xs mt-1">Try adjusting search terms or clearing select filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {filteredBooks.map((book) => {
              const avgRating = getAverageRating(book);
              const isFav = favorites.includes(book.id);
              const isWish = wishlist.includes(book.id);

              return (
                <div
                  key={book.id}
                  className="group bg-white rounded-2xl border border-slate-100 p-4 hover:border-indigo-150 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3.5 relative">
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onToggleFavorite(book.id)}
                        className={`p-1.5 rounded-lg border shadow-sm backdrop-blur-md transition-colors cursor-pointer ${
                          isFav
                            ? "bg-red-50 border-red-200 text-red-500"
                            : "bg-white/90 border-slate-150 text-slate-400 hover:text-slate-700"
                        }`}
                        title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => onToggleWishlist(book.id)}
                        className={`p-1.5 rounded-lg border shadow-sm backdrop-blur-md transition-colors cursor-pointer ${
                          isWish
                            ? "bg-amber-50 border-amber-200 text-amber-600"
                            : "bg-white/90 border-slate-150 text-slate-400 hover:text-slate-700"
                        }`}
                        title={isWish ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <div className="aspect-[2/3] w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0 shadow-sm">
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <span className="block text-[9px] text-indigo-600 font-bold uppercase tracking-wider">
                        {book.category}
                      </span>
                      <h4 className="font-bold text-xs text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {book.title}
                      </h4>
                      <p className="text-[10px] text-slate-450 line-clamp-1">
                        By {book.author}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[11px]">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{avgRating}</span>
                    </div>
                    
                    <button
                      onClick={() => setSelectedBook(book)}
                      className="text-[10px] text-slate-500 hover:text-indigo-600 font-bold tracking-wider flex items-center gap-0.5 uppercase cursor-pointer transition-colors"
                    >
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommended bento layout section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recommended for You */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
          <h4 className="text-sm font-bold tracking-wider uppercase text-indigo-600 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Smart Recommendations</span>
          </h4>
          <div className="divide-y divide-slate-100">
            {recommendedBooks.slice(0, 3).map((b) => (
              <div key={b.id} className="py-3 flex gap-3 items-center group">
                <img
                  src={b.coverUrl}
                  alt={b.title}
                  className="w-10 h-14 object-cover rounded shadow-sm border border-slate-150 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {b.title}
                  </h5>
                  <p className="text-[10px] text-slate-400">By {b.author}</p>
                </div>
                <button
                  onClick={() => onReadBook(b.id)}
                  className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Column */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
          <h4 className="text-sm font-bold tracking-wider uppercase text-indigo-600 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Trending Library Books</span>
          </h4>
          <div className="divide-y divide-slate-100">
            {trendingBooks.slice(0, 3).map((b) => (
              <div key={b.id} className="py-3 flex gap-3 items-center group">
                <img
                  src={b.coverUrl}
                  alt={b.title}
                  className="w-10 h-14 object-cover rounded shadow-sm border border-slate-150 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {b.title}
                  </h5>
                  <p className="text-[10px] text-slate-400">By {b.author}</p>
                </div>
                <button
                  onClick={() => onReadBook(b.id)}
                  className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Book Details Modal Drawer */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex justify-end p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-y-auto flex flex-col justify-between h-full relative">
            
            {/* Close */}
            <button
              onClick={() => setSelectedBook(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50"
            >
              Close Drawer
            </button>

            <div className="space-y-6">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row gap-5 pt-4">
                <div className="w-32 shadow-md border border-slate-150 rounded-xl overflow-hidden shrink-0 mx-auto sm:mx-0">
                  <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-full aspect-[2/3] object-cover" />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <span className="px-2.5 py-1 rounded bg-indigo-50 text-xs text-indigo-700 font-bold uppercase tracking-wider">
                    {selectedBook.category}
                  </span>
                  <h3 className="text-2xl font-serif font-light text-slate-855 mt-2">{selectedBook.title}</h3>
                  <p className="text-xs text-slate-450">Author: <span className="text-slate-700 font-medium">{selectedBook.author}</span></p>
                  <p className="text-xs text-slate-450">Publisher: <span className="text-slate-700">{selectedBook.publisher}</span></p>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-3 mt-1.5">
                    <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{getAverageRating(selectedBook)}</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">{selectedBook.pageCount} Pages</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">{selectedBook.year}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 border-t border-slate-100 pt-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">About this book</h5>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{selectedBook.description}</p>
              </div>

              {/* Related book suggestions */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Related Recommendations</h5>
                <div className="grid grid-cols-3 gap-3">
                  {getRelatedBooks(selectedBook).map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBook(b)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-lg cursor-pointer transition-colors shadow-sm"
                    >
                      <img src={b.coverUrl} className="w-full aspect-[3/4] object-cover rounded mb-1" />
                      <h6 className="text-[10px] font-bold text-slate-700 truncate">{b.title}</h6>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Section */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Ratings & Reader Reviews ({getBookReviews(selectedBook.id).length})</span>
                </h5>

                {/* Add review form */}
                <form onSubmit={handleAddReview} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3 shadow-inner">
                  {reviewSuccess && (
                    <div className="text-[11px] text-indigo-700 font-semibold">{reviewSuccess}</div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">Your rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setNewReviewRating(val)}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              val <= newReviewRating ? "text-amber-550 fill-current" : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    required
                    placeholder="Write your honest review and thoughts about the book..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                  <div className="text-right">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer uppercase tracking-wider"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>

                {/* Reviews List */}
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {getBookReviews(selectedBook.id).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">No reviews have been written yet. Be the first!</p>
                  ) : (
                    getBookReviews(selectedBook.id).map((r) => (
                      <div key={r.id} className="p-3 bg-white rounded-xl border border-slate-100 flex gap-3 shadow-sm">
                        <img
                          src={r.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.userName)}&background=4F46E5&color=fff`}
                          alt={r.userName}
                          className="w-7 h-7 rounded-full border border-slate-200 shrink-0 mt-0.5 object-cover"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-800">{r.userName}</span>
                            <div className="flex gap-0.5 text-amber-500">
                              {Array.from({ length: r.rating }).map((_, i) => (
                                <Star key={i} className="w-2.5 h-2.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">{r.comment}</p>
                          <span className="text-[8px] text-slate-400 block font-medium">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Read Button */}
            <div className="pt-6 border-t border-slate-100 mt-6 flex gap-2">
              <button
                onClick={() => {
                  const bid = selectedBook.id;
                  setSelectedBook(null);
                  onReadBook(bid);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open Digital Reader Now</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
