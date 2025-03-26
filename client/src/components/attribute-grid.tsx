import { Calendar, BookType, Globe, BookOpen, User, Languages, History } from "lucide-react";
import { type BookAttribute } from "@shared/schema";
import { cn } from "@/lib/utils";

type AttributeGridProps = {
  attributes: BookAttribute[];
};

// Map attribute names to icons
const attributeIcons: Record<string, React.ReactNode> = {
  "Publication Year": <Calendar className="h-5 w-5 text-slate-400" />,
  "Genre": <BookType className="h-5 w-5 text-slate-400" />,
  "Author's Country": <Globe className="h-5 w-5 text-slate-400" />,
  "Pages": <BookOpen className="h-5 w-5 text-slate-400" />,
  "Author": <User className="h-5 w-5 text-slate-400" />,
  "Original Language": <Languages className="h-5 w-5 text-slate-400" />,
  "Historical Period": <History className="h-5 w-5 text-slate-400" />
};

export default function AttributeGrid({ attributes }: AttributeGridProps) {
  // Log per debug
  console.log("Rendering attribute grid with:", JSON.stringify(attributes));
  
  // Log degli attributi rivelati
  const revealed = attributes.filter(attr => attr.revealed === true);
  console.log(`Attributi effettivamente rivelati nel grid: ${revealed.length}`, revealed);

  // Verifica se attributes è un array valido
  if (!Array.isArray(attributes) || attributes.length === 0) {
    console.warn("Attributi mancanti o non validi:", attributes);
    return <div className="text-center">Caricamento attributi...</div>;
  }

  // Ottieni lo stato corrente del gioco dal localStorage, se disponibile
  const getLatestGuess = () => {
    try {
      const gameStateRaw = localStorage.getItem('gameState');
      if (gameStateRaw) {
        const gameState = JSON.parse(gameStateRaw);
        if (gameState.guesses && gameState.guesses.length > 0) {
          return gameState.guesses[gameState.guesses.length - 1];
        }
      }
    } catch (e) {
      console.error("Errore nell'accesso al localStorage:", e);
    }
    return null;
  };

  const latestGuess = getLatestGuess();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {attributes.map((attr, index) => {
        // Gestione esplicita del valore rivelato con controllo di tipo
        const isRevealed = attr.revealed === true;
        console.log(`Attributo ${attr.name}: revealed = ${isRevealed}`);
        
        return (
          <div 
            key={index}
            className={cn(
              "attribute-card border rounded-md p-3 text-center shadow-sm flex flex-col items-center transition-all duration-300",
              isRevealed
                ? "bg-white border-blue-300 shadow-md" 
                : "bg-gray-50 border-gray-200"
            )}
            data-revealed={isRevealed ? "true" : "false"}
            data-name={attr.name}
          >
            {attributeIcons[attr.name] || <BookType className="h-5 w-5 text-slate-400" />}
            <p className="text-xs text-slate-500 mb-1">{attr.name}</p>
            <p className={cn(
              "font-mono text-sm font-medium",
              isRevealed ? "text-blue-600 font-bold" : "text-gray-400"
            )}>
              {isRevealed ? attr.value : attr.type === "number" ? "???" : "????"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
