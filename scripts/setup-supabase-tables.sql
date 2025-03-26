-- SQL script to create tables for the Books Guessing Game

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL UNIQUE,
    author VARCHAR(255) NOT NULL,
    publication_year INTEGER NOT NULL,
    genre VARCHAR(100) NOT NULL,
    authors_country VARCHAR(100) NOT NULL,
    pages INTEGER NOT NULL,
    original_language VARCHAR(100) NOT NULL,
    historical_period VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_states table to track daily games
CREATE TABLE IF NOT EXISTS game_states (
    id VARCHAR(255) PRIMARY KEY,
    date VARCHAR(10) NOT NULL UNIQUE,
    daily_book_id INTEGER NOT NULL REFERENCES books(id),
    remaining_attempts INTEGER NOT NULL DEFAULT 8,
    guesses JSONB DEFAULT '[]'::jsonb,
    revealed_attributes JSONB NOT NULL,
    game_status VARCHAR(10) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_stats table to track user statistics
CREATE TABLE IF NOT EXISTS game_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    max_streak INTEGER NOT NULL DEFAULT 0,
    guess_distribution TEXT NOT NULL DEFAULT '[]',
    last_played VARCHAR(10),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_books_title ON books (title);
CREATE INDEX IF NOT EXISTS idx_game_states_date ON game_states (date);
CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats (user_id);

-- Insert some sample book data for testing
INSERT INTO books (title, author, publication_year, genre, authors_country, pages, original_language, historical_period)
VALUES 
    ('To Kill a Mockingbird', 'Harper Lee', 1960, 'Fiction', 'United States', 281, 'English', '1930s'),
    ('1984', 'George Orwell', 1949, 'Dystopian', 'United Kingdom', 328, 'English', 'Future'),
    ('The Great Gatsby', 'F. Scott Fitzgerald', 1925, 'Fiction', 'United States', 180, 'English', '1920s'),
    ('One Hundred Years of Solitude', 'Gabriel García Márquez', 1967, 'Magical Realism', 'Colombia', 417, 'Spanish', '19th-20th Century'),
    ('Crime and Punishment', 'Fyodor Dostoevsky', 1866, 'Psychological Fiction', 'Russia', 671, 'Russian', '19th Century'),
    ('The Hobbit', 'J.R.R. Tolkien', 1937, 'Fantasy', 'United Kingdom', 310, 'English', 'Fictional Middle-earth'),
    ('Pride and Prejudice', 'Jane Austen', 1813, 'Romance', 'United Kingdom', 432, 'English', 'Early 19th Century'),
    ('The Catcher in the Rye', 'J.D. Salinger', 1951, 'Coming-of-age', 'United States', 277, 'English', '1950s'),
    ('Brave New World', 'Aldous Huxley', 1932, 'Dystopian', 'United Kingdom', 311, 'English', 'Future'),
    ('Don Quixote', 'Miguel de Cervantes', 1605, 'Satire', 'Spain', 863, 'Spanish', '16th Century')
ON CONFLICT (title) DO NOTHING;

-- Insert a test user
INSERT INTO users (username, password_hash, display_name)
VALUES ('testuser', '$2b$10$dJqsRYqSrvfKhG9YpIEY8ORdfctgxU.EKB1XOyXKLW7y76RtJ62Oi', 'Test User')
ON CONFLICT (username) DO NOTHING;