import { useState, useEffect, useRef } from "react";
import { useGame } from "@/hooks/use-game";
import { Input } from "@/components/ui/input";
import { Book, Search } from "lucide-react";

type BookSearchProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function BookSearch({ value, onChange, disabled = false }: BookSearchProps) {
  const { searchBooks } = useGame();
  const [results, setResults] = useState<{ id: number; title: string; author: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Handle search query
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (value.trim().length > 1) {
        setIsSearching(true);
        const searchResults = await searchBooks(value);
        setResults(searchResults);
        setIsSearching(false);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);
    
    return () => clearTimeout(delaySearch);
  }, [value, searchBooks]);
  
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
  };

  return (
    <div className="relative mb-6">
      <Search className="absolute top-3 left-3 h-5 w-5 text-slate-400" />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-6"
        placeholder="Type a book title..."
        disabled={disabled}
        onFocus={() => {
          if (value.trim().length > 1) {
            setShowResults(true);
          }
        }}
      />
      
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
