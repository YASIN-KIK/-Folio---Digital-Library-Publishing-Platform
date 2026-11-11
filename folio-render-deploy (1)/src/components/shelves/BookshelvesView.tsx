import React, { useState, useEffect } from 'react';
import {
  Bookmark, BookOpen, CheckCircle, Clock, Trash2, Plus, Sparkles, Filter
} from 'lucide-react';
import { BookshelfGroup, BookshelfItem } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface BookshelvesViewProps {
  onOpenBook: (bookId: string) => void;
  onReadBook: (book: any, chapterId?: string) => void;
}

export const BookshelvesView: React.FC<BookshelvesViewProps> = ({
  onOpenBook,
  onReadBook,
}) => {
  const [shelves, setShelves] = useState<BookshelfGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'reading' | 'want_to_read' | 'completed' | 'custom'>('reading');
  const [loading, setLoading] = useState(true);

  // Custom list creation
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  const fetchShelves = async () => {
    setLoading(true);
    try {
      const data = await api.getBookshelves();
      setShelves(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
  }, []);

  const handleRemoveFromShelf = async (bookId: string, shelfType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.toggleBookshelf(bookId, shelfType);
      fetchShelves();
    } catch (err) {
      console.error(err);
    }
  };

  const getList = (): BookshelfItem[] => {
    if (!shelves) return [];
    return shelves[activeTab] || [];
  };

  const currentList = getList();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Shelf Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">
            My Bookshelves
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-serif mt-1">
            Track reading journeys, manage your personal library, and pick up right where you left off.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {(['reading', 'want_to_read', 'completed', 'custom'] as const).map((tab) => {
          const count = shelves ? (shelves[tab] || []).length : 0;
          const labels = {
            reading: 'Currently Reading',
            want_to_read: 'Want to Read',
            completed: 'Completed',
            custom: 'Custom Lists',
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold shadow-sm'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{labels[tab]}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[10px]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookshelf items grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3 opacity-60">
          <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm font-serif">Organizing your library shelves...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-600/10 text-amber-600 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-lg">This shelf is currently empty</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Browse the discovery catalog to find your next great read and save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((item) => {
            const pct = Math.round(item.scroll_percentage || 0);
            return (
              <div
                key={item.shelf_entry_id}
                onClick={() => onOpenBook(item.book_id)}
                className="group bg-card rounded-2xl border border-border/80 hover:border-amber-600/40 p-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="flex space-x-4">
                  {/* Book cover */}
                  <div className="w-20 aspect-book rounded-lg overflow-hidden bg-stone-900 shrink-0 border border-border shadow-sm">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-500">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                      {item.genre}
                    </span>
                    <h3 className="font-display font-semibold text-base line-clamp-1 group-hover:text-amber-600 transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      By {item.author_name}
                    </p>

                    {item.list_name && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground font-medium">
                        {item.list_name}
                      </span>
                    )}

                    {/* Progress Bar if currently reading */}
                    {activeTab === 'reading' && (
                      <div className="pt-2 space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                          <span>Progress</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-600 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReadBook({ id: item.book_id, title: item.title }, item.last_read_chapter_id || undefined);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600/10 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-600 hover:text-white transition flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {activeTab === 'reading' ? 'Continue Reading' : 'Start Reading'}
                  </button>

                  <button
                    onClick={(e) => handleRemoveFromShelf(item.book_id, item.shelf_type, e)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
                    title="Remove from Shelf"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
