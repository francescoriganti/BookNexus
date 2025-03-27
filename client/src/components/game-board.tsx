import { useState, useEffect } from "react";
import BookSearch from "@/components/book-search";
import AttributeGrid from "@/components/attribute-grid";
import PreviousGuesses from "@/components/previous-guesses";
import { Button } from "@/components/ui/button";
import { useGame } from "@/hooks/use-game";
import HowToPlayModal from "@/components/modals/how-to-play-modal";
import StatsModal from "@/components/modals/stats-modal";
import GameResultModal from "@/components/modals/game-result-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function GameBoard() {
  const { 
    gameState, 
    isLoading, 
    makeGuess, 
    isPending,
    dailyBook,
    stats,
    gameNumber,
    hasUpdatedStats,
    hasShownResultModal,
    updateStats
  } = useGame();
  const [bookTitle, setBookTitle] = useState("");
  
  // Non mostrare il modale di vittoria se il gioco è stato caricato da localStorage
  useEffect(() => {
    const todayDateString = new Date().toISOString().split('T')[0];
    const resultModalShownBefore = localStorage.getItem(`resultModalShown_${todayDateString}`);
    
    // Forza la chiusura di qualsiasi modale aperto al refresh se è già stato mostrato
    if (resultModalShownBefore === 'true') {
      setTimeout(() => {
        const closeButtons = document.querySelectorAll("[data-state='open'] button[type='button']");
        closeButtons.forEach((button: any) => {
          if (button.textContent === 'Close') {
            button.click();
          }
        });
      }, 100);
    }
  }, []);
  
  // Handle guess submission
  const handleSubmitGuess = () => {
    if (bookTitle.trim()) {
      makeGuess(bookTitle);
      setBookTitle("");
    }
  };
  
  // Rimuoviamo l'effetto automatico per aggiornare le statistiche
  // L'aggiornamento avverrà solo quando viene fatto un tentativo di indovinare

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <Skeleton className="h-6 w-40 mx-auto mb-1" />
          <Skeleton className="h-8 w-32 mx-auto" />
        </div>
        
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-40 mx-auto mb-6" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-12 w-full mb-6" />
            
            <div className="space-y-3 mb-6">
              <Skeleton className="h-24 w-full" />
            </div>
            
            <Skeleton className="h-6 w-40 mx-auto mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      {/* Game Board */}
      <Card className="mb-8 game-container">
        <CardContent className="p-6">
          {/* Game Status */}
          <div className="text-center mb-6">
            <h2 className="font-serif text-xl font-semibold mb-2">
              Guess Today's Book
            </h2>
            <p className="text-slate-600 text-sm">
              Attempts remaining: {gameState?.remainingAttempts || 0}
            </p>
          </div>

          {/* Book Search Input */}
          <BookSearch 
            value={bookTitle}
            onChange={setBookTitle}
            disabled={gameState?.gameStatus !== "active" || isPending}
          />

          {/* Submit Button */}
          <Button
            className="w-full mb-6 bg-[#10a956] hover:bg-[#10a956]/90 disabled:opacity-100 disabled:bg-[#068ec5] disabled:text-white" 
            onClick={handleSubmitGuess}
            disabled={gameState?.gameStatus !== "active" || isPending || !bookTitle.trim()}
          >
            {isPending ? "Submitting..." : "Submit Guess"}
          </Button>

          {/* Previous Guesses */}
          <PreviousGuesses guesses={gameState?.guesses || []} />

          {/* Book Attributes Grid */}
          <h3 className="font-medium text-center mb-3">Book Attributes</h3>
          <AttributeGrid attributes={gameState?.revealedAttributes || []} />
        </CardContent>
      </Card>
      
      {/* Modals */}
      <HowToPlayModal />
      <StatsModal />
      <GameResultModal 
        gameStatus={gameState?.gameStatus || "active"}
        attempts={8 - (gameState?.remainingAttempts || 0)}
        dailyBook={dailyBook}
        gameNumber={gameNumber}
      />
    </main>
  );
}
