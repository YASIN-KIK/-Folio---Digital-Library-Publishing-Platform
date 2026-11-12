import React, { useState, useEffect } from 'react';
import {
  Trophy, Award, Flame, Target, Plus, Heart, BookOpen, Sparkles,
  CheckCircle2, Share2, Compass, Layers, Crown, Moon, Feather, Users
} from 'lucide-react';
import { ReadingChallenge, CommunityShelf } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface ReadingChallengeAndCommunityShelvesProps {
  onOpenBook: (bookId: string) => void;
  onRequireAuth: (reason: string, cb: () => void) => void;
}

export const ReadingChallengeAndCommunityShelves: React.FC<ReadingChallengeAndCommunityShelvesProps> = ({
  onOpenBook,
  onRequireAuth,
}) => {
  const [challenge, setChallenge] = useState<ReadingChallenge | null>(null);
  const [communityShelves, setCommunityShelves] = useState<CommunityShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState(25);

  // New public shelf form
  const [showCreateShelf, setShowCreateShelf] = useState(false);
  const [shelfTitle, setShelfTitle] = useState('');
  const [shelfDesc, setShelfDesc] = useState('');
  const [shelfTags, setShelfTags] = useState('');
  const [savingShelf, setSavingShelf] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chData, shData] = await Promise.all([
        api.getMyChallenge(),
        api.getCommunityShelves(),
      ]);
      setChallenge(chData);
      setNewTarget(chData.target_books);
      setCommunityShelves(shData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateTarget = async () => {
    try {
      await api.updateMyChallenge(newTarget);
      setEditingTarget(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeShelf = async (shelfId: string) => {
    try {
      const res = await api.likeCommunityShelf(shelfId);
      setCommunityShelves((prev) =>
        prev.map((s) => (s.id === shelfId ? { ...s, likes_count: res.likes_count } : s))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCommunityShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelfTitle.trim()) return;
    setSavingShelf(true);
    try {
      const tags = shelfTags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.createCommunityShelf({
        title: shelfTitle.trim(),
        description: shelfDesc.trim(),
        tags,
      });
      setShowCreateShelf(false);
      setShelfTitle('');
      setShelfDesc('');
      setShelfTags('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingShelf(false);
    }
  };

  const badgeIcons: Record<string, React.ReactNode> = {
    Crown: <Crown className="w-5 h-5 text-amber-500" />,
    Moon: <Moon className="w-5 h-5 text-sky-400" />,
    Sparkles: <Sparkles className="w-5 h-5 text-purple-400" />,
    Feather: <Feather className="w-5 h-5 text-emerald-400" />,
    Users: <Users className="w-5 h-5 text-rose-400" />,
  };

  return (
    <div className="space-y-10">
      {/* 1. Annual Reading Challenge Section */}
      <div className="rounded-3xl border border-amber-600/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-600" /> 2026 Annual Reading Challenge
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">
              Your Year in Literature
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-serif">
              Track your reading goal, maintain your daily streak, and unlock literary badges.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs font-bold shadow-sm">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{challenge?.streak_days || 18} Day Streak</span>
            </div>
            {editingTarget ? (
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={newTarget}
                  onChange={(e) => setNewTarget(parseInt(e.target.value) || 25)}
                  className="w-16 px-2 py-1 rounded-lg border border-border text-xs text-center"
                />
                <button
                  onClick={handleUpdateTarget}
                  className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTarget(true)}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted"
              >
                Edit Goal ({challenge?.target_books || 25} Books)
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-2 md:col-span-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-foreground">
                {challenge?.completed_books || 0} of {challenge?.target_books || 25} Books Finished
              </span>
              <span className="text-amber-600 font-bold">{challenge?.progress_pct || 0}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${challenge?.progress_pct || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground font-serif pt-1">
              Mark books as "Completed" on your bookshelf to automatically update your annual challenge progress.
            </p>
          </div>

          {/* Quick Challenge Status Card */}
          <div className="p-4 rounded-2xl bg-card border border-border flex items-center space-x-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Challenge Status
              </span>
              <span className="font-display font-bold text-base text-foreground block">
                {(challenge?.target_books || 25) - (challenge?.completed_books || 0) <= 0
                  ? 'Goal Reached! 🎉'
                  : `${(challenge?.target_books || 25) - (challenge?.completed_books || 0)} books remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Collectible Badges Row */}
        <div>
          <h4 className="font-display font-semibold text-base mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" /> Collectible Literary Badges
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {challenge?.badges.map((b) => (
              <div
                key={b.id}
                className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition ${
                  b.unlocked
                    ? 'border-amber-600/40 bg-card shadow-sm hover:scale-[1.02]'
                    : 'border-border/60 bg-muted/20 opacity-40'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto shadow-inner">
                  {badgeIcons[b.icon] || <Award className="w-5 h-5 text-amber-600" />}
                </div>
                <h5 className="font-display font-bold text-xs truncate text-foreground">{b.name}</h5>
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Community Curated Public Shelves Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-600" /> Community Curated Public Shelves
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-serif mt-0.5">
              Explore public reading anthologies crafted and shared by fellow Folio readers.
            </p>
          </div>

          <button
            onClick={() => {
              onRequireAuth('create and share custom public shelves', () => setShowCreateShelf(true));
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Public Shelf
          </button>
        </div>

        {/* Shelves Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {communityShelves.map((shelf) => (
            <div
              key={shelf.id}
              className="p-5 rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {shelf.curator_avatar ? (
                      <img src={shelf.curator_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-600/20 text-amber-700 text-[10px] font-bold flex items-center justify-center">
                        {shelf.curator_name.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-foreground">{shelf.curator_name}</span>
                  </div>

                  <button
                    onClick={() => handleLikeShelf(shelf.id)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-full border border-border text-xs text-rose-500 hover:bg-rose-500/10 transition"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    <span>{shelf.likes_count}</span>
                  </button>
                </div>

                <h4 className="font-display font-bold text-lg text-foreground line-clamp-1">
                  {shelf.title}
                </h4>
                <p className="text-xs text-muted-foreground font-serif line-clamp-2 leading-relaxed">
                  {shelf.description}
                </p>

                {/* Books in this Shelf (Horizontal stack) */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {shelf.books.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onOpenBook(b.id)}
                      className="aspect-book rounded-lg overflow-hidden bg-stone-900 border border-border/80 shadow-sm cursor-pointer hover:scale-105 transition"
                      title={b.title}
                    >
                      {b.cover_image && <img src={b.cover_image} alt="" className="w-full h-full object-cover" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex flex-wrap gap-1">
                  {shelf.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Public Shelf Modal */}
      {showCreateShelf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-display font-semibold text-xl">Create Curated Public Shelf</h3>
              <button onClick={() => setShowCreateShelf(false)} className="text-xs text-muted-foreground">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateCommunityShelf} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Shelf Title *
                </label>
                <input
                  type="text"
                  required
                  value={shelfTitle}
                  onChange={(e) => setShelfTitle(e.target.value)}
                  placeholder="e.g. Best Cyberpunk & Transhumanist Tales"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Description / Curator Note
                </label>
                <textarea
                  rows={3}
                  value={shelfDesc}
                  onChange={(e) => setShelfDesc(e.target.value)}
                  placeholder="Share what connects these books and why other readers should explore them..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Genre Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={shelfTags}
                  onChange={(e) => setShelfTags(e.target.value)}
                  placeholder="e.g. Cyberpunk, Noir, AI, Speculative"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateShelf(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingShelf}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow"
                >
                  {savingShelf ? 'Publishing...' : 'Publish to Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
