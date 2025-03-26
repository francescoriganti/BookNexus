import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export default function HowToPlayModal() {
  return (
    <Dialog>
      <DialogTrigger id="howToPlayModal" className="hidden">
        Open How To Play
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center font-serif text-xl">
            <HelpCircle className="text-blue-500 mr-2 h-5 w-5" />
            How to Play
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-slate-700">
          <p>Guess the daily book in 8 attempts or fewer.</p>
          
          <div>
            <h4 className="font-medium mb-1">How it works:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Type and select a book title to make a guess</li>
              <li>After each guess, you'll see how close you were</li>
              <li>Book attributes will be revealed as you make guesses</li>
              <li>The color indicators show how close your guess is:</li>
            </ul>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-green-500 mr-2"></span>
                <span>Green = Exact match</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></span>
                <span>Yellow = Close match (within range)</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-red-500 mr-2"></span>
                <span>Red = Incorrect</span>
              </div>
            </div>
          </div>
          
          <p>A new book is available every day!</p>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
