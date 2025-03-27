import { Calendar, BookType, Globe, BookOpen, User, Languages, History } from "lucide-react";
import { type BookAttribute } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  const getAllGuesses = () => {
    try {
      const gameStateRaw = localStorage.getItem('gameState');
      if (gameStateRaw) {
        const gameState = JSON.parse(gameStateRaw);
        if (gameState.guesses && gameState.guesses.length > 0) {
          return gameState.guesses;
        }
      }
    } catch (e) {
      console.error("Errore nell'accesso al localStorage:", e);
    }
    return [];
  };

  const allGuesses = getAllGuesses();
  
  // Funzione per ottenere lo stato dell'attributo, controllando tutti i tentativi precedenti
  const getAttributeStatus = (attrName: string): "correct" | "partial" | "incorrect" | null => {
    if (!allGuesses || allGuesses.length === 0) return null;
    
    const mappings: Record<string, string> = {
      "Publication Year": "publicationYear",
      "Genre": "genre",
      "Author's Country": "authorsCountry",
      "Pages": "pages",
      "Author": "author",
      "Original Language": "originalLanguage",
      "Historical Period": "historicalPeriod"
    };
    
    const key = mappings[attrName];
    if (!key) return null;
    
    console.log(`Controllo stato attributo ${attrName} (${key}) in tutti i tentativi:`, allGuesses);
    
    // Controlla tutti i tentativi e restituisci "correct" se è stato indovinato in qualsiasi tentativo
    for (const guess of allGuesses) {
      if (guess.attributes && guess.attributes[key] && guess.attributes[key].status === "correct") {
        console.log(`Attributo ${attrName} indovinato correttamente in un tentativo precedente!`);
        return "correct";
      }
    }
    
    // Se almeno un tentativo ha "partial", restituisci "partial"
    for (const guess of allGuesses) {
      if (guess.attributes && guess.attributes[key] && guess.attributes[key].status === "partial") {
        console.log(`Attributo ${attrName} parzialmente indovinato in un tentativo precedente!`);
        return "partial";
      }
    }
    
    // Altrimenti usa l'ultimo tentativo
    const latestGuess = allGuesses[allGuesses.length - 1];
    if (latestGuess && latestGuess.attributes && latestGuess.attributes[key]) {
      console.log(`Attributo ${attrName}: stato dall'ultimo tentativo = ${latestGuess.attributes[key].status}`);
      return latestGuess.attributes[key].status;
    }
    
    return null;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {attributes.map((attr, index) => {
        // Gestione esplicita del valore rivelato con controllo di tipo
        const isRevealed = attr.revealed === true;
        console.log(`Attributo ${attr.name}: revealed = ${isRevealed}`);
        
        const status = isRevealed ? getAttributeStatus(attr.name) : null;
        const statusClass = isRevealed && status 
          ? status === "correct" 
            ? "bg-green-50 border-green-300" 
            : status === "partial" 
              ? "bg-amber-50 border-amber-300" 
              : "bg-blue-50 border-blue-300"
          : "";
        
        return (
          <motion.div 
            key={index}
            className={cn(
              "attribute-card border rounded-md p-3 text-center shadow-sm flex flex-col items-center",
              isRevealed
                ? cn("shadow-md", statusClass)
                : "bg-gray-50 border-gray-200"
            )}
            data-revealed={isRevealed ? "true" : "false"}
            data-name={attr.name}
            data-status={status || "none"}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            initial={isRevealed ? { scale: 0.8, opacity: 0 } : {}}
            animate={isRevealed ? { 
              scale: 1, 
              opacity: 1,
              transition: { 
                type: "spring", 
                stiffness: 400, 
                damping: 10, 
                duration: 0.4 
              }
            } : {}}
          >
            <motion.div 
              className="mb-1"
              initial={isRevealed ? { rotateY: 180, opacity: 0 } : {}}
              animate={isRevealed ? { rotateY: 0, opacity: 1 } : {}}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {attributeIcons[attr.name] || <BookType className="h-5 w-5 text-slate-400" />}
            </motion.div>
            <p className="text-xs text-slate-500 mb-1">{attr.name}</p>
            <motion.p 
              className={cn(
                "font-mono text-sm font-medium",
                isRevealed 
                  ? status === "correct" 
                    ? "text-green-600 font-bold" 
                    : status === "partial" 
                      ? "text-amber-600 font-bold" 
                      : "text-blue-600 font-bold" 
                  : "text-gray-400"
              )}
              initial={isRevealed ? { opacity: 0, y: 10 } : {}}
              animate={isRevealed ? { 
                opacity: 1, 
                y: 0,
                transition: { 
                  delay: 0.2,
                  duration: 0.3 
                }
              } : {}}
            >
              {isRevealed ? attr.value : attr.type === "number" ? "???" : "????"}
            </motion.p>
            {status === "correct" && isRevealed && (
              <motion.div
                className="absolute inset-0 rounded-md"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0.15, 0], 
                  scale: [1, 1.05, 1] 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
                style={{ 
                  background: "radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(255,255,255,0) 70%)",
                  zIndex: -1 
                }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
