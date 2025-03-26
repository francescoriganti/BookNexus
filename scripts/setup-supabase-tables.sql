-- This file contains SQL statements to create the necessary tables in Supabase

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username VARCHAR NOT NULL UNIQUE,
  email VARCHAR,
  passwordHash VARCHAR,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title VARCHAR NOT NULL,
  author VARCHAR NOT NULL,
  publicationYear INTEGER NOT NULL,
  genre VARCHAR NOT NULL,
  authorsCountry VARCHAR NOT NULL,
  pages INTEGER NOT NULL,
  originalLanguage VARCHAR NOT NULL,
  historicalPeriod VARCHAR NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game States table
CREATE TABLE IF NOT EXISTS game_states (
  id VARCHAR PRIMARY KEY,
  date VARCHAR NOT NULL,
  dailyBookId BIGINT NOT NULL REFERENCES books(id),
  remainingAttempts INTEGER NOT NULL,
  guesses JSONB NOT NULL,
  revealedAttributes JSONB NOT NULL,
  gameStatus VARCHAR NOT NULL CHECK (gameStatus IN ('active', 'won', 'lost')),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Stats table
CREATE TABLE IF NOT EXISTS game_stats (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  userId BIGINT NOT NULL REFERENCES users(id),
  gamesPlayed INTEGER NOT NULL DEFAULT 0,
  gamesWon INTEGER NOT NULL DEFAULT 0,
  currentStreak INTEGER NOT NULL DEFAULT 0,
  maxStreak INTEGER NOT NULL DEFAULT 0,
  guessDistribution VARCHAR NOT NULL DEFAULT '[]',
  lastPlayed TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a sample user for testing
INSERT INTO users (username) 
VALUES ('test_user')
ON CONFLICT (username) DO NOTHING;

-- Add some sample books
INSERT INTO books (title, author, publicationYear, genre, authorsCountry, pages, originalLanguage, historicalPeriod) 
VALUES 
('To Kill a Mockingbird', 'Harper Lee', 1960, 'Fiction', 'United States', 281, 'English', '1930s'),
('1984', 'George Orwell', 1949, 'Dystopian', 'United Kingdom', 328, 'English', 'Future'),
('Pride and Prejudice', 'Jane Austen', 1813, 'Romance', 'United Kingdom', 432, 'English', 'Regency'),
('The Great Gatsby', 'F. Scott Fitzgerald', 1925, 'Fiction', 'United States', 180, 'English', '1920s'),
('One Hundred Years of Solitude', 'Gabriel García Márquez', 1967, 'Magical Realism', 'Colombia', 417, 'Spanish', '19th-20th Century'),
('The Hobbit', 'J.R.R. Tolkien', 1937, 'Fantasy', 'United Kingdom', 310, 'English', 'Fictional Universe'),
('Crime and Punishment', 'Fyodor Dostoevsky', 1866, 'Psychological Fiction', 'Russia', 545, 'Russian', '19th Century'),
('The Alchemist', 'Paulo Coelho', 1988, 'Adventure', 'Brazil', 197, 'Portuguese', 'Contemporary')
ON CONFLICT DO NOTHING;