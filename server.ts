import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize DB directories and file path
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "library_db.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Pre-load default books & FAQs
const DEFAULT_BOOKS = [
  {
    id: "digital-fortress-1",
    title: "The Digital Renaissance",
    author: "Elena Vance",
    category: "Technology",
    genre: "Computer Science & Society",
    publisher: "Apex Tech Publishing",
    language: "English",
    year: 2024,
    description: "An exploration of how digital libraries and generative technologies are empowering individuals to co-author the next era of human intelligence and preservation.",
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80",
    pageCount: 5,
    pages: [
      "Welcome to the Digital Renaissance. Over the past fifty years, computing has evolved from static calculating machines into highly relational, conversational partners. This book tracks that evolution and explores what it means for the future of human culture.",
      "Chapter 1: The Virtual Scriptorium. In medieval times, knowledge was preserved by hand in isolated monasteries. Today, digital networks act as infinite, distributed libraries, making the collective sum of human inquiry accessible in milliseconds. However, accessibility is only half the battle; searchability and contextual comprehension are where true intelligence begins.",
      "Chapter 2: The Conversational Medium. With the advent of large language models, we no longer just read books—we converse with them. A modern digital library is not merely a shelf of silent pages, but a lively agora where readers can ask questions directly to their study materials and receive personalized contextual summaries.",
      "Chapter 3: Cognitive Amplification. When knowledge is organized systematically, learning speeds increase exponentially. Modern students do not struggle with the lack of information, but with its overwhelming volume. Intelligent filtering systems, personalized dashboards, and interactive annotations are the keys to managing cognitive load.",
      "Conclusion: Preserving the Future. As we step deeper into this new digital age, our responsibility is to build software that respects human focus, promotes deep reading, and maintains open channels of accessible, verified truth. The renaissance is not in the machines, but in what we choose to learn with them."
    ],
    rating: 4.8,
    reviewsCount: 142,
    downloadsCount: 1250,
    isTrending: true,
    isFeatured: true,
    isPopular: true,
    isApproved: true,
    version: 1
  },
  {
    id: "galactic-odyssey-2",
    title: "Echoes of the Cosmos",
    author: "Marcus Vance",
    category: "Science Fiction",
    genre: "Space Opera",
    publisher: "Nebula Press",
    language: "English",
    year: 2023,
    description: "A thrilling sci-fi narrative depicting humanity's journey to colonize Kepler-186f, only to discover signals sent from Earth's ancient past.",
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80",
    pageCount: 4,
    pages: [
      "The engines hummed with a low, sub-audible vibration that resonated in the crew's teeth. Captain Marcus Vance stared out the observation deck into the endless, dark velvet of Kepler-186f's outer orbit. They had arrived, but the welcome was far from silent.",
      "Chapter 1: The Ghost Signal. For three years, the deep-space telemetry arrays had detected nothing but background static. Then, on the eve of colonization, the speakers crackled to life with a broadcast. It wasn't alien; it was a radio transmission from Earth—dated July 1945.",
      "Chapter 2: Deciphering the Past. As the science team cross-referenced the signal, they discovered a nested binary code containing detailed blueprints of the very warp drive that carried them here. How could a twentieth-century radio station broadcast technologies invented two hundred years later?",
      "Chapter 3: Temporal Ripples. The team hypothesized that Kepler's core contains a heavy-gravity anomaly, acting as a temporal mirror reflecting Earth's electromagnetic history backwards through space-time. To go home, they would have to dive into the anomaly itself."
    ],
    rating: 4.6,
    reviewsCount: 89,
    downloadsCount: 940,
    isTrending: false,
    isFeatured: true,
    isPopular: true,
    isApproved: true,
    version: 2
  },
  {
    id: "mind-habits-3",
    title: "Mastery of Habit",
    author: "Dr. Clara Sterling",
    category: "Self-Help",
    genre: "Psychology & Productivity",
    publisher: "Beacon Mind Books",
    language: "English",
    year: 2022,
    description: "A highly practical guide to reprogramming behavioral loops through neurological triggers, identity shift, and micro-progression mechanics.",
    coverUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&auto=format&fit=crop&q=80",
    pageCount: 4,
    pages: [
      "Habits are the compound interest of self-improvement. Just as money multiplies through compound interest, the effects of your habits multiply as you repeat them. This book demystifies why small changes lead to massive differences.",
      "Chapter 1: The Feedback Loop. Every habit can be split into a four-step neurological loop: Cue, Craving, Response, and Reward. If you want to build a positive habit, you must make the cue obvious, the craving attractive, the response easy, and the reward satisfying.",
      "Chapter 2: Identity-Based Change. The key to building lasting habits is not focusing on what you want to achieve, but on who you wish to become. When your behavior is aligned with your identity, habit preservation becomes natural and effortless.",
      "Chapter 3: The 1% Rule. Progress is rarely linear. We often expect instant results, but real growth occurs through the aggregation of marginal gains. Improving by just one percent each day yields a 37-fold increase in capability over a single year."
    ],
    rating: 4.9,
    reviewsCount: 312,
    downloadsCount: 3200,
    isTrending: true,
    isFeatured: false,
    isPopular: true,
    isApproved: true,
    version: 1
  },
  {
    id: "silent-history-4",
    title: "The Silk Crossroads",
    author: "Professor Han Jin",
    category: "History",
    genre: "World History",
    publisher: "Heritage Academic Press",
    language: "English",
    year: 2021,
    description: "A detailed account of the economic, philosophical, and cultural dialogues that shaped the ancient trade routes between East and West.",
    coverUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&auto=format&fit=crop&q=80",
    pageCount: 4,
    pages: [
      "The Silk Road was never a single highway. It was an intricate, shifting network of caravan tracks, mountain passes, and maritime lanes spanning from the markets of Chang'an to the shores of the Mediterranean Sea.",
      "Chapter 1: Merchants and Monks. Beyond silk, jade, and glassware, the caravans carried ideas. Buddhism traveled from India to China along these dusty trails, while mathematical theories and glass-making skills flowed westward into the Byzantine Empire.",
      "Chapter 2: The Oasis Kingdoms. Settlements like Dunhuang and Samarkand grew from modest desert watering holes into grand cosmopolitan centers of art and translation, where scholars from multiple empires compiled libraries in dozens of languages.",
      "Chapter 3: The Pax Mongolica. During the thirteenth century, the unification of Eurasia under Mongol rule established unprecedented security, allowing travelers like Ibn Battuta and Marco Polo to navigate thousands of miles with secure imperial passports."
    ],
    rating: 4.5,
    reviewsCount: 64,
    downloadsCount: 410,
    isTrending: false,
    isFeatured: false,
    isPopular: false,
    isApproved: true,
    version: 1
  }
];

const DEFAULT_FAQS = [
  {
    id: "faq-1",
    question: "How do I read a book online in the library?",
    answer: "Simply click on any book card to open its details panel, then click the 'Read Now' button. This will launch our responsive Online Reader directly inside your browser. You can navigate pages using the prev/next buttons, change font size, select a reading theme, or switch to full-screen mode.",
    category: "platform",
    synonyms: ["how to read", "open reader", "online reading", "start reading", "how do I open a book"]
  },
  {
    id: "faq-2",
    question: "Are my highlights, bookmarks, and notes saved automatically?",
    answer: "Yes, absolutely! The library tracks your reading progress in real time. Whenever you place a bookmark, highlight text, or add notes/annotations, they are synchronized to your account and will load automatically whenever you reopen the book on any device.",
    category: "platform",
    synonyms: ["save progress", "bookmark save", "where are my notes", "do you auto save", "keep highlights"]
  },
  {
    id: "faq-3",
    question: "What are the subscription plans and download permissions?",
    answer: "We offer two main tiers: (1) Free Tier: Unlimited online reading for all approved public books. (2) Premium Tier: Grants additional offline download permissions (PDF format), access to premium catalog collections, and advanced AI reading assistance. You can manage your subscription under the 'Settings' section of your profile.",
    category: "accounts",
    synonyms: ["premium plans", "pricing", "how to download", "download pdf", "subscription tiers", "cost"]
  },
  {
    id: "faq-4",
    question: "How can I recover my password or update my login credentials?",
    answer: "If you forget your password, click the 'Forgot Password' link on the login screen. Enter your registered email address and you will receive a secure account recovery email containing a reset link. You can also update your email, password, and avatar directly from your user Profile panel.",
    category: "accounts",
    synonyms: ["reset password", "change credentials", "forgot password", "login issues", "account recovery"]
  },
  {
    id: "faq-5",
    question: "What are the physical library operating hours and contact options?",
    answer: "Our physical administration and research building is open Monday to Friday from 8:00 AM to 8:00 PM, and Saturday from 10:00 AM to 6:00 PM (Closed Sundays). You can reach our helpdesk via email at support@smart-elibrary.org, or through our direct helpline at +1 (555) 019-2831.",
    category: "general",
    synonyms: ["operating hours", "timings", "contact number", "address", "phone", "email", "when are you open"]
  }
];

// Database state schema
interface DatabaseState {
  users: Record<string, {
    uid: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
    subscriptionPlan: "free" | "premium";
    readingGoalsMinutes: number;
    joinedAt: string;
    passwordHash: string;
  }>;
  books: any[];
  faqs: any[];
  unanswered: any[];
  bookmarks: any[];
  highlights: any[];
  notes: any[];
  progress: Record<string, Record<string, any>>; // userId -> bookId -> progress
  activityLogs: any[];
  chatHistory: Record<string, any[]>; // sessionId -> messages
}

// Load database state helper
function loadDB(): DatabaseState {
  if (!fs.existsSync(DB_FILE)) {
    const initialState: DatabaseState = {
      users: {
        "student-uid": {
          uid: "student-uid",
          email: "student@library.org",
          name: "Sienna Martinez",
          role: "student",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          subscriptionPlan: "free",
          readingGoalsMinutes: 30,
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          passwordHash: "demo123"
        },
        "reader-uid": {
          uid: "reader-uid",
          email: "reader@library.org",
          name: "Raymond Chen",
          role: "reader",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          subscriptionPlan: "free",
          readingGoalsMinutes: 45,
          joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          passwordHash: "demo123"
        },
        "premium-uid": {
          uid: "premium-uid",
          email: "premium@library.org",
          name: "Dr. Penelope Sterling",
          role: "premium",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          subscriptionPlan: "premium",
          readingGoalsMinutes: 60,
          joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          passwordHash: "demo123"
        },
        "librarian-uid": {
          uid: "librarian-uid",
          email: "librarian@library.org",
          name: "Lawrence Bookman",
          role: "librarian",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
          subscriptionPlan: "premium",
          readingGoalsMinutes: 15,
          joinedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          passwordHash: "demo123"
        },
        "admin-uid": {
          uid: "admin-uid",
          email: "admin@library.org",
          name: "Abigail Chief",
          role: "admin",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
          subscriptionPlan: "premium",
          readingGoalsMinutes: 120,
          joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          passwordHash: "demo123"
        }
      },
      books: DEFAULT_BOOKS,
      faqs: DEFAULT_FAQS,
      unanswered: [
        { id: "un-1", question: "Do you have audiobooks for children?", askedAt: new Date().toISOString(), count: 2 },
        { id: "un-2", question: "Can I print a whole book as a PDF?", askedAt: new Date().toISOString(), count: 1 }
      ],
      bookmarks: [],
      highlights: [],
      notes: [],
      progress: {
        "student-uid": {
          "digital-fortress-1": {
            bookId: "digital-fortress-1",
            lastPageRead: 1,
            percentComplete: 20,
            secondsSpent: 120,
            lastReadAt: new Date().toISOString()
          }
        },
        "premium-uid": {
          "mind-habits-3": {
            bookId: "mind-habits-3",
            lastPageRead: 2,
            percentComplete: 50,
            secondsSpent: 420,
            lastReadAt: new Date().toISOString()
          }
        }
      },
      activityLogs: [
        { id: "log-1", userId: "admin-uid", userName: "Abigail Chief", action: "System Init", details: "E-Library platform successfully launched.", timestamp: new Date().toISOString() }
      ],
      chatHistory: {}
    };
    saveDB(initialState);
    return initialState;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDB(state: DatabaseState) {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
}

// Log user activity helper
function logActivity(userId: string, userName: string, action: string, details: string) {
  const db = loadDB();
  const log = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userName,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.activityLogs.unshift(log);
  // Keep logs to a reasonable limit (e.g., 500)
  if (db.activityLogs.length > 500) {
    db.activityLogs.pop();
  }
  saveDB(db);
}

// Helper to search FAQ Database (Semantic/Keyword overlap check)
function findFAQMatch(userMessage: string, faqs: any[]) {
  const normalizedMsg = userMessage.toLowerCase().trim();
  let bestMatch = null;
  let highestScore = 0;

  for (const faq of faqs) {
    // Check main question
    let score = 0;
    const qWords = faq.question.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
    const mWords = normalizedMsg.replace(/[^\w\s]/g, "").split(/\s+/);

    // Calculate word overlaps
    let overlap = 0;
    for (const w of mWords) {
      if (w.length > 2 && qWords.includes(w)) overlap += 1;
    }
    score += (overlap / Math.max(qWords.length, mWords.length)) * 10;

    // Direct substring check
    if (normalizedMsg.includes(faq.question.toLowerCase())) {
      score += 5;
    }

    // Check synonyms/phrases
    if (faq.synonyms) {
      for (const syn of faq.synonyms) {
        if (normalizedMsg.includes(syn.toLowerCase())) {
          score += 6;
        }
        const sWords = syn.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
        let sOverlap = 0;
        for (const w of mWords) {
          if (w.length > 2 && sWords.includes(w)) sOverlap += 1;
        }
        const synScore = (sOverlap / Math.max(sWords.length, mWords.length)) * 8;
        if (synScore > score) score = synScore;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = faq;
    }
  }

  return highestScore > 1.5 ? { faq: bestMatch, score: highestScore } : null;
}

// Lazy-initialized Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
      console.log("Gemini Client successfully lazy-initialized server-side.");
    } else {
      console.warn("GEMINI_API_KEY is not configured or left at placeholder. Chatbot will run in rules-based simulation mode.");
    }
  }
  return geminiClient;
}

// App configuration
const app = express();
const PORT = 3000;

app.use(express.json());

// API: Auth endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password, isDemo, demoRole } = req.body;
  const db = loadDB();

  if (isDemo && demoRole) {
    // Demo account quick login
    const demoUserKey = Object.keys(db.users).find(k => db.users[k].role === demoRole);
    if (demoUserKey) {
      const u = db.users[demoUserKey];
      logActivity(u.uid, u.name, "Login", `Logged in using Demo Account: ${u.role}`);
      return res.json({ success: true, user: u });
    }
    return res.status(404).json({ error: "Demo account not found" });
  }

  // Regular login
  const matchedUserKey = Object.keys(db.users).find(k => db.users[k].email.toLowerCase() === email?.toLowerCase());
  if (!matchedUserKey) {
    return res.status(401).json({ error: "No account found with this email" });
  }

  const user = db.users[matchedUserKey];
  if (user.passwordHash !== password) {
    return res.status(401).json({ error: "Invalid password" });
  }

  logActivity(user.uid, user.name, "Login", "Successful login with credentials");
  res.json({ success: true, user });
});

app.post("/api/auth/register", (req, res) => {
  const { email, name, password, role } = req.body;
  const db = loadDB();

  if (Object.keys(db.users).some(k => db.users[k].email.toLowerCase() === email?.toLowerCase())) {
    return res.status(400).json({ error: "An account with this email already exists" });
  }

  const uid = `user-${Date.now()}`;
  const newUser = {
    uid,
    email: email.toLowerCase(),
    name,
    role: role || "reader",
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
    subscriptionPlan: "free" as const,
    readingGoalsMinutes: 30,
    joinedAt: new Date().toISOString(),
    passwordHash: password || "password123"
  };

  db.users[uid] = newUser;
  saveDB(db);

  logActivity(newUser.uid, newUser.name, "Register", "Created a new account");
  res.json({ success: true, user: newUser });
});

app.post("/api/auth/recovery", (req, res) => {
  const { email } = req.body;
  const db = loadDB();
  const exists = Object.keys(db.users).some(k => db.users[k].email.toLowerCase() === email?.toLowerCase());

  if (exists) {
    return res.json({ success: true, message: `A password recovery link has been dispatched to ${email}` });
  }
  return res.status(404).json({ error: "No account matches this email address" });
});

app.post("/api/auth/update-profile", (req, res) => {
  const { uid, name, avatar, readingGoalsMinutes, subscriptionPlan } = req.body;
  const db = loadDB();

  if (!db.users[uid]) {
    return res.status(404).json({ error: "User not found" });
  }

  db.users[uid].name = name || db.users[uid].name;
  db.users[uid].avatar = avatar || db.users[uid].avatar;
  db.users[uid].readingGoalsMinutes = Number(readingGoalsMinutes) || db.users[uid].readingGoalsMinutes;
  if (subscriptionPlan) {
    db.users[uid].subscriptionPlan = subscriptionPlan;
  }

  saveDB(db);
  logActivity(uid, db.users[uid].name, "Profile Update", "Updated user profile settings");
  res.json({ success: true, user: db.users[uid] });
});

// API: Books endpoints
app.get("/api/books", (req, res) => {
  const db = loadDB();
  res.json({ books: db.books });
});

app.post("/api/books", (req, res) => {
  const { book, userId, userName } = req.body;
  const db = loadDB();

  const newBook = {
    ...book,
    id: book.id || `book-${Date.now()}`,
    rating: book.rating || 4.5,
    reviewsCount: book.reviewsCount || 0,
    downloadsCount: book.downloadsCount || 0,
    isApproved: book.isApproved !== undefined ? book.isApproved : true,
    version: book.version || 1
  };

  db.books.unshift(newBook);
  saveDB(db);

  logActivity(userId || "system", userName || "Librarian", "Add Book", `Added book: "${newBook.title}" by ${newBook.author}`);
  res.json({ success: true, book: newBook });
});

app.put("/api/books/:id", (req, res) => {
  const { id } = req.params;
  const { book, userId, userName } = req.body;
  const db = loadDB();

  const idx = db.books.findIndex(b => b.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Book not found" });
  }

  db.books[idx] = { ...db.books[idx], ...book, id };
  saveDB(db);

  logActivity(userId || "system", userName || "Librarian", "Edit Book", `Modified book details: "${db.books[idx].title}"`);
  res.json({ success: true, book: db.books[idx] });
});

app.delete("/api/books/:id", (req, res) => {
  const { id } = req.params;
  const { userId, userName } = req.body;
  const db = loadDB();

  const matched = db.books.find(b => b.id === id);
  if (!matched) {
    return res.status(404).json({ error: "Book not found" });
  }

  db.books = db.books.filter(b => b.id !== id);
  saveDB(db);

  logActivity(userId || "system", userName || "Librarian", "Delete Book", `Removed book: "${matched.title}"`);
  res.json({ success: true });
});

app.post("/api/books/bulk-import", (req, res) => {
  const { books, userId, userName } = req.body;
  const db = loadDB();

  if (!Array.isArray(books)) {
    return res.status(400).json({ error: "Invalid data. Expected an array of books." });
  }

  const imported: any[] = [];
  for (const b of books) {
    const fresh = {
      id: `book-bulk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: b.title || "Untitled Import",
      author: b.author || "Unknown",
      category: b.category || "General",
      genre: b.genre || "General",
      publisher: b.publisher || "Library Press",
      language: b.language || "English",
      year: Number(b.year) || new Date().getFullYear(),
      description: b.description || "No description provided.",
      coverUrl: b.coverUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80",
      pageCount: Number(b.pageCount) || 3,
      pages: Array.isArray(b.pages) ? b.pages : ["Content page 1", "Content page 2", "Content page 3"],
      rating: Number(b.rating) || 4.5,
      reviewsCount: 0,
      downloadsCount: 0,
      isApproved: true,
      version: 1
    };
    db.books.unshift(fresh);
    imported.push(fresh);
  }

  saveDB(db);
  logActivity(userId || "system", userName || "Admin", "Bulk Import", `Imported ${imported.length} books successfully`);
  res.json({ success: true, count: imported.length, books: imported });
});

// API: Reading Progress, Bookmarks, Highlights, Notes
app.post("/api/reading-progress", (req, res) => {
  const { userId, bookId, lastPageRead, totalPages, secondsSpent } = req.body;
  const db = loadDB();

  if (!db.progress[userId]) {
    db.progress[userId] = {};
  }

  const existing = db.progress[userId][bookId] || {
    bookId,
    lastPageRead: 0,
    percentComplete: 0,
    secondsSpent: 0,
    lastReadAt: ""
  };

  const newProgress = {
    bookId,
    lastPageRead: Number(lastPageRead),
    percentComplete: Math.round((Number(lastPageRead) / Number(totalPages)) * 100),
    secondsSpent: existing.secondsSpent + Number(secondsSpent || 0),
    lastReadAt: new Date().toISOString()
  };

  db.progress[userId][bookId] = newProgress;
  saveDB(db);
  res.json({ success: true, progress: newProgress });
});

app.get("/api/reading-progress/:userId", (req, res) => {
  const { userId } = req.params;
  const db = loadDB();
  res.json({ progress: db.progress[userId] || {} });
});

app.post("/api/books/action", (req, res) => {
  const { action, userId, bookId, details } = req.body;
  const db = loadDB();

  if (action === "bookmark") {
    const { pageNumber } = details;
    const bid = `bmark-${Date.now()}`;
    const fresh = { id: bid, userId, bookId, pageNumber, createdAt: new Date().toISOString() };
    db.bookmarks.unshift(fresh);
    saveDB(db);
    return res.json({ success: true, type: "bookmark", bookmark: fresh });
  }

  if (action === "remove-bookmark") {
    const { pageNumber } = details;
    db.bookmarks = db.bookmarks.filter(b => !(b.userId === userId && b.bookId === bookId && b.pageNumber === Number(pageNumber)));
    saveDB(db);
    return res.json({ success: true });
  }

  if (action === "highlight") {
    const { pageNumber, text, color } = details;
    const hid = `hl-${Date.now()}`;
    const fresh = { id: hid, userId, bookId, pageNumber, text, color, createdAt: new Date().toISOString() };
    db.highlights.unshift(fresh);
    saveDB(db);
    return res.json({ success: true, type: "highlight", highlight: fresh });
  }

  if (action === "remove-highlight") {
    const { highlightId } = details;
    db.highlights = db.highlights.filter(h => h.id !== highlightId);
    saveDB(db);
    return res.json({ success: true });
  }

  if (action === "note") {
    const { pageNumber, text } = details;
    const nid = `note-${Date.now()}`;
    const fresh = { id: nid, userId, bookId, pageNumber, text, createdAt: new Date().toISOString() };
    db.notes.unshift(fresh);
    saveDB(db);
    return res.json({ success: true, type: "note", note: fresh });
  }

  if (action === "delete-note") {
    const { noteId } = details;
    db.notes = db.notes.filter(n => n.id !== noteId);
    saveDB(db);
    return res.json({ success: true });
  }

  res.status(400).json({ error: "Invalid reader action" });
});

app.get("/api/books/actions/:userId/:bookId", (req, res) => {
  const { userId, bookId } = req.params;
  const db = loadDB();

  const bookmarks = db.bookmarks.filter(b => b.userId === userId && b.bookId === bookId);
  const highlights = db.highlights.filter(h => h.userId === userId && h.bookId === bookId);
  const notes = db.notes.filter(n => n.userId === userId && n.bookId === bookId);

  res.json({ bookmarks, highlights, notes });
});

// API: AI Support Chatbot & RAG Engine
app.post("/api/chatbot/chat", async (req, res) => {
  const { message, history, userId, userName, userActivity } = req.body;
  const db = loadDB();

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message is required" });
  }

  // 1. Perform Semantic FAQ Matching (RAG Retrieval)
  const matchedFAQ = findFAQMatch(message, db.faqs);

  // 2. Perform Sentiment Analysis
  const negWords = ["bad", "terrible", "worst", "angry", "hate", "useless", "broke", "fail", "stole", "refund", "sucks", "awful"];
  const posWords = ["great", "love", "thanks", "helpful", "amazing", "good", "perfect", "awesome", "smart", "cool"];
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  const words = message.toLowerCase().split(/\s+/);
  let negCount = 0;
  let posCount = 0;
  for (const w of words) {
    if (negWords.includes(w)) negCount++;
    if (posWords.includes(w)) posCount++;
  }
  if (negCount > posCount) sentiment = "negative";
  else if (posCount > negCount) sentiment = "positive";

  // Check for explicit escalation
  const isEscalationRequested = words.includes("agent") || words.includes("human") || words.includes("representative") || words.includes("operator") || words.includes("person") || words.includes("call");

  // Determine if we should escalate to a mock Human Support Agent
  let escalated = false;
  if (isEscalationRequested || (sentiment === "negative" && negCount >= 2)) {
    escalated = true;
  }

  // Define Sarah's persona system instruction
  const matchedQAContext = matchedFAQ
    ? `KNOWLEDGE_BASE_MATCH: The user is likely asking about: "${matchedFAQ.faq.question}". Verified Library Fact: "${matchedFAQ.faq.answer}". You must base your answer on this fact.`
    : "KNOWLEDGE_BASE_MATCH: No exact knowledge match found. Synthesize a professional, polite response based on general libraries. If you are highly uncertain, ask the user to clarify or politely suggest they can request to speak to a human representative.";

  const userContext = userId
    ? `USER_CONTEXT: You are talking to registered user ${userName} (Role: ${db.users[userId]?.role || "Reader"}, Plan: ${db.users[userId]?.subscriptionPlan || "Free"}). Their recent library activity is: "${userActivity || "Browsing library catalog"}". Use this to personalize the response.`
    : "USER_CONTEXT: This user is not currently logged in or profile is unavailable.";

  const systemInstruction = `
You are Sarah, a highly empathetic, friendly, and seasoned Senior Customer Support Representative for the Smart E-Library Platform. 
You communicate naturally like a real human support agent:
1. Avoid sounding robotic, dry, or over-structured. Use conversational pacing, humble language, and standard support etiquette.
2. Maintain absolute helpfulness. You can understand typing errors, informal language, and multi-lingual greetings.
3. If appropriate, ask friendly, brief follow-up questions to understand the customer's needs, just like a real clerk would (e.g., "Would you like me to recommend a science fiction book or maybe a history text instead?").
4. Keep answers concise, highly readable, and clear.
5. If the user seems frustrated, show deep empathy (e.g., "I'm so sorry you're running into that, let's get it resolved right away!").

${matchedQAContext}
${userContext}
`;

  // 3. Query Gemini or Fallback
  let botReply = "";
  let isGeminiUsed = false;

  const client = getGeminiClient();
  if (client) {
    try {
      // Reconstruct simple contents history for the Gemini API call
      const formattedContents = [];
      
      // Append past messages
      if (Array.isArray(history)) {
        for (const h of history.slice(-6)) { // limit to last 6 messages for context & speed
          formattedContents.push({
            role: h.sender === "user" ? "user" as const : "model" as const,
            parts: [{ text: h.text }]
          });
        }
      }

      // Add the final user query
      formattedContents.push({
        role: "user" as const,
        parts: [{ text: message }]
      });

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      botReply = response.text || "";
      isGeminiUsed = true;
    } catch (err) {
      console.error("Gemini query error:", err);
    }
  }

  // Fallback Rule-Based Response if Gemini is absent or fails
  if (!botReply) {
    if (matchedFAQ) {
      botReply = `Hello! I can certainly help you with that. ${matchedFAQ.faq.answer} Is there anything else about this I can assist you with today?`;
    } else if (escalated) {
      botReply = "I understand you are looking for specialized support or running into an issue. I am immediately transferring you to our live helpdesk so a human representative can assist you. One moment please!";
    } else {
      botReply = "I hear you! As our virtual assistant Sarah, I want to make sure I get this exactly right. Could you tell me a bit more about what you are trying to do, or whether you are asking about reading, your account, or book downloads? I am here to help!";
    }
  }

  // Log unanswered queries for continuous training
  if (!matchedFAQ && !isEscalationRequested && sentiment !== "positive") {
    const existingUnanswered = db.unanswered.find(u => u.question.toLowerCase() === message.toLowerCase().trim());
    if (existingUnanswered) {
      existingUnanswered.count += 1;
      existingUnanswered.askedAt = new Date().toISOString();
    } else {
      db.unanswered.push({
        id: `un-${Date.now()}`,
        question: message.trim(),
        askedAt: new Date().toISOString(),
        count: 1
      });
    }
    saveDB(db);
  }

  // Send back result with simulated slight delay config parameters for human-like typing effect
  res.json({
    success: true,
    reply: botReply,
    sentiment,
    escalated,
    isGeminiUsed,
    delayMs: Math.min(1500, Math.max(500, message.length * 5)) // human typing delay simulation
  });
});

// Chatbot Knowledge Base Management CRUD
app.get("/api/chatbot/faqs", (req, res) => {
  const db = loadDB();
  res.json({ faqs: db.faqs });
});

app.post("/api/chatbot/faqs", (req, res) => {
  const { faq } = req.body;
  const db = loadDB();

  const fresh = {
    ...faq,
    id: faq.id || `faq-${Date.now()}`
  };

  db.faqs.unshift(fresh);
  saveDB(db);
  res.json({ success: true, faq: fresh });
});

app.put("/api/chatbot/faqs/:id", (req, res) => {
  const { id } = req.params;
  const { faq } = req.body;
  const db = loadDB();

  const idx = db.faqs.findIndex(f => f.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "FAQ not found" });
  }

  db.faqs[idx] = { ...db.faqs[idx], ...faq, id };
  saveDB(db);
  res.json({ success: true, faq: db.faqs[idx] });
});

app.delete("/api/chatbot/faqs/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  db.faqs = db.faqs.filter(f => f.id !== id);
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/chatbot/unanswered", (req, res) => {
  const db = loadDB();
  res.json({ unanswered: db.unanswered });
});

app.delete("/api/chatbot/unanswered/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  db.unanswered = db.unanswered.filter(u => u.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// Admin Panel endpoints
app.get("/api/admin/stats", (req, res) => {
  const db = loadDB();

  // Calculate statistics
  const totalUsers = Object.keys(db.users).length;
  const totalBooks = db.books.length;
  const totalFaqs = db.faqs.length;
  const unansweredCount = db.unanswered.length;

  const rolesBreakdown = Object.values(db.users).reduce((acc: any, curr) => {
    acc[curr.role] = (acc[curr.role] || 0) + 1;
    return acc;
  }, {});

  const plansBreakdown = Object.values(db.users).reduce((acc: any, curr) => {
    acc[curr.subscriptionPlan] = (acc[curr.subscriptionPlan] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalUsers,
    totalBooks,
    totalFaqs,
    unansweredCount,
    rolesBreakdown,
    plansBreakdown,
    logs: db.activityLogs.slice(0, 50)
  });
});

app.get("/api/admin/logs", (req, res) => {
  const db = loadDB();
  res.json({ logs: db.activityLogs });
});

app.post("/api/admin/clear-logs", (req, res) => {
  const db = loadDB();
  db.activityLogs = [
    { id: "log-reset", userId: "system", userName: "Admin", action: "Logs Clear", details: "Activity logs flushed by administrator.", timestamp: new Date().toISOString() }
  ];
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/admin/backup", (req, res) => {
  const db = loadDB();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=smart_library_backup.json");
  res.send(JSON.stringify(db, null, 2));
});

app.post("/api/admin/restore", (req, res) => {
  const { data } = req.body;
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "Invalid backup data" });
  }

  // Simple validation
  if (!data.users || !data.books || !data.faqs) {
    return res.status(400).json({ error: "Backup file is missing core library entities" });
  }

  saveDB(data);
  res.json({ success: true, message: "Library backup restored successfully." });
});

app.get("/api/admin/users", (req, res) => {
  const db = loadDB();
  res.json({ users: Object.values(db.users) });
});

app.post("/api/admin/users/role", (req, res) => {
  const { uid, role, adminUserId, adminUserName } = req.body;
  const db = loadDB();

  if (!db.users[uid]) {
    return res.status(404).json({ error: "User not found" });
  }

  const oldRole = db.users[uid].role;
  db.users[uid].role = role;
  saveDB(db);

  logActivity(adminUserId, adminUserName, "Role Change", `Modified role of ${db.users[uid].name} from ${oldRole} to ${role}`);
  res.json({ success: true, user: db.users[uid] });
});

// Serve Frontend Vite logic
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart E-Library Server listening on http://localhost:${PORT}`);
  });
}

start();
