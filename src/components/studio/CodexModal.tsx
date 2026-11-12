import React, { useState, useEffect } from 'react';
import {
  X, Compass, Users, MapPin, Shield, Sparkles, Plus, Trash2, Search, Filter, BookOpen
} from 'lucide-react';
import { CodexEntry, CodexGroup } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface CodexModalProps {
  bookId: string;
  bookTitle: string;
  isAuthor?: boolean;
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({
  bookId,
  bookTitle,
  isAuthor = false,
  onClose,
}) => {
  const [codex, setCodex] = useState<CodexGroup | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'character' | 'location' | 'faction' | 'artifact'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New entry form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'character' | 'location' | 'faction' | 'artifact'>('character');
  const [description, setDescription] = useState('');
  const [traitsInput, setTraitsInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCodex = async () => {
    setLoading(true);
    try {
      const data = await api.getBookCodex(bookId);
      setCodex(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodex();
  }, [bookId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    setSaving(true);
    try {
      const traits = traitsInput.split(',').map((t) => t.trim()).filter(Boolean);
      await api.createCodexEntry(bookId, {
        name: name.trim(),
        category,
        description: description.trim(),
        traits,
        image_url: imageUrl.trim() || undefined,
      });
      setShowAddModal(false);
      setName('');
      setDescription('');
      setTraitsInput('');
      setImageUrl('');
      await fetchCodex();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this lore entry?')) return;
    try {
      await api.deleteCodexEntry(id);
      await fetchCodex();
    } catch (err) {
      console.error(err);
    }
  };

  const getAllEntries = (): CodexEntry[] => {
    if (!codex) return [];
    if (activeCategory === 'all') {
      return [...codex.character, ...codex.location, ...codex.faction, ...codex.artifact];
    }
    return codex[activeCategory] || [];
  };

  const filteredEntries = getAllEntries().filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
  );

  const categoryIcons = {
    character: <Users className="w-4 h-4 text-amber-600" />,
    location: <MapPin className="w-4 h-4 text-emerald-600" />,
    faction: <Shield className="w-4 h-4 text-sky-600" />,
    artifact: <Sparkles className="w-4 h-4 text-purple-600" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 text-foreground transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" /> Worldbuilding Codex & Lore Bible
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white">
              {bookTitle} — Codex
            </h2>
            <p className="text-xs text-stone-300 font-serif mt-1">
              Encyclopedia of characters, ancestral locations, secretive factions, and arcane artifacts.
            </p>
          </div>

          {isAuthor && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Lore Entry
            </button>
          )}
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-muted/30 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            {(['all', 'character', 'location', 'faction', 'artifact'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl capitalize font-medium border transition shrink-0 ${
                  activeCategory === cat
                    ? 'border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat === 'all' ? 'All Lore' : `${cat}s`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter lore entries..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        </div>

        {/* Entries Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-20 text-center opacity-60">
              <div className="animate-spin w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-xs font-serif">Consulting the archives...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-2">
              <Compass className="w-10 h-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-serif">No codex entries found for this category.</p>
              {isAuthor && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-xs text-amber-600 hover:underline"
                >
                  Create the first lore entry →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex space-x-3 items-start">
                    {entry.image_url ? (
                      <img
                        src={entry.image_url}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-border shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        {categoryIcons[entry.category] || <BookOpen className="w-5 h-5" />}
                      </div>
                    )}

                    <div className="flex-1 space-y-1 truncate">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          {entry.category}
                        </span>
                        {isAuthor && (
                          <button
                            onClick={(e) => handleDelete(entry.id, e)}
                            className="p-1 text-muted-foreground hover:text-rose-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <h4 className="font-display font-semibold text-base text-foreground truncate">
                        {entry.name}
                      </h4>
                      <p className="text-xs text-muted-foreground font-serif line-clamp-2 leading-relaxed">
                        {entry.description}
                      </p>
                    </div>
                  </div>

                  {/* Traits Badges */}
                  {entry.traits && entry.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-border/50">
                      {entry.traits.map((trait, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Lore Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card rounded-3xl p-6 border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-display font-semibold text-xl">Create Codex Lore Entry</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-muted-foreground">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Entry Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. The Sky Sovereign"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <option value="character">Character</option>
                    <option value="location">Location</option>
                    <option value="faction">Faction / Order</option>
                    <option value="artifact">Artifact / Relic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Description / World Lore *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail this entry's background, significance, and history..."
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Traits or Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={traitsInput}
                  onChange={(e) => setTraitsInput(e.target.value)}
                  placeholder="e.g. Celestial Entity, Ancient, High-Tier"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow"
                >
                  {saving ? 'Saving...' : 'Add to Lore Bible'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
