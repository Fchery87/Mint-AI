/**
 * Streaming Indicator Component
 * 
 * Clean streaming status indicator with subtle animations
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Terminal, Cpu, Brain, Sparkles } from "lucide-react";
import { SkillType } from "@/types/skill";

interface StreamingIndicatorProps {
  status?: string | null;
  skill?: {
    type: SkillType;
    stage: string;
    confidence?: number;
  } | null;
  className?: string;
}

const skillIcons: Record<SkillType, typeof Terminal> = {
  [SkillType.BRAINSTORM]: Brain,
  [SkillType.PLAN]: Sparkles,
  [SkillType.CODE]: Terminal,
  [SkillType.DEBUG]: Cpu,
  [SkillType.REVIEW]: Cpu,
  [SkillType.SEARCH]: Brain,
  [SkillType.GENERAL]: Terminal,
};

const skillColors: Record<SkillType, string> = {
  [SkillType.BRAINSTORM]: "text-violet-500",
  [SkillType.PLAN]: "text-amber-500",
  [SkillType.CODE]: "text-emerald-500",
  [SkillType.DEBUG]: "text-rose-500",
  [SkillType.REVIEW]: "text-blue-500",
  [SkillType.SEARCH]: "text-cyan-500",
  [SkillType.GENERAL]: "text-accent",
};

const skillGradients: Record<SkillType, string> = {
  [SkillType.BRAINSTORM]: "from-violet-500/10 to-violet-600/5",
  [SkillType.PLAN]: "from-amber-500/10 to-amber-600/5",
  [SkillType.CODE]: "from-emerald-500/10 to-emerald-600/5",
  [SkillType.DEBUG]: "from-rose-500/10 to-rose-600/5",
  [SkillType.REVIEW]: "from-blue-500/10 to-blue-600/5",
  [SkillType.SEARCH]: "from-cyan-500/10 to-cyan-600/5",
  [SkillType.GENERAL]: "from-accent/10 to-accent/5",
};

export function StreamingIndicator({ 
  status, 
  skill,
  className 
}: StreamingIndicatorProps) {
  const Icon = skill ? skillIcons[skill.type] : Terminal;
  const colorClass = skill ? skillColors[skill.type] : "text-accent";
  const gradientClass = skill ? skillGradients[skill.type] : "from-accent/10 to-accent/5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-gradient-to-r",
        gradientClass,
        "border border-border/50",
        className
      )}
    >
      {/* Animated Icon */}
      <div className="relative flex items-center justify-center w-10 h-10">
        {/* Outer ring animation */}
        <motion.div
          className={cn("absolute inset-0 rounded-full border-2", colorClass)}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Inner pulsing dot */}
        <motion.div
          className={cn("absolute inset-2 rounded-full", colorClass.replace("text-", "bg-"))}
          animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Icon */}
        <Icon className={cn("w-5 h-5 relative z-10", colorClass)} />
      </div>

      {/* Status Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium uppercase tracking-wide", colorClass)}>
            {skill?.type || "Processing"}
          </span>
          
          {/* Animated dots */}
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className={cn("w-1 h-1 rounded-full", colorClass.replace("text-", "bg-"))}
                animate={{
                  y: [0, -3, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
        </div>
        
        {status && (
          <div className="text-xs text-muted-foreground truncate">
            {status}
          </div>
        )}
      </div>

      {/* Stage Badge */}
      {skill?.stage && (
        <div className={cn(
          "px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide",
          "bg-background/50 border border-border",
          colorClass
        )}>
          {skill.stage}
        </div>
      )}

      {/* Confidence Indicator */}
      {skill?.confidence && skill.confidence > 0.8 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2 h-2 rounded-full bg-emerald-500"
          title={`${Math.round(skill.confidence * 100)}% confidence`}
        />
      )}
    </motion.div>
  );
}

export default StreamingIndicator;
