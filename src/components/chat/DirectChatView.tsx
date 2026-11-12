import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Search, Users, UserPlus, Check, Sparkles,
  Clock, Shield, BookOpen, Coffee, Smile, ChevronRight
} from 'lucide-react';
import { ChatContact, DirectMessage, User } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface DirectChatViewProps {
  currentUser: User;
  initialPartnerId?: string | null;
  onOpenBook?: (bookId: string) => void;
}

export const DirectChatView: React.FC<DirectChatViewProps> = ({
  currentUser,
  initialPartnerId,
  onOpenBook,
}) => {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [friendActionNotice, setFriendActionNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContacts = async (selectId?: string) => {
    setLoadingContacts(true);
    try {
      const list = await api.getChatContacts();
      setContacts(list);

      const targetId = selectId || initialPartnerId;
      if (targetId) {
        const found = list.find((c) => c.id === targetId);
        if (found) {
          selectPartner(found);
        } else if (list.length > 0) {
          selectPartner(list[0]);
        }
      } else if (list.length > 0 && !selectedContact) {
        selectPartner(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [initialPartnerId]);

  const selectPartner = async (contact: ChatContact) => {
    setSelectedContact(contact);
    setLoadingMessages(true);
    try {
      const data = await api.getChatMessages(contact.id);
      setMessages(data.messages);
      // Mark unread as 0 in local contact list
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, unread_count: 0 } : c))
      );
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const msg = await api.sendDirectMessage(selectedContact.id, textToSend);
      setMessages((prev) => [...prev, msg]);
      setTimeout(scrollToBottom, 50);

      // Update contact's last message in list
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContact.id
            ? {
                ...c,
                last_message: {
                  message: textToSend,
                  created_at: Math.floor(Date.now() / 1000),
                  sender_id: currentUser.id,
                },
              }
            : c
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAddFriend = async (targetId: string) => {
    try {
      const res = await api.sendFriendRequest(targetId);
      setFriendActionNotice(res.message || 'Friend request sent!');
      setTimeout(() => setFriendActionNotice(null), 3000);
      setContacts((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, is_friend: true } : c))
      );
      if (selectedContact?.id === targetId) {
        setSelectedContact({ ...selectedContact, is_friend: true });
      }
    } catch (err: any) {
      alert(err.message || 'Could not send friend request');
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const QUICK_STARTERS = [
    "What chapter are you currently reading?",
    "Would love your thoughts on my novel draft!",
    "Are you joining the next reading club salon?",
    "Your review on The Clockwork Alchemist was spot on!"
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">
            Reader Dialogues & Community Chat
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-serif mt-1">
            Exchange direct thoughts with authors, connect with fellow book lovers, and build lasting literary friendships.
          </p>
        </div>
      </div>

      {friendActionNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {friendActionNotice}
        </div>
      )}

      {/* Main Dual-Pane Chat Layout */}
      <div className="h-[650px] bg-card rounded-3xl border border-border shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Contacts Drawer */}
        <div className="w-full md:w-80 border-r border-border flex flex-col bg-muted/20 shrink-0">
          {/* Search Contacts Bar */}
          <div className="p-4 border-b border-border bg-card/60">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search readers & authors..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingContacts ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <div className="animate-spin w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-2" />
                Loading community members...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-serif">
                No matching members found.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;
                return (
                  <div
                    key={contact.id}
                    onClick={() => selectPartner(contact)}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-amber-600/40 bg-card shadow-sm text-foreground'
                        : 'border-transparent hover:bg-card/70 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate mr-2">
                      <div className="relative shrink-0">
                        <img
                          src={contact.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {contact.is_friend && (
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card"
                            title="Connected Friend"
                          />
                        )}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-xs truncate text-foreground">
                            {contact.display_name}
                          </span>
                          {contact.role === 'admin' && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-bold uppercase">
                              Admin
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] truncate opacity-75 mt-0.5">
                          {contact.last_message?.message || contact.bio || `@${contact.username}`}
                        </p>
                      </div>
                    </div>

                    {contact.unread_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-bold text-[10px] shrink-0">
                        {contact.unread_count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Surface */}
        <div className="flex-1 flex flex-col bg-background justify-between overflow-hidden">
          {selectedContact ? (
            <>
              {/* Active Conversation Header */}
              <div className="px-6 py-3.5 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 truncate">
                  <img
                    src={selectedContact.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-display font-semibold text-base leading-tight truncate text-foreground">
                        {selectedContact.display_name}
                      </h3>
                      <span className="text-[10px] text-muted-foreground">@{selectedContact.username}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-serif">
                      {selectedContact.bio || 'Literary enthusiast'}
                    </p>
                  </div>
                </div>

                {/* Friend Status Action Button */}
                <div className="flex items-center space-x-2 shrink-0">
                  {selectedContact.is_friend ? (
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Friends
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddFriend(selectedContact.id)}
                      className="px-3 py-1.5 rounded-xl border border-amber-600/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {loadingMessages ? (
                  <div className="py-20 text-center text-xs text-muted-foreground">
                    <div className="animate-spin w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-2" />
                    Fetching transcript...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-amber-600/10 text-amber-600 flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-base">Begin the Dialogue</h4>
                      <p className="text-xs text-muted-foreground font-serif mt-1">
                        Start a conversation with {selectedContact.display_name}.
                      </p>
                    </div>

                    {/* Quick Starters */}
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Conversation Starters
                      </span>
                      {QUICK_STARTERS.map((st, i) => (
                        <button
                          key={i}
                          onClick={() => setInputText(st)}
                          className="w-full text-left p-2 rounded-xl bg-muted/40 hover:bg-muted text-[11px] text-foreground transition"
                        >
                          "{st}"
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === currentUser.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex items-end space-x-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={selectedContact.avatar_url}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                          />
                        )}

                        <div
                          className={`max-w-[78%] rounded-2xl p-3.5 text-xs sm:text-sm font-serif leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-amber-600 text-white rounded-br-none'
                              : 'bg-muted/60 text-foreground border border-border/80 rounded-bl-none'
                          }`}
                        >
                          <p>{m.message}</p>
                          <span
                            className={`block text-[10px] text-right mt-1 font-sans ${
                              isMe ? 'text-white/70' : 'text-muted-foreground'
                            }`}
                          >
                            {new Date(m.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-border bg-card/80 backdrop-blur-sm flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Write a message to ${selectedContact.display_name}...`}
                  className="flex-1 rounded-2xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />

                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-md transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground font-serif">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm">Select a contact to begin chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
