-- Create lyrics table with timestamps
CREATE TABLE IF NOT EXISTS lyrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  image TEXT,
  content TEXT NOT NULL,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
