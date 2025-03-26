import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Share2, Copy } from "lucide-react";
import CountdownTimer from "@/components/countdown-timer";
import { generateShareText } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { type Book } from "@shared/schema";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

type GameResultModalProps = {
  gameStatus: "active" | "won" | "lost";
  attempts: number;
  dailyBook: Book | null;
  gameNumber: number;
};

export default function GameResultModal({ 
  gameStatus, 
  attempts, 
  dailyBook,
  gameNumber
}: GameResultModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [confettiShown, setConfettiShown] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  
  // Effetto per aprire il modale quando cambia lo stato del gioco o quando viene cliccato il trigger
  useEffect(() => {
    // Aggiorniamo lo stato del modale in base allo stato del gioco
    if (gameStatus === "won" || gameStatus === "lost") {
      setOpen(true);
      
      // Se ha vinto, mostra i confetti
      if (gameStatus === "won" && !confettiShown) {
        setConfettiShown(true);
        
        // Funzione per lanciare i confetti
        setTimeout(() => {
          const duration = 3 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
          
          function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
          }
          
          // Lancio i confetti a intervalli
          const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            
            if (timeLeft <= 0) {
              return clearInterval(interval);
            }
            
            const particleCount = 50 * (timeLeft / duration);
            
            // Confetti dai lati
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
          }, 250);
        }, 500);
      }
    }
    
    // Aggiungiamo un listener per il click sul trigger
    const handleTriggerClick = () => {
      setOpen(true);
    };
    
    const triggerEl = document.getElementById("gameResultModal");
    triggerEl?.addEventListener("click", handleTriggerClick);
    
    return () => {
      triggerEl?.removeEventListener("click", handleTriggerClick);
    };
  }, [gameStatus, confettiShown]);
  
  const isGameOver = gameStatus === "won" || gameStatus === "lost";
  
  // Copy result to clipboard
  const handleCopyResult = () => {
    const shareText = generateShareText(
      gameNumber,
      attempts,
      gameStatus === "won"
    );
    
    navigator.clipboard.writeText(shareText)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Result copied to clipboard"
        });
      })
      .catch(err => {
        toast({
          title: "Error",
          description: "Failed to copy result",
          variant: "destructive"
        });
      });
  };
  
  // Share result to Twitter
  const handleShareResult = () => {
    const shareText = generateShareText(
      gameNumber,
      attempts,
      gameStatus === "won"
    );
    
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  // Funzione per gestire la chiusura del modale
  const handleClose = () => {
    // Aggiorna le statistiche quando l'utente chiude il modale
    const event = new CustomEvent('updateGameStats');
    window.dispatchEvent(event);
    
    // Chiudi il modale
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger id="gameResultModal" className="hidden">
        Open Game Result
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-serif text-2xl">
            {gameStatus === "won" ? "You got it!" : "Better luck tomorrow!"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center">
          <p className="text-slate-600 mb-4">
            {gameStatus === "won" 
              ? `You guessed today's book in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}.`
              : "You ran out of attempts. The correct book was:"}
          </p>
          
          <motion.div 
            className="flex flex-col items-center mb-6 py-4 px-6 bg-slate-50 rounded-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 17,
              delay: 0.1
            }}
          >
            {dailyBook?.imageUrl && (
              <motion.div 
                className="mb-4 w-24 h-36 overflow-hidden rounded-md shadow-sm"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.img 
                  src={dailyBook.imageUrl} 
                  alt={`Cover of ${dailyBook.title}`} 
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                />
              </motion.div>
            )}
            <motion.span 
              className="font-serif text-xl font-semibold mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              {dailyBook?.title || "—"}
            </motion.span>
            <motion.span 
              className="text-slate-500 mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              by {dailyBook?.author || "—"}
            </motion.span>
            <motion.div 
              className="flex items-center text-slate-500 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              <Calendar className="h-4 w-4 mr-1" />
              <span>{dailyBook?.publicationYear || "—"}</span>
            </motion.div>
          </motion.div>
          
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-2">Share your result</p>
            <div className="flex justify-center space-x-3">
              <Button 
                size="icon" 
                className="bg-[#1DA1F2] hover:bg-[#1a91da]" 
                onClick={handleShareResult}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                onClick={handleCopyResult}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-500 mb-3">Next book in</p>
            <div className="font-mono text-lg font-semibold">
              <CountdownTimer />
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
