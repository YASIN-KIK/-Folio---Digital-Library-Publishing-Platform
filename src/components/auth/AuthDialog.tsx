import React, { useState } from 'react';
import {
  X, BookOpen, KeyRound, Mail, User, Lock, ArrowRight, Sparkles, CheckCircle2
} from 'lucide-react';
import { api, setStoredUserId } from '@/lib/libraryClient';
import { User as UserType } from '@/types/library';

interface AuthDialogProps {
  currentUser?: UserType | null;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  onSignOut?: () => void;
  onOpenForgotPassword: () => void;
  customReason?: string | null;
}

const DEMO_PERSONAS = [
  {
    id: 'usr_yasin',
    name: 'Yasin Kik',
    role: '👑 System Administrator & Author',
    email: 'yasinkik@outlook.com',
    password: 'YASINKIK01',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'I will write the whole in a book',
  },
  {
    id: 'usr_elena',
    name: 'Elena Vance',
    role: 'Author (Speculative Fiction)',
    email: 'elena.vance@folio.read',
    password: 'demo123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Speculative fiction author and archivist.',
  },
  {
    id: 'usr_marcus',
    name: 'Marcus Reed',
    role: 'Club Host & Reviewer',
    email: 'marcus.reed@folio.read',
    password: 'demo123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Essayist and historical fiction enthusiast.',
  },
  {
    id: 'usr_aria',
    name: 'Aria Thorne',
    role: 'Cyberpunk Author',
    email: 'aria.thorne@folio.read',
    password: 'demo123',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Cyberpunk worldbuilder and poet.',
  },
];

export const AuthDialog: React.FC<AuthDialogProps> = ({
  currentUser,
  onClose,
  onSuccess,
  onSignOut,
  onOpenForgotPassword,
  customReason,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const res = await api.login({ email, password });
        setStoredUserId(res.user.id);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.signup({
          email,
          password,
          username: username || email.split('@')[0],
          display_name: displayName || email.split('@')[0],
          bio,
        });
        setStoredUserId(res.user.id);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (persona: typeof DEMO_PERSONAS[0]) => {
    setStoredUserId(persona.id);
    try {
      const user = await api.getCurrentUser();
      onSuccess(user);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 text-foreground transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Pane (Editorial Literary branding & Demo Switcher) */}
        <div className="w-full md:w-5/12 bg-gradient-to-b from-stone-900 via-stone-900 to-amber-950 p-6 sm:p-8 text-white flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <BookOpen className="w-6 h-6" />
              <span className="font-display font-semibold text-lg tracking-wider">FOLIO</span>
            </div>
            <h3 className="font-display font-semibold text-2xl leading-snug">
              Enter the Literary Republic
            </h3>
            <p className="text-xs text-stone-300 font-serif leading-relaxed">
              Publish your stories, join immersive chapter discussions with book clubs, and build your digital bookshelf.
            </p>
          </div>

          {/* Quick Demo Personas */}
          <div className="space-y-2.5 pt-4 border-t border-white/10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
              Instant 1-Click Demo Accounts
            </span>
            <div className="space-y-1.5">
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickSwitch(p)}
                  className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition flex items-center space-x-2.5 group"
                >
                  <img src={p.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div className="truncate flex-1">
                    <span className="text-xs font-semibold block text-white group-hover:text-amber-300 transition">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-stone-300 block truncate">{p.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane (Form) */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Contextual Notice */}
            {customReason && !currentUser && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{customReason}</span>
              </div>
            )}

            {/* If Already Signed In: Show Account Summary & Sign Out */}
            {currentUser ? (
              <div className="space-y-6">
                <div className="pb-4 border-b border-border">
                  <h3 className="font-display font-semibold text-xl text-foreground">
                    Current Account Session
                  </h3>
                  <p className="text-xs text-muted-foreground font-serif">
                    You are currently authenticated in Folio.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center space-x-3.5">
                  <img
                    src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-600"
                  />
                  <div className="truncate flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-foreground">{currentUser.display_name}</span>
                      <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase">
                        {currentUser.role === 'admin' ? '👑 Admin' : currentUser.role || 'Author'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground block truncate">{currentUser.email}</span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 italic block mt-0.5 font-serif">
                      "{currentUser.bio || 'Literary member'}"
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSignOut) onSignOut();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2"
                  >
                    <span>Sign Out of Folio</span>
                  </button>

                  <div className="text-center">
                    <span className="text-[11px] text-muted-foreground">
                      Or switch to another account below:
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {!currentUser && (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                      }}
                      className={`text-sm font-semibold pb-1 border-b-2 transition ${
                        mode === 'signin'
                          ? 'border-amber-600 text-amber-700 dark:text-amber-300'
                          : 'border-transparent text-muted-foreground'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setError(null);
                      }}
                      className={`text-sm font-semibold pb-1 border-b-2 transition ${
                        mode === 'signup'
                          ? 'border-amber-600 text-amber-700 dark:text-amber-300'
                          : 'border-transparent text-muted-foreground'
                      }`}
                    >
                      Create Free Account
                    </button>
                  </div>
                </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Elena Vance"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. elenavance"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenForgotPassword();
                      }}
                      className="text-xs text-amber-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Bio (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell other readers about your literary interests..."
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 mt-4"
              >
                {loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Folio' : 'Create Free Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            </>
            )}
          </div>

          <div className="pt-6 text-center text-[11px] text-muted-foreground">
            Protected by end-to-end token encryption and secure credential hashing.
          </div>
        </div>
      </div>
    </div>
  );
};
