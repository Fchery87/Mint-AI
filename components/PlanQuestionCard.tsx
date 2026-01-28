/**
 * Plan Question Card Component
 * 
 * Interactive card for clarifying questions in plan mode
 * Allows users to answer questions with text input or predefined options
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronUp 
} from "lucide-react";
import type { ClarifyingQuestion } from "@/types/plan-build";

interface PlanQuestionCardProps {
  question: ClarifyingQuestion;
  index: number;
  onAnswer: (questionId: string, answer: string) => void;
  className?: string;
}

export function PlanQuestionCard({
  question,
  index,
  onAnswer,
  className,
}: PlanQuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [answer, setAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onAnswer(question.id, answer);
    setIsSubmitted(true);
    setIsExpanded(false);
  };

  const handleOptionClick = (option: string) => {
    setAnswer(option);
    onAnswer(question.id, option);
    setIsSubmitted(true);
    setIsExpanded(false);
  };

  // If already answered, show compact view
  if (question.answer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground line-through truncate">
              {question.question}
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium truncate">
              {question.answer}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "rounded-xl border overflow-hidden",
        question.required 
          ? "bg-amber-500/5 border-amber-500/30" 
          : "bg-muted/30 border-border/50",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className={cn(
          "flex items-center justify-center w-7 h-7 rounded-lg shrink-0",
          question.required 
            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" 
            : "bg-primary/10 text-primary"
        )}>
          <span className="text-xs font-bold">Q{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {question.required && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 uppercase tracking-wide">
                Required
              </span>
            )}
            <p className={cn(
              "text-sm leading-relaxed",
              question.required ? "text-foreground" : "text-muted-foreground"
            )}>
              {question.question}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Options */}
              {question.options && question.options.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {question.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleOptionClick(option)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg border transition-all",
                        "bg-background border-border/50 hover:border-primary/50 hover:bg-primary/5",
                        "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Text Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Type your answer..."
                  className={cn(
                    "flex-1 px-3 py-2 text-sm rounded-lg",
                    "bg-background border border-border/50",
                    "focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20",
                    "placeholder:text-muted-foreground/50"
                  )}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  className={cn(
                    "px-3 py-2 rounded-lg border transition-all",
                    "bg-primary text-primary-foreground border-primary/20",
                    "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-1"
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default PlanQuestionCard;
