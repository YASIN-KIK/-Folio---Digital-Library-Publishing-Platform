import sqlite3, time, uuid

conn = sqlite3.connect("/home/user/apps/folio/library.db")
c = conn.cursor()
now = int(time.time())

more_books = [
    {
        "id": "book_aurora_voyage",
        "author_id": "usr_yasin",
        "title": "The Last Voyage of Aurora",
        "subtitle": "An Odyssey to the Rim of Time",
        "description": "When the generation ship Aurora reaches the boundary where physics ceases to obey causality, Navigator Kik must decipher a map inscribed in the dying pulses of an ancient pulsar.",
        "cover_image": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
        "genre": "Sci-Fi",
        "chapters": [
            ("ch_aur_1", 1, "The Pulsar Signal", "<p>The siren in Deck 4 echoed like a heartbeat through the frozen titanium corridors. Across the viewport, the void was not black, but swirling violet.</p><p>We had traveled three hundred light years to find that the destination had moved.</p>", 340)
        ]
    },
    {
        "id": "book_silk_mystery",
        "author_id": "usr_marcus",
        "title": "The Jade Cipher of Samarkand",
        "subtitle": "A Silk Road Chronicle",
        "description": "Along the windy desert caravan routes of the 14th century, a Venetian merchant and a Persian astronomer join forces to unlock a jade cylinder said to contain the secret formula for Greek Fire.",
        "cover_image": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80",
        "genre": "Historical Fiction",
        "chapters": [
            ("ch_silk_1", 1, "Caravan Under the Crescent Moon", "<p>The dunes shifted under the nocturnal breeze like sleeping beasts. In the oasis of Bukhara, copper lamps illuminated the silk merchants' tents.</p><p>When the caravan guard opened the cedar chest, the cylinder inside was already humming.</p>", 290)
        ]
    }
]

for b in more_books:
    c.execute("SELECT id FROM books WHERE id = ?", (b["id"],))
    if not c.fetchone():
        c.execute("""
        INSERT INTO books (id, author_id, title, subtitle, description, cover_image, genre, language, mature_content, status, published_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'English', 0, 'published', ?, ?, ?)
        """, (b["id"], b["author_id"], b["title"], b["subtitle"], b["description"], b["cover_image"], b["genre"], now - 86400 * 5, now - 86400 * 15, now - 86400 * 2))
        for ch_id, num, t, cont, wc in b["chapters"]:
            c.execute("""
            INSERT INTO chapters (id, book_id, chapter_number, title, content, word_count, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (ch_id, b["id"], num, t, cont, wc, num, now - 86400 * 15, now - 86400 * 2))

conn.commit()
conn.close()
print("Added extra books successfully!")
