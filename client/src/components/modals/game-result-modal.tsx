import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Share2, Copy } from "lucide-react";
import CountdownTimer from "@/components/countdown-timer";
import { generateShareText } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { type Book } from "@shared/schema";

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

  return (
    <Dialog>
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
          
          <div className="flex flex-col items-center mb-6 py-4 px-6 bg-slate-50 rounded-lg">
            <span className="font-serif text-xl font-semibold mb-2">
              {dailyBook?.title || "—"}
            </span>
            <span className="text-slate-500 mb-1">
              by {dailyBook?.author || "—"}
            </span>
            <div className="flex items-center text-slate-500 text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{dailyBook?.publicationYear || "—"}</span>
            </div>
          </div>
          
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
          <Button type="button" variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
