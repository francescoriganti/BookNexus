import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function Router() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Check for reset parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const reset = searchParams.get("reset");
    const book = searchParams.get("book");
    
    if (reset === "true") {
      const resetGame = async () => {
        try {
          // Make a call to reset the game state
          const response = await fetch("/api/game?reset=true" + (book ? `&book=${book}` : ""));
          const data = await response.json();
          
          if (data.success) {
            // Clear the cache and refetch
            queryClient.invalidateQueries({ queryKey: ['/api/game'] });
            
            toast({
              title: "Game Reset",
              description: book 
                ? `Game reset with "${book}" as the answer` 
                : "Game has been reset with a new daily book",
              variant: "default"
            });
            
            // Remove the URL parameters by replacing the current URL
            window.history.replaceState({}, document.title, location.split("?")[0]);
          }
        } catch (error) {
          console.error("Failed to reset game:", error);
        }
      };
      
      resetGame();
    }
  }, []);
  
  return (
    <Switch>
      <Route path="/" component={Home}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
