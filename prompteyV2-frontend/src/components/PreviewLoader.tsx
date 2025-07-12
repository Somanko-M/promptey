import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

const loadingMessages = [
  "C ooking up the HTML...",
  "S prinkling some CSS magic...",
  "A ttaching JavaScript wires...",
  "T esting responsiveness...",
  "A dding final touches...",
  "O ptimizing pixels..."
];

const PreviewLoader = () => {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageRef = useRef(loadingMessages[0]);

  useEffect(() => {
    // Step 1: set current message
    const message = loadingMessages[index];
    messageRef.current = message;

    // Step 2: reset and immediately show first character
    setDisplayText(message.charAt(0));
    let charIndex = 1;

    // Step 3: start typing animation
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    typingIntervalRef.current = setInterval(() => {
      if (charIndex < message.length) {
        setDisplayText((prev) => prev + message.charAt(charIndex));
        charIndex++;
      } else {
        clearInterval(typingIntervalRef.current!);
      }
    }, 40); // typing speed

    return () => clearInterval(typingIntervalRef.current!);
  }, [index]);

  useEffect(() => {
    const rotate = setInterval(() => {
      setIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500); // rotate every 2.5s
    return () => clearInterval(rotate);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-muted animate-pulse">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-white font-mono text-center text-sm opacity-80 max-w-xs px-4">
        {displayText}
      </p>
    </div>
  );
};

export default PreviewLoader;
