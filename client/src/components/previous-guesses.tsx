import { type GameGuess } from "@shared/schema";
import { getStatusColorClass } from "@/lib/utils";
import { Check, X, Minus } from "lucide-react";

type PreviousGuessesProps = {
  guesses: GameGuess[];
};

// Status icons mapping
const statusIcons = {
  correct: <Check className="h-4 w-4" />,
  partial: <Minus className="h-4 w-4" />,
  incorrect: <X className="h-4 w-4" />
};

export default function PreviousGuesses({ guesses }: PreviousGuessesProps) {
  if (guesses.length === 0) {
    return (
      <div className="space-y-3 mb-6">
        <p className="text-center text-sm text-slate-500 italic py-4">
          No guesses yet. Make your first guess!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {guesses.slice().reverse().map((guess, index) => (
        <div key={index} className="p-3 border border-slate-200 rounded-md bg-slate-50">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              {guess.imageUrl && (
                <div className="mr-2 w-10 h-14 overflow-hidden rounded-sm">
                  <img 
                    src={guess.imageUrl} 
                    alt={`Cover of ${guess.title}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span className="font-medium">{guess.title}</span>
            </div>
            <span className={`text-white rounded-full p-1 ${guess.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
              {guess.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <AttributeMatch 
              name="Publication Year" 
              value={guess.attributes.publicationYear.value} 
              status={guess.attributes.publicationYear.status} 
            />
            <AttributeMatch 
              name="Author's Country" 
              value={guess.attributes.authorsCountry.value} 
              status={guess.attributes.authorsCountry.status} 
            />
            <AttributeMatch 
              name="Genre" 
              value={guess.attributes.genre.value} 
              status={guess.attributes.genre.status} 
            />
            <AttributeMatch 
              name="Pages" 
              value={`${guess.attributes.pages.value} pages`} 
              status={guess.attributes.pages.status} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type AttributeMatchProps = {
  name: string;
  value: string | number;
  status: "correct" | "partial" | "incorrect";
};

function AttributeMatch({ name, value, status }: AttributeMatchProps) {
  const colorClass = getStatusColorClass(status);
  
  return (
    <div className="flex items-center">
      <span className={`w-4 h-4 rounded-full ${colorClass} mr-2 flex items-center justify-center text-white`}>
        {statusIcons[status]}
      </span>
      <span>{value}</span>
    </div>
  );
}
