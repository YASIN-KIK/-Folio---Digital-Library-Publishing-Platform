import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, Settings, Bookmark, CheckCircle2,
  Type, Sun, Moon, Coffee, Maximize2, Minimize2, ListOrdered, Lock,
  Volume2, VolumeX, Play, Pause, Square, Highlighter, Sparkles, Share2,
  Download, Eye, BookOpen, Flame, CloudRain, Wind, Radio, MessageSquare, Trash2
} from 'lucide-react';
import { Book, Chapter, ReaderSettings, Highlight } from '@/types/library';
import { api } from '@/lib/libraryClient';
import { soundscapes } from '@/lib/soundscapes';
import { QuoteCardModal } from '@/components/reader/QuoteCardModal';

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
  const [showHighlightsDrawer, setShowHighlightsDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Feature 1: Audio Narration (SpeechSynthesis)
  const [isNarrating, setIsNarrating] = useState(false);
  const [narrationRate, setNarrationRate] = useState<number>(1.0);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Feature 2: Text Highlighting & Margin Notes
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [highlightNote, setHighlightNote] = useState<string>('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedColor, setSelectedColor] = useState<'amber' | 'emerald' | 'rose' | 'violet'>('amber');

  // Feature 3: Ambient Soundscapes
  const [activeSoundscape, setActiveSoundscape] = useState<'none' | 'fire' | 'rain' | 'library' | 'cosmic'>('none');
  const [soundVolume, setSoundVolume] = useState<number>(0.35);

  // Feature 4: View Mode & Bionic Reading
  const [viewMode, setViewMode] = useState<'scroll' | 'paginated'>('scroll');
  const [bionicReading, setBionicReading] = useState(false);

  // Feature 10: Quote Card Modal
  const [quoteCardText, setQuoteCardText] = useState<string | null>(null);

  // Feature 11: Silent Reading Salon Presence (Active Readers count)
  const [activeRoomReaders] = useState(() => Math.floor(Math.random() * 5) + 3);

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

  const updateSettings = (partial: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem('folio_reader_settings', JSON.stringify(next));
      }
      return next;
    });
  };

  // Stop narration and ambient audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      soundscapes.stop();
    };
  }, []);

  const loadHighlights = async () => {
    try {
      const data = await api.getHighlights(book.id);
      setHighlights(data);
    } catch {}
  };

  // Load chapter
  const loadChapter = async (chapterId: string) => {
    setLoading(true);
    setAuthRequired(false);
    stopNarration();
    try {
      const ch = await api.getChapter(chapterId);
      setCurrentChapter(ch);
      if (ch.all_chapters) {
        setChapters(ch.all_chapters as any);
      }
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      try {
        await api.saveProgress(book.id, chapterId, 5);
        if (onProgressUpdated) onProgressUpdated();
      } catch {}
      loadHighlights();
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

    if (pct > 5 && pct % 10 === 0) {
      api.saveProgress(book.id, currentChapter.id, pct).catch(() => {});
    }
  };

  // Text selection for highlights & quote cards
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionCoords(null);
      setSelectedText('');
      return;
    }
    const text = selection.toString().trim();
    if (text.length > 5) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionCoords({
        x: Math.max(10, rect.left + rect.width / 2),
        y: Math.max(70, rect.top - 10),
      });
    }
  };

  const handleSaveHighlight = async () => {
    if (!currentChapter || !selectedText) return;
    try {
      const created = await api.createHighlight({
        book_id: book.id,
        chapter_id: currentChapter.id,
        selected_text: selectedText,
        note: highlightNote.trim(),
        color: selectedColor,
      });
      setHighlights((prev) => [created, ...prev]);
      setSelectedText('');
      setHighlightNote('');
      setSelectionCoords(null);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Sign in to save highlights');
    }
  };

  const handleDeleteHighlight = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteHighlight(id);
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch {}
  };

  // Audio Narration Engine
  const startNarration = () => {
    if (!currentChapter || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Extract plain text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentChapter.content;
    const plainText = `${currentChapter.title}. ${tempDiv.textContent || tempDiv.innerText || ''}`;

    const utter = new SpeechSynthesisUtterance(plainText);
    utter.rate = narrationRate;
    utter.pitch = 1.0;
    utter.onend = () => setIsNarrating(false);
    utter.onerror = () => setIsNarrating(false);

    speechUtteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsNarrating(true);
  };

  const pauseNarration = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsNarrating(false);
    }
  };

  const stopNarration = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
    }
  };

  const handleNarrationRateChange = (rate: number) => {
    setNarrationRate(rate);
    if (isNarrating) {
      stopNarration();
      setTimeout(startNarration, 100);
    }
  };

  // Soundscape toggles
  const handleSoundscapeChange = (mode: 'none' | 'fire' | 'rain' | 'library' | 'cosmic') => {
    setActiveSoundscape(mode);
    if (mode === 'none') {
      soundscapes.stop();
    } else {
      soundscapes.play(mode);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSoundVolume(val);
    soundscapes.setVolume(val);
  };

  // Fullscreen
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

  // Apply bionic reading transformation
  const formatBionicText = (html: string) => {
    if (!bionicReading) return html;
    return html.replace(/>([^<]+)</g, (_, text) => {
      const bionic = text.split(/\s+/).map((word: string) => {
        if (word.length <= 3) return `<b>${word}</b>`;
        const mid = Math.ceil(word.length / 2);
        return `<b>${word.slice(0, mid)}</b>${word.slice(mid)}`;
      }).join(' ');
      return `>${bionic}<`;
    });
  };

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
      <header className="flex items-center justify-between px-4 sm:px-8 py-2.5 border-b border-black/10 dark:border-white/10 backdrop-blur-sm z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium opacity-70 hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            title="Exit Reader"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-4 w-[1px] bg-black/20 dark:bg-white/20 hidden sm:block" />
          <div className="flex flex-col">
            <span className="font-display font-semibold text-sm sm:text-base truncate max-w-[180px] sm:max-w-xs md:max-w-md">
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

        {/* Reader Center Badge: Silent Reading Salon Presence */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="opacity-80 text-[11px] font-serif">
            {activeRoomReaders} readers immersed in this salon
          </span>
        </div>

        {/* Reader Controls */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {/* Audio Narration Toggle */}
          <div className="flex items-center rounded-lg bg-black/5 dark:bg-white/5 p-0.5 border border-black/10 dark:border-white/10">
            {isNarrating ? (
              <button
                onClick={pauseNarration}
                className="p-1.5 rounded-md bg-amber-600 text-white transition flex items-center gap-1 text-xs font-semibold shadow-sm"
                title="Pause Audio Narration"
              >
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Narrating</span>
              </button>
            ) : (
              <button
                onClick={startNarration}
                className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition flex items-center gap-1 text-xs opacity-80 hover:opacity-100"
                title="Listen with AI Narration (Text-to-Speech)"
              >
                <Play className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden xl:inline">Listen</span>
              </button>
            )}

            {isNarrating && (
              <div className="flex items-center space-x-1 px-1.5">
                {[1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleNarrationRateChange(rate)}
                    className={`px-1 py-0.5 rounded text-[10px] font-bold ${
                      narrationRate === rate ? 'bg-amber-600 text-white' : 'opacity-60'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table of Contents Drawer */}
          <button
            onClick={() => setShowChapterList(!showChapterList)}
            className="px-2.5 py-1.5 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1 text-xs font-semibold"
            title="Table of Contents"
          >
            <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Ch. ({chapters.length})</span>
          </button>

          {/* Highlights & Notes Drawer Toggle */}
          <button
            onClick={() => setShowHighlightsDrawer(!showHighlightsDrawer)}
            className="p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition relative"
            title="My Highlights & Notes"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-600" />
            {highlights.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-600" />
            )}
          </button>

          {/* e-Reader Book Export Button */}
          <a
            href={api.getExportUrl(book.id)}
            download={`${book.title}.md`}
            className="p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition hidden md:block"
            title="Download Book Manuscript (.md for Kindle & e-Readers)"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
          </a>

          {/* Bookmark Button */}
          <button
            onClick={handleManualBookmark}
            className="p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center space-x-1 text-xs"
            title="Bookmark position"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden lg:inline">{savedNotice ? 'Saved!' : `${scrollProgress}%`}</span>
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Appearance & Soundscapes"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Text Selection Action Pill */}
      {selectionCoords && selectedText && (
        <div
          style={{ left: `${selectionCoords.x}px`, top: `${selectionCoords.y}px` }}
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full bg-stone-900 text-white rounded-2xl shadow-2xl p-2 flex items-center space-x-2 border border-white/20 animate-in fade-in zoom-in-95"
        >
          {/* Highlight Colors */}
          <div className="flex items-center space-x-1 pr-1 border-r border-white/20">
            {(['amber', 'emerald', 'rose', 'violet'] as const).map((color) => {
              const bg =
                color === 'amber'
                  ? 'bg-amber-400'
                  : color === 'emerald'
                  ? 'bg-emerald-400'
                  : color === 'rose'
                  ? 'bg-rose-400'
                  : 'bg-purple-400';
              return (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    handleSaveHighlight();
                  }}
                  className={`w-5 h-5 rounded-full ${bg} hover:scale-125 transition border border-white/40`}
                  title={`Highlight in ${color}`}
                />
              );
            })}
          </div>

          {/* Create Quote Card */}
          <button
            onClick={() => {
              setQuoteCardText(selectedText);
              setSelectionCoords(null);
            }}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1 transition"
          >
            <Share2 className="w-3 h-3 text-amber-300" />
            <span>Quote Card</span>
          </button>

          <button
            onClick={() => setSelectionCoords(null)}
            className="p-1 opacity-60 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Settings Popover Drawer (Typography, Soundscapes, Bionic Reading) */}
      {showSettings && (
        <div className="absolute right-4 top-14 z-50 w-84 max-w-[90vw] rounded-3xl border border-black/15 dark:border-white/15 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-5 shadow-2xl space-y-4 text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-amber-600" /> Reader Experience
            </h4>
            <button onClick={() => setShowSettings(false)} className="text-xs opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Ambient Soundscapes Selector */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider opacity-60 block mb-2 flex items-center justify-between">
              <span>Ambient Soundscapes</span>
              <span className="capitalize text-amber-600 font-semibold">{activeSoundscape}</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
              <button
                onClick={() => handleSoundscapeChange('none')}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 ${
                  activeSoundscape === 'none' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 font-bold' : 'border-black/10 dark:border-white/10'
                }`}
              >
                <VolumeX className="w-4 h-4 opacity-60" /> Mute
              </button>
              <button
                onClick={() => handleSoundscapeChange('fire')}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 ${
                  activeSoundscape === 'fire' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 font-bold text-amber-700' : 'border-black/10 dark:border-white/10'
                }`}
              >
                <Flame className="w-4 h-4 text-orange-500" /> Fire
              </button>
              <button
                onClick={() => handleSoundscapeChange('rain')}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 ${
                  activeSoundscape === 'rain' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 font-bold text-sky-700' : 'border-black/10 dark:border-white/10'
                }`}
              >
                <CloudRain className="w-4 h-4 text-sky-500" /> Rain
              </button>
              <button
                onClick={() => handleSoundscapeChange('library')}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 ${
                  activeSoundscape === 'library' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 font-bold text-emerald-700' : 'border-black/10 dark:border-white/10'
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-500" /> Library
              </button>
              <button
                onClick={() => handleSoundscapeChange('cosmic')}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 ${
                  activeSoundscape === 'cosmic' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 font-bold text-purple-700' : 'border-black/10 dark:border-white/10'
                }`}
              >
                <Radio className="w-4 h-4 text-purple-500" /> Cosmic
              </button>
            </div>

            {activeSoundscape !== 'none' && (
              <div className="mt-2 flex items-center space-x-2 text-xs">
                <Volume2 className="w-3.5 h-3.5 opacity-60" />
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={handleVolumeChange}
                  className="w-full accent-amber-600 h-1.5 bg-black/10 dark:bg-white/10 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Bionic Reading & View Mode Toggles */}
          <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="font-medium opacity-80">Bionic Reading Focus</span>
            <button
              onClick={() => setBionicReading(!bionicReading)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                bionicReading
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'border-black/15 dark:border-white/15 opacity-60'
              }`}
            >
              {bionicReading ? 'Active (Bold)' : 'Off'}
            </button>
          </div>

          {/* Theme Palette */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider opacity-60 block mb-1.5">
              Theme Palette
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={`py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 ${
                  settings.theme === 'light'
                    ? 'border-amber-600 bg-stone-100 text-stone-900 shadow-sm ring-1 ring-amber-600'
                    : 'border-stone-200 bg-stone-50 text-stone-700'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
              <button
                onClick={() => updateSettings({ theme: 'sepia' })}
                className={`py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 ${
                  settings.theme === 'sepia'
                    ? 'border-amber-700 bg-[#f5eedc] text-[#3b2f20] shadow-sm ring-1 ring-amber-700'
                    : 'border-[#e4d8be] bg-[#faf3e3] text-[#4d3f2d]'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" /> Sepia
              </button>
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 ${
                  settings.theme === 'dark'
                    ? 'border-amber-500 bg-stone-800 text-stone-100 shadow-sm ring-1 ring-amber-500'
                    : 'border-stone-800 bg-stone-950 text-stone-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
            </div>
          </div>

          {/* Typography */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider opacity-60 block mb-1.5">
              Typography
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateSettings({ fontFamily: 'serif' })}
                className={`py-1.5 text-xs font-serif rounded-lg border ${
                  settings.fontFamily === 'serif' ? 'border-amber-600 bg-amber-500/15 font-bold' : 'border-black/10 dark:border-white/10'
                }`}
              >
                Serif
              </button>
              <button
                onClick={() => updateSettings({ fontFamily: 'sans' })}
                className={`py-1.5 text-xs font-sans rounded-lg border ${
                  settings.fontFamily === 'sans' ? 'border-amber-600 bg-amber-500/15 font-bold' : 'border-black/10 dark:border-white/10'
                }`}
              >
                Sans
              </button>
              <button
                onClick={() => updateSettings({ fontFamily: 'mono' })}
                className={`py-1.5 text-xs font-mono rounded-lg border ${
                  settings.fontFamily === 'mono' ? 'border-amber-600 bg-amber-500/15 font-bold' : 'border-black/10 dark:border-white/10'
                }`}
              >
                Mono
              </button>
            </div>
          </div>

          {/* Text Size Stepper */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="opacity-75">Size: {settings.fontSize}px</span>
            <div className="flex space-x-2">
              <button
                onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
                className="px-3 py-1 rounded-lg border border-black/15 dark:border-white/15 font-bold"
              >
                A-
              </button>
              <button
                onClick={() => updateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })}
                className="px-3 py-1 rounded-lg border border-black/15 dark:border-white/15 font-bold text-sm"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Highlights & Margin Notes Side Drawer */}
      {showHighlightsDrawer && (
        <div className="absolute right-4 top-14 z-50 w-88 max-w-[92vw] max-h-[80vh] overflow-y-auto rounded-3xl border border-black/15 dark:border-white/15 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-5 shadow-2xl space-y-4 text-stone-900 dark:text-stone-100 animate-in fade-in slide-in-from-right-3">
          <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <Highlighter className="w-4 h-4 text-amber-600" /> Book Highlights ({highlights.length})
            </h4>
            <button onClick={() => setShowHighlightsDrawer(false)} className="text-xs opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            {highlights.length === 0 ? (
              <div className="py-12 text-center text-xs opacity-60 font-serif">
                Select any text in the story to highlight or save margin notes.
              </div>
            ) : (
              highlights.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-600">
                      Ch. {h.chapter_number}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setQuoteCardText(h.selected_text)}
                        className="p-1 hover:text-amber-600"
                        title="Generate Quote Card"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteHighlight(h.id, e)}
                        className="p-1 hover:text-rose-500"
                        title="Delete Highlight"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="font-serif italic border-l-2 border-amber-500 pl-2 opacity-90">
                    "{h.selected_text}"
                  </p>
                  {h.note && (
                    <p className="text-[11px] opacity-75 font-sans pt-1">
                      <strong>Note:</strong> {h.note}
                    </p>
                  )}
                </div>
              ))
            )}
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
                  <span className="text-[10px] opacity-50 shrink-0">{ch.word_count || 400}w</span>
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
        onMouseUp={handleTextSelection}
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
                Reading full manuscripts, multi-chapter books, and illustrated story scenes requires a free Folio account. Sign up or log in to unlock the entire library!
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

              {/* Chapter Content rendered from rich HTML with Bionic Reading */}
              <div
                className="chapter-body space-y-6"
                dangerouslySetInnerHTML={{
                  __html: formatBionicText(currentChapter.content),
                }}
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

      {/* Quote Card Modal (Social Quote Sharing) */}
      {quoteCardText && (
        <QuoteCardModal
          book={book}
          chapterTitle={currentChapter?.title}
          quoteText={quoteCardText}
          onClose={() => setQuoteCardText(null)}
        />
      )}
    </div>
  );
};
