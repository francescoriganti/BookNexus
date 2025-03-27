import { type GameGuess } from "@shared/schema";
import { getStatusColorClass } from "@/lib/utils";
import { Check, X, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      <AnimatePresence>
        {guesses.slice().reverse().map((guess, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, rotateY: -90, scale: 0.9 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20, 
              duration: 0.5 
            }}
            className="p-3 border border-slate-200 rounded-md bg-slate-50 perspective-card"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                {guess.imageUrl && (
                  <motion.div 
                    className="mr-2 w-10 h-14 overflow-hidden rounded-sm"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <img 
                      src={guess.imageUrl?.startsWith("http") ? guess.imageUrl : `${window.location.origin}${guess.imageUrl}`} 
                      alt={`Cover of ${guess.title}`} 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
                <span className="font-medium">{guess.title}</span>
              </div>
              <motion.span 
                className={`text-white rounded-full p-1 ${guess.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                {guess.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </motion.span>
            </div>
            
            <motion.div 
              className="grid grid-cols-2 gap-2 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <AttributeMatch 
                name="Publication Year" 
                value={guess.attributes.publicationYear.value} 
                status={guess.attributes.publicationYear.status}
                index={0}
              />
              <AttributeMatch 
                name="Author's Country" 
                value={guess.attributes.authorsCountry.value} 
                status={guess.attributes.authorsCountry.status}
                index={1}
              />
              <AttributeMatch 
                name="Genre" 
                value={guess.attributes.genre.value} 
                status={guess.attributes.genre.status}
                index={2}
              />
              <AttributeMatch 
                name="Pages" 
                value={`${guess.attributes.pages.value} pages`} 
                status={guess.attributes.pages.status}
                index={3}
              />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

type AttributeMatchProps = {
  name: string;
  value: string | number;
  status: "correct" | "partial" | "incorrect";
  index?: number;
};

function AttributeMatch({ name, value, status, index = 0 }: AttributeMatchProps) {
  const colorClass = getStatusColorClass(status);
  
  return (
    <motion.div 
      className="flex items-center"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + (index * 0.1) }}
    >
      <motion.span 
        className={`w-4 h-4 rounded-full ${colorClass} mr-2 flex items-center justify-center text-white`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          delay: 0.5 + (index * 0.1),
          type: "spring", 
          stiffness: 500
        }}
      >
        {statusIcons[status]}
      </motion.span>
      <span>{value}</span>
    </motion.div>
  );
}
