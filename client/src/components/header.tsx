import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/hooks/use-game";

export default function Header() {
  const { openHowToPlayModal, openStatsModal } = useGame();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <BookOpen className="text-blue-500 mr-2 h-6 w-6" />
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
              Bookaneer
            </h1>
          </div>
          
          <nav className="flex space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-600 hover:text-blue-500 flex items-center text-sm font-medium"
              onClick={openHowToPlayModal}
            >
              <span className="mr-1">?</span>
              How to Play
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-600 hover:text-blue-500 flex items-center text-sm font-medium"
              onClick={openStatsModal}
            >
              <span className="mr-1">📊</span>
              Stats
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
