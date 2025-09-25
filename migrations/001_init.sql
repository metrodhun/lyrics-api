-- Create the lyrics table
CREATE TABLE IF NOT EXISTS lyrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  image TEXT,
  content TEXT NOT NULL
);

-- Insert sample lyrics
INSERT INTO lyrics (title, artist, image, content) VALUES
("Yesterday", "The Beatles", "https://example.com/yesterday.jpg", "Yesterday, all my troubles seemed so far away..."),
("Hallelujah", "Leonard Cohen", "https://example.com/hallelujah.jpg", "Now I've heard there was a secret chord..."),
("Imagine", "John Lennon", "https://example.com/imagine.jpg", "Imagine all the people, living life in peace..."),
("Bohemian Rhapsody", "Queen", "https://example.com/bohemian.jpg", "Is this the real life? Is this just fantasy..."),
("Let It Be", "The Beatles", "https://example.com/letitbe.jpg", "When I find myself in times of trouble, Mother Mary comes to me...");
