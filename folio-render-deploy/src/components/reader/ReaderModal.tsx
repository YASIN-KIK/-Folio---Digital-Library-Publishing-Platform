import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, Settings, Bookmark, CheckCircle2,
  Type, Sun, Moon, Coffee, Maximize2, Minimize2, ListOrdered, Lock
} from 'lucide-react';
import { Book, Chapter, ReaderSettings } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface ReaderModalProps {
  book: Book;
  initialChapterId?: string;
  onClose: () => void;
  onProgressUpdated?: () => void;
  onRequireAuth?: () => void;
}

export const ReaderModal: React.FC<ReaderModalProps> = ({
  book,
  initialChapterId,
  onClose,
  onProgressUpdated,
  onRequireAuth,
}) => {
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const [settings, setSettings] = useState<ReaderSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('folio_reader_settings');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return {
      fontFamily: 'serif',
      fontSize: 18,
      lineHeight: 'comfortable',
      theme: 'sepia',
    };
  });

  const contentRef = useRef<HTMLDivElement>(null);

  // Save settings
  const updateSettings = (partial: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem('folio_reader_settings', JSON.stringify(next));
      }
      return next;
    });
  };

  // Load chapter
  const loadChapter = async (chapterId: string) => {
    setLoading(true);
    setAuthRequired(false);
    try {
      const ch = await api.getChapter(chapterId);
      setCurrentChapter(ch);
      if (ch.all_chapters) {
        setChapters(ch.all_chapters as any);
      }
      // Reset scroll position to top
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      // Save progress for this chapter if signed in
      try {
        await api.saveProgress(book.id, chapterId, 5);
        if (onProgressUpdated) onProgressUpdated();
      } catch {
        // ignore progress save if not signed in
      }
    } catch (err: any) {
      console.error('Failed to load chapter', err);
      if (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('sign up') || err.message.toLowerCase().includes('sign in'))) {
        setAuthRequired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const allChapters = await api.getChapters(book.id);
        setChapters(allChapters);
        let targetId = initialChapterId;
        if (!targetId) {
          // Check saved progress
          const prog = await api.getProgress(book.id);
          if (prog?.chapter_id) {
            targetId = prog.chapter_id;
          } else if (allChapters.length > 0) {
            targetId = allChapters[0].id;
          }
        }
        if (targetId) {
          await loadChapter(targetId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    init();
  }, [book.id, initialChapterId]);

  // Handle scroll progress
  const handleScroll = () => {
    if (!contentRef.current || !currentChapter) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const total = scrollHeight - clientHeight;
    const pct = total > 0 ? Math.min(100, Math.round((scrollTop / total) * 100)) : 0;
    setScrollProgress(pct);

    // Debounced bookmark save on milestone
    if (pct > 5 && pct % 10 === 0) {
      api.saveProgress(book.id, currentChapter.id, pct);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleManualBookmark = async () => {
    if (!currentChapter) return;
    await api.saveProgress(book.id, currentChapter.id, scrollProgress);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
    if (onProgressUpdated) onProgressUpdated();
  };

  const themeClass =
    settings.theme === 'sepia'
      ? 'reader-theme-sepia'
      : settings.theme === 'dark'
      ? 'reader-theme-dark'
      : 'reader-theme-light';

  const fontClass =
    settings.fontFamily === 'serif'
      ? 'font-serif-literary'
      : settings.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const lineHeightClass =
    settings.lineHeight === 'compact'
      ? 'leading-relaxed'
      : settings.lineHeight === 'comfortable'
      ? 'leading-loose'
      : 'leading-[2.2]';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${themeClass} transition-colors duration-200 select-text`}>
      {/* Top Reading Progress Bar */}
      <div className="w-full bg-black/10 dark:bg-white/10 h-1 fixed top-0 left-0 z-50">
        <div
          className="bg-amber-600 h-1 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reader Header Nav */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-black/10 dark:border-white/10 backdrop-blur-sm z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium opacity-70 hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            title="Exit Reader"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Library</span>
          </button>
          <div className="h-4 w-[1px] bg-black/20 dark:bg-white/20 hidden sm:block" />
          <div className="flex flex-col">
            <span className="font-display font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
              {book.title}
            </span>
            <span className="text-xs opacity-75 truncate flex items-center gap-1.5">
              {currentChapter ? (
                <>
                  <span className="px-1.5 py-0.2 rounded bg-amber-600/15 text-amber-700 dark:text-amber-300 font-semibold text-[10px]">
                    Ch. {currentChapter.chapter_number} of {chapters.length || 1}
                  </span>
                  <span className="truncate">{currentChapter.title}</span>
                </>
              ) : 'Loading...'}
            </span>
          </div>
        </div>

        {/* Reader Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Chapter Drawer Toggle */}
          <button
            onClick={() => setShowChapterList(!showChapterList)}
            className="px-2.5 py-1.5 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Table of Contents"
          >
            <ListOrdered className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Chapters ({chapters.length})</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleManualBookmark}
            className="p-2 rounded-lg opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center space-x-1 text-xs"
            title="Bookmark position"
          >
            <Bookmark className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">{savedNotice ? 'Saved!' : `${scrollProgress}%`}</span>
          </button>

          {/* Typography & Theme Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Appearance Settings"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Popover Drawer */}
      {showSettings && (
        <div className="absolute right-4 top-14 z-50 w-80 rounded-2xl border border-black/15 dark:border-white/15 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-5 shadow-2xl space-y-5 text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-amber-600" /> Reader Appearance
            </h4>
            <button onClick={() => setShowSettings(false)} className="text-xs opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Palette */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider opacity-60 block mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                  settings.theme === 'light'
                    ? 'border-amber-600 bg-stone-100 text-stone-900 shadow-sm ring-1 ring-amber-600'
                    : 'border-stone-200 bg-stone-50 text-stone-700'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
              <button
                onClick={() => updateSettings({ theme: 'sepia' })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                  settings.theme === 'sepia'
                    ? 'border-amber-700 bg-[#f5eedc] text-[#3b2f20] shadow-sm ring-1 ring-amber-700'
                    : 'border-[#e4d8be] bg-[#faf3e3] text-[#4d3f2d]'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" /> Sepia
              </button>
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 ${
                  settings.theme === 'dark'
                    ? 'border-amber-500 bg-stone-800 text-stone-100 shadow-sm ring-1 ring-amber-500'
                    : 'border-stone-800 bg-stone-950 text-stone-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider opacity-60 block mb-2">
              Typography
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateSettings({ fontFamily: 'serif' })}
                className={`py-2 px-2 rounded-xl border text-xs font-serif ${
                  settings.fontFamily === 'serif' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200' : 'border-black/10 dark:border-white/10'
                }`}
              >
                Serif (Book)
              </button>
              <button
                onClick={() => updateSettings({ fontFamily: 'sans' })}
                className={`py-2 px-2 rounded-xl border text-xs font-sans ${
                  settings.fontFamily === 'sans' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200' : 'border-black/10 dark:border-white/10'
                }`}
              >
                Sans-Serif
              </button>
              <button
                onClick={() => updateSettings({ fontFamily: 'mono' })}
                className={`py-2 px-2 rounded-xl border text-xs font-mono ${
                  settings.fontFamily === 'mono' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200' : 'border-black/10 dark:border-white/10'
                }`}
              >
                Monospace
              </button>
            </div>
          </div>

          {/* Font Size Adjuster */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider opacity-60 mb-2">
              <span>Text Size</span>
              <span>{settings.fontSize}px</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
                className="flex-1 py-1.5 px-3 rounded-lg border border-black/15 dark:border-white/15 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5"
              >
                A-
              </button>
              <button
                onClick={() => updateSettings({ fontSize: Math.min(26, settings.fontSize + 1) })}
                className="flex-1 py-1.5 px-3 rounded-lg border border-black/15 dark:border-white/15 text-lg font-semibold hover:bg-black/5 dark:hover:bg-white/5"
              >
                A+
              </button>
            </div>
          </div>

          {/* Line Height Toggle */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider opacity-60 block mb-2">
              Line Spacing
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'comfortable', 'relaxed'] as const).map((lh) => (
                <button
                  key={lh}
                  onClick={() => updateSettings({ lineHeight: lh })}
                  className={`py-1.5 text-xs capitalize rounded-lg border ${
                    settings.lineHeight === lh
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                      : 'border-black/10 dark:border-white/10'
                  }`}
                >
                  {lh}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chapter Drawer */}
      {showChapterList && (
        <div className="absolute left-4 top-14 z-50 w-80 max-h-[75vh] overflow-y-auto rounded-2xl border border-black/15 dark:border-white/15 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 shadow-2xl space-y-3 text-stone-900 dark:text-stone-100 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
            <h4 className="font-semibold text-sm">Table of Contents</h4>
            <button onClick={() => setShowChapterList(false)} className="text-xs opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {chapters.map((ch) => {
              const isActive = currentChapter?.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    loadChapter(ch.id);
                    setShowChapterList(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition flex items-center justify-between ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="truncate mr-2">
                    <span className="opacity-60 mr-1.5">Ch. {ch.chapter_number}</span>
                    <span>{ch.title}</span>
                  </div>
                  <span className="text-[10px] opacity-50 shrink-0">{ch.word_count || 300}w</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Reading Surface */}
      <main
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-10 md:py-16 md:px-12 flex justify-center"
      >
        <div
          className={`max-w-2xl w-full ${fontClass} ${lineHeightClass}`}
          style={{ fontSize: `${settings.fontSize}px` }}
        >
          {loading ? (
            <div className="py-24 text-center space-y-4 opacity-50">
              <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm">Retrieving chapter parchment...</p>
            </div>
          ) : authRequired ? (
            <div className="py-20 text-center space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-600/10 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="font-display font-semibold text-2xl text-foreground">
                Sign In Required to Read
              </h3>
              <p className="text-sm font-serif text-muted-foreground leading-relaxed">
                Reading full manuscripts, multi-chapter books, and illustrated story art requires a free Folio account. Sign up or log in to unlock the entire library!
              </p>
              <div className="pt-3">
                <button
                  onClick={() => {
                    onClose();
                    if (onRequireAuth) onRequireAuth();
                  }}
                  className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm shadow-xl transition"
                >
                  Sign In or Create Account
                </button>
              </div>
            </div>
          ) : currentChapter ? (
            <article className="prose-reader transition-all">
              {/* Chapter Header */}
              <div className="text-center mb-12 pb-8 border-b border-black/10 dark:border-white/10">
                <span className="text-xs uppercase tracking-widest opacity-60 font-sans block mb-2">
                  Chapter {currentChapter.chapter_number}
                </span>
                <h1 className="text-3xl sm:text-4xl font-display font-semibold mb-4 leading-tight">
                  {currentChapter.title}
                </h1>
                <div className="flex items-center justify-center space-x-3 text-xs opacity-60 font-sans">
                  <span>{currentChapter.word_count} words</span>
                  <span>•</span>
                  <span>~{Math.max(1, Math.round(currentChapter.word_count / 200))} min read</span>
                </div>
              </div>

              {/* Chapter Content rendered from rich HTML */}
              <div
                className="chapter-body space-y-6"
                dangerouslySetInnerHTML={{ __html: currentChapter.content }}
              />

              {/* Bottom Chapter Navigation */}
              <div className="mt-16 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
                {currentChapter.prev_chapter ? (
                  <button
                    onClick={() => loadChapter(currentChapter.prev_chapter!.id)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Chapter
                  </button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleManualBookmark}
                    className="px-4 py-2.5 rounded-xl bg-amber-600/10 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-600/20 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Chapter Read
                  </button>
                </div>

                {currentChapter.next_chapter ? (
                  <button
                    onClick={() => loadChapter(currentChapter.next_chapter!.id)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 flex items-center justify-center gap-2 shadow-sm"
                  >
                    Next Chapter <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 text-xs font-medium opacity-80 hover:opacity-100"
                  >
                    Finished Book 🎉
                  </button>
                )}
              </div>
            </article>
          ) : (
            <div className="py-24 text-center space-y-4 opacity-60">
              <p>No chapter selected or book has no published chapters yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
