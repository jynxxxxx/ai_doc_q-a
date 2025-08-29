import { useEffect, useState } from "react";

export function TypingVisual({ text, speed = 20 }: {text: string, speed: number}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      return;
    }

    let i = displayed.length;
    let target = text;

    if (i >= target.length) return; // already caught up

    const interval = setInterval(() => {
      i++;
      setDisplayed(target.slice(0, i));
      if (i >= target.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, displayed.length, speed]);

  return <span>{displayed}</span>;
}