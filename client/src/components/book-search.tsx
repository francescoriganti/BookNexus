import { useState, useEffect, useRef } from "react";
import { useGame } from "@/hooks/use-game";
import { Input } from "@/components/ui/input";
import { Book, Search } from "lucide-react";
import { motion } from "framer-motion";

type BookSearchProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function BookSearch({ value, onChange, disabled = false }: BookSearchProps) {
  const { searchBooks, isPending } = useGame();
  const [results, setResults] = useState<{ id: number; title: string; author: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Teniamo traccia dell'ultima selezione per evitare di riaprire il menu
  const [lastSelected, setLastSelected] = useState("");
  
  // Effetto per mostrare lo shake quando un tentativo è errato
  useEffect(() => {
    if (isPending) {
      setShake(false);
    }
  }, [isPending]);
  
  // Funzione per attivare l'effetto shake
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };
  
  // Ascoltiamo un evento personalizzato che indica che il tentativo è errato
  useEffect(() => {
    const handleIncorrectGuess = () => {
      triggerShake();
    };
    
    window.addEventListener('incorrectGuess', handleIncorrectGuess);
    return () => window.removeEventListener('incorrectGuess', handleIncorrectGuess);
  }, []);
  
  // Handle search query
  useEffect(() => {
    // Se il valore corrisponde all'ultima selezione, non riapriamo il menu
    if (value === lastSelected) {
      return;
    }
    
    const delaySearch = setTimeout(async () => {
      if (value.trim().length > 1) {
        setIsSearching(true);
        const searchResults = await searchBooks(value);
        setResults(searchResults);
        setIsSearching(false);
        
        // Apriamo i risultati solo se l'utente sta ancora digitando,
        // non quando ha appena selezionato un valore
        if (value !== lastSelected) {
          setShowResults(true);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);
    
    return () => clearTimeout(delaySearch);
  }, [value, searchBooks, lastSelected]);
  
  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleSelectBook = (title: string) => {
    onChange(title);
    setShowResults(false);
    // Aggiorniamo l'ultima selezione per evitare che il menu si riapra
    setLastSelected(title);
  };

  return (
    <div className="relative mb-6">
      <Search className="absolute top-3 left-3 h-5 w-5 text-slate-400 z-10" />
      <motion.div
        animate={shake ? { 
          x: [0, -10, 10, -10, 10, -5, 5, -2, 2, 0],
          transition: { duration: 0.5 }
        } : {}}
      >
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            // Se l'utente sta scrivendo, resettiamo l'ultima selezione
            if (e.target.value !== lastSelected) {
              setLastSelected("");
            }
          }}
          className="w-full pl-10 pr-4 py-6"
          placeholder="Type a book title..."
          disabled={disabled}
          onFocus={() => {
            if (value.trim().length > 1 && value !== lastSelected) {
              setShowResults(true);
            }
          }}
        />
      </motion.div>
      
      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-slate-200 overflow-hidden"
        >
          {isSearching ? (
            <div className="px-4 py-3 text-center text-sm text-slate-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto py-1">
              {results.map((book) => (
                <li 
                  key={book.id}
                  className="px-4 py-2 hover:bg-slate-100 cursor-pointer flex items-center"
                  onClick={() => handleSelectBook(book.title)}
                >
                  <Book className="h-4 w-4 text-slate-400 mr-2" />
                  <div>
                    <div className="font-medium">{book.title}</div>
                    <div className="text-xs text-slate-500">by {book.author}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-center text-sm text-slate-500">
              No books found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
