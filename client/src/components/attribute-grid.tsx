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
  // For debugging - remove in production
  console.log("Rendering attribute grid with:", attributes);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {attributes.map((attr, index) => (
        <div 
          key={index}
          className={cn(
            "attribute-card bg-white border border-slate-200 rounded-md p-3 text-center shadow-sm flex flex-col items-center transition-all duration-300",
            attr.revealed 
              ? "bg-white border-blue-200" 
              : "bg-gray-50"
          )}
        >
          {attributeIcons[attr.name] || <BookType className="h-5 w-5 text-slate-400" />}
          <p className="text-xs text-slate-500 mb-1">{attr.name}</p>
          <p className={cn(
            "font-mono text-sm font-medium",
            attr.revealed ? "text-blue-600" : "text-gray-400"
          )}>
            {attr.revealed ? attr.value : attr.type === "number" ? "???" : "????"}
          </p>
        </div>
      ))}
    </div>
  );
}
