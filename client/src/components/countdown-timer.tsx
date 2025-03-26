import { useState, useEffect } from "react";
import { formatTimeRemaining, getEndOfDay } from "@/lib/utils";

export default function CountdownTimer() {
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(getEndOfDay()));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(getEndOfDay()));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="font-mono text-lg font-semibold">
      {timeRemaining}
    </div>
  );
}
