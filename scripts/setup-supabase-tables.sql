-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Create the books table
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  publication_year INTEGER NOT NULL,
  genre TEXT NOT NULL,
  authors_country TEXT NOT NULL,
  pages INTEGER NOT NULL,
  original_language TEXT NOT NULL,
  historical_period TEXT NOT NULL
);

-- Create the game_stats table
CREATE TABLE IF NOT EXISTS game_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  guess_distribution TEXT NOT NULL DEFAULT '[]',
  last_played DATE
);

-- Create the game_states table
CREATE TABLE IF NOT EXISTS game_states (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  daily_book_id INTEGER NOT NULL,
  remaining_attempts INTEGER NOT NULL,
  guesses TEXT NOT NULL,
  revealed_attributes TEXT NOT NULL,
  game_status TEXT NOT NULL
);

-- Insert sample books
INSERT INTO books (title, author, publication_year, genre, authors_country, pages, original_language, historical_period)
VALUES 
('To Kill a Mockingbird', 'Harper Lee', 1960, 'Fiction', 'United States', 281, 'English', 'Great Depression'),
('1984', 'George Orwell', 1949, 'Dystopian', 'United Kingdom', 328, 'English', 'Post-WWII'),
('Pride and Prejudice', 'Jane Austen', 1813, 'Romance', 'United Kingdom', 432, 'English', 'Regency Era'),
('One Hundred Years of Solitude', 'Gabriel García Márquez', 1967, 'Magical Realism', 'Colombia', 417, 'Spanish', '19th-20th Century'),
('Crime and Punishment', 'Fyodor Dostoevsky', 1866, 'Psychological Fiction', 'Russia', 545, 'Russian', '19th Century'),
('The Great Gatsby', 'F. Scott Fitzgerald', 1925, 'Fiction', 'United States', 180, 'English', 'Roaring Twenties'),
('Moby-Dick', 'Herman Melville', 1851, 'Adventure', 'United States', 635, 'English', '19th Century');