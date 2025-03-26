import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart } from "lucide-react";
import { useGame } from "@/hooks/use-game";
import { calculateWinPercentage } from "@/lib/utils";

export default function StatsModal() {
  const { stats } = useGame();
  
  const defaultStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: Array(8).fill(0)
  };
  
  const {
    gamesPlayed,
    gamesWon,
    currentStreak,
    maxStreak,
    guessDistribution
  } = stats || defaultStats;
  
  const winPercentage = calculateWinPercentage(gamesPlayed, gamesWon);
  
  // Calculate max value for distribution scaling
  const maxDistributionValue = Math.max(...(guessDistribution || []), 1);

  return (
    <Dialog>
      <DialogTrigger id="statsModal" className="hidden">
        Open Stats
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif text-xl">
            <BarChart className="text-blue-500 mr-2 h-5 w-5" />
            Your Statistics
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="font-bold text-2xl">{gamesPlayed}</p>
            <p className="text-xs text-slate-500">Played</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-2xl">{winPercentage}</p>
            <p className="text-xs text-slate-500">Win %</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-2xl">{currentStreak}</p>
            <p className="text-xs text-slate-500">Current Streak</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-2xl">{maxStreak}</p>
            <p className="text-xs text-slate-500">Max Streak</p>
          </div>
        </div>
        
        <h4 className="font-medium mb-3">Guess Distribution</h4>
        <div className="space-y-2 mb-4">
          {(guessDistribution || Array(8).fill(0)).map((count, index) => (
            <div key={index} className="flex items-center text-sm">
              <span className="w-3 text-right mr-2">{index + 1}</span>
              <div 
                className={`${count > 0 ? 'bg-blue-500' : 'bg-slate-200'} h-6 rounded flex items-center pl-2 text-xs font-medium ${count > 0 ? 'text-white' : 'text-slate-600'}`} 
                style={{ width: `${Math.max(10, (count / maxDistributionValue) * 100)}%` }}
              >
                {count}
              </div>
            </div>
          ))}
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
