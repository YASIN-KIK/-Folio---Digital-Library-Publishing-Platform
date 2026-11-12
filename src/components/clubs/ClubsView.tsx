import React, { useState, useEffect } from 'react';
import {
  X, Users, BookOpen, MessageSquare, Send, Plus, CheckCircle2,
  Calendar, Layers, Sparkles
} from 'lucide-react';
import { Club, ClubThread, ClubComment } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface ClubDetailDialogProps {
  clubId: string;
  onClose: () => void;
  onOpenBook: (bookId: string) => void;
}

export const ClubDetailDialog: React.FC<ClubDetailDialogProps> = ({
  clubId,
  onClose,
  onOpenBook,
}) => {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<ClubThread | null>(null);
  const [comments, setComments] = useState<ClubComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // New thread modal
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadChapter, setThreadChapter] = useState('');
  const [threadContent, setThreadContent] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);

  const fetchClub = async () => {
    try {
      const data = await api.getClub(clubId);
      setClub(data);
      if (data.threads && data.threads.length > 0 && !selectedThread) {
        openThread(data.threads[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClub();
  }, [clubId]);

  const openThread = async (t: ClubThread) => {
    setSelectedThread(t);
    try {
      const commList = await api.getThreadComments(t.id);
      setComments(commList);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !newComment.trim()) return;
    setSendingComment(true);
    try {
      const added = await api.addThreadComment(selectedThread.id, newComment.trim());
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingComment(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadTitle.trim() || !threadContent.trim()) return;
    setCreatingThread(true);
    try {
      const created = await api.createThread(clubId, {
        title: threadTitle.trim(),
        chapter_ref: threadChapter.trim(),
        content: threadContent.trim(),
      });
      setShowNewThreadModal(false);
      setThreadTitle('');
      setThreadChapter('');
      setThreadContent('');
      await fetchClub();
      openThread(created);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingThread(false);
    }
  };

  const handleToggleJoin = async () => {
    try {
      const res = await api.joinClub(clubId);
      setClub((prev) =>
        prev
          ? {
              ...prev,
              is_member: res.is_member,
              member_count: res.is_member ? prev.member_count + 1 : Math.max(1, prev.member_count - 1),
            }
          : null
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !club) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-xl bg-card rounded-3xl p-8 border border-border shadow-2xl flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full" />
          <p className="text-sm font-serif text-muted-foreground">Opening reading club salon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Club Header Banner */}
        <div className="relative bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2 text-xs text-amber-300 font-semibold uppercase tracking-wider">
              <Users className="w-4 h-4" /> Reading Club Salon
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white">
              {club.name}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
              {club.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-stone-400 pt-1">
              <span>{club.member_count} Members</span>
              <span>•</span>
              <span>Host: {club.founder_name}</span>
            </div>
          </div>

          <button
            onClick={handleToggleJoin}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition shadow-lg shrink-0 ${
              club.is_member
                ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-rose-950/40 hover:text-rose-200'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {club.is_member ? 'Joined ✓' : 'Join Reading Club'}
          </button>
        </div>

        {/* Book of the Month Highlight Bar */}
        {club.book_title && (
          <div className="px-6 py-3 bg-amber-500/10 border-b border-border flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-semibold text-[10px] uppercase tracking-wider">
                Book of the Month
              </span>
              <span className="font-semibold text-foreground font-display text-sm">{club.book_title}</span>
              <span className="text-muted-foreground">({club.book_genre})</span>
            </div>
            {club.book_of_the_month_id && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBook(club.book_of_the_month_id!);
                }}
                className="text-amber-700 dark:text-amber-300 font-medium hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" /> Read with Club →
              </button>
            )}
          </div>
        )}

        {/* Main Content Layout: Thread List on Left, Thread & Comments on Right */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Threads Column */}
          <div className="w-full md:w-80 border-r border-border bg-muted/20 flex flex-col shrink-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                Chapter Discussions
              </span>
              <button
                onClick={() => setShowNewThreadModal(true)}
                className="p-1.5 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> New Thread
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[220px] md:max-h-none">
              {club.threads && club.threads.length > 0 ? (
                club.threads.map((t) => {
                  const isSelected = selectedThread?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => openThread(t)}
                      className={`p-3 rounded-2xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-amber-600/40 bg-card shadow-sm text-foreground'
                          : 'border-border/60 hover:bg-card/60 text-muted-foreground'
                      }`}
                    >
                      {t.chapter_ref && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 block mb-0.5">
                          {t.chapter_ref}
                        </span>
                      )}
                      <h4 className="font-display font-semibold text-xs sm:text-sm line-clamp-1 text-foreground">
                        {t.title}
                      </h4>
                      <p className="text-[11px] line-clamp-2 mt-1 leading-normal opacity-80">
                        {t.content}
                      </p>
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/40 text-[10px] opacity-60">
                        <span>{t.author_name}</span>
                        <span>{t.comment_count} replies</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No discussions started yet. Start one!
                </div>
              )}
            </div>
          </div>

          {/* Active Thread & Comments Conversation */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-card justify-between space-y-6">
            {selectedThread ? (
              <div className="space-y-6">
                {/* Thread OP Header */}
                <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                      {selectedThread.chapter_ref || 'General Club Discussion'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(selectedThread.created_at * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-xl leading-tight">
                    {selectedThread.title}
                  </h3>
                  <p className="text-sm font-serif leading-relaxed text-foreground/90 pt-1">
                    {selectedThread.content}
                  </p>
                  <div className="pt-2 flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>Started by <strong className="text-foreground">{selectedThread.author_name}</strong></span>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reader Comments ({comments.length})
                  </h4>

                  {comments.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground font-serif">
                      No comments yet. Share your thoughts on this chapter!
                    </div>
                  ) : (
                    comments.map((cm) => (
                      <div
                        key={cm.id}
                        className="p-3.5 rounded-2xl border border-border/70 bg-muted/15 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">{cm.author_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(cm.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-serif text-foreground/90 leading-relaxed">
                          {cm.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handlePostComment} className="pt-4 border-t border-border flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Contribute to this chapter discussion..."
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                  <button
                    type="submit"
                    disabled={sendingComment || !newComment.trim()}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow transition flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground text-sm font-serif">
                Select a thread on the left to read and reply.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-display font-semibold text-xl">Start Chapter Discussion</h3>
              <button onClick={() => setShowNewThreadModal(false)} className="text-xs text-muted-foreground">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Chapter Reference (Optional)
                </label>
                <input
                  type="text"
                  value={threadChapter}
                  onChange={(e) => setThreadChapter(e.target.value)}
                  placeholder="e.g. Chapter 3: Beneath the Charles Bridge"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Discussion Title *
                </label>
                <input
                  type="text"
                  required
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  placeholder="e.g. What does the celestial equation symbolize?"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Topic Prompt / Question *
                </label>
                <textarea
                  rows={4}
                  required
                  value={threadContent}
                  onChange={(e) => setThreadContent(e.target.value)}
                  placeholder="Share a passage, question, or reaction to discuss with club members..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingThread}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow"
                >
                  {creatingThread ? 'Posting...' : 'Create Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const ClubsView: React.FC<{ onOpenBook: (bookId: string) => void }> = ({ onOpenBook }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  // Create club modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubDesc, setClubDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const list = await api.getClubs();
      setClubs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim() || !clubDesc.trim()) return;
    setCreating(true);
    try {
      const res = await api.createClub({
        name: clubName.trim(),
        description: clubDesc.trim(),
        cover_image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&auto=format&fit=crop&q=80',
      });
      setShowCreateModal(false);
      setClubName('');
      setClubDesc('');
      await fetchClubs();
      setSelectedClubId(res.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">
            Reading Clubs & Salons
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-serif mt-1">
            Read together chapter-by-chapter, discuss plot twists, and vote on monthly selections.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm shadow-md transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Start Reading Club
        </button>
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3 opacity-60">
          <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm font-serif">Summoning reading salons...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clubs.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedClubId(c.id)}
              className="group bg-card rounded-3xl border border-border/80 hover:border-amber-600/40 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                    {c.member_count} Members
                  </span>
                  {c.is_member && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Member
                    </span>
                  )}
                </div>

                <h3 className="font-display font-semibold text-xl group-hover:text-amber-600 transition">
                  {c.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-serif line-clamp-2 leading-relaxed">
                  {c.description}
                </p>

                {/* Book of the Month Card */}
                {c.book_title && (
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 flex items-center space-x-3">
                    <div className="w-10 aspect-book rounded overflow-hidden bg-stone-900 shrink-0">
                      {c.book_cover ? (
                        <img src={c.book_cover} alt={c.book_title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-500">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">
                        Current Read
                      </span>
                      <span className="text-xs font-medium truncate block">{c.book_title}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Hosted by <strong>{c.founder_name}</strong></span>
                <span className="text-amber-600 font-medium group-hover:underline flex items-center gap-1">
                  Enter Salon →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Club Modal */}
      {selectedClubId && (
        <ClubDetailDialog
          clubId={selectedClubId}
          onClose={() => {
            setSelectedClubId(null);
            fetchClubs();
          }}
          onOpenBook={onOpenBook}
        />
      )}

      {/* Create Club Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-display font-semibold text-2xl">Start a Reading Club</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-xs text-muted-foreground">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="e.g. The Victorian Alchemists Society"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Description & Reading Focus *
                </label>
                <textarea
                  rows={3}
                  required
                  value={clubDesc}
                  onChange={(e) => setClubDesc(e.target.value)}
                  placeholder="Describe the genres, themes, and meeting frequency of your club..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow"
                >
                  {creating ? 'Creating...' : 'Launch Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
