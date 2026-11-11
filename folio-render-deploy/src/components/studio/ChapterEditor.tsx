import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, Eye, CheckCircle,
  Heading1, Heading2, Heading3, Bold, Italic, Quote, Minus, List,
  Clock, FileText, Check, AlertCircle, Sparkles
} from 'lucide-react';
import { Book, Chapter } from '@/types/library';
import { api } from '@/lib/libraryClient';

interface ChapterEditorProps {
  bookId: string;
  onBack: () => void;
  onPreviewBook: (book: Book, chapterId?: string) => void;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  bookId,
  onBack,
  onPreviewBook,
}) => {
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  // Editor states
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [savingState, setSavingState] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [wordCount, setWordCount] = useState<number>(0);

  // Publish checklist modal
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch book and chapters
  const loadData = async () => {
    try {
      const [bookData, chList] = await Promise.all([
        api.getBook(bookId),
        api.getChapters(bookId),
      ]);
      setBook(bookData);
      setChapters(chList);
      if (chList.length > 0 && !selectedChapterId) {
        selectChapter(chList[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [bookId]);

  const selectChapter = (ch: Chapter) => {
    // If dirty, save first
    if (savingState === 'dirty' && activeChapter) {
      performSave();
    }
    setSelectedChapterId(ch.id);
    setActiveChapter(ch);
    setTitle(ch.title);
    setContentHtml(ch.content || '');
    if (editorRef.current) {
      editorRef.current.innerHTML = ch.content || '<p></p>';
    }
    calculateWords(ch.content || '');
    setSavingState('saved');
  };

  const calculateWords = (html: string) => {
    const text = html.replace(/<[^>]*>/g, ' ').trim();
    const count = text ? text.split(/\s+/).length : 0;
    setWordCount(count);
  };

  // Handle content change in rich editable div
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setContentHtml(html);
    calculateWords(html);
    setSavingState('dirty');

    // Debounced auto-save (after 1.8s of inactivity)
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 1800);
  };

  const performSave = async () => {
    if (!selectedChapterId) return;
    setSavingState('saving');
    try {
      const updated = await api.updateChapter(selectedChapterId, {
        title,
        content: contentHtml,
      });
      setActiveChapter(updated);
      setChapters((prev) =>
        prev.map((c) => (c.id === selectedChapterId ? { ...c, title, word_count: updated.word_count } : c))
      );
      setSavingState('saved');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Auto-save failed', err);
      setSavingState('dirty');
    }
  };

  // Add chapter
  const handleAddChapter = async () => {
    try {
      const nextNum = chapters.length + 1;
      const newCh = await api.createChapter(bookId, {
        title: `Chapter ${nextNum}: Title`,
        content: '<p>Begin drafting this chapter here...</p>',
      });
      const updatedList = [...chapters, newCh];
      setChapters(updatedList);
      selectChapter(newCh);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete chapter
  const handleDeleteChapter = async (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (chapters.length <= 1) {
      alert('A book must have at least one chapter.');
      return;
    }
    if (!confirm('Are you sure you want to delete this chapter? This cannot be undone.')) return;
    try {
      await api.deleteChapter(chapterId);
      const remaining = chapters.filter((c) => c.id !== chapterId);
      setChapters(remaining);
      if (selectedChapterId === chapterId && remaining.length > 0) {
        selectChapter(remaining[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reorder chapters up or down
  const handleMoveChapter = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= chapters.length) return;

    const listCopy = [...chapters];
    const [moved] = listCopy.splice(index, 1);
    listCopy.splice(newIdx, 0, moved);

    setChapters(listCopy);
    try {
      await api.reorderChapters(bookId, listCopy.map((c) => c.id));
    } catch (err) {
      console.error(err);
    }
  };

  // Rich text command helper
  const execFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleEditorInput();
      editorRef.current.focus();
    }
  };

  const insertHeading = (tag: string) => {
    document.execCommand('formatBlock', false, `<${tag}>`);
    if (editorRef.current) {
      handleEditorInput();
      editorRef.current.focus();
    }
  };

  const insertBlockquote = () => {
    document.execCommand('formatBlock', false, '<blockquote>');
    if (editorRef.current) {
      handleEditorInput();
      editorRef.current.focus();
    }
  };

  const insertDivider = () => {
    document.execCommand('insertHorizontalRule', false);
    if (editorRef.current) {
      handleEditorInput();
      editorRef.current.focus();
    }
  };

  // Publishing checklist criteria
  const hasCover = Boolean(book?.cover_image);
  const hasChapters = chapters.length >= 1;
  const hasSubstantialContent = chapters.some((c) => (c.word_count || 0) > 30);
  const hasGenre = Boolean(book?.genre && book.genre !== '');
  const hasSynopsis = Boolean(book?.description && book.description.length >= 20);
  const canPublish = hasCover && hasChapters && hasSubstantialContent && hasGenre && hasSynopsis;

  const handlePublish = async (newStatus: 'published' | 'draft' | 'in_review') => {
    setPublishing(true);
    try {
      await api.updateBook(bookId, { status: newStatus });
      setBook((prev) => (prev ? { ...prev, status: newStatus } : null));
      setShowPublishModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Studio Bar */}
      <header className="h-16 border-b border-border bg-card px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Studio
          </button>
          <div className="h-4 w-[1px] bg-border hidden sm:block" />
          <div>
            <h2 className="font-display font-semibold text-sm sm:text-base leading-tight">
              {book?.title || 'Authoring Workspace'}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="capitalize">{book?.genre || 'Novel'}</span>
              <span>•</span>
              <span className={`font-medium ${
                book?.status === 'published' ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {book?.status === 'published' ? 'Published' : book?.status === 'in_review' ? 'In Review' : 'Draft'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Auto-save indicator */}
          <div className="text-xs text-muted-foreground hidden md:flex items-center space-x-1.5">
            {savingState === 'saving' ? (
              <span className="flex items-center text-amber-600 gap-1">
                <span className="animate-spin w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full" />
                Saving...
              </span>
            ) : savingState === 'dirty' ? (
              <span className="text-stone-400">Unsaved changes</span>
            ) : (
              <span className="flex items-center text-emerald-600 gap-1">
                <Check className="w-3.5 h-3.5" /> All saved ({lastSavedTime})
              </span>
            )}
          </div>

          {/* Manual Save */}
          <button
            onClick={performSave}
            disabled={savingState === 'saving'}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted transition flex items-center gap-1.5"
            title="Save Chapter"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Preview Reader */}
          {book && (
            <button
              onClick={() => onPreviewBook(book, selectedChapterId || undefined)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted transition flex items-center gap-1.5"
              title="Preview in Reader"
            >
              <Eye className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          )}

          {/* Publishing Checklist / Publish Button */}
          <button
            onClick={() => setShowPublishModal(true)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition shadow-sm flex items-center gap-1.5 ${
              book?.status === 'published'
                ? 'bg-muted border border-border text-foreground hover:bg-muted/80'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{book?.status === 'published' ? 'Manage Publication' : 'Publish Book'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Chapters Organizer */}
        <aside className="w-72 border-r border-border bg-card/60 flex flex-col shrink-0 hidden md:flex">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
              Chapters ({chapters.length})
            </span>
            <button
              onClick={handleAddChapter}
              className="p-1.5 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 text-amber-700 dark:text-amber-300 transition text-xs font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Chapter
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {chapters.map((ch, idx) => {
              const isSelected = ch.id === selectedChapterId;
              return (
                <div
                  key={ch.id}
                  onClick={() => selectChapter(ch)}
                  className={`group p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-amber-600/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-medium'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <div className="truncate mr-2 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-60">
                      Chapter {ch.chapter_number}
                    </span>
                    <span className="text-xs truncate block text-foreground">{ch.title}</span>
                    <span className="text-[10px] opacity-60">{ch.word_count || 0} words</span>
                  </div>

                  {/* Move Up/Down & Delete */}
                  <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => handleMoveChapter(idx, 'up', e)}
                      disabled={idx === 0}
                      className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleMoveChapter(idx, 'down', e)}
                      disabled={idx === chapters.length - 1}
                      className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChapter(ch.id, e)}
                      className="p-1 hover:bg-red-500/20 text-rose-500 rounded"
                      title="Delete Chapter"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center Writing Studio Canvas */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-stone-50/50 dark:bg-stone-950/20">
          {activeChapter ? (
            <div className="max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col flex-1">
              {/* Chapter Title Input */}
              <div className="mb-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSavingState('dirty');
                  }}
                  onBlur={performSave}
                  placeholder="Chapter Title..."
                  className="w-full text-2xl sm:text-3xl font-display font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40 text-foreground"
                />
              </div>

              {/* Rich Text Editor Toolbar */}
              <div className="sticky top-2 z-20 mb-6 p-1.5 rounded-2xl bg-card/95 border border-border shadow-md backdrop-blur-md flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertHeading('h1')}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-0.5"
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertHeading('h2')}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-0.5"
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertHeading('h3')}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-0.5"
                  title="Heading 3"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-border mx-1" />
                <button
                  type="button"
                  onClick={() => execFormat('bold')}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execFormat('italic')}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={insertBlockquote}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Blockquote"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={insertDivider}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Horizontal Divider"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => execFormat('insertUnorderedList')}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>

                {/* Word counter info badge in toolbar */}
                <div className="ml-auto flex items-center space-x-3 px-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <strong>{wordCount}</strong> words
                  </span>
                  <span className="flex items-center gap-1 hidden sm:flex">
                    <Clock className="w-3.5 h-3.5" />
                    ~{Math.max(1, Math.round(wordCount / 200))} min
                  </span>
                </div>
              </div>

              {/* Rich Contenteditable Writing Canvas */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                onBlur={performSave}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
                className="flex-1 min-h-[400px] p-6 rounded-2xl bg-card border border-border/70 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-600/30 prose-reader text-foreground leading-relaxed text-base"
                style={{ outline: 'none' }}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm">Select or create a chapter to begin writing.</p>
            </div>
          )}
        </main>
      </div>

      {/* Publish Checklist Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-display font-semibold text-xl">Publication Checklist</h3>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Verify your book details before making it accessible to the global community of readers and clubs.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 text-xs">
                <span className="flex items-center gap-2">
                  {hasCover ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  Book Cover Image Assigned
                </span>
                <span className={hasCover ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                  {hasCover ? 'Ready' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 text-xs">
                <span className="flex items-center gap-2">
                  {hasChapters ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  Chapters Configured ({chapters.length})
                </span>
                <span className={hasChapters ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                  {hasChapters ? 'Ready' : 'Need at least 1'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 text-xs">
                <span className="flex items-center gap-2">
                  {hasSubstantialContent ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  Prose Content Drafted
                </span>
                <span className={hasSubstantialContent ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                  {hasSubstantialContent ? 'Ready' : 'Add text'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 text-xs">
                <span className="flex items-center gap-2">
                  {hasGenre ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  Genre Category ({book?.genre})
                </span>
                <span className={hasGenre ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                  {hasGenre ? 'Ready' : 'Assign'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 text-xs">
                <span className="flex items-center gap-2">
                  {hasSynopsis ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  Synopsis / Summary
                </span>
                <span className={hasSynopsis ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                  {hasSynopsis ? 'Ready' : 'Provide synopsis'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
              {book?.status === 'published' ? (
                <>
                  <button
                    onClick={() => handlePublish('draft')}
                    disabled={publishing}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-amber-600 hover:bg-muted"
                  >
                    Unpublish to Draft
                  </button>
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium"
                  >
                    Keep Published
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handlePublish('in_review')}
                    disabled={publishing}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                  >
                    Submit for Review
                  </button>
                  <button
                    onClick={() => handlePublish('published')}
                    disabled={publishing || !canPublish}
                    className={`px-5 py-2.5 rounded-xl text-xs font-medium transition shadow flex items-center justify-center gap-2 ${
                      canPublish
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {publishing ? 'Publishing...' : 'Confirm & Publish to Library'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
