"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow, isPast } from "date-fns";

interface CountdownTimerProps {
  deadline: string;
  className?: string;
}

export function CountdownTimer({ deadline, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const d = new Date(deadline);
      if (isPast(d)) {
        setTimeLeft("Expired");
      } else {
        setTimeLeft(formatDistanceToNow(d, { addSuffix: true }));
      }
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return <span className={className}>{timeLeft}</span>;
}
