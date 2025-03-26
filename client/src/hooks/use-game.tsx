import { 
  createContext, 
  useState, 
  useContext, 
  useEffect, 
  ReactNode,
  FC
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getTodayDateString } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type GameState, type Book, type GameGuess, type GameStats } from "@shared/schema";

// Context types
type GameContextType = {
  gameState: GameState | null;
  isLoading: boolean;
  makeGuess: (bookTitle: string) => void;
  isPending: boolean;
  searchBooks: (query: string) => Promise<{ id: number, title: string, author: string }[]>;
  openGameResultModal: () => void;
  openStatsModal: () => void;
  openHowToPlayModal: () => void;
  stats: GameStats & { guessDistribution: number[] } | null;
  gameNumber: number;
  dailyBook: Book | null;
  hasUpdatedStats: boolean;
  updateStats: () => Promise<void>;
};

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const useGameProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [dailyBook, setDailyBook] = useState<Book | null>(null);
  const [hasUpdatedStats, setHasUpdatedStats] = useState(false);
  
  // Calculate a "game number" based on days since launch
  const launchDate = new Date('2023-01-01'); // Arbitrary launch date
  const today = new Date();
  const gameNumber = Math.floor((today.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Fetch game state
  const { 
    data: gameState, 
    isLoading 
  } = useQuery<GameState>({
    queryKey: ['/api/game'],
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  });
  
  // Fetch stats
  const { 
    data: stats 
  } = useQuery<GameStats & { guessDistribution: number[] }>({
    queryKey: ['/api/stats'],
    refetchOnWindowFocus: false,
    staleTime: 3600000, // 1 hour
  });
  
  // Submit guess mutation
  const { 
    mutate: submitGuess,
    isPending
  } = useMutation({
    mutationFn: async (bookTitle: string) => {
      const response = await apiRequest('POST', '/api/game/guess', { bookTitle });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }
      
      // Log game state data for debugging
      console.log("Game state updated:", data.gameState);
      
      // Ensure we handle revealedAttributes properly
      if (data.gameState && data.gameState.revealedAttributes) {
        // Make sure revealedAttributes is properly processed
        queryClient.setQueryData(['/api/game'], {
          ...data.gameState,
          revealedAttributes: data.gameState.revealedAttributes
        });
        
        // Check what we've revealed so far
        const revealedCount = data.gameState.revealedAttributes.filter((attr: any) => attr.revealed).length;
        console.log(`Revealed ${revealedCount} attributes so far`);
      } else {
        queryClient.setQueryData(['/api/game'], data.gameState);
      }
      
      if (data.dailyBook) {
        setDailyBook(data.dailyBook);
        
        // If game is over, show the result modal
        openGameResultModal();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit guess",
        variant: "destructive"
      });
    }
  });
  
  // Update stats mutation
  const { 
    mutate: updateStatsMutation,
  } = useMutation({
    mutationFn: async () => {
      if (!gameState || gameState.gameStatus === "active") return;
      
      const won = gameState.gameStatus === "won";
      const attempts = 8 - gameState.remainingAttempts;
      
      const response = await apiRequest('POST', '/api/stats/update', { 
        won, 
        attempts 
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['/api/stats'], data);
        setHasUpdatedStats(true);
      }
    }
  });
  
  // Modal functions
  const openGameResultModal = () => {
    document.getElementById("gameResultModal")?.click();
  };
  
  const openStatsModal = () => {
    document.getElementById("statsModal")?.click();
  };
  
  const openHowToPlayModal = () => {
    document.getElementById("howToPlayModal")?.click();
  };
  
  // Make a guess
  const makeGuess = (bookTitle: string) => {
    if (!bookTitle.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a book title",
        variant: "destructive"
      });
      return;
    }
    
    // Submit the guess
    submitGuess(bookTitle);
  };
  
  // Search books
  const searchBooks = async (query: string) => {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error searching books:", error);
      return [];
    }
  };
  
  // Update stats when game is over
  const updateStats = async () => {
    updateStatsMutation();
  };
  
  // Value for the context
  const value: GameContextType = {
    gameState: gameState || null,
    isLoading,
    makeGuess,
    isPending,
    searchBooks,
    openGameResultModal,
    openStatsModal,
    openHowToPlayModal,
    stats: stats || null,
    gameNumber,
    dailyBook,
    hasUpdatedStats,
    updateStats
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
