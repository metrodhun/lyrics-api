CREATE TABLE lyrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  image TEXT,
  content TEXT NOT NULL
);

INSERT INTO lyrics (title, artist, image, content) VALUES
("Yesterday", "The Beatles", "https://example.com/yesterday.jpg", "Yesterday, all my troubles seemed so far away..."),
("Hallelujah", "Leonard Cohen", "https://example.com/hallelujah.jpg", "Now I've heard there was a secret chord..."),
("Imagine", "John Lennon", "https://example.com/imagine.jpg", "Imagine all the people, living life in peace...");
