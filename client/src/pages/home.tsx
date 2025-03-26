import { useEffect } from "react";
import Header from "@/components/header";
import GameBoard from "@/components/game-board";
import { useGameProvider as GameProvider } from "@/hooks/use-game";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  
  // Show how to play modal on first visit
  useEffect(() => {
    if (!localStorage.getItem("bookGameTutorialSeen")) {
      localStorage.setItem("bookGameTutorialSeen", "true");
      document.getElementById("howToPlayModal")?.click();
    }
  }, []);

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen overflow-hidden relative">
      <GameProvider>
        <Header />
        <GameBoard />
      </GameProvider>
    </div>
  );
}
