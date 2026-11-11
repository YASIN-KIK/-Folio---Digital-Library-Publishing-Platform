import React, { useState, useEffect } from 'react';
import {
  Plus, BookOpen, Clock, Edit3, Trash2, CheckCircle2, AlertCircle, Sparkles, Filter, Layers
} from 'lucide-react';
import { Book } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface AuthorStudioProps {
  onOpenEditor: (bookId: string) => void;
  onReadBook: (book: Book) => void;
}

const PRESET_COVERS = [
  { name: 'Alchemical Gold', url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80' },
  { name: 'Neon Noir', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80' },
  { name: 'Venetian Mist', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80' },
  { name: 'Deep Cosmos', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80' },
  { name: 'Glass Library', url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80' },
  { name: 'Leather Grimoire', url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80' },
];

const GENRES = [
  'Fantasy', 'Sci-Fi', 'Literary Fiction', 'Historical Fiction',
  'Cyberpunk', 'Mystery', 'Poetry', 'Thriller', 'Non-Fiction'
];

export const AuthorStudio: React.FC<AuthorStudioProps> = ({
  onOpenEditor,
  onReadBook,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New Book Dialog
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [genre, setGenre] = useState('Fantasy');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState(PRESET_COVERS[0].url);
  const [mature, setMature] = useState(false);
  const [language, setLanguage] = useState('English');
  const [creating, setCreating] = useState(false);

  const fetchMyBooks = async () => {
    setLoading(true);
    try {
      const user = await api.getCurrentUser();
      const myBooks = await api.getBooks({ author_id: user.id });
      setBooks(myBooks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBooks();
  }, []);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please provide a title and synopsis.');
      return;
    }
    setCreating(true);
    try {
      const res = await api.createBook({
        title: title.trim(),
        subtitle: subtitle.trim(),
        genre,
        description: description.trim(),
        cover_image: coverUrl,
        mature_content: mature,
        language,
      });
      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setSubtitle('');
      setDescription('');
      // Open editor directly for the new book!
      onOpenEditor(res.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create book');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you certain you wish to delete this book and its chapters?')) return;
    try {
      await api.deleteBook(bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBooks = books.filter((b) => {
    if (filterStatus === 'published') return b.status === 'published';
    if (filterStatus === 'draft') return b.status === 'draft';
    if (filterStatus === 'in_review') return b.status === 'in_review';
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Studio Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 p-6 sm:p-10 text-white shadow-xl overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Authoring & Publishing Studio
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-white">
            Write, Edit, & Self-Publish
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
            Distraction-free rich text drafting with chapter hierarchy, automatic progress saving, and multi-step publication workflows.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="relative z-10 px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm shadow-xl transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Start New Book
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-2">
          {(['all', 'published', 'draft', 'in_review'] as const).map((st) => {
            const count =
              st === 'all'
                ? books.length
                : books.filter((b) => b.status === st).length;
            const labels = {
              all: 'All Works',
              published: 'Published',
              draft: 'Drafts',
              in_review: 'In Review',
            };
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                  filterStatus === st
                    ? 'border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {labels[st]} ({count})
              </button>
            );
          })}
        </div>

        <span className="text-xs text-muted-foreground">
          Showing {filteredBooks.length} book{filteredBooks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3 opacity-60">
          <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm font-serif">Loading your manuscript catalog...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-600/10 text-amber-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-lg">No manuscripts found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Ready to tell your story? Start a new draft to begin crafting your first chapter.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow"
          >
            Create Your First Book
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((b) => (
            <div
              key={b.id}
              onClick={() => onOpenEditor(b.id)}
              className="group bg-card rounded-2xl border border-border/80 hover:border-amber-600/40 p-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="flex space-x-4 items-start">
                {/* 2:3 Book Cover Thumbnail */}
                <div className="w-20 aspect-book rounded-lg overflow-hidden bg-stone-900 shrink-0 border border-border shadow-sm">
                  {b.cover_image ? (
                    <img src={b.cover_image} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-500">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {b.genre}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      b.status === 'published'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : b.status === 'in_review'
                        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-base line-clamp-1 group-hover:text-amber-600 transition">
                    {b.title}
                  </h3>
                  {b.subtitle && (
                    <p className="text-xs text-muted-foreground italic line-clamp-1">{b.subtitle}</p>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                    {b.description}
                  </p>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {b.chapter_count || 1} ch
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {b.reading_time_mins || 2}m read
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditor(b.id);
                    }}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-amber-600 hover:text-amber-700 transition"
                    title="Edit Chapters"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(b.id, e)}
                    className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 text-rose-500 transition"
                    title="Delete Book"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Book Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display font-semibold text-2xl">Create New Manuscript</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Clockwork Alchemist"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Chronicles of the Iron Meridian"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Genre *
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Synopsis / Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this book about? Hook your readers with an evocative description..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              {/* Cover Aspect Ratio Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  Select Book Cover (2:3 Aspect Ratio)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                  {PRESET_COVERS.map((preset) => {
                    const isSelected = coverUrl === preset.url;
                    return (
                      <div
                        key={preset.name}
                        onClick={() => setCoverUrl(preset.url)}
                        className={`aspect-book rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                          isSelected
                            ? 'border-amber-600 ring-2 ring-amber-600/30 shadow-md scale-105'
                            : 'border-border opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                </div>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Or paste custom image URL..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              {/* Mature Content Flag */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="matureToggle"
                  checked={mature}
                  onChange={(e) => setMature(e.target.checked)}
                  className="rounded border-border text-amber-600 focus:ring-amber-600 w-4 h-4"
                />
                <label htmlFor="matureToggle" className="text-xs text-foreground cursor-pointer">
                  Contains mature / adult themes (18+ tag)
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  {creating ? 'Creating...' : 'Create & Open Editor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
