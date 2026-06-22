import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface StreamingMessageProps {
  content: string;
  /** Speed in ms per character chunk reveal */
  speed?: number;
  /** Called when streaming is complete */
  onComplete?: () => void;
}

/**
 * Reveals text content progressively, simulating a streaming token-by-token
 * AI response even for standard REST responses.
 */
const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  speed = 12,
  onComplete,
}) => {
  const reduced = useReducedMotion();
  const [displayed, setDisplayed] = useState(reduced ? content : "");
  const indexRef = useRef(reduced ? content.length : 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reduced) {
      setDisplayed(content);
      onComplete?.();
      return;
    }

    // Reset when content changes
    indexRef.current = 0;
    setDisplayed("");

    const CHUNK = 3; // reveal N chars per tick for snappier feel

    timerRef.current = setInterval(() => {
      indexRef.current = Math.min(indexRef.current + CHUNK, content.length);
      setDisplayed(content.slice(0, indexRef.current));

      if (indexRef.current >= content.length) {
        clearInterval(timerRef.current!);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return <span style={{ whiteSpace: "pre-wrap" }}>{displayed}</span>;
};

export default StreamingMessage;
