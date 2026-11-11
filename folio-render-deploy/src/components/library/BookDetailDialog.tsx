import React, { useState, useEffect } from 'react';
import {
  X, Star, BookOpen, Clock, Bookmark, ThumbsUp, Send, Check, MessageSquare, Layers, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { Book, Chapter, Review } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface BookDetailDialogProps {
  bookId: string;
  onClose: () => void;
  onReadChapter: (book: Book, chapterId?: string) => void;
  onShelfUpdated?: () => void;
}

export const BookDetailDialog: React.FC<BookDetailDialogProps> = ({
  bookId,
  onClose,
  onReadChapter,
  onShelfUpdated,
}) => {
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'chapters' | 'reviews'>('overview');

  // Review Form
  const [myRating, setMyRating] = useState<number>(5);
  const [myReviewText, setMyReviewText] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  const fetchBookData = async () => {
    try {
      const [bookData, reviewList] = await Promise.all([
        api.getBook(bookId),
        api.getReviews(bookId),
      ]);
      setBook(bookData);
      setReviews(reviewList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookData();
  }, [bookId]);

  const handleShelfChange = async (shelfType: string) => {
    if (!book) return;
    try {
      const res = await api.toggleBookshelf(book.id, shelfType);
      setBook({ ...book, shelf_status: res.shelf_type as any });
      if (onShelfUpdated) onShelfUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    setSubmittingReview(true);
    try {
      await api.submitReview(book.id, myRating, myReviewText);
      setMyReviewText('');
      setReviewNotice('Your review has been published!');
      setTimeout(() => setReviewNotice(null), 3000);
      await fetchBookData();
    } catch (err: any) {
      alert(err.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUpvote = async (reviewId: string) => {
    try {
      const res = await api.upvoteReview(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, helpful_count: res.helpful_count, user_upvoted: res.upvoted }
            : r
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !book) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl bg-card rounded-3xl p-8 border border-border shadow-2xl flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground font-serif">Opening book folio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Top Banner */}
        <div className="relative bg-gradient-to-b from-stone-900 via-stone-900/90 to-card p-6 sm:p-8 text-white flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* Cover */}
          <div className="w-28 sm:w-36 aspect-book shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-stone-800">
            {book.cover_image ? (
              <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-900/40 text-amber-300">
                <BookOpen className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-600/80 text-white text-[11px] font-medium tracking-wide">
                {book.genre}
              </span>
              <span className="text-xs text-stone-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> ~{book.reading_time_mins || 3} min read
              </span>
              <span className="text-xs text-stone-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> {book.chapters?.length || 0} chapters
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-semibold leading-tight text-white">
              {book.title}
            </h2>
            {book.subtitle && (
              <p className="text-sm text-stone-300 italic">{book.subtitle}</p>
            )}

            {/* Author */}
            <div className="flex items-center space-x-2 pt-1 text-sm text-stone-200">
              {book.author_avatar && (
                <img
                  src={book.author_avatar}
                  alt={book.author_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <span>By <strong className="font-medium text-white">{book.author_name}</strong></span>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center space-x-2 pt-1">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      (book.avg_rating || 0) >= star
                        ? 'fill-amber-400 stroke-amber-400'
                        : (book.avg_rating || 0) >= star - 0.5
                        ? 'fill-amber-400/50 stroke-amber-400'
                        : 'stroke-stone-500 fill-transparent'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">{book.avg_rating || 'New'}</span>
              <span className="text-xs text-stone-400">({reviews.length} reviews)</span>
            </div>
          </div>
        </div>

        {/* Action Bar (Read Now & Shelf) */}
        <div className="px-6 sm:px-8 py-3 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onReadChapter(book, book.reading_progress?.chapter_id || book.chapters?.[0]?.id);
              }}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              {book.reading_progress ? 'Continue Reading' : 'Start Reading'}
            </button>
          </div>

          {/* Bookshelf Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Add to shelf:</span>
            {(['want_to_read', 'reading', 'completed'] as const).map((st) => {
              const active = book.shelf_status === st;
              const labels = {
                want_to_read: 'Want to Read',
                reading: 'Reading',
                completed: 'Completed',
              };
              return (
                <button
                  key={st}
                  onClick={() => handleShelfChange(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1 ${
                    active
                      ? 'border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {active && <Check className="w-3 h-3 text-amber-600" />}
                  {labels[st]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs: Overview / Chapters / Reviews */}
        <div className="flex border-b border-border px-6 sm:px-8 bg-card">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-700 dark:text-amber-300'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={`py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'chapters'
                ? 'border-amber-600 text-amber-700 dark:text-amber-300'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Chapters ({book.chapters?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-amber-600 text-amber-700 dark:text-amber-300'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Synopsis */}
              <div>
                <h4 className="font-display font-semibold text-lg mb-2">Synopsis</h4>
                <p className="font-serif leading-relaxed text-muted-foreground text-sm sm:text-base">
                  {book.description}
                </p>
              </div>

              {/* Author Bio */}
              {book.author_bio && (
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    About the Author
                  </h5>
                  <div className="flex items-start space-x-3">
                    {book.author_avatar && (
                      <img
                        src={book.author_avatar}
                        alt={book.author_name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm text-foreground">{book.author_name}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-normal">{book.author_bio}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating Distribution Breakdown */}
              {book.rating_distribution && (
                <div>
                  <h4 className="font-display font-semibold text-base mb-3">Reader Ratings</h4>
                  <div className="space-y-1.5 max-w-sm">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = book.rating_distribution?.[star] || 0;
                      const total = reviews.length || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={star} className="flex items-center text-xs space-x-2">
                          <span className="w-12 text-muted-foreground flex items-center gap-1 font-medium">
                            {star} <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          </span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-muted-foreground font-mono">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chapters' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-4">
                Click any chapter to begin reading immediately from that point.
              </p>
              {book.chapters && book.chapters.length > 0 ? (
                book.chapters.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => {
                      onClose();
                      onReadChapter(book, ch.id);
                    }}
                    className="p-4 rounded-xl border border-border/80 hover:border-amber-600/40 bg-card hover:bg-muted/30 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 block">
                          Chapter {ch.chapter_number}
                        </span>
                        {Boolean(ch.has_illustration) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
                            <Sparkles className="w-2.5 h-2.5" /> Illustrated
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-semibold text-base group-hover:text-amber-600 transition">
                        {ch.title}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span>{ch.word_count || 300} words</span>
                      <button className="px-3 py-1 rounded-lg bg-amber-600/10 text-amber-700 dark:text-amber-300 group-hover:bg-amber-600 group-hover:text-white transition font-medium">
                        Read
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No chapters available yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Write a Review Box */}
              <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
                <h4 className="font-display font-semibold text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600" /> Write a Review & Rating
                </h4>

                {reviewNotice && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    {reviewNotice}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground font-medium">Your Rating:</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setMyRating(star)}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              myRating >= star
                                ? 'fill-amber-500 stroke-amber-500'
                                : 'stroke-stone-400 fill-transparent'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-amber-600 ml-2">{myRating} of 5 Stars</span>
                  </div>

                  <textarea
                    rows={3}
                    value={myReviewText}
                    onChange={(e) => setMyReviewText(e.target.value)}
                    placeholder="Share your thoughts on the plot, worldbuilding, and characters..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submittingReview ? 'Submitting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-foreground">
                  Community Reviews ({reviews.length})
                </h4>

                {reviews.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-xs font-serif">
                    Be the first reader to review this book!
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl border border-border/70 bg-card space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          {rev.avatar_url ? (
                            <img
                              src={rev.avatar_url}
                              alt={rev.display_name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-amber-600/20 text-amber-700 flex items-center justify-center text-xs font-bold">
                              {rev.display_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-xs sm:text-sm block">
                              {rev.display_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              @{rev.username}
                            </span>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                rev.rating >= s
                                  ? 'fill-amber-500 stroke-amber-500'
                                  : 'stroke-stone-400 fill-transparent'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-foreground/90 font-serif leading-relaxed">
                        {rev.review_text}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                        <span>{new Date(rev.created_at * 1000).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleUpvote(rev.id)}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs transition ${
                            rev.user_upvoted
                              ? 'border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium'
                              : 'border-border hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Helpful ({rev.helpful_count})</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
