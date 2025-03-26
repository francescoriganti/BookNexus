import { pgTable, text, serial, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Book schema
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  publicationYear: integer("publication_year").notNull(),
  genre: text("genre").notNull(),
  authorsCountry: text("authors_country").notNull(),
  pages: integer("pages").notNull(),
  originalLanguage: text("original_language").notNull(),
  historicalPeriod: text("historical_period").notNull(),
  imageUrl: text("image_url").default(""),  // URL dell'immagine di copertina del libro
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
});

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

// Game stats schema
export const gameStats = pgTable("game_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  guessDistribution: text("guess_distribution").notNull().default("[]"),
  lastPlayed: date("last_played"),
});

export const insertGameStatsSchema = createInsertSchema(gameStats).omit({
  id: true,
});

export type InsertGameStats = z.infer<typeof insertGameStatsSchema>;
export type GameStats = typeof gameStats.$inferSelect;

// Game state types (not stored in DB but used for game logic)
export type GameGuess = {
  title: string;
  isCorrect: boolean;
  imageUrl?: string | null;
  attributes: {
    publicationYear: { value: number; status: "correct" | "partial" | "incorrect" };
    genre: { value: string; status: "correct" | "partial" | "incorrect" };
    authorsCountry: { value: string; status: "correct" | "partial" | "incorrect" };
    pages: { value: number; status: "correct" | "partial" | "incorrect" };
    author: { value: string; status: "correct" | "partial" | "incorrect" };
    originalLanguage: { value: string; status: "correct" | "partial" | "incorrect" };
    historicalPeriod: { value: string; status: "correct" | "partial" | "incorrect" };
  };
};

export type BookAttribute = {
  name: string;
  value: string | number;
  icon: string;
  revealed: boolean;
  type: "date" | "text" | "number";
};

export type GameState = {
  id: string;
  date: string;
  dailyBookId: number;
  remainingAttempts: number;
  guesses: GameGuess[];
  revealedAttributes: BookAttribute[];
  gameStatus: "active" | "won" | "lost";
};
