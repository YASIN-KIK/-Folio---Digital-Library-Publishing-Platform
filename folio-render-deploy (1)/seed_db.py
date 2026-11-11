"""
Database seeder for Folio. Populates realistic literary books, users, reviews, chapters, clubs, and activity.
"""
import sqlite3
import json
import uuid
import time
from library_api import DB_PATH, init_db

init_db()
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check if already seeded
cursor.execute("SELECT COUNT(*) FROM users")
if cursor.fetchone()[0] > 0:
    print("Database already seeded.")
    conn.close()
    exit(0)

now = int(time.time())

# 1. Seed Users
users = [
    {
        "id": "usr_elena",
        "email": "elena.vance@folio.read",
        "password_hash": "pbkdf2:demo123",
        "username": "elenavance",
        "display_name": "Elena Vance",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "bio": "Speculative fiction author and archivist. Writing stories at the intersection of myth and machine.",
        "favorite_genres": json.dumps(["Sci-Fi", "Literary Fiction", "Fantasy"]),
        "created_at": now - 86400 * 90
    },
    {
        "id": "usr_marcus",
        "email": "marcus.reed@folio.read",
        "password_hash": "pbkdf2:demo123",
        "username": "marcusreed",
        "display_name": "Marcus Reed",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "bio": "Essayist and historical fiction enthusiast. Host of the Midnight Readers Club.",
        "favorite_genres": json.dumps(["Historical Fiction", "Mystery", "Philosophy"]),
        "created_at": now - 86400 * 75
    },
    {
        "id": "usr_aria",
        "email": "aria.thorne@folio.read",
        "password_hash": "pbkdf2:demo123",
        "username": "ariathorne",
        "display_name": "Aria Thorne",
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        "bio": "Cyberpunk worldbuilder, poet, and coffee-fueled night owl.",
        "favorite_genres": json.dumps(["Cyberpunk", "Poetry", "Sci-Fi"]),
        "created_at": now - 86400 * 60
    },
    {
        "id": "usr_julian",
        "email": "julian.cross@folio.read",
        "password_hash": "pbkdf2:demo123",
        "username": "juliancross",
        "display_name": "Julian Cross",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        "bio": "Book reviewer, literary translator, and collector of vintage dust jackets.",
        "favorite_genres": json.dumps(["Mystery", "Thriller", "Literary Fiction"]),
        "created_at": now - 86400 * 45
    }
]

for u in users:
    cursor.execute("""
    INSERT INTO users (id, email, password_hash, username, display_name, avatar_url, bio, favorite_genres, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (u["id"], u["email"], u["password_hash"], u["username"], u["display_name"], u["avatar_url"], u["bio"], u["favorite_genres"], u["created_at"]))

# 2. Seed Books & Chapters
books = [
    {
        "id": "book_clockwork",
        "author_id": "usr_elena",
        "title": "The Clockwork Alchemist",
        "subtitle": "Chronicles of the Iron Meridian",
        "description": "In an alternate Victorian Prague where alchemy replaced steam engines, a renegade clockmaker unearths an automaton heart inscribed with forbidden celestial equations. When imperial inquisitors arrive at her doorstep, she must choose between silencing the truth or awakening the sleeping titan beneath the Charles Bridge.",
        "cover_image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80",
        "genre": "Fantasy",
        "language": "English",
        "mature_content": 0,
        "status": "published",
        "published_at": now - 86400 * 30,
        "created_at": now - 86400 * 60,
        "updated_at": now - 86400 * 20
    },
    {
        "id": "book_solaris",
        "author_id": "usr_aria",
        "title": "Echoes of the Neon Deep",
        "subtitle": "A Cyberpunk Noir Tale",
        "description": "Deep within the flooded lower tiers of Neo-Shinjuku, synthetic memories are traded like illicit narcotics. Kaelen, a neural diver with a cracked cortex implant, takes a contract to extract a dying tycoon's final hour—only to discover the man was murdered twice.",
        "cover_image": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        "genre": "Cyberpunk",
        "language": "English",
        "mature_content": 1,
        "status": "published",
        "published_at": now - 86400 * 18,
        "created_at": now - 86400 * 40,
        "updated_at": now - 86400 * 5
    },
    {
        "id": "book_shadows",
        "author_id": "usr_marcus",
        "title": "The Cartographer of Lost Hours",
        "subtitle": "Memories of the Venetian Republic",
        "description": "An evocative historical mystery set in 16th-century Venice. When a mapmaker is commissioned to chart the waterways of dreams by the Council of Ten, he discovers that every tide he draws erases an hour from the memories of the living.",
        "cover_image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
        "genre": "Historical Fiction",
        "language": "English",
        "mature_content": 0,
        "status": "published",
        "published_at": now - 86400 * 12,
        "created_at": now - 86400 * 50,
        "updated_at": now - 86400 * 2
    },
    {
        "id": "book_stellar",
        "author_id": "usr_elena",
        "title": "Whispers Beyond the Oort Cloud",
        "subtitle": "Hard Science Fiction & Philosophy",
        "description": "A slow-burn interplanetary voyage toward a stationary gravitational anomaly discovered at the rim of the solar system. The crew of the research vessel *Archimedes* discovers that the signal isn't mathematical—it is musical.",
        "cover_image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
        "genre": "Sci-Fi",
        "language": "English",
        "mature_content": 0,
        "status": "published",
        "published_at": now - 86400 * 5,
        "created_at": now - 86400 * 25,
        "updated_at": now - 86400 * 1
    },
    {
        "id": "book_draft_parchment",
        "author_id": "usr_elena",
        "title": "The Glass Library of Alexandria",
        "subtitle": "Fragments of an Unwritten World",
        "description": "A draft novel exploring what would have happened if the great library had been built from optical quartz prisms that recorded light itself.",
        "cover_image": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80",
        "genre": "Literary Fiction",
        "language": "English",
        "mature_content": 0,
        "status": "draft",
        "published_at": None,
        "created_at": now - 86400 * 3,
        "updated_at": now - 86400 * 1
    }
]

for b in books:
    cursor.execute("""
    INSERT INTO books (id, author_id, title, subtitle, description, cover_image, genre, language, mature_content, status, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (b["id"], b["author_id"], b["title"], b["subtitle"], b["description"], b["cover_image"], b["genre"], b["language"], b["mature_content"], b["status"], b["published_at"], b["created_at"], b["updated_at"]))

# Chapters for "The Clockwork Alchemist"
c1_content = """<h3>The Heart in the Brass Cage</h3>
<p>The lamp oil was running thin when the third gear finally ceased its weeping.</p>
<p>Isla dipped her brass calipers into the crucible of warm distilled turpentine, lifting the miniature escapement wheel toward the amber flicker of the tallow candle. Outside her loft window, the fog of the Vltava river coiled against the leaded panes like the cold breath of an approaching winter. Prague was sleeping under a canopy of iron chimneys and frost, but in the attic workshop of the Golden Lane, silence had its own percussion.</p>
<p><em>Click. Turn. Breathe.</em></p>
<p>It was not supposed to hum. Standard brass clockwork, even the precision celestial spheres commissioned by the Hapsburg astronomes, remained dead metal until wound by a silver key. Yet this spherical armature—no larger than a pomegranate, salvaged from the flooded vaults beneath the Old Town Hall—emitted a rhythmic, biological vibration. When she laid her palm against its lattice casing, she felt not the stiff tension of coiled steel, but a measured warmth.</p>
<blockquote>"Metal does not remember blood," her master had warned her before the tribunal sealed his lips forever. "Unless the artisan carved the seals of the Meridian into the inner rings."</blockquote>
<p>She brought the magnifying monocle to her right eye. Etched along the tooth of the central escapement was a microscopic phrase in archaic Bohemian cipher: <em>When the iron strikes thirteen, the river shall turn to mercury.</em></p>
<p>Far below in the cobblestone alley, heavy boots struck the wet flagstones. Three men in black velvet cloaks, bearing lanterns capped with lead shields, paused directly beneath her drainpipe. The Inquisitors of the Alchemical Guild had arrived three hours ahead of the dawn.</p>"""

c2_content = """<h3>The Meridian Shadow</h3>
<p>Isla packed three items into her leather satchel: her father’s tempered steel tweezers, a sealed vial of sulfurous quicksilver, and the pulsing brass heart.</p>
<p>She climbed through the skylight just as the splintering crash of oak resonated through the floorboards. The night air hit her lungs like crushed ice. Across the rooftops of the Lesser Quarter, copper domes gleamed beneath the pale fingernail of a crescent moon. She leaped the gutter, landing with a muted thud on the slate shingles of Master Kopeck’s cooperage.</p>
<p>Behind her, lantern beams pierced through her shattered skylight, casting frantic geometric shadows across the chimney stacks.</p>
<p>“Mistress Isla!” a voice shouted, raspy and edged with the dry coughing of coal smoke. Brother Malachi stood on the roof ridge, his gloved hand raised. In his left grip, he held a bronze compass whose needle was spinning like a drowning beetle. “You cannot quiet what is already awake. Bring it here, and the High Chancellery will grant you your father’s pardon.”</p>
<p>Isla held the satchel tighter to her ribs. The heart within pulsed twice, rapid and sharp, sending a tingling surge of static electricity down her arm.</p>
<p>“My father died six winters ago in your dungeon, Malachi,” she called out into the wind. “You are negotiating with ghosts.”</p>
<p>She dropped through the laundry lines into the darkness of the baker’s alleyway below.</p>"""

c3_content = """<h3>Beneath the Charles Bridge</h3>
<p>The stone arches of the bridge groaned under the weight of three centuries of river currents.</p>
<p>In the subterranean chamber beneath the statue of St. Luthgard, water seeped through mortar turned green with luminous moss. Isla struck a phosphorus match, illuminating the ancient dry dock where the river waters had been held back by copper sluice gates.</p>
<p>In the center of the vault stood the Colossus: an eight-foot frame of dark, non-reflective bronze alloy, half-submerged in a bath of mineral oils. Its chest cavity stood hollow, revealing seven circular alignment gears awaiting a core.</p>
<p>She reached into her satchel and drew out the sphere. Its glow had shifted from pale amber to an incandescent sapphire. As she brought it within twelve inches of the chest aperture, the metal fingers of the titan twitched, rust and dried tallow flaking away into the black pool.</p>"""

chapters_clockwork = [
    ("ch_clk_1", "book_clockwork", 1, "The Heart in the Brass Cage", c1_content, 480, 1),
    ("ch_clk_2", "book_clockwork", 2, "The Meridian Shadow", c2_content, 420, 2),
    ("ch_clk_3", "book_clockwork", 3, "Beneath the Charles Bridge", c3_content, 390, 3)
]

for ch_id, b_id, num, title, content, wc, ord_idx in chapters_clockwork:
    cursor.execute("""
    INSERT INTO chapters (id, book_id, chapter_number, title, content, word_count, order_index, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (ch_id, b_id, num, title, content, wc, ord_idx, now - 86400 * 20, now - 86400 * 10))

# Chapters for "Echoes of the Neon Deep"
ch_neo_1 = """<h3>The Drowned Tiers</h3>
<p>The rain in Sector 9 tasted like battery acid and burnt silicon.</p>
<p>Kaelen leaned against the corroded safety rail of Platform 42, watching the luminescent advertising holograms reflect on the black canal waters three hundred meters down. Shinjuku had been rebuilt three times since the Great Inundation, each layer stacked on the rotting skeleton of the one before it. The rich had the atmospheric scrubbers on the mile-high spires; down here, people breathed through charcoal filters and traded black-market synthetic neurotransmitters.</p>
<p>A damp trench coat brushed past him. A girl with mirrored ocular implants dropped a chip into his coffee cup.</p>
<p>“One hour of memory from Kenjiro Sato,” she murmured without stopping. “Before they wiped him.”</p>
<p>Kaelen fished the damp silver chip from his cold espresso, plugged it into his wrist jack, and squeezed his eyes shut.</p>"""

cursor.execute("""
INSERT INTO chapters (id, book_id, chapter_number, title, content, word_count, order_index, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""", ("ch_neo_1", "book_solaris", 1, "The Drowned Tiers", ch_neo_1, 260, 1, now - 86400 * 15, now - 86400 * 10))

# Chapters for "The Cartographer of Lost Hours"
ch_cart_1 = """<h3>The Lagoon at Midnight</h3>
<p>Venice in the winter was a city constructed entirely of mist, salt, and secrets.</p>
<p>Signor Bellini dipped his quill into squid ink mixed with powdered lapis lazuli. The parchment stretched across his easel was not ordinary calfskin; it had been cured in sea brine and pressed between pages of the Latin translation of Ptolemy's Geography. Every canal he drew was accurate to the fathom, yet the doge had summoned him for a different purpose.</p>
<p>“Tell me, cartographer,” the Inquisitor whispered from behind the gilded silk screen. “Can you chart the place where yesterday went?”</p>"""

cursor.execute("""
INSERT INTO chapters (id, book_id, chapter_number, title, content, word_count, order_index, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""", ("ch_cart_1", "book_shadows", 1, "The Lagoon at Midnight", ch_cart_1, 210, 1, now - 86400 * 10, now - 86400 * 5))

# 3. Seed Reviews & Ratings
reviews = [
    {
        "id": "rev_1",
        "user_id": "usr_marcus",
        "book_id": "book_clockwork",
        "rating": 5,
        "review_text": "An absolute masterpiece of Victorian alchemical fantasy. Isla is an inventive, defiant protagonist whose love for clockwork mechanism shines through every sentence. The pacing across Prague's winter roofs kept me reading until 3 AM.",
        "helpful_count": 24,
        "created_at": now - 86400 * 14
    },
    {
        "id": "rev_2",
        "user_id": "usr_julian",
        "book_id": "book_clockwork",
        "rating": 4,
        "review_text": "Remarkable worldbuilding with palpable historical texture. The tension in Chapter 2 with the Guild Inquisitors is masterfully orchestrated. Eagerly anticipating Volume II.",
        "helpful_count": 12,
        "created_at": now - 86400 * 8
    },
    {
        "id": "rev_3",
        "user_id": "usr_elena",
        "book_id": "book_solaris",
        "rating": 5,
        "review_text": "Dark, atmospheric, and relentlessly clever. Aria builds a neon underworld that feels alive, dirty, and utterly authentic to classic cyberpunk literature.",
        "helpful_count": 19,
        "created_at": now - 86400 * 6
    },
    {
        "id": "rev_4",
        "user_id": "usr_aria",
        "book_id": "book_shadows",
        "rating": 5,
        "review_text": "The prose in this book reads like poetry whispered across misty canals. A philosophical puzzle dressed in 16th-century velvet.",
        "helpful_count": 15,
        "created_at": now - 86400 * 4
    }
]

for r in reviews:
    cursor.execute("""
    INSERT INTO reviews (id, user_id, book_id, rating, review_text, helpful_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (r["id"], r["user_id"], r["book_id"], r["rating"], r["review_text"], r["helpful_count"], r["created_at"]))

# 4. Seed Bookshelves
shelves = [
    ("usr_elena", "book_shadows", "reading", None, now - 86400 * 5),
    ("usr_elena", "book_solaris", "completed", None, now - 86400 * 12),
    ("usr_marcus", "book_clockwork", "completed", None, now - 86400 * 10),
    ("usr_marcus", "book_stellar", "want_to_read", None, now - 86400 * 2),
    ("usr_marcus", "book_shadows", "custom", "Venetian Renaissance", now - 86400 * 3),
    ("usr_aria", "book_clockwork", "reading", None, now - 86400 * 4),
    ("usr_aria", "book_stellar", "want_to_read", None, now - 86400 * 1),
    ("usr_julian", "book_clockwork", "completed", None, now - 86400 * 7),
    ("usr_julian", "book_solaris", "want_to_read", None, now - 86400 * 3),
]

for uid, bid, stype, lname, added in shelves:
    cursor.execute("""
    INSERT INTO bookshelves (id, user_id, book_id, shelf_type, list_name, added_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), uid, bid, stype, lname, added))

# 5. Seed Friendships
friendships = [
    ("f1", "usr_elena", "usr_marcus", "accepted", now - 86400 * 50),
    ("f2", "usr_elena", "usr_aria", "accepted", now - 86400 * 40),
    ("f3", "usr_marcus", "usr_aria", "accepted", now - 86400 * 30),
    ("f4", "usr_julian", "usr_elena", "accepted", now - 86400 * 20),
    ("f5", "usr_julian", "usr_marcus", "pending", now - 86400 * 2),
]

for fid, r_id, a_id, st, cat in friendships:
    cursor.execute("""
    INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (fid, r_id, a_id, st, cat, cat))

# 6. Seed Reading Clubs & Discussion Threads
clubs = [
    {
        "id": "club_midnight",
        "name": "The Midnight Readers Guild",
        "description": "A haven for readers who prefer dark fantasy, alchemical steampunk, and philosophical mysteries read by candlelight.",
        "cover_image": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80",
        "book_of_the_month_id": "book_clockwork",
        "founder_id": "usr_marcus",
        "member_count": 4,
        "created_at": now - 86400 * 40
    },
    {
        "id": "club_cyberverse",
        "name": "Neon & Nebula Sci-Fi Collective",
        "description": "Exploring hard science fiction, transhumanism, cyberpunk futures, and artificial intelligence sagas.",
        "cover_image": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
        "book_of_the_month_id": "book_solaris",
        "founder_id": "usr_aria",
        "member_count": 3,
        "created_at": now - 86400 * 25
    }
]

for c in clubs:
    cursor.execute("""
    INSERT INTO reading_clubs (id, name, description, cover_image, book_of_the_month_id, founder_id, member_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (c["id"], c["name"], c["description"], c["cover_image"], c["book_of_the_month_id"], c["founder_id"], c["member_count"], c["created_at"]))

# Add members
club_members = [
    ("club_midnight", "usr_marcus", "founder", now - 86400 * 40),
    ("club_midnight", "usr_elena", "moderator", now - 86400 * 35),
    ("club_midnight", "usr_aria", "member", now - 86400 * 28),
    ("club_midnight", "usr_julian", "member", now - 86400 * 15),
    ("club_cyberverse", "usr_aria", "founder", now - 86400 * 25),
    ("club_cyberverse", "usr_elena", "member", now - 86400 * 20),
    ("club_cyberverse", "usr_julian", "member", now - 86400 * 10),
]

for cid, uid, role, j_at in club_members:
    cursor.execute("""
    INSERT INTO club_members (club_id, user_id, role, joined_at)
    VALUES (?, ?, ?, ?)
    """, (cid, uid, role, j_at))

# Seed discussion threads
threads = [
    {
        "id": "th_1",
        "club_id": "club_midnight",
        "user_id": "usr_marcus",
        "chapter_ref": "Chapter 1: The Heart in the Brass Cage",
        "title": "Symbolism of the Prague Meridian cipher",
        "content": "Did anyone else catch the allusion to historical Bohemian astronomes in the escapement wheel inscription? Isla's connection to her deceased father feels very personal. What do you think the thirteen strikes imply?",
        "created_at": now - 86400 * 10
    },
    {
        "id": "th_2",
        "club_id": "club_midnight",
        "user_id": "usr_aria",
        "chapter_ref": "Chapter 2: The Meridian Shadow",
        "title": "Brother Malachi's real motivation",
        "content": "Notice how his compass went crazy when Isla drew near? It looks like the Guild isn't trying to destroy the heart—they want to weaponize the bronze Colossus under the bridge.",
        "created_at": now - 86400 * 5
    }
]

for t in threads:
    cursor.execute("""
    INSERT INTO club_threads (id, club_id, user_id, chapter_ref, title, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (t["id"], t["club_id"], t["user_id"], t["chapter_ref"], t["title"], t["content"], t["created_at"]))

# Comments on thread 1
comments = [
    ("cm_1", "th_1", "usr_elena", "As the author, I love seeing this discussion! The 13 strikes refer to the medieval astronomical clock (Orloj) calendar cycle. More on this in Chapter 4!", now - 86400 * 8),
    ("cm_2", "th_1", "usr_julian", "The mechanical metaphors for heartbeat vs ticking are brilliantly sustained throughout the opening scene.", now - 86400 * 7),
]

for cid, tid, uid, cont, cat in comments:
    cursor.execute("""
    INSERT INTO club_comments (id, thread_id, user_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (cid, tid, uid, cont, cat))

# 7. Activity Feed
activities = [
    ("act_1", "usr_elena", "published_book", "book_clockwork", "The Clockwork Alchemist", json.dumps({"genre": "Fantasy"}), now - 86400 * 30),
    ("act_2", "usr_marcus", "wrote_review", "book_clockwork", "The Clockwork Alchemist", json.dumps({"rating": 5}), now - 86400 * 14),
    ("act_3", "usr_aria", "published_book", "book_solaris", "Echoes of the Neon Deep", json.dumps({"genre": "Cyberpunk"}), now - 86400 * 18),
    ("act_4", "usr_marcus", "started_book", "book_stellar", "Whispers Beyond the Oort Cloud", json.dumps({}), now - 86400 * 2),
    ("act_5", "usr_julian", "completed_chapter", "ch_clk_2", "Chapter 2: The Meridian Shadow", json.dumps({"book_title": "The Clockwork Alchemist"}), now - 86400 * 1),
]

for aid, uid, atype, eid, etitle, meta, cat in activities:
    cursor.execute("""
    INSERT INTO activity_feed (id, user_id, activity_type, entity_id, entity_title, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (aid, uid, atype, eid, etitle, meta, cat))

conn.commit()
conn.close()
print("Seeding completed successfully!")
