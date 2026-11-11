import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Users, BookOpen, FileText, CheckCircle2, XCircle,
  AlertTriangle, Search, Filter, Shield, Key, Eye, Clock, MessageSquare,
  Sparkles, Check, RefreshCw
} from 'lucide-react';
import { AdminStats, User, Book } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface AdminDashboardProps {
  currentUser: User;
  onOpenBook: (bookId: string) => void;
  onStartChatWithUser?: (userId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onOpenBook,
  onStartChatWithUser,
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'books' | 'overview'>('overview');
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [bookSearch, setBookSearch] = useState('');
  const [bookStatusFilter, setBookStatusFilter] = useState('all');

  // Updating feedback
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, booksData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getBooks({}),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setBooks(booksData);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateAccess = async (userId: string, newStatus: 'granted' | 'pending' | 'revoked', newRole?: string) => {
    setUpdatingId(userId);
    try {
      const res = await api.updateUserAccess(userId, {
        access_status: newStatus,
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, access_status: newStatus, role: (newRole || u.role) as any } : u))
      );
      setNotice(`Access for ${res.user.display_name} updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update user access');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'assistant' | 'author' | 'reader') => {
    setUpdatingId(userId);
    try {
      const user = users.find((u) => u.id === userId);
      await api.updateUserAccess(userId, {
        access_status: user?.access_status || 'granted',
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
      );
      setNotice(`Role updated to ${newRole.toUpperCase()}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAppointAssistant = async (userId: string, makeAssistant: boolean) => {
    setUpdatingId(userId);
    try {
      if (makeAssistant) {
        const res = await api.appointAssistant(userId);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: 'assistant', access_status: 'granted' } : u))
        );
        setNotice(`${res.user.display_name} has been appointed as Platform Assistant! 🛡️`);
      } else {
        await api.updateUserAccess(userId, { access_status: 'granted', role: 'author' });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: 'author' } : u))
        );
        setNotice(`Assistant role revoked.`);
      }
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Could not appoint assistant');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleModerateBook = async (bookId: string, status: string) => {
    try {
      await api.updateBookStatusAdmin(bookId, status);
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, status: status as any } : b))
      );
      setNotice(`Manuscript status set to ${status}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update book');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.display_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.access_status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      (b.author_name || '').toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.genre.toLowerCase().includes(bookSearch.toLowerCase());
    const matchesStatus = bookStatusFilter === 'all' || b.status === bookStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Admin Top Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-6 sm:p-10 text-white shadow-2xl overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Platform Governance & Administration
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-white">
            Admin Master Console
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
            Welcome, <strong>{currentUser.display_name}</strong> ({currentUser.email}). Manage user permissions, grant or revoke platform publishing rights, moderate manuscripts, and monitor network health.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={loadAdminData}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Global Toast Notice */}
      {notice && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {notice}
          </span>
          <button onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Users</span>
            <Users className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-display font-bold text-foreground">
            {stats?.total_users ?? users.length}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">100% active</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Manuscripts</span>
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-display font-bold text-foreground">
            {stats?.total_books ?? books.length}
          </div>
          <span className="text-[10px] text-muted-foreground">{stats?.published_books ?? 0} published</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Words Inscribed</span>
            <FileText className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-display font-bold text-foreground">
            {stats?.total_words ? stats.total_words.toLocaleString() : '4,200'}
          </div>
          <span className="text-[10px] text-muted-foreground">Across {stats?.total_chapters ?? 12} chapters</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Reading Clubs</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-display font-bold text-foreground">
            {stats?.total_clubs ?? 2}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Active salons</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Reader Reviews</span>
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-display font-bold text-foreground">
            {stats?.total_reviews ?? 4}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">4.9 avg rating</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Direct Chats</span>
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-display font-bold text-foreground">
            {stats?.total_messages ?? 5}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Live dialogues</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border border-amber-600/30'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Overview & Governance
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border border-amber-600/30'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> User Access Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('books')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'books'
              ? 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border border-amber-600/30'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Manuscript Moderation ({books.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Grant Access Summary Card */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" /> Access Control Guidelines
            </h3>
            <p className="text-xs text-muted-foreground font-serif leading-relaxed">
              As an administrator, you possess full sovereignty over the platform's user permissions.
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                <strong>Granted:</strong> User can write manuscripts, publish chapters, submit reviews, and create reading clubs without restrictions.
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200">
                <strong>Pending:</strong> User is under initial review; can read library books, but new publications require moderator confirmation.
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-200">
                <strong>Revoked:</strong> Access is suspended; account cannot publish or post comments in salons.
              </div>
            </div>
            <button
              onClick={() => setActiveTab('users')}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow transition"
            >
              Manage User Access Now →
            </button>
          </div>

          {/* Platform Administrator Profile Card */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" /> Current Superadmin Account
              </h3>
              <div className="mt-4 flex items-center space-x-4 p-4 rounded-2xl bg-muted/40 border border-border">
                <img
                  src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover shadow border-2 border-amber-600"
                />
                <div>
                  <h4 className="font-display font-semibold text-base">{currentUser.display_name}</h4>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  <p className="text-xs text-amber-600 italic mt-1 font-serif">"{currentUser.bio}"</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Security Level: <strong>Full Admin Control</strong></span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-[10px] uppercase">
                Active Session
              </span>
            </div>
          </div>

          {/* Appointed Platform Assistants Card */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-600" /> Appointed Platform Assistants ({users.filter(u => u.role === 'assistant').length})
                </h3>
                <p className="text-xs text-muted-foreground font-serif">
                  Users appointed by Admin Yasin Kik with delegated moderation authority.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('users')}
                className="px-3 py-1.5 rounded-xl border border-border text-xs hover:bg-muted font-medium transition"
              >
                Manage in User Directory →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {users.filter(u => u.role === 'assistant').length === 0 ? (
                <div className="p-4 rounded-2xl bg-muted/20 border border-dashed border-border text-xs text-muted-foreground text-center col-span-3">
                  No assistants currently appointed. You can appoint any author as an Assistant from the User Directory tab.
                </div>
              ) : (
                users.filter(u => u.role === 'assistant').map(asst => (
                  <div key={asst.id} className="p-3.5 rounded-2xl border border-sky-500/30 bg-sky-500/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3 truncate mr-2">
                      <img src={asst.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-xs text-foreground block truncate">{asst.display_name}</span>
                        <span className="text-[10px] text-sky-700 dark:text-sky-300 font-bold block uppercase">🛡️ Platform Assistant</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAppointAssistant(asst.id, false)}
                      className="text-[10px] text-muted-foreground hover:text-rose-600 px-2 py-1 rounded hover:bg-rose-500/10 shrink-0"
                      title="Revoke Assistant"
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER ACCESS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* User Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="assistant">🛡️ Assistants</option>
                <option value="author">Authors</option>
                <option value="reader">Readers</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs"
              >
                <option value="all">All Access</option>
                <option value="granted">Granted</option>
                <option value="pending">Pending</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Access Status</th>
                    <th className="py-3 px-4">Works</th>
                    <th className="py-3 px-4 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    return (
                      <tr key={u.id} className="hover:bg-muted/20 transition">
                        <td className="py-3.5 px-4 flex items-center space-x-3">
                          <img
                            src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {u.display_name}
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px]">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{u.email}</div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            disabled={isSelf || updatingId === u.id}
                            value={u.role || 'author'}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                            className="px-2 py-1 rounded-lg border border-border bg-background text-[11px] font-medium"
                          >
                            <option value="admin">Admin</option>
                            <option value="assistant">🛡️ Assistant</option>
                            <option value="author">Author</option>
                            <option value="reader">Reader</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            u.access_status === 'granted'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : u.access_status === 'pending'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                          }`}>
                            {u.access_status === 'granted' && <CheckCircle2 className="w-3 h-3" />}
                            {u.access_status === 'pending' && <AlertTriangle className="w-3 h-3" />}
                            {u.access_status === 'revoked' && <XCircle className="w-3 h-3" />}
                            {u.access_status || 'granted'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground">
                          {u.books_count ?? 0} books
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {onStartChatWithUser && !isSelf && (
                              <button
                                onClick={() => onStartChatWithUser(u.id)}
                                className="px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted text-[11px] font-medium"
                              >
                                Chat
                              </button>
                            )}

                            {!isSelf && (
                              <>
                                {u.role === 'assistant' ? (
                                  <button
                                    onClick={() => handleAppointAssistant(u.id, false)}
                                    disabled={updatingId === u.id}
                                    className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-[11px] font-semibold hover:bg-sky-500/25"
                                    title="Revoke Assistant role"
                                  >
                                    🛡️ Assistant ✓
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAppointAssistant(u.id, true)}
                                    disabled={updatingId === u.id}
                                    className="px-2.5 py-1 rounded-lg border border-sky-600/40 text-sky-700 dark:text-sky-300 hover:bg-sky-500/10 text-[11px] font-medium"
                                    title="Appoint as Platform Assistant"
                                  >
                                    Appoint Assistant
                                  </button>
                                )}

                                {u.access_status !== 'granted' ? (
                                  <button
                                    onClick={() => handleUpdateAccess(u.id, 'granted')}
                                    disabled={updatingId === u.id}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium shadow-sm"
                                  >
                                    Grant Access
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateAccess(u.id, 'revoked')}
                                    disabled={updatingId === u.id}
                                    className="px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-[11px] font-medium"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANUSCRIPT MODERATION */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Search manuscripts by title, author, or genre..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <select
              value={bookStatusFilter}
              onChange={(e) => setBookStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="in_review">In Review</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex space-x-3">
                  <div className="w-16 aspect-book rounded-lg overflow-hidden bg-stone-900 shrink-0">
                    {b.cover_image && (
                      <img src={b.cover_image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1 truncate">
                    <span className="text-[10px] uppercase font-semibold text-amber-600 block">
                      {b.genre}
                    </span>
                    <h4 className="font-display font-semibold text-sm truncate text-foreground">
                      {b.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      By {b.author_name}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    b.status === 'published'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  }`}>
                    {b.status}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onOpenBook(b.id)}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                      title="Inspect Folio"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {b.status !== 'published' ? (
                      <button
                        onClick={() => handleModerateBook(b.id, 'published')}
                        className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-medium"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleModerateBook(b.id, 'draft')}
                        className="px-2 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted text-[11px]"
                      >
                        Unpublish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
