import { 
  books, type Book, type InsertBook, 
  users, type User, type InsertUser,
  gameStats, type GameStats, type InsertGameStats,
  type GameState, type GameGuess, type BookAttribute
} from "@shared/schema";

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
    
    // Initialize with sample books
    this.initializeSampleBooks();
  }
  
  private initializeSampleBooks() {
    const sampleBooks: InsertBook[] = [
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        publicationYear: 1960,
        genre: "Fiction",
        authorsCountry: "United States",
        pages: 281,
        originalLanguage: "English",
        historicalPeriod: "Great Depression"
      },
      {
        title: "1984",
        author: "George Orwell",
        publicationYear: 1949,
        genre: "Dystopian",
        authorsCountry: "United Kingdom",
        pages: 328,
        originalLanguage: "English",
        historicalPeriod: "Post-WWII"
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        publicationYear: 1813,
        genre: "Romance",
        authorsCountry: "United Kingdom",
        pages: 432,
        originalLanguage: "English",
        historicalPeriod: "Regency Era"
      },
      {
        title: "One Hundred Years of Solitude",
        author: "Gabriel García Márquez",
        publicationYear: 1967,
        genre: "Magical Realism",
        authorsCountry: "Colombia",
        pages: 417,
        originalLanguage: "Spanish",
        historicalPeriod: "19th-20th Century"
      },
      {
        title: "Crime and Punishment",
        author: "Fyodor Dostoevsky",
        publicationYear: 1866,
        genre: "Psychological Fiction",
        authorsCountry: "Russia",
        pages: 545,
        originalLanguage: "Russian",
        historicalPeriod: "19th Century"
      },
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        publicationYear: 1925,
        genre: "Fiction",
        authorsCountry: "United States",
        pages: 180,
        originalLanguage: "English",
        historicalPeriod: "Roaring Twenties"
      },
      {
        title: "Moby-Dick",
        author: "Herman Melville",
        publicationYear: 1851,
        genre: "Adventure",
        authorsCountry: "United States",
        pages: 635,
        originalLanguage: "English",
        historicalPeriod: "19th Century"
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
    const book: Book = { ...insertBook, id };
    this.books.set(id, book);
    return book;
  }
  
  // Game methods
  async getDailyBook(date: string): Promise<Book> {
    // Use date string to deterministically select a book for the day
    const books = Array.from(this.books.values());
    const dateObj = new Date(date);
    // Generate a deterministic index based on the date
    const dateNum = dateObj.getFullYear() * 10000 + (dateObj.getMonth() + 1) * 100 + dateObj.getDate();
    const index = dateNum % books.length;
    
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

export const storage = new MemStorage();
