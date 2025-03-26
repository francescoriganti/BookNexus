import { createClient } from '@supabase/supabase-js';
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
import { getTodayDateString } from '../client/src/lib/utils';

const supabaseUrl = 'https://nkcoydainagcupxxkra.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([insertUser])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data as User;
  }

  // Book methods
  async getBooks(): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*');
    
    if (error) return [];
    
    // Convert from snake_case to camelCase
    return data.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      publicationYear: book.publication_year,
      genre: book.genre,
      authorsCountry: book.authors_country,
      pages: book.pages,
      originalLanguage: book.original_language,
      historicalPeriod: book.historical_period
    })) as Book[];
  }

  async getBook(id: number): Promise<Book | undefined> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
    // Convert from snake_case to camelCase
    return {
      id: data.id,
      title: data.title,
      author: data.author,
      publicationYear: data.publication_year,
      genre: data.genre,
      authorsCountry: data.authors_country,
      pages: data.pages,
      originalLanguage: data.original_language,
      historicalPeriod: data.historical_period
    } as Book;
  }

  async getBookByTitle(title: string): Promise<Book | undefined> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .ilike('title', title)
      .single();
    
    if (error || !data) return undefined;
    
    // Convert from snake_case to camelCase
    return {
      id: data.id,
      title: data.title,
      author: data.author,
      publicationYear: data.publication_year,
      genre: data.genre,
      authorsCountry: data.authors_country,
      pages: data.pages,
      originalLanguage: data.original_language,
      historicalPeriod: data.historical_period
    } as Book;
  }

  async addBook(insertBook: InsertBook): Promise<Book> {
    // Convert to snake_case for Supabase
    const dbData = {
      title: insertBook.title,
      author: insertBook.author,
      publication_year: insertBook.publicationYear,
      genre: insertBook.genre,
      authors_country: insertBook.authorsCountry,
      pages: insertBook.pages,
      original_language: insertBook.originalLanguage,
      historical_period: insertBook.historicalPeriod
    };
    
    const { data, error } = await supabase
      .from('books')
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create book: ${error.message}`);
    
    // Convert from snake_case to camelCase
    return {
      id: data.id,
      title: data.title,
      author: data.author,
      publicationYear: data.publication_year,
      genre: data.genre,
      authorsCountry: data.authors_country,
      pages: data.pages,
      originalLanguage: data.original_language,
      historicalPeriod: data.historical_period
    } as Book;
  }

  // Game methods
  async getDailyBook(date: string): Promise<Book> {
    // We'll use a deterministic way to select the daily book based on the date
    // This ensures the same book is chosen for all users on the same day
    
    const { data: books, error } = await supabase
      .from('books')
      .select('*');
    
    if (error || !books || books.length === 0) {
      throw new Error('No books available');
    }
    
    // Use the date string to generate a deterministic index
    const dateObj = new Date(date);
    const dateNum = dateObj.getDate() + dateObj.getMonth() * 31;
    const bookIndex = dateNum % books.length;
    
    // Get the selected book and convert from snake_case to camelCase
    const book = books[bookIndex];
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      publicationYear: book.publication_year,
      genre: book.genre,
      authorsCountry: book.authors_country,
      pages: book.pages,
      originalLanguage: book.original_language,
      historicalPeriod: book.historical_period
    } as Book;
  }

  async getGameState(date: string): Promise<GameState | undefined> {
    const { data, error } = await supabase
      .from('game_states')
      .select('*')
      .eq('date', date)
      .single();
    
    if (error || !data) return undefined;
    
    // Parse JSON strings from database and convert to camelCase
    return {
      id: data.id,
      date: data.date,
      dailyBookId: data.daily_book_id,
      remainingAttempts: data.remaining_attempts,
      guesses: JSON.parse(data.guesses),
      revealedAttributes: JSON.parse(data.revealed_attributes),
      gameStatus: data.game_status
    } as GameState;
  }

  async createGameState(date: string): Promise<GameState> {
    // Get daily book for the date
    const dailyBook = await this.getDailyBook(date);
    
    // Create attribute objects for the book
    const attributes = [
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
        icon: "bookType",
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
        icon: "bookOpen",
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
        icon: "languages",
        revealed: false,
        type: "text" as const
      },
      {
        name: "Historical Period",
        value: dailyBook.historicalPeriod,
        icon: "history",
        revealed: false,
        type: "text" as const
      }
    ];
    
    // Create a new game state
    const gameState: Omit<GameState, 'id'> = {
      date,
      dailyBookId: dailyBook.id,
      remainingAttempts: 8,
      guesses: [],
      revealedAttributes: attributes,
      gameStatus: "active"
    };
    
    // Store as strings in database with snake_case column names
    const { data, error } = await supabase
      .from('game_states')
      .insert([{
        id: `game-${date}`,
        date: date,
        daily_book_id: gameState.dailyBookId,
        remaining_attempts: gameState.remainingAttempts,
        guesses: JSON.stringify(gameState.guesses),
        revealed_attributes: JSON.stringify(gameState.revealedAttributes),
        game_status: gameState.gameStatus
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create game state: ${error.message}`);
    
    // Parse the JSON strings back to objects and convert to camelCase
    return {
      id: data.id,
      date: data.date,
      dailyBookId: data.daily_book_id,
      remainingAttempts: data.remaining_attempts,
      guesses: JSON.parse(data.guesses),
      revealedAttributes: JSON.parse(data.revealed_attributes),
      gameStatus: data.game_status
    } as GameState;
  }

  async updateGameState(gameState: GameState): Promise<GameState> {
    // Convert to snake_case and store arrays as JSON strings
    const { data, error } = await supabase
      .from('game_states')
      .update({
        date: gameState.date,
        daily_book_id: gameState.dailyBookId,
        remaining_attempts: gameState.remainingAttempts,
        guesses: JSON.stringify(gameState.guesses),
        revealed_attributes: JSON.stringify(gameState.revealedAttributes),
        game_status: gameState.gameStatus
      })
      .eq('id', gameState.id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update game state: ${error.message}`);
    
    // Parse JSON strings back to objects and convert to camelCase
    return {
      id: data.id,
      date: data.date,
      dailyBookId: data.daily_book_id,
      remainingAttempts: data.remaining_attempts,
      guesses: JSON.parse(data.guesses),
      revealedAttributes: JSON.parse(data.revealed_attributes),
      gameStatus: data.game_status
    } as GameState;
  }

  // Stats methods
  async getGameStats(userId: number): Promise<GameStats | undefined> {
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return undefined;
    
    // Convert from snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      gamesPlayed: data.games_played,
      gamesWon: data.games_won,
      currentStreak: data.current_streak,
      maxStreak: data.max_streak,
      guessDistribution: data.guess_distribution,
      lastPlayed: data.last_played
    } as GameStats;
  }

  async updateGameStats(insertStats: InsertGameStats): Promise<GameStats> {
    // Check if stats exist
    const existing = await this.getGameStats(insertStats.userId);
    
    // Convert to snake_case for Supabase
    const dbData = {
      user_id: insertStats.userId,
      games_played: insertStats.gamesPlayed,
      games_won: insertStats.gamesWon,
      current_streak: insertStats.currentStreak,
      max_streak: insertStats.maxStreak,
      guess_distribution: insertStats.guessDistribution,
      last_played: insertStats.lastPlayed
    };
    
    if (existing) {
      // Update existing stats
      const { data, error } = await supabase
        .from('game_stats')
        .update(dbData)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update game stats: ${error.message}`);
      
      // Convert back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        gamesPlayed: data.games_played,
        gamesWon: data.games_won,
        currentStreak: data.current_streak,
        maxStreak: data.max_streak,
        guessDistribution: data.guess_distribution,
        lastPlayed: data.last_played
      } as GameStats;
    } else {
      // Create new stats record
      const { data, error } = await supabase
        .from('game_stats')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create game stats: ${error.message}`);
      
      // Convert back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        gamesPlayed: data.games_played,
        gamesWon: data.games_won,
        currentStreak: data.current_streak,
        maxStreak: data.max_streak,
        guessDistribution: data.guess_distribution,
        lastPlayed: data.last_played
      } as GameStats;
    }
  }
}

// Export a singleton instance
export const supabaseStorage = new SupabaseStorage();