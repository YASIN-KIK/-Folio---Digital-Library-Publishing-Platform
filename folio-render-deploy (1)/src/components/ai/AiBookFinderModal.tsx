import React, { useState } from 'react';
import {
  X, Sparkles, Send, BookOpen, Star, Clock, Compass, Layers,
  ChevronRight, Bookmark, ArrowRight, Wand2, Flame, Bot
} from 'lucide-react';
import { Book } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface AiBookFinderModalProps {
  onClose: () => void;
  onReadBook: (book: Book, chapterId?: string) => void;
  onOpenBookDetail: (book: Book) => void;
}

export const AiBookFinderModal: React.FC<AiBookFinderModalProps> = ({
  onClose,
  onReadBook,
  onOpenBookDetail,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(
    "Greetings, traveler of words. I am the **Folio Literary Oracle**, cataloging over 115 manuscripts, philosophical treaties, and illustrated mage epics. Tell me what themes, worlds, or feelings you seek today—or select one of the enchanted queries below."
  );
  const [recommendations, setRecommendations] = useState<Book[]>([]);

  const QUICK_PROMPTS = [
    { label: "🔮 Illustrated Mage & Titan Sagas", prompt: "Find me an epic mage story with clear pictures and ancient titans" },
    { label: "📜 Books by Yasin Kik", prompt: "Show me all philosophical and speculative books authored by Yasin Kik" },
    { label: "🌌 Cosmic & Quantum Sci-Fi", prompt: "I want deep hard sci-fi about quantum botany, pulsars, or megastructures" },
    { label: "🕯️ Deep Philosophical Treatises", prompt: "Recommend a philosophical book on memory, consciousness, and the void" },
    { label: "🏰 Gothic Cliffside Mysteries", prompt: "Find a Victorian gothic story with dark atmospheric secrets" },
  ];

  const handleSearch = async (promptText: string) => {
    if (!promptText.trim()) return;
    setLoading(true);
    setQuery(promptText);
    try {
      const res = await api.askAiBookFinder(promptText);
      setResponseMessage(res.reply);
      setRecommendations(res.recommendations);
    } catch (err: any) {
      setResponseMessage("The archives flickered in the dark. Please try another query.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-card rounded-3xl border border-amber-600/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 text-foreground transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Arcane Header */}
        <div className="relative bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> AI Literary Oracle & Intelligent Bookfinder
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white">
              Discover Your Next Great Read
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
              Powered by deep semantic indexing across all 115+ manuscripts, chapter passages, and author bibliographies.
            </p>
          </div>
        </div>

        {/* Query Input Bar & Starters */}
        <div className="p-4 sm:p-6 bg-muted/30 border-b border-border space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Wand2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask for anything: 'A story like a mage with pictures', 'Books by Yasin Kik', 'Cozy mystery'..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Ask Oracle</span>
            </button>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
              Quick Inquiries:
            </span>
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSearch(qp.prompt)}
                className="px-3 py-1 rounded-xl border border-border bg-card hover:border-amber-600 hover:text-amber-600 transition shrink-0 text-muted-foreground text-[11px] font-medium"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Oracle reply and Recommended Book Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Oracle Speech Bubble */}
          {responseMessage && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-foreground font-serif leading-relaxed text-xs sm:text-sm space-y-2">
              <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300 font-sans font-semibold text-xs">
                <Bot className="w-4 h-4" />
                <span>Folio AI Literary Oracle</span>
              </div>
              <div
                className="prose-sm text-foreground/90 font-serif leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: responseMessage
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>'),
                }}
              />
            </div>
          )}

          {/* Recommended Books Grid */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display font-semibold text-lg flex items-center justify-between">
                <span>Curated Recommendations ({recommendations.length})</span>
                <span className="text-xs text-muted-foreground font-sans">
                  From 115+ stories cataloged
                </span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((book) => (
                  <div
                    key={book.id}
                    className="p-4 rounded-2xl border border-border/80 hover:border-amber-600/40 bg-card shadow-sm hover:shadow-md transition flex space-x-4 items-start"
                  >
                    {/* Book 2:3 Cover */}
                    <div
                      onClick={() => {
                        onClose();
                        onOpenBookDetail(book);
                      }}
                      className="w-20 aspect-book rounded-lg overflow-hidden bg-stone-900 shrink-0 cursor-pointer border border-border shadow-sm group"
                    >
                      {book.cover_image && (
                        <img
                          src={book.cover_image}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      )}
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 space-y-1.5 truncate">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                          {book.genre}
                        </span>
                        <div className="flex items-center text-amber-500 text-xs font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500 mr-1" />
                          <span>{book.avg_rating || 5.0}</span>
                        </div>
                      </div>

                      <h5
                        onClick={() => {
                          onClose();
                          onOpenBookDetail(book);
                        }}
                        className="font-display font-semibold text-sm truncate text-foreground hover:text-amber-600 cursor-pointer"
                      >
                        {book.title}
                      </h5>

                      <p className="text-xs text-muted-foreground truncate">
                        By {book.author_name}
                      </p>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 font-serif leading-normal">
                        {book.description}
                      </p>

                      <div className="pt-2 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onClose();
                            onReadBook(book);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-sm transition flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Read Now
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onOpenBookDetail(book);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition"
                        >
                          Folio
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
