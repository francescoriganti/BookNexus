import { createClient } from '@supabase/supabase-js';
import { 
  type IStorage, 
  type Book, 
  type InsertBook, 
  type User, 
  type InsertUser, 
  type GameStats, 
  type InsertGameStats, 
  type GameState 
} from './storage';
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
    return data as Book[];
  }

  async getBook(id: number): Promise<Book | undefined> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Book;
  }

  async getBookByTitle(title: string): Promise<Book | undefined> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .ilike('title', title)
      .single();
    
    if (error || !data) return undefined;
    return data as Book;
  }

  async addBook(insertBook: InsertBook): Promise<Book> {
    const { data, error } = await supabase
      .from('books')
      .insert([insertBook])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create book: ${error.message}`);
    return data as Book;
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
    
    return books[bookIndex] as Book;
  }

  async getGameState(date: string): Promise<GameState | undefined> {
    const { data, error } = await supabase
      .from('game_states')
      .select('*')
      .eq('date', date)
      .single();
    
    if (error || !data) return undefined;
    
    // Parse JSON strings from database
    return {
      ...data,
      guesses: JSON.parse(data.guesses),
      revealedAttributes: JSON.parse(data.revealedAttributes)
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
    
    // Store as strings in database
    const { data, error } = await supabase
      .from('game_states')
      .insert([{
        ...gameState,
        id: `game-${date}`,
        guesses: JSON.stringify(gameState.guesses),
        revealedAttributes: JSON.stringify(gameState.revealedAttributes)
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create game state: ${error.message}`);
    
    // Parse the JSON strings back to objects
    return {
      ...data,
      guesses: JSON.parse(data.guesses),
      revealedAttributes: JSON.parse(data.revealedAttributes)
    } as GameState;
  }

  async updateGameState(gameState: GameState): Promise<GameState> {
    // Store arrays as JSON strings
    const { data, error } = await supabase
      .from('game_states')
      .update({
        ...gameState,
        guesses: JSON.stringify(gameState.guesses),
        revealedAttributes: JSON.stringify(gameState.revealedAttributes)
      })
      .eq('id', gameState.id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update game state: ${error.message}`);
    
    // Parse JSON strings back to objects
    return {
      ...data,
      guesses: JSON.parse(data.guesses),
      revealedAttributes: JSON.parse(data.revealedAttributes)
    } as GameState;
  }

  // Stats methods
  async getGameStats(userId: number): Promise<GameStats | undefined> {
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('userId', userId)
      .single();
    
    if (error || !data) return undefined;
    return data as GameStats;
  }

  async updateGameStats(insertStats: InsertGameStats): Promise<GameStats> {
    // Check if stats exist
    const existing = await this.getGameStats(insertStats.userId);
    
    if (existing) {
      // Update existing stats
      const { data, error } = await supabase
        .from('game_stats')
        .update(insertStats)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update game stats: ${error.message}`);
      return data as GameStats;
    } else {
      // Create new stats record
      const { data, error } = await supabase
        .from('game_stats')
        .insert([insertStats])
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create game stats: ${error.message}`);
      return data as GameStats;
    }
  }
}

// Export a singleton instance
export const supabaseStorage = new SupabaseStorage();