"use client";

import { useState, useEffect, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePromptInputController } from "./context";

// ============================================================================
// PromptInputSpeechButton - Speech-to-text button
// ============================================================================
interface PromptInputSpeechButtonProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  className?: string;
}

export const PromptInputSpeechButton = ({ textareaRef, className }: PromptInputSpeechButtonProps) => {
  const controller = usePromptInputController();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check support on client-side only (once)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
      setIsSupported(supported);
    } else {
      setIsSupported(false);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      // Update input with final transcript
      if (finalTranscript) {
        const currentValue = controller.textInput.value;
        const newValue = currentValue + finalTranscript;
        controller.textInput.setValue(newValue);

        // Auto-resize textarea
        if (textareaRef?.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
        }
      }
    };

    recognitionInstance.onerror = (event: any) => {
      // Only log non-network errors (network errors are common when stopping)
      if (event.error !== "network" && event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [isSupported, controller.textInput, textareaRef]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      try {
        recognition.stop();
        setIsListening(false);
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
        setIsListening(false);
      }
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);
      }
    }
  }, [recognition, isListening]);

  // Don't render if not supported or still checking
  if (isSupported === false) {
    return null;
  }

  // Show loading state while checking support
  if (isSupported === null) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={cn(
        "flex items-center justify-center rounded-md p-2 transition-colors",
        isListening
          ? "bg-red-500 text-white hover:bg-red-600"
          : "hover:bg-accent hover:text-accent-foreground",
        className
      )}
      title={isListening ? "Stop recording" : "Start voice input"}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
};
