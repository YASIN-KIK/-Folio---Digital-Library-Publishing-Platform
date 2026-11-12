import React, { useState } from 'react';
import { Star, BookOpen, Clock, Bookmark, Check, Plus, ChevronDown, Layers } from 'lucide-react';
import { Book } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface BookCardProps {
  book: Book;
  onOpenDetail: (book: Book) => void;
  onReadNow: (book: Book) => void;
  onShelfChanged?: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onOpenDetail,
  onReadNow,
  onShelfChanged,
}) => {
  const [currentShelf, setCurrentShelf] = useState<string | null>(book.shelf_status || null);
  const [showShelfMenu, setShowShelfMenu] = useState(false);
  const [savingShelf, setSavingShelf] = useState(false);

  const handleShelfToggle = async (shelfType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavingShelf(true);
    try {
      const res = await api.toggleBookshelf(book.id, shelfType);
      setCurrentShelf(res.shelf_type);
      setShowShelfMenu(false);
      if (onShelfChanged) onShelfChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingShelf(false);
    }
  };

  const shelfLabels: Record<string, string> = {
    want_to_read: 'Want to Read',
    reading: 'Currently Reading',
    completed: 'Completed',
  };

  return (
    <div
      onClick={() => onOpenDetail(book)}
      className="group relative flex flex-col bg-card rounded-2xl border border-border/70 hover:border-amber-600/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* 2:3 Aspect Ratio Book Cover */}
      <div className="relative aspect-book w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
        {book.cover_image ? (
          <img
            src={book.cover_image}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-amber-900/10 to-stone-900/10">
            <BookOpen className="w-10 h-10 text-amber-700/40 mb-2" />
            <span className="font-display font-semibold text-sm line-clamp-2">{book.title}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-full bg-stone-900/75 backdrop-blur-md text-white border border-white/10 shadow-sm">
            {book.genre}
          </span>
          {Boolean(book.mature_content) && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-900/80 text-rose-100 backdrop-blur-sm">
              18+
            </span>
          )}
        </div>

        {/* Status indicator if draft or in_review */}
        {book.status !== 'published' && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-amber-500/90 text-stone-950 backdrop-blur-sm shadow">
              {book.status === 'draft' ? 'Draft' : 'In Review'}
            </span>
          </div>
        )}

        {/* Quick Read Overlay Button on Hover */}
        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReadNow(book);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs tracking-wide shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200 flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" /> Start Reading
          </button>
        </div>
      </div>

      {/* Book Metadata Section */}
      <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
        <div>
          {/* Rating & Reading Time */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <div className="flex items-center space-x-1 text-amber-500 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
              <span>{book.avg_rating && book.avg_rating > 0 ? book.avg_rating : 'New'}</span>
              {book.review_count ? (
                <span className="text-muted-foreground text-[11px]">({book.review_count})</span>
              ) : null}
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{book.reading_time_mins || 2}m</span>
            </div>
          </div>

          {/* Title & Subtitle */}
          <h3 className="font-display font-semibold text-base line-clamp-1 group-hover:text-amber-600 transition-colors">
            {book.title}
          </h3>
          {book.subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1 italic mt-0.5">
              {book.subtitle}
            </p>
          )}

          {/* Author */}
          <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
            {book.author_avatar ? (
              <img
                src={book.author_avatar}
                alt={book.author_name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-amber-600/20 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                {book.author_name ? book.author_name.charAt(0) : 'A'}
              </div>
            )}
            <span className="font-medium text-foreground truncate">{book.author_name || 'Author'}</span>
          </div>
        </div>

        {/* Shelf Action Button */}
        <div className="pt-2 relative">
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShelfMenu(!showShelfMenu);
              }}
              disabled={savingShelf}
              className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-medium transition flex items-center justify-between ${
                currentShelf
                  ? 'border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'border-border hover:bg-muted/60 text-muted-foreground'
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <Bookmark className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{currentShelf ? shelfLabels[currentShelf] || currentShelf : 'Add to Shelf'}</span>
              </span>
              <ChevronDown className="w-3 h-3 opacity-60 ml-1 shrink-0" />
            </button>
          </div>

          {/* Dropdown Menu */}
          {showShelfMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-11 left-0 right-0 z-30 bg-popover border border-border rounded-xl shadow-xl p-1 text-xs space-y-0.5 animate-in fade-in zoom-in-95"
            >
              {(['want_to_read', 'reading', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={(e) => handleShelfToggle(st, e)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                    currentShelf === st
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span>{shelfLabels[st]}</span>
                  {currentShelf === st && <Check className="w-3 h-3 text-amber-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
