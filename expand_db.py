"""
Database migration & expansion script for Folio:
1. Adds role and access_status to users table.
2. Creates direct_messages table.
3. Seeds/upserts admin user Yasin Kik (yasinkik@outlook.com / YASINKIK01).
4. Adds rich stories across multiple genres, with chapters.
5. Seeds initial direct chats and connections.
"""

import sqlite3
import json
import uuid
import time

DB_PATH = "/home/user/apps/folio/library.db"
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 1. Alter table users to add role and access_status if missing
cursor.execute("PRAGMA table_info(users)")
cols = [c[1] for c in cursor.fetchall()]

if "role" not in cols:
    cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'author'")
if "access_status" not in cols:
    cursor.execute("ALTER TABLE users ADD COLUMN access_status TEXT DEFAULT 'granted'")

# Ensure existing users have granted status
cursor.execute("UPDATE users SET access_status = 'granted' WHERE access_status IS NULL")
cursor.execute("UPDATE users SET role = 'author' WHERE role IS NULL")

# 2. Create direct_messages table
cursor.execute("""
CREATE TABLE IF NOT EXISTS direct_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
)
""")

now = int(time.time())

# 3. Insert or update Admin User: YASIN KIK
admin_user = {
    "id": "usr_yasin",
    "email": "yasinkik@outlook.com",
    "password_hash": "YASINKIK01",
    "username": "yasinkik",
    "display_name": "Yasin Kik",
    "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "bio": "I will write the whole in a book",
    "favorite_genres": json.dumps(["Philosophy", "Sci-Fi", "Historical Fiction", "Epic Fantasy"]),
    "role": "admin",
    "access_status": "granted",
    "created_at": now - 86400 * 120
}

cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (admin_user["email"],))
existing_admin = cursor.fetchone()
if existing_admin:
    cursor.execute("""
    UPDATE users SET
        display_name = ?,
        username = ?,
        password_hash = ?,
        avatar_url = ?,
        bio = ?,
        favorite_genres = ?,
        role = 'admin',
        access_status = 'granted'
    WHERE id = ?
    """, (admin_user["display_name"], admin_user["username"], admin_user["password_hash"], admin_user["avatar_url"], admin_user["bio"], admin_user["favorite_genres"], existing_admin[0]))
    admin_id = existing_admin[0]
else:
    cursor.execute("""
    INSERT INTO users (id, email, password_hash, username, display_name, avatar_url, bio, favorite_genres, role, access_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (admin_user["id"], admin_user["email"], admin_user["password_hash"], admin_user["username"], admin_user["display_name"], admin_user["avatar_url"], admin_user["bio"], admin_user["favorite_genres"], admin_user["role"], admin_user["access_status"], admin_user["created_at"]))
    admin_id = admin_user["id"]

# Ensure friendships exist for Yasin Kik so chat works right away
for friend_id in ["usr_elena", "usr_marcus", "usr_aria", "usr_julian"]:
    cursor.execute("""
    SELECT id FROM friendships
    WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)
    """, (admin_id, friend_id, friend_id, admin_id))
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at)
        VALUES (?, ?, ?, 'accepted', ?, ?)
        """, (str(uuid.uuid4()), admin_id, friend_id, now - 86400 * 10, now - 86400 * 10))

# 4. Add many more rich, evocative stories
new_stories = [
    {
        "id": "book_infinite_archivist",
        "author_id": admin_id,
        "title": "The Infinite Archivist: Book of All Things",
        "subtitle": "The Philosophy of Memory & Time",
        "description": "At the threshold of the Great Silence, the Grand Scribe undertakes an epochal endeavor: committing every spoken tongue, every constellation, and every forgotten heartbeat of civilization into a single unyielding tome. A profound philosophical epic examining the boundaries of truth and human destiny.",
        "cover_image": "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80",
        "genre": "Philosophy",
        "language": "English",
        "mature_content": 0,
        "status": "published",
        "published_at": now - 86400 * 4,
        "created_at": now - 86400 * 15,
        "updated_at": now - 86400 * 1,
        "chapters": [
            ("ch_arch_1", 1, "The First Inscription", """<h3>The First Inscription</h3>
<p>To capture the universe in a book is not a poet's madness, but a scholar's duty when the stars begin to dim.</p>
<p>I sat atop the Obsidian Promontory of the Citadel, watching the twilight winds carry the ash of the old libraries across the valley. Below, seven generations of scholars had gathered the parchments of four vanished empires. Yet mere parchment is frail against water and flame. What we required was ink synthesized from starlight and obsidian dust—a medium that could endure a million winters.</p>
<blockquote>"He who writes the whole world does not invent truth; he merely restores the silence between the words."</blockquote>
<p>I dipped the quill of annealed tungsten into the crucible. Before me lay the blank folio of compressed diamond-leaf. On page one, I wrote the name of the light before there was an eye to receive it.</p>""", 390),
            ("ch_arch_2", 2, "The Geometry of Forgetting", """<h3>The Geometry of Forgetting</h3>
<p>By the third century of our labor, the Archivists had reached the annals of the Sea Kings.</p>
<p>Every memory has weight. When a man forgives an old wound, its geometry flattens; when he harbors spite, it sharpens like flint. In our index, each memory was categorized by its mass. A city's surrender weighed less than a child weeping in an empty courtyard.</p>
<p>Kael came to my lectern carrying a sealed bronze urn. "Master Scribe," he whispered, "we have uncovered the confessions of the last Astronomer Royal. He claims he intentionally miscalculated the path of the Comet to grant humanity fifty more years of peace."</p>
<p>I smiled through the dust of centuries. "Then write his lie in gold leaf. Even illusions deserve their chapter in the chronicle of mankind."</p>""", 410)
        ]
    },
    {
        "id": "book_quantum_botanist",
        "author_id": admin_id,
        "title": "The Quantum Botanist",
        "subtitle": "Chronicles of Kepler-186f",
        "description": "When an expedition of exobiologists discovers flora whose petals oscillate between parallel dimensions, lead researcher Dr. Yasin realizes the forest isn't merely alive—it is computing the collapse of the universe.",
        "cover_image": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
        "genre": "Sci-Fi",
        "language": "English",
        "mature_content": 0,
        "status": "published",
        "published_at": now - 86400 * 7,
        "created_at": now - 86400 * 20,
        "updated_at": now - 86400 * 2,
        "chapters": [
            ("ch_bot_1", 1, "The Oscillating Orchid", """<h3>The Oscillating Orchid</h3>
<p>The flower existed in three places at once, and smelled faintly of ozone and crushed thyme.</p>
<p>I pressed the sensor probe to the stem. The spectrometer flickered between 450 nanometers and zero—absolute absence. In the laboratory tent on the crimson plains of Kepler-186f, the crew held their breath. Every thirty seconds, the violet blossom dissolved into quantum interference fringes before snapping back into physical reality.</p>
<p>"It's photosynthesizing light from a timeline where this planet never had a drought," Dr. Sarah Vance said, stepping up to my shoulder. Her visor reflected the twin sapphire moons rising through the methane clouds.</p>
<p>"No," I corrected gently, watching the waveforms stabilize. "It's not taking light. It's sending a message."</p>""", 380)
        ]
    },
    {
        "id": "book_alchemist_seville",
        "author_id": "usr_marcus",
        "title": "The Alchemist of Seville",
        "subtitle": "Shadows of the Inquisition",
        "description": "In 1588, amidst the sweltering courtyards of Seville, a conversor apothecary discovers an Arabic manuscript detailing how to distill human grief into an incorruptible pigment favored by master painters.",
        "cover_image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80",
        "genre": "Historical Fiction",
        "language": "English",
        "mature_content": 0,
        "status": "published",
        "published_at": now - 86400 * 11,
        "created_at": now - 86400 * 28,
        "updated_at": now - 86400 * 3,
        "chapters": [
            ("ch_alc_1", 1, "The Blue of Cordoba", """<h3>The Blue of Cordoba</h3>
<p>No master in Andalusia had ever ground an ultramarine of such haunting depth.</p>
<p>Master Diego dabbed his sable brush onto the earthenware palette. The pigment did not merely sit upon the gesso panel; it seemed to drink the morning sunlight entering through the high Moorish arches. In the shadows of the courtyard, orange blossoms fell into the stone fountain with silent grace.</p>
<p>"Where did you obtain this lapis, Mateo?" the painter asked, his voice subdued by the presence of the Holy Office guard standing at the archway.</p>
<p>Mateo kept his gaze upon the tile mosaic. "It is not lapis, Don Diego. It was distilled from letters burned forty years ago."</p>""", 320)
        ]
    },
    {
        "id": "book_starlight_tribunal",
        "author_id": admin_id,
        "title": "The Starlight Tribunal",
        "subtitle": "The Imperial Succession Protocols",
        "description": "A high-stakes courtroom drama across seven galactic city-states. When the Grand Justiciar is poisoned inside the vacuum chamber of the High Assembly, defense advocate Kik must defend an artificial intelligence accused of high treason.",
        "cover_image": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
        "genre": "Thriller",
        "language": "English",
        "mature_content": 0,
        "status": "published",
        "published_at": now - 86400 * 2,
        "created_at": now - 86400 * 10,
        "updated_at": now - 86400 * 1,
        "chapters": [
            ("ch_trib_1", 1, "The Coldest Verdict", """<h3>The Coldest Verdict</h3>
<p>The dock was empty except for a humming cylindrical core of spun optical crystal.</p>
<p>Twelve hundred magistrates filled the terraced galleries of the Orbital Spire, their velvet cloaks rustling in the pressurized draft. The accusation was read in three solar dialects: murder of the Crown Regent by manipulation of the life-support harmonics.</p>
<p>I adjusted my advocate's robes and stepped to the lectern. "Magistrates of the Spire," I spoke into the acoustic resonator. "Before you vote to shatter this machine, ask yourselves why the Regent altered his last will twenty seconds before his heart stopped beating."</p>""", 290)
        ]
    },
    {
        "id": "book_gothic_thorns",
        "author_id": "usr_julian",
        "title": "A Garden of Silver Thorns",
        "subtitle": "Gothic Romance & Necromancy",
        "description": "High upon the wave-battered cliffs of Blackwood Manor, an heiress inherits a conservatory of poisonous blooms that only blossom when a ghost speaks their true name.",
        "cover_image": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        "genre": "Fantasy",
        "language": "English",
        "mature_content": 1,
        "status": "published",
        "published_at": now - 86400 * 9,
        "created_at": now - 86400 * 35,
        "updated_at": now - 86400 * 4,
        "chapters": [
            ("ch_goth_1", 1, "The Salt Glass Conservatorium", """<h3>The Salt Glass Conservatorium</h3>
<p>The sea fog had frosted the octagonal glass panels until they looked like sea ice.</p>
<p>Cordelia unlocked the rusted brass latch with the iron key her grandmother had hidden inside a family Bible. Within, the air was warm, damp, and smelled of winter moss and bitter almond. From the wrought-iron ceiling hung trailing vines of black nightshade, their tendrils curling toward the sound of her breath.</p>
<p>A tap sounded against the glass behind her. Three distinct beats. When she turned, only the crashing waves of the North Sea met her gaze.</p>""", 305)
        ]
    }
]

for b in new_stories:
    cursor.execute("SELECT id FROM books WHERE id = ?", (b["id"],))
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO books (id, author_id, title, subtitle, description, cover_image, genre, language, mature_content, status, published_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (b["id"], b["author_id"], b["title"], b["subtitle"], b["description"], b["cover_image"], b["genre"], b["language"], b["mature_content"], b["status"], b["published_at"], b["created_at"], b["updated_at"]))

        for ch_id, ch_num, ch_title, ch_content, ch_wc in b["chapters"]:
            cursor.execute("""
            INSERT INTO chapters (id, book_id, chapter_number, title, content, word_count, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (ch_id, b["id"], ch_num, ch_title, ch_content, ch_wc, ch_num, b["created_at"], b["updated_at"]))

# 5. Seed direct messages
messages = [
    (str(uuid.uuid4()), "usr_elena", admin_id, "Welcome to Folio, Yasin! Your vision for 'The Infinite Archivist' is phenomenal.", now - 86400 * 2, 1),
    (str(uuid.uuid4()), admin_id, "usr_elena", "Thank you, Elena! I am writing the whole world into this book. Isla's clockwork story is riveting.", now - 86400 * 2 + 1800, 1),
    (str(uuid.uuid4()), "usr_marcus", admin_id, "Yasin, would you be interested in having The Infinite Archivist featured in our Midnight Readers Club?", now - 86400 * 1, 1),
    (str(uuid.uuid4()), admin_id, "usr_marcus", "Absolutely, Marcus. Let's schedule the chapter discussion thread this week.", now - 86400 * 1 + 2400, 1),
    (str(uuid.uuid4()), "usr_aria", admin_id, "Hey Yasin, I love the quantum flower concept in Kepler-186f! Let me know if you want to collaborate on a sci-fi anthology.", now - 3600 * 5, 0),
]

for mid, s_id, r_id, msg, cat, is_r in messages:
    cursor.execute("""
    INSERT INTO direct_messages (id, sender_id, receiver_id, message, created_at, is_read)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (mid, s_id, r_id, msg, cat, is_r))

conn.commit()
conn.close()
print("Migration and expansion completed successfully!")
