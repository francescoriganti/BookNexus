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
  hasShownResultModal: boolean;
  updateStats: () => Promise<void>;
};

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const useGameProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [dailyBook, setDailyBook] = useState<Book | null>(null);
  const [hasUpdatedStats, setHasUpdatedStats] = useState(false);
  const [hasShownResultModal, setHasShownResultModal] = useState(false);
  
  // Calculate a "game number" based on days since launch
  const launchDate = new Date('2023-01-01'); // Arbitrary launch date
  const today = new Date();
  const gameNumber = Math.floor((today.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Stato locale del gioco
  const [localGameState, setLocalGameState] = useState<GameState | null>(null);
  const [bookAttributes, setBookAttributes] = useState<any[]>([]);
  
  // Caricamento iniziale degli attributi del libro giornaliero
  const { 
    data: dailyBookData, 
    isLoading,
  } = useQuery({
    queryKey: ['/api/daily-book'],
    queryFn: async () => {
      const response = await fetch('/api/daily-book');
      if (!response.ok) {
        throw new Error('Failed to fetch daily book data');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity, // Non ricaricare durante la sessione
  });
  
  // Inizializza o recupera lo stato del gioco dal localStorage
  useEffect(() => {
    if (!dailyBookData) return;
    
    const todayDateString = getTodayDateString();
    const savedGameState = localStorage.getItem(`gameState_${todayDateString}`);
    
    if (savedGameState) {
      // Se esiste già uno stato salvato, usalo
      try {
        const parsedState = JSON.parse(savedGameState);
        setLocalGameState(parsedState);
        console.log("Stato del gioco caricato da localStorage");
      } catch (e) {
        console.error("Errore nel parsing dello stato del gioco:", e);
      }
    } else {
      // Altrimenti crea uno stato iniziale
      const initialState: GameState = {
        id: dailyBookData.id,
        date: dailyBookData.date,
        dailyBookId: 0, // Non conserviamo l'ID reale nel client
        remainingAttempts: 8,
        guesses: [],
        revealedAttributes: dailyBookData.bookAttributes || [],
        gameStatus: "active"
      };
      
      setLocalGameState(initialState);
      setBookAttributes(dailyBookData.bookAttributes || []);
      
      // Salva lo stato iniziale
      localStorage.setItem(`gameState_${todayDateString}`, JSON.stringify(initialState));
    }
  }, [dailyBookData]);
  
  // Usa localGameState come stato del gioco
  const gameState = localGameState;
  
  // Check localStorage for persisted game data
  useEffect(() => {
    const todayDateString = getTodayDateString();
    const statsUpdatedToday = localStorage.getItem(`statsUpdated_${todayDateString}`);
    const resultModalShown = localStorage.getItem(`resultModalShown_${todayDateString}`);
    const savedDailyBook = localStorage.getItem(`dailyBook_${todayDateString}`);
    
    // Carica flag degli stats aggiornati
    if (statsUpdatedToday === 'true') {
      setHasUpdatedStats(true);
      console.log("Stats already updated today according to localStorage");
    }
    
    // Carica flag del modal mostrato
    if (resultModalShown === 'true') {
      setHasShownResultModal(true);
      console.log("Result modal already shown today according to localStorage");
    }
    
    // Carica il libro del giorno se è stato già indovinato
    if (savedDailyBook) {
      try {
        const parsedBook = JSON.parse(savedDailyBook);
        setDailyBook(parsedBook);
        console.log("Libro del giorno caricato dal localStorage:", parsedBook.title);
      } catch (e) {
        console.error("Errore nel parsing del libro dal localStorage:", e);
      }
    }
  }, []);
  
  // Fetch stats
  const { 
    data: stats 
  } = useQuery<GameStats & { guessDistribution: number[] }>({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 3600000, // 1 hour
  });
  
  // Submit guess mutation - ora gestito principalmente lato client
  const { 
    mutate: submitGuessToServer,
    isPending
  } = useMutation({
    mutationFn: async (bookTitle: string) => {
      // Include i tentativi rimanenti per permettere al server di riconoscere l'ultimo tentativo
      const remainingAttempts = localGameState?.remainingAttempts || 0;
      const response = await apiRequest('POST', '/api/game/guess', { 
        bookTitle,
        remainingAttempts 
      });
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
      
      // Il server ora restituisce il risultato del tentativo e possibilmente il libro
      const { guessResult, dailyBook: correctBook, gameOver, won } = data;
      
      if (!localGameState) return;
      
      // Aggiorniamo lo stato localmente
      const updatedState = { ...localGameState };
      updatedState.remainingAttempts--;
      updatedState.guesses.push(guessResult);
      
      // Aggiorna gli attributi rivelati in base al tentativo
      if (updatedState.revealedAttributes && guessResult) {
        updatedState.revealedAttributes.forEach((attr: any, index: number) => {
          let matchStatus: "correct" | "partial" | "incorrect" | null = null;
          
          if (attr.name === "Publication Year") {
            matchStatus = guessResult.attributes.publicationYear.status;
          } else if (attr.name === "Genre") {
            matchStatus = guessResult.attributes.genre.status;
          } else if (attr.name === "Author's Country") {
            matchStatus = guessResult.attributes.authorsCountry.status;
          } else if (attr.name === "Pages") {
            matchStatus = guessResult.attributes.pages.status;
          } else if (attr.name === "Author") {
            matchStatus = guessResult.attributes.author.status;
          } else if (attr.name === "Original Language") {
            matchStatus = guessResult.attributes.originalLanguage.status;
          } else if (attr.name === "Historical Period") {
            matchStatus = guessResult.attributes.historicalPeriod.status;
          }
          
          if (matchStatus === "correct") {
            updatedState.revealedAttributes[index].revealed = true;
            console.log(`Rivelato attributo ${attr.name} perché corrisponde esattamente`);
          }
        });
      }
      
      // Conta quanti attributi sono rivelati
      const revealedAttrs = updatedState.revealedAttributes.filter((attr: any) => attr.revealed === true);
      console.log(`Numero di attributi rivelati: ${revealedAttrs.length}`);
    
      // Verifica se il gioco è finito
      if (guessResult.isCorrect) {
        updatedState.gameStatus = "won";
      } else if (updatedState.remainingAttempts <= 0) {
        updatedState.gameStatus = "lost";
      }
      
      // Salva lo stato del gioco aggiornato nel localStorage
      const todayDateString = getTodayDateString();
      try {
        localStorage.setItem(`gameState_${todayDateString}`, JSON.stringify(updatedState));
        console.log("Stato del gioco salvato in localStorage");
      } catch (e) {
        console.error("Errore nel salvataggio in localStorage:", e);
      }
      
      // Aggiorna lo stato React
      setLocalGameState(updatedState);
      
      // Se il tentativo è errato e il gioco non è ancora finito, mostra l'animazione shake
      if (!gameOver && updatedState.gameStatus === "active") {
        setTimeout(() => {
          const event = new CustomEvent('incorrectGuess');
          window.dispatchEvent(event);
        }, 300);
      }
      
      // Se il server ha inviato il libro (per vittoria o sconfitta), gestisci l'ultimo tentativo
      if (correctBook) {
        setDailyBook(correctBook);
        
        // Salva il libro indovinato nel localStorage per la persistenza
        try {
          localStorage.setItem(`dailyBook_${todayDateString}`, JSON.stringify(correctBook));
          console.log("Libro del giorno salvato in localStorage:", correctBook.title);
        } catch (e) {
          console.error("Errore nel salvataggio del libro nel localStorage:", e);
        }
        
        // Apri il modale solo se non l'abbiamo già mostrato oggi
        if (!hasShownResultModal) {
          // Segna che abbiamo mostrato il modale per evitare di mostrarlo nuovamente al refresh
          localStorage.setItem(`resultModalShown_${todayDateString}`, 'true');
          setHasShownResultModal(true);
          
          // Show the result modal immediately - verrà mostrato per entrambi i casi (vittoria o sconfitta)
          openGameResultModal();
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit guess",
        variant: "destructive"
      });
      
      // Trigger shake animation
      const event = new CustomEvent('incorrectGuess');
      window.dispatchEvent(event);
    }
  });
  
  // Update stats mutation
  const { 
    mutate: updateStatsMutation,
  } = useMutation({
    mutationFn: async () => {
      if (!gameState || gameState.gameStatus === "active") return;
      
      // Controllo cruciale: evita aggiornamenti ripetuti
      if (hasUpdatedStats) {
        console.log("Aggiornamento statistiche già effettuato, esco");
        return null;
      }
      
      // Blocca ulteriori tentativi immediatamente
      setHasUpdatedStats(true);
      
      // Salva in localStorage per prevenire aggiornamenti futuri
      const todayDateString = getTodayDateString();
      localStorage.setItem(`statsUpdated_${todayDateString}`, 'true');
      
      console.log("Updating stats for the first time");
      
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
        console.log("Stats updated successfully, hasUpdatedStats set to true");
      }
    }
  });
  
  // Modal functions
  const openGameResultModal = () => {
    // Apri il modale solo se non l'abbiamo già mostrato oggi
    if (!hasShownResultModal) {
      document.getElementById("gameResultModal")?.click();
    }
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
    submitGuessToServer(bookTitle);
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
  
  // Update stats when game is over - only once per game
  const updateStats = async () => {
    if (!hasUpdatedStats) {
      updateStatsMutation();
    }
  };
  
  // Add listener for updateGameStats event
  useEffect(() => {
    // Aggiungiamo un event listener per gestire l'aggiornamento delle statistiche
    // quando l'utente chiude il modale di risultato
    const handleUpdateStats = () => {
      if (!hasUpdatedStats && gameState && (gameState.gameStatus === "won" || gameState.gameStatus === "lost")) {
        console.log("Aggiornamento statistiche da evento utente");
        updateStats();
      }
    };
    
    window.addEventListener('updateGameStats', handleUpdateStats);
    
    return () => {
      window.removeEventListener('updateGameStats', handleUpdateStats);
    };
  }, [hasUpdatedStats, gameState, updateStats]);
  
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
    hasShownResultModal,
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
