import React, { useState, useEffect } from 'react';
import {
  BookOpen, Sparkles, Bookmark, Users, Activity, PenTool, Search,
  Compass, Star, Clock, ChevronRight, User, LogIn, Shield, MessageSquare,
  Home, Check, ArrowRight, Layers, Heart, Coffee, Flame, ShieldAlert, Lock
} from 'lucide-react';
import { Book, User as UserType } from '@/types/library';
import { api, getStoredUserId, setStoredUserId } from '@/lib/libraryClient';

import { BookCard } from '@/components/library/BookCard';
import { BookDetailDialog } from '@/components/library/BookDetailDialog';
import { ReaderModal } from '@/components/reader/ReaderModal';
import { AuthorStudio } from '@/components/studio/AuthorStudio';
import { ChapterEditor } from '@/components/studio/ChapterEditor';
import { BookshelvesView } from '@/components/shelves/BookshelvesView';
import { ClubsView } from '@/components/clubs/ClubsView';
import { ActivitySocialView } from '@/components/social/ActivitySocialView';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { DirectChatView } from '@/components/chat/DirectChatView';
import { AiBookFinderModal } from '@/components/ai/AiBookFinderModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeNav, setActiveNav] = useState<'home' | 'explore' | 'shelves' | 'studio' | 'clubs' | 'social' | 'chat' | 'admin'>('home');

  // Exploration state
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('trending');
  const [loadingBooks, setLoadingBooks] = useState<boolean>(true);

  // Modals & Active Overlays
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);
  const [readingBook, setReadingBook] = useState<{ book: Book; chapterId?: string } | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [chatPartnerId, setChatPartnerId] = useState<string | null>(null);

  // Require auth gate for protected actions
  const requireAuth = (reason: string, callback: () => void) => {
    if (!currentUser) {
      setAuthReason(reason);
      setShowAuthModal(true);
      return;
    }
    callback();
  };

  const handleSignOut = () => {
    import('@/lib/libraryClient').then(({ clearStoredUserId }) => {
      clearStoredUserId();
      setCurrentUser(null);
      setActiveNav('home');
      setEditingBookId(null);
      fetchBooks();
    });
  };

  // Load Current User & Books
  const loadInitialData = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const list = await api.getBooks({
        genre: selectedGenre === 'All' ? undefined : selectedGenre,
        search: searchQuery || undefined,
        sort_by: sortBy,
      });
      setBooks(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [selectedGenre, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveNav('explore');
    fetchBooks();
  };

  const genres = ['All', 'Philosophy', 'Sci-Fi', 'Fantasy', 'Historical Fiction', 'Thriller', 'Cyberpunk', 'Literary Fiction'];

  // Featured books (Prioritize Archmage of Obsidian Spire & Infinite Archivist)
  const featuredBook = books.find((b) => b.id === 'book_archmage_spire') || books.find((b) => b.id === 'book_infinite_archivist') || books[0];
  const yasinBooks = books.filter((b) => b.author_name === 'Yasin Kik' || b.author_id === 'usr_yasin');

  const startChatWith = (userId: string) => {
    setChatPartnerId(userId);
    setActiveNav('chat');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Primary Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div
            onClick={() => {
              setActiveNav('home');
              setEditingBookId(null);
            }}
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-wide text-foreground block leading-none">
                FOLIO
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Publishing Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => {
                setActiveNav('home');
                setEditingBookId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                activeNav === 'home' && !editingBookId
                  ? 'bg-amber-600/10 text-amber-700 dark:text-amber-300 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Home className="w-4 h-4" /> Home
            </button>
            <button
              onClick={() => {
                setActiveNav('explore');
                setEditingBookId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                activeNav === 'explore' && !editingBookId
                  ? 'bg-amber-600/10 text-amber-700 dark:text-amber-300 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Compass className="w-4 h-4" /> Discovery ({books.length})
            </button>
            <button
              onClick={() => {
                requireAuth('view and manage personal bookshelves', () => {
                  setActiveNav('shelves');
                  setEditingBookId(null);
                });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                activeNav === 'shelves'
                  ? 'bg-amber-600/10 text-amber-700 dark:text-amber-300 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Bookmark className="w-4 h-4" /> Bookshelves
            </button>
            <button
              onClick={() => {
                requireAuth('access the Author Studio and draft manuscripts', () => {
                  setActiveNav('studio');
                  setEditingBookId(null);
                });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                activeNav === 'studio' || editingBookId
                  ? 'bg-amber-600/10 text-amber-700 dark:text-amber-300 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <PenTool className="w-4 h-4" /> Author Studio
            </button>
            <button
              onClick={() => {
                requireAuth('chat and connect with community readers', () => {
                  setActiveNav('chat');
                  setEditingBookId(null);
                });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                activeNav === 'chat'
                  ? 'bg-amber-600/10 text-amber-700 dark:text-amber-300 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Chat & Friends
            </button>
            <button
              onClick={() => {
                setActiveNav('clubs');
                setEditingBookId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                activeNav === 'clubs'
                  ? 'bg-amber-600/10 text-amber-700 dark:text-amber-300 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Users className="w-4 h-4" /> Reading Clubs
            </button>
            <button
              onClick={() => {
                setActiveNav('social');
                setEditingBookId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${
                activeNav === 'social'
                  ? 'bg-amber-600/10 text-amber-700 dark:text-amber-300 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Activity className="w-4 h-4" /> Community
            </button>

            {/* Admin Console Link (Highlighted) - ONLY VISIBLE TO SYSTEM ADMIN */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveNav('admin');
                  setEditingBookId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-1.5 ${
                  activeNav === 'admin'
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                <Shield className="w-4 h-4" /> Admin Console
              </button>
            )}
          </nav>

          {/* Right User Bar */}
          <div className="flex items-center space-x-2">
            {/* AI Assistant & Bookfinder CTA */}
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white text-xs font-semibold shadow-md transition transform hover:scale-[1.02]"
              title="Ask AI Literary Oracle to find or recommend books"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>AI Book Finder</span>
            </button>

            {/* Quick Write CTA */}
            <button
              onClick={() => {
                requireAuth('access Author Studio and draft manuscripts', () => {
                  setActiveNav('studio');
                  setEditingBookId(null);
                });
              }}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-medium transition"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>

            {/* User Profile / Switcher or Sign In Button */}
            {currentUser ? (
              <button
                onClick={() => {
                  setAuthReason(null);
                  setShowAuthModal(true);
                }}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full border border-border hover:border-amber-600/60 bg-card transition shadow-sm shrink-0"
              >
                <img
                  src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-600 shrink-0 shadow-sm"
                />
                <div className="text-left hidden md:block whitespace-nowrap shrink-0">
                  <span className="text-xs font-bold block text-foreground leading-tight whitespace-nowrap">
                    {currentUser.display_name}
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold block uppercase tracking-wider leading-none mt-0.5">
                    {currentUser.role === 'admin' ? '👑 Admin' : currentUser.role || 'Author'}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthReason(null);
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Join Free</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto px-4 py-2 border-t border-border bg-muted/40 space-x-2 scrollbar-none text-xs">
          <button
            onClick={() => { setActiveNav('home'); setEditingBookId(null); }}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeNav === 'home' ? 'bg-amber-600 text-white' : 'text-muted-foreground'}`}
          >
            Home
          </button>
          <button
            onClick={() => { setActiveNav('explore'); setEditingBookId(null); }}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeNav === 'explore' ? 'bg-amber-600 text-white' : 'text-muted-foreground'}`}
          >
            Discovery
          </button>
          <button
            onClick={() => { setActiveNav('chat'); setEditingBookId(null); }}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeNav === 'chat' ? 'bg-amber-600 text-white' : 'text-muted-foreground'}`}
          >
            Chat & Friends
          </button>
          {/* Mobile Admin Link: ONLY IF ADMIN */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => { setActiveNav('admin'); setEditingBookId(null); }}
              className={`px-3 py-1 rounded-lg shrink-0 ${activeNav === 'admin' ? 'bg-amber-600 text-white' : 'text-amber-700 dark:text-amber-300 font-bold'}`}
            >
              Admin
            </button>
          )}
          <button
            onClick={() => { setActiveNav('studio'); setEditingBookId(null); }}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeNav === 'studio' ? 'bg-amber-600 text-white' : 'text-muted-foreground'}`}
          >
            Studio
          </button>
          <button
            onClick={() => { setActiveNav('shelves'); setEditingBookId(null); }}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeNav === 'shelves' ? 'bg-amber-600 text-white' : 'text-muted-foreground'}`}
          >
            Shelves
          </button>
          <button
            onClick={() => { setActiveNav('clubs'); setEditingBookId(null); }}
            className={`px-3 py-1 rounded-lg shrink-0 ${activeNav === 'clubs' ? 'bg-amber-600 text-white' : 'text-muted-foreground'}`}
          >
            Clubs
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        {editingBookId ? (
          <ChapterEditor
            bookId={editingBookId}
            onBack={() => setEditingBookId(null)}
            onPreviewBook={(book, chapterId) => setReadingBook({ book, chapterId })}
          />
        ) : activeNav === 'admin' ? (
          currentUser?.role === 'admin' ? (
            <AdminDashboard
              currentUser={currentUser}
              onOpenBook={(bookId) => {
                const b = books.find((x) => x.id === bookId);
                if (b) setSelectedBookForDetail(b);
              }}
              onStartChatWithUser={startChatWith}
            />
          ) : (
            <div className="py-24 text-center space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="font-display font-semibold text-2xl text-foreground">
                Access Restricted
              </h3>
              <p className="text-sm font-serif text-muted-foreground leading-relaxed">
                Only the designated System Administrator (Yasin Kik) can view or access the Admin Governance Dashboard.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setActiveNav('home')}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-md transition"
                >
                  Return to Home
                </button>
              </div>
            </div>
          )
        ) : activeNav === 'chat' ? (
          <DirectChatView
            currentUser={currentUser || ({ id: 'usr_yasin', display_name: 'Yasin Kik', email: 'yasinkik@outlook.com', role: 'admin' } as any)}
            initialPartnerId={chatPartnerId}
            onOpenBook={(bookId) => {
              const b = books.find((x) => x.id === bookId);
              if (b) setSelectedBookForDetail(b);
            }}
          />
        ) : activeNav === 'home' ? (
          /* =================== HOME PAGE =================== */
          <div className="space-y-12 animate-in fade-in duration-200">
            {/* Grand Literary Hero Banner */}
            <div className="relative rounded-3xl bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950 p-8 sm:p-12 text-white shadow-2xl overflow-hidden flex flex-col md:flex-row items-center gap-8">
              <div className="space-y-4 flex-1 text-center md:text-left z-10">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Welcome to Folio Literary Republic
                </div>

                <h1 className="text-4xl sm:text-5xl font-display font-semibold leading-tight text-white tracking-tight">
                  Where Stories Are Written, Shared, & Remembered.
                </h1>

                <p className="text-sm sm:text-base text-stone-300 font-serif leading-relaxed max-w-2xl">
                  A modern collaborative digital library and book publishing platform. Author manuscripts with distraction-free rich text tools, read in customizable typography modes, join chapter discussions in reading salons, and converse directly with fellow bibliophiles.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <button
                    onClick={() => {
                      requireAuth('read full manuscripts', () => setReadingBook({ book: featuredBook }));
                    }}
                    className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm shadow-xl transition flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" /> Start Reading Chapter 1
                  </button>
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="px-6 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" /> AI Book Finder
                  </button>
                  <button
                    onClick={() => {
                      requireAuth('access Author Studio and draft manuscripts', () => {
                        setActiveNav('studio');
                        setEditingBookId(null);
                      });
                    }}
                    className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs sm:text-sm transition flex items-center gap-2"
                  >
                    <PenTool className="w-4 h-4" /> Author Studio
                  </button>
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => setActiveNav('admin')}
                      className="px-5 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium text-xs sm:text-sm transition flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" /> Admin Console
                    </button>
                  )}
                </div>
              </div>

              {/* Featured Book Showcase on Hero */}
              {featuredBook && (
                <div
                  onClick={() => setSelectedBookForDetail(featuredBook)}
                  className="w-44 sm:w-56 aspect-book shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-stone-900 group cursor-pointer hover:scale-105 transition-transform"
                >
                  <img src={featuredBook.cover_image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Member Sign In / Sign Up Gate Banner for Guests */}
            {!currentUser && (
              <div className="rounded-3xl border border-amber-600/30 bg-gradient-to-r from-amber-500/10 via-card to-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="space-y-1.5 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-600/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    <Lock className="w-3 h-3" /> Member Access Required to Read & Write
                  </div>
                  <h3 className="font-display font-semibold text-2xl text-foreground">
                    Create an Account to Read & Publish Manuscripts
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-serif max-w-xl leading-relaxed">
                    Readers and authors must sign up or sign in to open full chapters, view in-story illustrated artwork, manage personal bookshelves, and write in the Author Studio.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setAuthReason("Sign up or sign in to unlock full reading and authoring features.");
                      setShowAuthModal(true);
                    }}
                    className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-xl transition flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In / Create Account</span>
                  </button>
                </div>
              </div>
            )}

            {/* Admin & Author Feature: Yasin Kik Profile Spotlight */}
            <div className="rounded-3xl border border-amber-600/30 bg-gradient-to-br from-amber-500/5 via-card to-card p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border/80">
                <div className="flex items-center space-x-4">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                    alt=""
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-600 shadow-md"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="font-display font-semibold text-2xl text-foreground">Yasin Kik</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-bold text-[10px] uppercase tracking-wider">
                        👑 System Administrator & Author
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-serif italic mt-0.5">
                      "I will write the whole in a book"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Platform Administrator • Creator of <em>The Infinite Archivist</em> & <em>The Quantum Botanist</em>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => setActiveNav('admin')}
                      className="px-4 py-2 rounded-xl bg-amber-600 text-white font-medium text-xs hover:bg-amber-700 shadow transition flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Open Admin Dashboard</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      requireAuth('chat with community members', () => startChatWith('usr_elena'));
                    }}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat with Community</span>
                  </button>
                </div>
              </div>

              {/* Yasin's Works in Folio */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    Works Authored by Yasin Kik
                  </h3>
                  <span className="text-xs text-muted-foreground">{yasinBooks.length} Published Novels</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {yasinBooks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBookForDetail(b)}
                      className="p-3.5 rounded-2xl border border-border bg-card hover:border-amber-600/40 shadow-sm hover:shadow-md transition cursor-pointer flex space-x-3 items-center group"
                    >
                      <div className="w-14 aspect-book rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-border/80 shadow-sm">
                        {b.cover_image ? (
                          <img
                            src={b.cover_image}
                            alt={b.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-400">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="truncate flex-1 space-y-0.5">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">{b.genre}</span>
                        <h4 className="font-display font-semibold text-xs truncate group-hover:text-amber-600 text-foreground leading-snug">{b.title}</h4>
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          {b.chapter_count ? `${b.chapter_count} chapters` : '1 chapter'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats Ticker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm text-center space-y-1">
                <div className="text-3xl font-display font-bold text-amber-600">{books.length}</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Stories & Books</div>
              </div>
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm text-center space-y-1">
                <div className="text-3xl font-display font-bold text-amber-600">4,200+</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Words Inscribed</div>
              </div>
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm text-center space-y-1">
                <div className="text-3xl font-display font-bold text-amber-600">2 Active</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Reading Clubs</div>
              </div>
              <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm text-center space-y-1">
                <div className="text-3xl font-display font-bold text-amber-600">100%</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Community Open</div>
              </div>
            </div>

            {/* Trending Curated Stories Grid */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-2xl flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-600" /> Trending Literature Across Folio
                  </h3>
                  <p className="text-xs text-muted-foreground font-serif">
                    Highly rated manuscripts, philosophical treatises, and speculative fiction epics.
                  </p>
                </div>
                <button
                  onClick={() => setActiveNav('explore')}
                  className="text-xs text-amber-600 font-medium hover:underline flex items-center gap-1"
                >
                  View Full Library →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {books.slice(0, 8).map((b) => (
                  <BookCard
                    key={b.id}
                    book={b}
                    onOpenDetail={(book) => setSelectedBookForDetail(book)}
                    onReadNow={(book) => setReadingBook({ book })}
                    onShelfChanged={fetchBooks}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : activeNav === 'studio' ? (
          <AuthorStudio
            onOpenEditor={(bookId) => setEditingBookId(bookId)}
            onReadBook={(book) => setReadingBook({ book })}
          />
        ) : activeNav === 'shelves' ? (
          <BookshelvesView
            onOpenBook={(bookId) => {
              const b = books.find((x) => x.id === bookId);
              if (b) setSelectedBookForDetail(b);
            }}
            onReadBook={(book, chapterId) => setReadingBook({ book, chapterId })}
          />
        ) : activeNav === 'clubs' ? (
          <ClubsView
            onOpenBook={(bookId) => {
              const b = books.find((x) => x.id === bookId);
              if (b) setSelectedBookForDetail(b);
            }}
          />
        ) : activeNav === 'social' ? (
          <ActivitySocialView
            onOpenBook={(bookId) => {
              const b = books.find((x) => x.id === bookId);
              if (b) setSelectedBookForDetail(b);
            }}
          />
        ) : (
          /* =================== EXPLORE / DISCOVERY VIEW =================== */
          <div className="space-y-10 animate-in fade-in duration-200">
            {/* Search & Genre Filter Bar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search input */}
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 12+ stories by title, author, or keyword..."
                    className="w-full pl-10 pr-4 py-2 rounded-2xl border border-border bg-card text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </form>

                {/* Sort dropdown */}
                <div className="flex items-center space-x-2 text-xs text-muted-foreground w-full sm:w-auto justify-end">
                  <span>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <option value="trending">Trending</option>
                    <option value="newest">Recently Published</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>

              {/* Genre Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition shrink-0 ${
                      selectedGenre === g
                        ? 'border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Books Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-xl">
                  {selectedGenre === 'All' ? 'Complete Library Collection' : `${selectedGenre} Titles`}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {books.length} book{books.length === 1 ? '' : 's'} available
                </span>
              </div>

              {loadingBooks ? (
                <div className="py-20 text-center space-y-3 opacity-60">
                  <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm font-serif">Browsing the stacks...</p>
                </div>
              ) : books.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm font-serif">
                  No books matched your search or genre filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {books.map((b) => (
                    <BookCard
                      key={b.id}
                      book={b}
                      onOpenDetail={(book) => setSelectedBookForDetail(book)}
                      onReadNow={(book) => {
                        requireAuth('read this manuscript', () => setReadingBook({ book }));
                      }}
                      onShelfChanged={fetchBooks}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Reader Modal (Distraction-Free) */}
      {readingBook && (
        <ReaderModal
          book={readingBook.book}
          initialChapterId={readingBook.chapterId}
          onClose={() => setReadingBook(null)}
          onProgressUpdated={fetchBooks}
          onRequireAuth={() => {
            setAuthReason("Sign in or create a free account to read full manuscripts.");
            setShowAuthModal(true);
          }}
        />
      )}

      {/* Book Detail Dialog */}
      {selectedBookForDetail && (
        <BookDetailDialog
          bookId={selectedBookForDetail.id}
          onClose={() => setSelectedBookForDetail(null)}
          onReadChapter={(book, chapterId) => {
            requireAuth('read full chapters and illustrated story scenes', () => {
              setSelectedBookForDetail(null);
              setReadingBook({ book, chapterId });
            });
          }}
          onShelfUpdated={fetchBooks}
        />
      )}

      {/* Auth / Demo Persona Switcher Modal */}
      {showAuthModal && (
        <AuthDialog
          currentUser={currentUser}
          customReason={authReason}
          onClose={() => {
            setShowAuthModal(false);
            setAuthReason(null);
          }}
          onSuccess={(user) => {
            setCurrentUser(user);
            setAuthReason(null);
            fetchBooks();
          }}
          onSignOut={handleSignOut}
          onOpenForgotPassword={() => {
            alert('Password reset link has been dispatched to your email address.');
          }}
        />
      )}

      {/* AI Book Finder & Recommendation Modal */}
      {showAiModal && (
        <AiBookFinderModal
          onClose={() => setShowAiModal(false)}
          onReadBook={(book, chapterId) => {
            setShowAiModal(false);
            setReadingBook({ book, chapterId });
          }}
          onOpenBookDetail={(book) => {
            setShowAiModal(false);
            setSelectedBookForDetail(book);
          }}
        />
      )}
    </div>
  );
}
