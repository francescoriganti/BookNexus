import { 
  books, type Book, type InsertBook, 
  users, type User, type InsertUser,
  gameStats, type GameStats, type InsertGameStats,
  type GameState, type GameGuess, type BookAttribute
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { loadBooksFromCsv } from "./csv-loader";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Book methods
  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  getBookByTitle(title: string): Promise<Book | undefined>;
  addBook(book: InsertBook): Promise<Book>;
  
  // Game methods
  getDailyBook(date: string): Promise<Book>;
  getGameState(date: string): Promise<GameState | undefined>;
  createGameState(date: string): Promise<GameState>;
  updateGameState(gameState: GameState): Promise<GameState>;
  
  // Stats methods
  getGameStats(userId: number): Promise<GameStats | undefined>;
  updateGameStats(stats: InsertGameStats): Promise<GameStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private gameStates: Map<string, GameState>;
  private gameStatsByUser: Map<number, GameStats>;
  private userCurrentId: number;
  private bookCurrentId: number;
  private statsCurrentId: number;
  
  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.gameStates = new Map();
    this.gameStatsByUser = new Map();
    this.userCurrentId = 1;
    this.bookCurrentId = 1;
    this.statsCurrentId = 1;
    
    // Initialize with books from CSV
    this.loadBooksFromCsv();
  }
  
  private async loadBooksFromCsv() {
    try {
      const books = await loadBooksFromCsv();
      // Aggiorna il valore di bookCurrentId in base al massimo ID trovato
      let maxId = 0;
      books.forEach(book => {
        this.books.set(book.id, book);
        maxId = Math.max(maxId, book.id);
      });
      this.bookCurrentId = maxId + 1;
      console.log(`Caricati ${books.length} libri dal CSV. Prossimo ID: ${this.bookCurrentId}`);
    } catch (error) {
      console.error('Errore nel caricamento dei libri dal CSV:', error);
      // In caso di errore, usa i libri predefiniti
      this.initializeSampleBooks();
    }
  }
  
  private initializeSampleBooks() {
    console.warn('Utilizzo dei libri di esempio come fallback');
    const sampleBooks: InsertBook[] = [
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        publicationYear: 1960,
        genre: "Fiction",
        authorsCountry: "United States",
        pages: 281,
        originalLanguage: "English",
        historicalPeriod: "Great Depression",
        imageUrl: "/book-covers/to-kill-a-mockingbird.jpg"
      },
      {
        title: "1984",
        author: "George Orwell",
        publicationYear: 1949,
        genre: "Dystopian",
        authorsCountry: "United Kingdom",
        pages: 328,
        originalLanguage: "English",
        historicalPeriod: "Post-WWII",
        imageUrl: "/book-covers/1984.jpg"
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        publicationYear: 1813,
        genre: "Romance",
        authorsCountry: "United Kingdom",
        pages: 432,
        originalLanguage: "English",
        historicalPeriod: "Regency Era",
        imageUrl: "/book-covers/pride-and-prejudice.jpg"
      },
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        publicationYear: 1925,
        genre: "Fiction",
        authorsCountry: "United States",
        pages: 180,
        originalLanguage: "English",
        historicalPeriod: "Roaring Twenties",
        imageUrl: "/book-covers/the-great-gatsby.jpg"
      }
    ];
    
    sampleBooks.forEach(book => this.addBook(book));
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Book methods
  async getBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }
  
  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }
  
  async getBookByTitle(title: string): Promise<Book | undefined> {
    return Array.from(this.books.values()).find(
      (book) => book.title.toLowerCase() === title.toLowerCase(),
    );
  }
  
  async addBook(insertBook: InsertBook): Promise<Book> {
    const id = this.bookCurrentId++;
    // Assicuriamoci che imageUrl sia sempre definito
    const book: Book = { 
      ...insertBook, 
      id,
      imageUrl: insertBook.imageUrl || null 
    };
    this.books.set(id, book);
    return book;
  }
  
  // Game methods
  async getDailyBook(date: string): Promise<Book> {
    // Check if we have a custom book ID in the date string (format: YYYY-MM-DD_BOOKID)
    const parts = date.split('_');
    if (parts.length > 1) {
      const bookId = parseInt(parts[1], 10);
      if (!isNaN(bookId)) {
        const book = this.books.get(bookId);
        if (book) {
          console.log(`Using custom book "${book.title}" as daily book`);
          return book;
        }
      }
    }
    
    const books = Array.from(this.books.values());
    
    // Use the date to deterministically select a book
    const dateObj = new Date(parts[0]); // Use first part as date
    const dateNum = dateObj.getFullYear() * 10000 + (dateObj.getMonth() + 1) * 100 + dateObj.getDate();
    const index = dateNum % books.length;
    
    console.log(`Using random book "${books[index].title}" as daily book based on date`);
    return books[index];
  }
  
  async getGameState(date: string): Promise<GameState | undefined> {
    return this.gameStates.get(date);
  }
  
  async createGameState(date: string): Promise<GameState> {
    const dailyBook = await this.getDailyBook(date);
    
    const initialAttributes: BookAttribute[] = [
      { name: "Publication Year", value: dailyBook.publicationYear, icon: "calendar_today", revealed: false, type: "date" },
      { name: "Genre", value: dailyBook.genre, icon: "category", revealed: false, type: "text" },
      { name: "Author's Country", value: dailyBook.authorsCountry, icon: "public", revealed: false, type: "text" },
      { name: "Pages", value: dailyBook.pages, icon: "menu_book", revealed: false, type: "number" },
      { name: "Author", value: dailyBook.author, icon: "person", revealed: false, type: "text" },
      { name: "Original Language", value: dailyBook.originalLanguage, icon: "translate", revealed: false, type: "text" },
      { name: "Historical Period", value: dailyBook.historicalPeriod, icon: "history_edu", revealed: false, type: "text" }
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
    
    this.gameStates.set(date, gameState);
    return gameState;
  }
  
  async updateGameState(gameState: GameState): Promise<GameState> {
    this.gameStates.set(gameState.date, gameState);
    return gameState;
  }
  
  // Stats methods
  async getGameStats(userId: number): Promise<GameStats | undefined> {
    return this.gameStatsByUser.get(userId);
  }
  
  async updateGameStats(insertStats: InsertGameStats): Promise<GameStats> {
    const id = this.statsCurrentId++;
    const existingStats = await this.getGameStats(insertStats.userId);
    
    // Ensure all fields have values
    const stats: GameStats = { 
      id: existingStats?.id || id,
      userId: insertStats.userId,
      gamesPlayed: insertStats.gamesPlayed ?? 0,
      gamesWon: insertStats.gamesWon ?? 0,
      currentStreak: insertStats.currentStreak ?? 0,
      maxStreak: insertStats.maxStreak ?? 0,
      guessDistribution: insertStats.guessDistribution ?? "[]",
      lastPlayed: insertStats.lastPlayed ?? null
    };
    
    this.gameStatsByUser.set(stats.userId, stats);
    return stats;
  }
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getBooks(): Promise<Book[]> {
    const allBooks = await db.select().from(books);
    return allBooks;
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book || undefined;
  }

  async getBookByTitle(title: string): Promise<Book | undefined> {
    const allBooks = await this.getBooks();
    return allBooks.find(
      (book) => book.title.toLowerCase() === title.toLowerCase(),
    );
  }

  async addBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db
      .insert(books)
      .values(insertBook)
      .returning();
    return book;
  }

  async getDailyBook(date: string): Promise<Book> {
    const allBooks = await this.getBooks();
    if (allBooks.length === 0) {
      throw new Error("No books available");
    }
    
    // Use date string to deterministically select a book for the day
    const dateObj = new Date(date);
    // Generate a deterministic index based on the date
    const dateNum = dateObj.getFullYear() * 10000 + (dateObj.getMonth() + 1) * 100 + dateObj.getDate();
    const index = dateNum % allBooks.length;
    
    return allBooks[index];
  }

  async getGameState(date: string): Promise<GameState | undefined> {
    // For now, using the in-memory implementation as we need to set up the game_states table in Drizzle
    // This would be replaced with a proper query once the table is set up
    try {
      const result = await db.execute(
        sql`SELECT * FROM game_states WHERE id = ${`game-${date}`}`
      );
      
      if (result.length === 0) return undefined;
      
      const row = result[0];
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
      console.error(`Failed to get game state: ${error}`);
      return undefined;
    }
  }

  async createGameState(date: string): Promise<GameState> {
    try {
      const dailyBook = await this.getDailyBook(date);
      
      const initialAttributes: BookAttribute[] = [
        { name: "Publication Year", value: dailyBook.publicationYear, icon: "calendar", revealed: false, type: "date" },
        { name: "Genre", value: dailyBook.genre, icon: "bookmark", revealed: false, type: "text" },
        { name: "Author's Country", value: dailyBook.authorsCountry, icon: "globe", revealed: false, type: "text" },
        { name: "Pages", value: dailyBook.pages, icon: "file-text", revealed: false, type: "number" },
        { name: "Author", value: dailyBook.author, icon: "user", revealed: false, type: "text" },
        { name: "Original Language", value: dailyBook.originalLanguage, icon: "message-square", revealed: false, type: "text" },
        { name: "Historical Period", value: dailyBook.historicalPeriod, icon: "clock", revealed: false, type: "text" }
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
      
      // Insert into database
      await db.execute(
        sql`INSERT INTO game_states (id, date, daily_book_id, remaining_attempts, guesses, revealed_attributes, game_status) 
            VALUES (${gameState.id}, ${gameState.date}, ${gameState.dailyBookId}, ${gameState.remainingAttempts}, 
                    ${JSON.stringify(gameState.guesses)}, ${JSON.stringify(gameState.revealedAttributes)}, ${gameState.gameStatus})`
      );
      
      return gameState;
    } catch (error) {
      console.error(`Failed to create game state: ${error}`);
      throw new Error(`Failed to create game state: ${error}`);
    }
  }

  async updateGameState(gameState: GameState): Promise<GameState> {
    try {
      // Update in database
      await db.execute(
        sql`UPDATE game_states SET 
            date = ${gameState.date}, 
            daily_book_id = ${gameState.dailyBookId}, 
            remaining_attempts = ${gameState.remainingAttempts}, 
            guesses = ${JSON.stringify(gameState.guesses)}, 
            revealed_attributes = ${JSON.stringify(gameState.revealedAttributes)}, 
            game_status = ${gameState.gameStatus} 
            WHERE id = ${gameState.id}`
      );
      
      return gameState;
    } catch (error) {
      console.error(`Failed to update game state: ${error}`);
      throw new Error(`Failed to update game state: ${error}`);
    }
  }

  async getGameStats(userId: number): Promise<GameStats | undefined> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM game_stats WHERE user_id = ${userId}`
      );
      
      if (result.length === 0) return undefined;
      
      const row = result[0];
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
      console.error(`Failed to get game stats: ${error}`);
      return undefined;
    }
  }

  async updateGameStats(insertStats: InsertGameStats): Promise<GameStats> {
    try {
      const existingStats = await this.getGameStats(insertStats.userId);
      
      if (existingStats) {
        // Update existing stats
        const result = await db.execute(
          sql`UPDATE game_stats SET 
              games_played = ${insertStats.gamesPlayed ?? 0}, 
              games_won = ${insertStats.gamesWon ?? 0}, 
              current_streak = ${insertStats.currentStreak ?? 0}, 
              max_streak = ${insertStats.maxStreak ?? 0}, 
              guess_distribution = ${insertStats.guessDistribution ?? '[]'}, 
              last_played = ${insertStats.lastPlayed} 
              WHERE user_id = ${insertStats.userId} 
              RETURNING *`
        );
        
        const row = result[0];
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
      } else {
        // Insert new stats
        const result = await db.execute(
          sql`INSERT INTO game_stats (user_id, games_played, games_won, current_streak, max_streak, guess_distribution, last_played) 
              VALUES (${insertStats.userId}, ${insertStats.gamesPlayed ?? 0}, ${insertStats.gamesWon ?? 0}, 
                     ${insertStats.currentStreak ?? 0}, ${insertStats.maxStreak ?? 0}, 
                     ${insertStats.guessDistribution ?? '[]'}, ${insertStats.lastPlayed}) 
              RETURNING *`
        );
        
        const row = result[0];
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
      }
    } catch (error) {
      console.error(`Failed to update game stats: ${error}`);
      throw new Error(`Failed to update game stats: ${error}`);
    }
  }
}

export const storage = new MemStorage();
