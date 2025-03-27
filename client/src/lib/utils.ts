import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get today's date in YYYY-MM-DD format
export function getTodayDateString(): string {
  return formatDate(new Date());
}

// Format remaining time for countdown
export function formatTimeRemaining(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) return "00:00:00";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
}

// Calculate end of current day
export function getEndOfDay(): Date {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

// Calculate guess status color class based on status
export function getStatusColorClass(status: "correct" | "partial" | "incorrect"): string {
  switch (status) {
    case "correct":
      return "bg-green-500";
    case "partial":
      return "bg-yellow-500";
    case "incorrect":
      return "bg-red-500";
    default:
      return "bg-slate-300";
  }
}

// Calculate win percentage
export function calculateWinPercentage(gamesPlayed: number, gamesWon: number): string {
  if (gamesPlayed === 0) return "0%";
  return Math.round((gamesWon / gamesPlayed) * 100) + "%";
}

// Generate share text for results
export function generateShareText(gameNumber: number, attempts: number, won: boolean): string {
  if (!won) {
    return `Bookaneer #${gameNumber}: I couldn't guess today's book in 8 attempts!`;
  }
  return `Bookaneer #${gameNumber}: I guessed today's book in ${attempts}/8 attempts!`;
}
