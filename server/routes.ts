import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertBookSchema } from "@shared/schema";

// Helper for date formatting
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Helper for checking guess correctness and providing feedback
async function checkGuess(bookTitle: string, date: string) {
  const dailyBook = await storage.getDailyBook(date);
  const guessedBook = await storage.getBookByTitle(bookTitle);
  
  if (!guessedBook) {
    return { error: "Book not found in database" };
  }
  
  const isCorrect = guessedBook.id === dailyBook.id;
  
  // Define matching criteria
  const getPublicationYearStatus = () => {
    const diff = Math.abs(guessedBook.publicationYear - dailyBook.publicationYear);
    if (diff === 0) return "correct";
    if (diff <= 10) return "partial";
    return "incorrect";
  };
  
  const getPagesStatus = () => {
    const diff = Math.abs(guessedBook.pages - dailyBook.pages);
    const percentage = diff / dailyBook.pages;
    if (diff === 0) return "correct";
    if (percentage <= 0.15) return "partial"; // Within 15%
    return "incorrect";
  };
  
  // Create guess result
  const guess = {
    title: guessedBook.title,
    isCorrect,
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
    const books = await storage.getBooks();
    res.json(books.map(book => ({ id: book.id, title: book.title, author: book.author })));
  });
  
  // Search books by title
  app.get("/api/books/search", async (req: Request, res: Response) => {
    const searchQuery = req.query.q as string;
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.json([]);
    }
    
    const books = await storage.getBooks();
    const filteredBooks = books.filter(book => 
      book.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(book => ({ id: book.id, title: book.title, author: book.author }));
    
    res.json(filteredBooks.slice(0, 10)); // Limit to 10 results
  });
  
  // Add a new book (admin functionality)
  app.post("/api/books", async (req: Request, res: Response) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      const newBook = await storage.addBook(bookData);
      res.status(201).json(newBook);
    } catch (error) {
      res.status(400).json({ error: "Invalid book data" });
    }
  });
  
  // Get today's game state
  app.get("/api/game", async (req: Request, res: Response) => {
    const today = getTodayDateString();
    
    let gameState = await storage.getGameState(today);
    
    if (!gameState) {
      // Create new game state for today
      gameState = await storage.createGameState(today);
    }
    
    // Don't send the book ID in the response to avoid cheating
    const { dailyBookId, ...safeGameState } = gameState;
    
    res.json(safeGameState);
  });
  
  // Submit a guess
  app.post("/api/game/guess", async (req: Request, res: Response) => {
    const guessSchema = z.object({
      bookTitle: z.string().min(1)
    });
    
    try {
      const { bookTitle } = guessSchema.parse(req.body);
      const today = getTodayDateString();
      
      // Get or create game state
      let gameState = await storage.getGameState(today);
      if (!gameState) {
        gameState = await storage.createGameState(today);
      }
      
      // Check if game is already over
      if (gameState.gameStatus !== "active") {
        return res.status(400).json({ error: "Game is already over" });
      }
      
      // Check if book exists and compare with today's book
      const guessResult = await checkGuess(bookTitle, today);
      
      if ('error' in guessResult) {
        return res.status(404).json({ error: guessResult.error });
      }
      
      // Update game state
      gameState.remainingAttempts--;
      gameState.guesses.push(guessResult);
      
      // Reveal one attribute
      const unrevealed = gameState.revealedAttributes.filter(attr => !attr.revealed);
      if (unrevealed.length > 0) {
        // Reveal attributes in a specific order
        const orderPriority = [
          "Publication Year", "Genre", "Pages", "Author's Country", 
          "Original Language", "Historical Period", "Author"
        ];
        
        // Find the next attribute to reveal
        let nextToReveal = null;
        for (const attrName of orderPriority) {
          const attr = unrevealed.find(a => a.name === attrName);
          if (attr) {
            nextToReveal = attr;
            break;
          }
        }
        
        // If no prioritized attribute found, just take the first unrevealed
        if (!nextToReveal && unrevealed.length > 0) {
          nextToReveal = unrevealed[0];
        }
        
        if (nextToReveal) {
          const index = gameState.revealedAttributes.findIndex(
            attr => attr.name === nextToReveal?.name
          );
          if (index !== -1) {
            gameState.revealedAttributes[index].revealed = true;
          }
        }
      }
      
      // Check if game is over
      if (guessResult.isCorrect) {
        gameState.gameStatus = "won";
      } else if (gameState.remainingAttempts <= 0) {
        gameState.gameStatus = "lost";
      }
      
      // Save updated game state
      await storage.updateGameState(gameState);
      
      // If game is over, include the correct book
      if (gameState.gameStatus !== "active") {
        const dailyBook = await storage.getBook(gameState.dailyBookId);
        return res.json({ 
          guessResult, 
          gameState: { 
            ...gameState, 
            dailyBookId: undefined 
          }, 
          dailyBook 
        });
      }
      
      // Return the guess result and updated game state (without dailyBookId)
      const { dailyBookId, ...safeGameState } = gameState;
      res.json({ guessResult, gameState: safeGameState });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });
  
  // Get stats
  app.get("/api/stats", async (req: Request, res: Response) => {
    // For simplicity, we'll use a fixed user ID
    const userId = 1;
    
    let stats = await storage.getGameStats(userId);
    
    if (!stats) {
      // Create default stats
      stats = await storage.updateGameStats({
        userId,
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: "[]", // Empty JSON array as string
        lastPlayed: undefined
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
      let stats = await storage.getGameStats(userId);
      
      if (!stats) {
        stats = {
          id: 1,
          userId,
          gamesPlayed: 0,
          gamesWon: 0,
          currentStreak: 0,
          maxStreak: 0,
          guessDistribution: "[]",
          lastPlayed: undefined
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
      const updatedStats = await storage.updateGameStats({
        ...stats,
        guessDistribution: JSON.stringify(distribution),
        lastPlayed: today
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
