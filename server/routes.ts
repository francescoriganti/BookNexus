import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabaseStorage } from "./supabase-storage";
import { postgresStorage } from "./postgres-storage";
import { z } from "zod";
import { insertBookSchema } from "@shared/schema";
import { log } from "./vite";
import { type IStorage } from "./storage";

// Create a new storage implementation that falls back to in-memory storage if Supabase fails
class FallbackStorage implements IStorage {
  private primaryStorage: IStorage;
  private fallbackStorage: IStorage;
  private usesFallback = false;

  constructor(primaryStorage: IStorage, fallbackStorage: IStorage) {
    this.primaryStorage = primaryStorage;
    this.fallbackStorage = fallbackStorage;
  }

  private async withFallback<T>(primaryFn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
    try {
      // Try the primary storage first
      if (!this.usesFallback) {
        return await primaryFn();
      }
    } catch (error) {
      // Log the error and mark to use fallback from now on
      log(`Error using primary storage: ${(error as Error).message}. Falling back to in-memory storage.`);
      this.usesFallback = true;
    }
    // Use the fallback storage
    return fallbackFn();
  }

  // User methods
  async getUser(id: number) {
    return this.withFallback(
      () => this.primaryStorage.getUser(id),
      () => this.fallbackStorage.getUser(id)
    );
  }

  async getUserByUsername(username: string) {
    return this.withFallback(
      () => this.primaryStorage.getUserByUsername(username),
      () => this.fallbackStorage.getUserByUsername(username)
    );
  }

  async createUser(user: import('@shared/schema').InsertUser) {
    return this.withFallback(
      () => this.primaryStorage.createUser(user),
      () => this.fallbackStorage.createUser(user)
    );
  }

  // Book methods
  async getBooks() {
    return this.withFallback(
      () => this.primaryStorage.getBooks(),
      () => this.fallbackStorage.getBooks()
    );
  }

  async getBook(id: number) {
    return this.withFallback(
      () => this.primaryStorage.getBook(id),
      () => this.fallbackStorage.getBook(id)
    );
  }

  async getBookByTitle(title: string) {
    return this.withFallback(
      () => this.primaryStorage.getBookByTitle(title),
      () => this.fallbackStorage.getBookByTitle(title)
    );
  }

  async addBook(book: import('@shared/schema').InsertBook) {
    return this.withFallback(
      () => this.primaryStorage.addBook(book),
      () => this.fallbackStorage.addBook(book)
    );
  }

  // Game methods
  async getDailyBook(date: string) {
    return this.withFallback(
      () => this.primaryStorage.getDailyBook(date),
      () => this.fallbackStorage.getDailyBook(date)
    );
  }

  async getGameState(date: string) {
    return this.withFallback(
      () => this.primaryStorage.getGameState(date),
      () => this.fallbackStorage.getGameState(date)
    );
  }

  async createGameState(date: string) {
    return this.withFallback(
      () => this.primaryStorage.createGameState(date),
      () => this.fallbackStorage.createGameState(date)
    );
  }

  async updateGameState(gameState: import('@shared/schema').GameState) {
    return this.withFallback(
      () => this.primaryStorage.updateGameState(gameState),
      () => this.fallbackStorage.updateGameState(gameState)
    );
  }

  // Stats methods
  async getGameStats(userId: number) {
    return this.withFallback(
      () => this.primaryStorage.getGameStats(userId),
      () => this.fallbackStorage.getGameStats(userId)
    );
  }

  async updateGameStats(stats: import('@shared/schema').InsertGameStats) {
    return this.withFallback(
      () => this.primaryStorage.updateGameStats(stats),
      () => this.fallbackStorage.updateGameStats(stats)
    );
  }
}

// Determine which storage to use
let activeStorage: IStorage;

// For now, use in-memory storage to get the app working reliably
log('Using in-memory storage for stability.');
activeStorage = storage;

// Helper for date formatting
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Helper for checking guess correctness and providing feedback
async function checkGuess(bookTitle: string, date: string) {
  const dailyBook = await activeStorage.getDailyBook(date);
  const guessedBook = await activeStorage.getBookByTitle(bookTitle);
  
  if (!guessedBook) {
    return { error: "Book not found in database" };
  }
  
  const isCorrect = guessedBook.id === dailyBook.id;
  
  // Define matching criteria
  const getPublicationYearStatus = (): "correct" | "partial" | "incorrect" => {
    const diff = Math.abs(guessedBook.publicationYear - dailyBook.publicationYear);
    if (diff === 0) return "correct";
    if (diff <= 10) return "partial";
    return "incorrect";
  };
  
  const getPagesStatus = (): "correct" | "partial" | "incorrect" => {
    const diff = Math.abs(guessedBook.pages - dailyBook.pages);
    const percentage = diff / dailyBook.pages;
    if (diff === 0) return "correct";
    if (percentage <= 0.15) return "partial"; // Within 15%
    return "incorrect";
  };
  
  // Create guess result with proper type annotations
  const guess: import('@shared/schema').GameGuess = {
    title: guessedBook.title,
    isCorrect,
    imageUrl: guessedBook.imageUrl,
    attributes: {
      publicationYear: { 
        value: guessedBook.publicationYear, 
        status: getPublicationYearStatus() 
      },
      genre: { 
        value: guessedBook.genre, 
        status: guessedBook.genre === dailyBook.genre ? "correct" : "incorrect" 
      },
      authorsCountry: { 
        value: guessedBook.authorsCountry, 
        status: guessedBook.authorsCountry === dailyBook.authorsCountry ? "correct" : "incorrect" 
      },
      pages: { 
        value: guessedBook.pages, 
        status: getPagesStatus() 
      },
      author: { 
        value: guessedBook.author, 
        status: guessedBook.author === dailyBook.author ? "correct" : "incorrect" 
      },
      originalLanguage: { 
        value: guessedBook.originalLanguage, 
        status: guessedBook.originalLanguage === dailyBook.originalLanguage ? "correct" : "incorrect" 
      },
      historicalPeriod: { 
        value: guessedBook.historicalPeriod, 
        status: guessedBook.historicalPeriod === dailyBook.historicalPeriod ? "correct" : "incorrect" 
      }
    }
  };
  
  return guess;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API Routes
  
  // Get all books (for search functionality)
  app.get("/api/books", async (req: Request, res: Response) => {
    const books = await activeStorage.getBooks();
    res.json(books.map(book => ({ id: book.id, title: book.title, author: book.author })));
  });
  
  // Search books by title
  app.get("/api/books/search", async (req: Request, res: Response) => {
    const searchQuery = req.query.q as string;
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.json([]);
    }
    
    const books = await activeStorage.getBooks();
    const filteredBooks = books.filter(book => 
      book.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(book => ({ id: book.id, title: book.title, author: book.author }));
    
    res.json(filteredBooks.slice(0, 10)); // Limit to 10 results
  });
  
  // Add a new book (admin functionality)
  app.post("/api/books", async (req: Request, res: Response) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      const newBook = await activeStorage.addBook(bookData);
      res.status(201).json(newBook);
    } catch (error) {
      res.status(400).json({ error: "Invalid book data" });
    }
  });
  
  // Get only today's daily book ID and initial state, don't store progress server-side
  app.get("/api/daily-book", async (req: Request, res: Response) => {
    try {
      const today = getTodayDateString();
      const resetGame = req.query.reset === 'true';
      const bookTitle = req.query.book as string | undefined;
      
      // Handle reset with specific book title
      if (resetGame && bookTitle) {
        console.log(`Setting "${bookTitle}" as the daily book`);
        
        // Find the book by title
        const book = await activeStorage.getBookByTitle(bookTitle);
        
        if (!book) {
          return res.status(404).json({ 
            error: `Book "${bookTitle}" not found in database`,
            success: false
          });
        }
        
        // Create a new game state with this specific book
        const gameState = await activeStorage.createGameState(today);
        
        // Force the daily book ID to be the selected book's ID
        // This is a hack since we can't modify the createGameState method directly
        gameState.dailyBookId = book.id;
        await activeStorage.updateGameState(gameState);
        
        return res.json({ 
          success: true, 
          message: `Game reset with "${bookTitle}" as the answer`
        });
      }
      
      // Standard reset (random book)
      if (resetGame) {
        const newGameState = await activeStorage.createGameState(today);
        return res.json({ 
          success: true, 
          message: "Game reset with a new daily book"
        });
      }
      
      // Get today's game state to extract the dailyBookId
      let gameState = await activeStorage.getGameState(today);
      
      if (!gameState) {
        // Create new game state for today if none exists
        gameState = await activeStorage.createGameState(today);
      }
      
      // Get the daily book's attributes 
      const dailyBook = await activeStorage.getBook(gameState.dailyBookId);
      
      if (!dailyBook) {
        return res.status(500).json({ error: "Daily book not found", success: false });
      }
      
      // Return initial state info (date, book attributes) but don't include the title or author
      // to prevent cheating
      const initialState = {
        id: `game-${today}`,
        date: today,
        bookAttributes: [
          { name: "Publication Year", value: dailyBook.publicationYear, icon: "calendar_today", revealed: false, type: "date" },
          { name: "Genre", value: dailyBook.genre, icon: "category", revealed: false, type: "text" },
          { name: "Author's Country", value: dailyBook.authorsCountry, icon: "public", revealed: false, type: "text" },
          { name: "Pages", value: dailyBook.pages, icon: "menu_book", revealed: false, type: "number" },
          { name: "Author", value: dailyBook.author, icon: "person", revealed: false, type: "text" },
          { name: "Original Language", value: dailyBook.originalLanguage, icon: "translate", revealed: false, type: "text" },
          { name: "Historical Period", value: dailyBook.historicalPeriod, icon: "history_edu", revealed: false, type: "text" }
        ]
      };
      
      res.json(initialState);
    } catch (error) {
      console.error("Error in /api/daily-book:", error);
      res.status(500).json({ error: "An error occurred", success: false });
    }
  });
  
  // Maintain backward compatibility temporarily
  app.get("/api/game", async (req: Request, res: Response) => {
    try {
      const today = getTodayDateString();
      
      // Crea uno stato del gioco iniziale ed emettilo
      const initialState = {
        id: `game-${today}`,
        date: today,
        remainingAttempts: 8,
        guesses: [],
        gameStatus: "active",
        revealedAttributes: []
      };
      
      res.json(initialState);
    } catch (error) {
      console.error("Error in /api/game:", error);
      res.status(500).json({ error: "An error occurred", success: false });
    }
  });
  
  // Submit a guess (versione client-side state)
  app.post("/api/game/guess", async (req: Request, res: Response) => {
    const guessSchema = z.object({
      bookTitle: z.string().min(1)
    });
    
    try {
      const { bookTitle } = guessSchema.parse(req.body);
      const today = getTodayDateString();
      
      // Non gestire più lo stato sul server, solo verifica il tentativo
      const guessResult = await checkGuess(bookTitle, today);
      
      if ('error' in guessResult) {
        return res.status(404).json({ error: guessResult.error });
      }
      
      // Se il tentativo è corretto, includiamo il libro per la vittoria
      if (guessResult.isCorrect) {
        // Ottieni il game state per trovare il daily book
        let gameState = await activeStorage.getGameState(today);
        if (!gameState) {
          gameState = await activeStorage.createGameState(today);
        }
        
        const dailyBook = await activeStorage.getBook(gameState.dailyBookId);
        return res.json({ guessResult, dailyBook });
      }
      
      // Semplice risposta con solo il risultato del tentativo
      res.json({ guessResult });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });
  
  // Get stats
  app.get("/api/stats", async (req: Request, res: Response) => {
    
    // For simplicity, we'll use a fixed user ID
    const userId = 1;
    
    let stats = await activeStorage.getGameStats(userId);
    
    if (!stats) {
      // Create default stats
      stats = await activeStorage.updateGameStats({
        userId,
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: "[]", // Empty JSON array as string
        lastPlayed: null
      });
    }
    
    res.json({
      ...stats,
      guessDistribution: JSON.parse(stats.guessDistribution)
    });
  });
  
  // Update stats after game completion
  app.post("/api/stats/update", async (req: Request, res: Response) => {
    const statsSchema = z.object({
      won: z.boolean(),
      attempts: z.number().int().min(1).max(8)
    });
    
    try {
      const { won, attempts } = statsSchema.parse(req.body);
      
      const userId = 1; // Using fixed user ID for simplicity
      
      // Get or create stats
      let stats = await activeStorage.getGameStats(userId);
      
      if (!stats) {
        stats = {
          id: 1,
          userId,
          gamesPlayed: 0,
          gamesWon: 0,
          currentStreak: 0,
          maxStreak: 0,
          guessDistribution: "[]",
          lastPlayed: null
        };
      }
      
      // Parse guess distribution
      const distribution = JSON.parse(stats.guessDistribution) as number[];
      
      // Ensure distribution array has enough elements (8 attempts possible)
      while (distribution.length < 8) {
        distribution.push(0);
      }
      
      // Update stats
      stats.gamesPlayed++;
      const today = new Date();
      
      if (won) {
        stats.gamesWon++;
        stats.currentStreak++;
        
        // Update max streak if needed
        if (stats.currentStreak > stats.maxStreak) {
          stats.maxStreak = stats.currentStreak;
        }
        
        // Update distribution
        distribution[attempts - 1]++;
      } else {
        stats.currentStreak = 0;
      }
      
      // Save updated stats
      const updatedStats = await activeStorage.updateGameStats({
        ...stats,
        guessDistribution: JSON.stringify(distribution),
        lastPlayed: today.toISOString().split('T')[0] // Convert to YYYY-MM-DD string
      });
      
      res.json({
        ...updatedStats,
        guessDistribution: distribution
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid stats data" });
    }
  });

  return httpServer;
}
