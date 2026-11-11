import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Check, X, BookOpen, Star, Sparkles, MessageCircle, Heart, ArrowRight
} from 'lucide-react';
import { ActivityItem } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface ActivitySocialViewProps {
  onOpenBook: (bookId: string) => void;
}

export const ActivitySocialView: React.FC<ActivitySocialViewProps> = ({ onOpenBook }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends'>('feed');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [friendsData, setFriendsData] = useState<{ friends: any[]; pending_received: any[]; suggested: any[] }>({
    friends: [],
    pending_received: [],
    suggested: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feed, fr] = await Promise.all([
        api.getActivity(),
        api.getFriends(),
      ]);
      setActivities(feed);
      setFriendsData(fr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendRequest = async (targetId: string) => {
    try {
      await api.sendFriendRequest(targetId);
      // Remove from suggested or mark sent
      setFriendsData((prev) => ({
        ...prev,
        suggested: prev.suggested.filter((s) => s.id !== targetId),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespond = async (requesterId: string, action: 'accept' | 'decline') => {
    try {
      await api.respondFriendRequest(requesterId, action);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const formatActivityText = (act: ActivityItem) => {
    switch (act.activity_type) {
      case 'published_book':
        return (
          <span>
            published a new book:{' '}
            <strong
              onClick={() => onOpenBook(act.entity_id)}
              className="text-amber-600 hover:underline cursor-pointer"
            >
              {act.entity_title}
            </strong>
          </span>
        );
      case 'wrote_review':
        return (
          <span>
            reviewed{' '}
            <strong
              onClick={() => onOpenBook(act.entity_id)}
              className="text-amber-600 hover:underline cursor-pointer"
            >
              {act.entity_title}
            </strong>{' '}
            ({act.metadata?.rating} ★)
          </span>
        );
      case 'completed_chapter':
        return (
          <span>
            completed reading <strong>{act.entity_title}</strong>
          </span>
        );
      case 'started_book':
        return (
          <span>
            began reading{' '}
            <strong
              onClick={() => onOpenBook(act.entity_id)}
              className="text-amber-600 hover:underline cursor-pointer"
            >
              {act.entity_title}
            </strong>
          </span>
        );
      default:
        return <span>interacted with <strong>{act.entity_title}</strong></span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">
            Literary Community & Activity
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-serif mt-1">
            See what your friends are reading, celebrate newly published chapters, and connect with fellow bibliophiles.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition ${
              activeTab === 'feed'
                ? 'border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            Activity Feed
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border transition flex items-center gap-1.5 ${
              activeTab === 'friends'
                ? 'border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends ({friendsData.friends.length})</span>
            {friendsData.pending_received.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-600" />
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3 opacity-60">
          <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm font-serif">Checking the literary grapevine...</p>
        </div>
      ) : activeTab === 'feed' ? (
        /* Activity Feed Stream */
        <div className="max-w-2xl mx-auto space-y-4">
          {activities.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm font-serif">
              No recent activity found. Connect with friends to see their reading milestones!
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm hover:shadow-md transition flex space-x-4 items-start"
              >
                {/* User avatar */}
                {act.avatar_url ? (
                  <img
                    src={act.avatar_url}
                    alt={act.display_name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-600/20 text-amber-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {act.display_name.charAt(0)}
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{act.display_name}</span>
                    <span>{new Date(act.created_at * 1000).toLocaleDateString()}</span>
                  </div>

                  <p className="text-xs sm:text-sm font-serif text-foreground/90 leading-relaxed">
                    {formatActivityText(act)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Friends & Requests Layout */
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Pending Requests */}
          {friendsData.pending_received.length > 0 && (
            <div className="p-6 rounded-3xl border border-amber-600/30 bg-amber-500/5 space-y-4">
              <h3 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-600" /> Pending Friend Requests ({friendsData.pending_received.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friendsData.pending_received.map((req) => (
                  <div
                    key={req.friendship_id}
                    className="p-3 rounded-2xl bg-card border border-border flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 truncate mr-2">
                      {req.avatar_url && (
                        <img src={req.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="text-xs font-semibold block truncate">{req.display_name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">@{req.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleRespond(req.id, 'accept')}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        title="Accept"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'decline')}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition"
                        title="Decline"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Friends */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-foreground">
              Your Friends ({friendsData.friends.length})
            </h3>

            {friendsData.friends.length === 0 ? (
              <p className="text-xs text-muted-foreground font-serif">No friends connected yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friendsData.friends.map((fr) => (
                  <div
                    key={fr.id}
                    className="p-4 rounded-2xl border border-border bg-card flex items-start space-x-3"
                  >
                    {fr.avatar_url && (
                      <img src={fr.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold text-sm">{fr.display_name}</h4>
                      <p className="text-[11px] text-muted-foreground font-serif line-clamp-2">
                        {fr.bio || 'Avid reader and Folio member.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggested Bibliophiles */}
          {friendsData.suggested.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-display font-semibold text-lg text-foreground">
                Readers You May Know
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friendsData.suggested.map((sug) => (
                  <div
                    key={sug.id}
                    className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 truncate mr-2">
                      {sug.avatar_url && (
                        <img src={sug.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-semibold text-sm block truncate">{sug.display_name}</span>
                        <span className="text-[11px] text-muted-foreground block truncate">@{sug.username}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendRequest(sug.id)}
                      className="px-3 py-1.5 rounded-xl border border-amber-600/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-xs font-medium transition flex items-center gap-1 shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
