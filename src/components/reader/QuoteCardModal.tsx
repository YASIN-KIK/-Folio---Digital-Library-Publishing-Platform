import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, BookOpen, Share2 } from 'lucide-react';
import { Book } from '@/types/library';

interface QuoteCardModalProps {
  book: Book;
  chapterTitle?: string;
  quoteText: string;
  onClose: () => void;
}

export const QuoteCardModal: React.FC<QuoteCardModalProps> = ({
  book,
  chapterTitle,
  quoteText,
  onClose,
}) => {
  const [theme, setTheme] = useState<'gold' | 'obsidian' | 'parchment' | 'azure'>('gold');
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    const textToCopy = `"${quoteText}"\n\n— ${book.author_name}, ${book.title}${chapterTitle ? ` (${chapterTitle})` : ''}\nRead on Folio: https://folio-library.onrender.com`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const themeStyles = {
    gold: 'bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 text-amber-100 border-amber-600/40',
    obsidian: 'bg-gradient-to-br from-stone-950 via-zinc-900 to-black text-stone-100 border-white/20',
    parchment: 'bg-[#f5eedc] text-[#3b2f20] border-[#d8c7a5]',
    azure: 'bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-sky-100 border-sky-500/40',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-card rounded-3xl border border-border shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" /> Share Literary Passage
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Selectors */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-muted-foreground font-medium">Palette:</span>
          {(['gold', 'obsidian', 'parchment', 'azure'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1.5 rounded-xl capitalize font-medium border transition ${
                theme === t
                  ? 'border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Card Preview */}
        <div
          id="quote-card-preview"
          className={`p-6 sm:p-8 rounded-2xl border shadow-xl flex flex-col justify-between space-y-6 ${themeStyles[theme]}`}
        >
          <div className="text-3xl font-serif leading-none opacity-40">“</div>
          <p className="font-serif italic text-base sm:text-lg leading-relaxed text-center px-2">
            {quoteText}
          </p>
          <div className="text-3xl font-serif leading-none opacity-40 text-right">”</div>

          <div className="pt-4 border-t border-current/15 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 aspect-book rounded bg-black/20 overflow-hidden shrink-0">
                {book.cover_image && <img src={book.cover_image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div>
                <span className="font-display font-bold block">{book.title}</span>
                <span className="opacity-75 block text-[10px]">By {book.author_name}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 font-display tracking-widest text-[10px] opacity-60 uppercase font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>FOLIO</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleCopyText}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-md transition flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Quote Card Text'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
