import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";

interface Message {
  role: string;
  content: string;
}

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatPanel({
  messages,
  isLoading,
  onSendMessage,
  messagesEndRef,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput("");
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(
        inputRef.current.scrollHeight,
        150
      ) + "px";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="max-w-sm w-full space-y-8">
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-6">
                  <Logo className="scale-150" hideText />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">How can I help you?</h2>
                <p className="text-sm text-muted-foreground">
                  Describe the UI component you want to build and I'll generate the code for you.
                </p>
              </div>
              
              <div className="grid gap-2">
                {[
                  { title: "Create a todo app", desc: "With tasks & completion" },
                  { title: "Build a login form", desc: "With validation & styling" },
                  { title: "Dashboard cards", desc: "With charts & stats" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(item.title)}
                    className="group relative p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/20 text-left transition-all duration-200"
                  >
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx}
                className={cn(
                  "flex w-full",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/10"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.1s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.2s]" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/40 bg-background/50 backdrop-blur-sm">
        <form 
          onSubmit={handleSubmit} 
          className="relative flex items-end gap-2 p-2 rounded-xl bg-muted/50 border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 focus:ring-0 text-sm px-2 py-2 min-h-[44px] max-h-[150px] resize-none placeholder:text-muted-foreground/70"
            rows={1}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              input.trim() && !isLoading 
                ? "bg-primary text-primary-foreground shadow-sm hover:translate-y-[-1px]" 
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            <Send size={16} />
          </button>
        </form>
        <div className="text-[10px] text-center text-muted-foreground mt-2">
          Mint AI can make mistakes. Please check the code.
        </div>
      </div>
    </div>
  );
}
