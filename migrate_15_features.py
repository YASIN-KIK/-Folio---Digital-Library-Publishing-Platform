"""
Database migration to support the 15 new advanced Folio features:
1. reader_highlights & notes
2. book_codex (Lore Bible: characters, locations, factions, artifacts)
3. book_qna (Author Q&A and AMA threads)
4. club_polls & votes
5. admin_announcements (broadcast banner)
6. reading_challenges & badges
7. community_shelves & likes
"""

import sqlite3
import json
import uuid
import time
from pathlib import Path

DB_PATH = Path("/home/user/apps/folio/library.db")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

c.executescript("""
CREATE TABLE IF NOT EXISTS reader_highlights (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    selected_text TEXT NOT NULL,
    note TEXT,
    color TEXT DEFAULT 'amber',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE IF NOT EXISTS book_codex (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    category TEXT NOT NULL, -- character, location, faction, artifact
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    traits TEXT, -- JSON array of tags or traits
    image_url TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE IF NOT EXISTS book_qna (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by TEXT,
    created_at INTEGER NOT NULL,
    answered_at INTEGER,
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS club_polls (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    options_json TEXT NOT NULL,
    created_by TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (club_id) REFERENCES reading_clubs(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS club_poll_votes (
    poll_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    option_idx INTEGER NOT NULL,
    voted_at INTEGER NOT NULL,
    PRIMARY KEY(poll_id, user_id),
    FOREIGN KEY (poll_id) REFERENCES club_polls(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS admin_announcements (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    badge_label TEXT DEFAULT 'Announcement',
    link_text TEXT,
    link_target TEXT,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reading_challenges (
    user_id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    target_books INTEGER DEFAULT 25,
    completed_books INTEGER DEFAULT 0,
    unlocked_badges TEXT, -- JSON array
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS community_shelves (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT, -- JSON array
    is_public INTEGER DEFAULT 1,
    likes_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS community_shelf_books (
    shelf_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    PRIMARY KEY (shelf_id, book_id),
    FOREIGN KEY (shelf_id) REFERENCES community_shelves(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);
""")

now = int(time.time())

# Seed Lore Bible Codex for 'The Archmage of the Obsidian Spire'
archmage_codex = [
    ("codex_arch_1", "book_archmage_spire", "character", "Archmage Yasin", "Master of the Seventh Meridian and High Scholar of the Obsidian Spire. Renowned for unearthing the forbidden Titan ciphers.", json.dumps(["Aether Sorcery", "Titan Cipher Master", "High Sage"]), "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"),
    ("codex_arch_2", "book_archmage_spire", "character", "Lyanna of the Sunken Isles", "Prodigy apprentice who escaped the flood of the sunken archipelagos. Bearer of the Phosphor Light.", json.dumps(["Apprentice", "Water Affinity", "Scholar"]), "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"),
    ("codex_arch_3", "book_archmage_spire", "location", "The Solarium of Aethelgard", "The crowning observatory of Mount Aethelgard, suspended 3,000 cubits above the Whispering Chasm.", json.dumps(["Sacred", "Leyline Focal Point", "High Altitude"]), "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80"),
    ("codex_arch_4", "book_archmage_spire", "artifact", "The Celestial Astrolabe", "An ancient brass and diamond gimbal instrument aligned to the hidden gravitational tides of the Void.", json.dumps(["Relic", "Gravitational Harmonic", "Titan Forged"]), "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80"),
    ("codex_arch_5", "book_archmage_spire", "faction", "The Seventh Concordat", "The order of contemplative scholars sworn to protect the ancient library archives from imperial censors.", json.dumps(["Scholar Order", "Anti-Censorship", "Secret Archives"]), "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&auto=format&fit=crop&q=80")
]

for cid, bid, cat, name, desc, traits, img in archmage_codex:
    c.execute("SELECT id FROM book_codex WHERE id = ?", (cid,))
    if not c.fetchone():
        c.execute("""
        INSERT INTO book_codex (id, book_id, category, name, description, traits, image_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (cid, bid, cat, name, desc, traits, img, now))

# Seed initial Author Q&A
qnas = [
    ("qna_1", "book_archmage_spire", "usr_marcus", "Will the Sky Sovereign play a central role in Volume II?", "Indeed! The second arc focuses on the reconciliation between humanity and the celestial entities that sleep beneath the planetary crust.", "usr_yasin", now - 86400 * 2, now - 86400 * 1),
    ("qna_2", "book_archmage_spire", "usr_aria", "What was the inspiration behind the Aether crystal harmonic resonance?", "The idea that magic is not supernatural mystery, but an uncatalogued harmonic branch of particle physics waiting for a maestro.", "usr_yasin", now - 86400 * 3, now - 86400 * 2),
    ("qna_3", "book_infinite_archivist", "usr_julian", "Is the final blank page meant to invite the reader into authorial collaboration?", "Precisely. No book is finished until a conscious mind breathes life into its sentences. The reader completes the creation.", "usr_yasin", now - 86400 * 4, now - 86400 * 3)
]

for qid, bid, uid, q, a, aby, cat, aat in qnas:
    c.execute("SELECT id FROM book_qna WHERE id = ?", (qid,))
    if not c.fetchone():
        c.execute("""
        INSERT INTO book_qna (id, book_id, user_id, question, answer, answered_by, created_at, answered_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (qid, bid, uid, q, a, aby, cat, aat))

# Seed Club Poll for Midnight Readers Guild
c.execute("SELECT id FROM club_polls WHERE id = 'poll_mid_1'")
if not c.fetchone():
    opts = [
        {"text": "The Archmage of the Obsidian Spire by Yasin Kik", "votes": 9},
        {"text": "The Infinite Archivist: Book of All Things by Yasin Kik", "votes": 6},
        {"text": "The Clockwork Alchemist by Elena Vance", "votes": 4},
        {"text": "The Cartographer of Lost Hours by Marcus Reed", "votes": 3}
    ]
    c.execute("""
    INSERT INTO club_polls (id, club_id, title, description, options_json, created_by, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    """, ("poll_mid_1", "club_midnight", "Select Our Next Grand Salon Book of the Month", "Vote on our collective reading voyage for the coming season.", json.dumps(opts), "usr_marcus", now - 86400 * 5))

# Seed Admin Announcement Broadcast Banner
c.execute("SELECT id FROM admin_announcements WHERE id = 'ann_1'")
if not c.fetchone():
    c.execute("""
    INSERT INTO admin_announcements (id, message, badge_label, link_text, link_target, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
    """, ("ann_1", "✨ Welcome to Folio 2.0: Audio Narration, Text Highlighting, Ambient Soundscapes, and the Lore Codex are now live!", "New Release", "Explore 115+ Stories", "explore", now))

# Seed User Reading Challenge for Yasin Kik and others
challenges = [
    ("usr_yasin", 2026, 30, 18, json.dumps(["tome_conqueror", "mage_scholar", "night_owl", "ink_alchemist", "grand_archivist"])),
    ("usr_elena", 2026, 25, 14, json.dumps(["night_owl", "ink_alchemist"])),
    ("usr_marcus", 2026, 20, 16, json.dumps(["salon_host", "night_owl"]))
]

for uid, yr, target, comp, badges in challenges:
    c.execute("SELECT user_id FROM reading_challenges WHERE user_id = ?", (uid,))
    if not c.fetchone():
        c.execute("""
        INSERT INTO reading_challenges (user_id, year, target_books, completed_books, unlocked_badges, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (uid, yr, target, comp, badges, now))

# Seed Community Public Curated Shelves
shelves = [
    ("shelf_1", "usr_yasin", "Essential High Fantasy & Arcane Lore", "A curated anthology of deep worldbuilding, ancient grimoires, and titanium titans.", json.dumps(["Fantasy", "Mage Lore", "Epics"]), 38, now - 86400 * 6),
    ("shelf_2", "usr_marcus", "Midnight Philosophical Inquiries", "Works that question reality, memory, and the architecture of time.", json.dumps(["Philosophy", "Sci-Fi", "Existential"]), 24, now - 86400 * 4),
    ("shelf_3", "usr_elena", "Clockwork & Steampunk Chronicles", "Mechanized wonders, alchemical engines, and historical mysteries.", json.dumps(["Steampunk", "Historical Fiction"]), 19, now - 86400 * 2)
]

for sid, uid, title, desc, tags, likes, cat in shelves:
    c.execute("SELECT id FROM community_shelves WHERE id = ?", (sid,))
    if not c.fetchone():
        c.execute("""
        INSERT INTO community_shelves (id, user_id, title, description, tags, is_public, likes_count, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        """, (sid, uid, title, desc, tags, likes, cat))

# Add books to shelves
shelf_books = [
    ("shelf_1", "book_archmage_spire", 1),
    ("shelf_1", "book_fan_0_v1", 2),
    ("shelf_1", "book_fan_1_v1", 3),
    ("shelf_2", "book_infinite_archivist", 1),
    ("shelf_2", "book_quantum_botanist", 2),
    ("shelf_3", "book_clockwork", 1),
    ("shelf_3", "book_shadows", 2)
]

for sid, bid, ord_idx in shelf_books:
    c.execute("SELECT shelf_id FROM community_shelf_books WHERE shelf_id = ? AND book_id = ?", (sid, bid))
    if not c.fetchone():
        c.execute("INSERT INTO community_shelf_books (shelf_id, book_id, order_index) VALUES (?, ?, ?)", (sid, bid, ord_idx))

conn.commit()
conn.close()
print("Migration for 15 new features successfully applied!")
