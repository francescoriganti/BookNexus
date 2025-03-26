import pkg from 'pg';
const { Client } = pkg;
import { type IStorage } from './storage';
import { 
  type Book, 
  type InsertBook, 
  type User, 
  type InsertUser, 
  type GameStats, 
  type InsertGameStats, 
  type GameState,
  type GameGuess,
  type BookAttribute
} from '@shared/schema';
import { log } from './vite';

// Get database connection details from environment variables
const {
  DATABASE_URL,
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE
} = process.env;

// Validate database environment variables
if (!DATABASE_URL && (!PGHOST || !PGPORT || !PGUSER || !PGPASSWORD || !PGDATABASE)) {
  throw new Error('Database environment variables are not set');
}

export class PostgresStorage implements IStorage {
  private client: Client;
  private connected: boolean = false;
  
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Connect to database
    this.connect();
  }
  
  private async connect() {
    try {
      await this.client.connect();
      this.connected = true;
      log('Connected to PostgreSQL database', 'postgres');
    } catch (error) {
      log(`Failed to connect to PostgreSQL database: ${error}`, 'postgres');
      throw new Error(`Failed to connect to PostgreSQL database: ${error}`);
    }
  }
  
  private async query(text: string, params: any[] = []) {
    if (!this.connected) {
      await this.connect();
    }
    
    try {
      return await this.client.query(text, params);
    } catch (error) {
      log(`Query error: ${error}`, 'postgres');
      throw error;
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password
      } as User;
    } catch (error) {
      log(`Failed to get user: ${error}`, 'postgres');
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password
      } as User;
    } catch (error) {
      log(`Failed to get user by username: ${error}`, 'postgres');
      return undefined;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await this.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
        [user.username, user.password]
      );
      
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password
      } as User;
    } catch (error) {
      log(`Failed to create user: ${error}`, 'postgres');
      throw new Error(`Failed to create user: ${error}`);
    }
  }
  
  // Book methods
  async getBooks(): Promise<Book[]> {
    try {
      const result = await this.query('SELECT * FROM books');
      if (result.rows.length === 0) throw new Error('No books available');
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        author: row.author,
        publicationYear: row.publication_year,
        genre: row.genre,
        authorsCountry: row.authors_country,
        pages: row.pages,
        originalLanguage: row.original_language,
        historicalPeriod: row.historical_period
      })) as Book[];
    } catch (error) {
      log(`Failed to get books: ${error}`, 'postgres');
      throw new Error(`Failed to get books: ${error}`);
    }
  }
  
  async getBook(id: number): Promise<Book | undefined> {
    try {
      const result = await this.query('SELECT * FROM books WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        author: row.author,
        publicationYear: row.publication_year,
        genre: row.genre,
        authorsCountry: row.authors_country,
        pages: row.pages,
        originalLanguage: row.original_language,
        historicalPeriod: row.historical_period
      } as Book;
    } catch (error) {
      log(`Failed to get book: ${error}`, 'postgres');
      return undefined;
    }
  }
  
  async getBookByTitle(title: string): Promise<Book | undefined> {
    try {
      const result = await this.query('SELECT * FROM books WHERE LOWER(title) = LOWER($1)', [title]);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        author: row.author,
        publicationYear: row.publication_year,
        genre: row.genre,
        authorsCountry: row.authors_country,
        pages: row.pages,
        originalLanguage: row.original_language,
        historicalPeriod: row.historical_period
      } as Book;
    } catch (error) {
      log(`Failed to get book by title: ${error}`, 'postgres');
      return undefined;
    }
  }
  
  async addBook(book: InsertBook): Promise<Book> {
    try {
      const result = await this.query(
        'INSERT INTO books (title, author, publication_year, genre, authors_country, pages, original_language, historical_period) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          book.title,
          book.author,
          book.publicationYear,
          book.genre,
          book.authorsCountry,
          book.pages,
          book.originalLanguage,
          book.historicalPeriod
        ]
      );
      
      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        author: row.author,
        publicationYear: row.publication_year,
        genre: row.genre,
        authorsCountry: row.authors_country,
        pages: row.pages,
        originalLanguage: row.original_language,
        historicalPeriod: row.historical_period
      } as Book;
    } catch (error) {
      log(`Failed to add book: ${error}`, 'postgres');
      throw new Error(`Failed to add book: ${error}`);
    }
  }
  
  // Game methods
  async getDailyBook(date: string): Promise<Book> {
    try {
      // Get all books
      const result = await this.query('SELECT * FROM books');
      if (result.rows.length === 0) throw new Error('No books available');
      
      // Select a book based on the date (deterministic)
      const dateObj = new Date(date);
      const seed = dateObj.getFullYear() * 10000 + (dateObj.getMonth() + 1) * 100 + dateObj.getDate();
      const index = seed % result.rows.length;
      
      const row = result.rows[index];
      return {
        id: row.id,
        title: row.title,
        author: row.author,
        publicationYear: row.publication_year,
        genre: row.genre,
        authorsCountry: row.authors_country,
        pages: row.pages,
        originalLanguage: row.original_language,
        historicalPeriod: row.historical_period
      } as Book;
    } catch (error) {
      log(`Failed to get daily book: ${error}`, 'postgres');
      throw new Error(`Failed to get daily book: ${error}`);
    }
  }
  
  async getGameState(date: string): Promise<GameState | undefined> {
    try {
      const result = await this.query('SELECT * FROM game_states WHERE id = $1', [`game-${date}`]);
      if (result.rows.length === 0) return undefined;
      
      // Parse JSON fields
      const row = result.rows[0];
      return {
        id: row.id,
        date: row.date,
        dailyBookId: row.daily_book_id,
        remainingAttempts: row.remaining_attempts,
        guesses: JSON.parse(row.guesses),
        revealedAttributes: JSON.parse(row.revealed_attributes),
        gameStatus: row.game_status
      } as GameState;
    } catch (error) {
      log(`Failed to get game state: ${error}`, 'postgres');
      return undefined;
    }
  }
  
  async createGameState(date: string): Promise<GameState> {
    try {
      // Get the daily book for this date
      const dailyBook = await this.getDailyBook(date);
      
      // Initialize the game state
      const initialAttributes: BookAttribute[] = [
        {
          name: "Publication Year",
          value: dailyBook.publicationYear,
          icon: "calendar",
          revealed: false,
          type: "date" as const
        },
        {
          name: "Genre",
          value: dailyBook.genre,
          icon: "bookmark",
          revealed: false,
          type: "text" as const
        },
        {
          name: "Author's Country",
          value: dailyBook.authorsCountry,
          icon: "globe",
          revealed: false,
          type: "text" as const
        },
        {
          name: "Pages",
          value: dailyBook.pages,
          icon: "file-text",
          revealed: false,
          type: "number" as const
        },
        {
          name: "Author",
          value: dailyBook.author,
          icon: "user",
          revealed: false,
          type: "text" as const
        },
        {
          name: "Original Language",
          value: dailyBook.originalLanguage,
          icon: "message-square",
          revealed: false,
          type: "text" as const
        },
        {
          name: "Historical Period",
          value: dailyBook.historicalPeriod,
          icon: "clock",
          revealed: false,
          type: "text" as const
        }
      ];
      
      const gameState: GameState = {
        id: `game-${date}`,
        date,
        dailyBookId: dailyBook.id,
        remainingAttempts: 8,
        guesses: [],
        revealedAttributes: initialAttributes,
        gameStatus: "active"
      };
      
      // Save to database
      await this.query(
        'INSERT INTO game_states (id, date, daily_book_id, remaining_attempts, guesses, revealed_attributes, game_status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          gameState.id,
          gameState.date,
          gameState.dailyBookId,
          gameState.remainingAttempts,
          JSON.stringify(gameState.guesses),
          JSON.stringify(gameState.revealedAttributes),
          gameState.gameStatus
        ]
      );
      
      return gameState;
    } catch (error) {
      log(`Failed to create game state: ${error}`, 'postgres');
      throw new Error(`Failed to create game state: ${error}`);
    }
  }
  
  async updateGameState(gameState: GameState): Promise<GameState> {
    try {
      // Update in database
      await this.query(
        'UPDATE game_states SET date = $1, daily_book_id = $2, remaining_attempts = $3, guesses = $4, revealed_attributes = $5, game_status = $6 WHERE id = $7',
        [
          gameState.date,
          gameState.dailyBookId,
          gameState.remainingAttempts,
          JSON.stringify(gameState.guesses),
          JSON.stringify(gameState.revealedAttributes),
          gameState.gameStatus,
          gameState.id
        ]
      );
      
      return gameState;
    } catch (error) {
      log(`Failed to update game state: ${error}`, 'postgres');
      throw new Error(`Failed to update game state: ${error}`);
    }
  }
  
  // Stats methods
  async getGameStats(userId: number): Promise<GameStats | undefined> {
    try {
      const result = await this.query('SELECT * FROM game_stats WHERE user_id = $1', [userId]);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        gamesPlayed: row.games_played,
        gamesWon: row.games_won,
        currentStreak: row.current_streak,
        maxStreak: row.max_streak,
        guessDistribution: row.guess_distribution,
        lastPlayed: row.last_played
      } as GameStats;
    } catch (error) {
      log(`Failed to get game stats: ${error}`, 'postgres');
      return undefined;
    }
  }
  
  async updateGameStats(stats: InsertGameStats): Promise<GameStats> {
    try {
      // Check if stats exists
      const existingStats = await this.getGameStats(stats.userId);
      
      let result;
      if (existingStats) {
        // Update existing stats
        result = await this.query(
          'UPDATE game_stats SET games_played = $1, games_won = $2, current_streak = $3, max_streak = $4, guess_distribution = $5, last_played = $6 WHERE user_id = $7 RETURNING *',
          [
            stats.gamesPlayed ?? 0,
            stats.gamesWon ?? 0,
            stats.currentStreak ?? 0,
            stats.maxStreak ?? 0,
            stats.guessDistribution ?? '[]',
            stats.lastPlayed,
            stats.userId
          ]
        );
      } else {
        // Insert new stats
        result = await this.query(
          'INSERT INTO game_stats (user_id, games_played, games_won, current_streak, max_streak, guess_distribution, last_played) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [
            stats.userId,
            stats.gamesPlayed ?? 0,
            stats.gamesWon ?? 0,
            stats.currentStreak ?? 0,
            stats.maxStreak ?? 0,
            stats.guessDistribution ?? '[]',
            stats.lastPlayed
          ]
        );
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        gamesPlayed: row.games_played,
        gamesWon: row.games_won,
        currentStreak: row.current_streak,
        maxStreak: row.max_streak,
        guessDistribution: row.guess_distribution,
        lastPlayed: row.last_played
      } as GameStats;
    } catch (error) {
      log(`Failed to update game stats: ${error}`, 'postgres');
      throw new Error(`Failed to create game stats: ${error}`);
    }
  }
}

// Export a singleton instance
export const postgresStorage = new PostgresStorage();