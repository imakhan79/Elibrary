export type UserRole = "student" | "reader" | "premium" | "librarian" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  joinedAt: string;
  subscriptionPlan: "free" | "premium";
  readingGoalsMinutes: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  genre: string;
  publisher: string;
  language: string;
  year: number;
  description: string;
  coverUrl: string;
  pageCount: number;
  pages: string[]; // Content of the book page-by-page
  rating: number;
  reviewsCount: number;
  downloadsCount: number;
  isTrending?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  isApproved?: boolean;
  version?: number;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  bookId: string;
  pageNumber: number;
  createdAt: string;
}

export interface Highlight {
  id: string;
  bookId: string;
  pageNumber: number;
  text: string;
  color: string;
  createdAt: string;
}

export interface Note {
  id: string;
  bookId: string;
  pageNumber: number;
  text: string;
  createdAt: string;
}

export interface ReadingProgress {
  bookId: string;
  lastPageRead: number;
  percentComplete: number;
  secondsSpent: number;
  lastReadAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "books" | "accounts" | "platform" | "general";
  synonyms?: string[];
}

export interface UnansweredQuestion {
  id: string;
  question: string;
  askedAt: string;
  count: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "human_agent";
  text: string;
  timestamp: string;
  sentiment?: "positive" | "neutral" | "negative";
}

export interface UserActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
