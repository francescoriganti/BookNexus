import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/hooks/use-game";
import CountdownTimer from "@/components/countdown-timer";

export default function Header() {
  const { openHowToPlayModal, openStatsModal } = useGame();

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <img 
              src="/images/logo_bookle.png" 
              alt="Bookle Logo" 
              className="h-10" 
            />
          </div>
          
          <div className="flex items-center">
            <div className="mr-6 flex items-center">
              <Clock className="text-slate-500 mr-2 h-4 w-4" />
              <span className="text-xs text-slate-500 mr-2">Next book in:</span>
              <span className="font-mono text-sm font-semibold">
                <CountdownTimer />
              </span>
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
      </div>
    </header>
  );
}
