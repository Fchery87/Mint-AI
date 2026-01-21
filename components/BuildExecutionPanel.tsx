"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  StopCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Hammer,
  ArrowRight,
} from "lucide-react";
import type { ExecutionPlan, PlanStep } from "@/types/plan-build";
import { BuildStatus } from "@/types/plan-build";

interface BuildExecutionPanelProps {
  plan: ExecutionPlan;
  isBuilding: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onStepComplete: (stepId: string) => void;
  onStepFailed: (stepId: string, error: string) => void;
  onBuildComplete: () => void;
}

export function BuildExecutionPanel({
  plan,
  isBuilding,
  isPaused,
  onPause,
  onResume,
  onStop,
  onStepComplete: _onStepComplete,
  onStepFailed: _onStepFailed,
  onBuildComplete,
}: BuildExecutionPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [_stepStartTime, setStepStartTime] = useState<number | null>(null);

  // Track elapsed time during build
  useEffect(() => {
    if (!isBuilding || isPaused) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isBuilding, isPaused]);

  // Reset elapsed time when build starts
  useEffect(() => {
    if (plan.buildStatus === BuildStatus.PREPARING) {
      setElapsedTime(0);
      setStepStartTime(Date.now());
    }
  }, [plan.buildStatus]);

  // Check if build is complete
  useEffect(() => {
    const allComplete = plan.steps.every(
      (s) => s.status === "completed" || s.status === "skipped"
    );
    const hasFailed = plan.steps.some((s) => s.status === "failed");

    if (allComplete && !hasFailed && isBuilding) {
      onBuildComplete();
    }
  }, [plan.steps, isBuilding, onBuildComplete]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const currentStep = plan.steps[plan.currentStepIndex];
  const completedSteps = plan.steps.filter(
    (s) => s.status === "completed"
  ).length;
  const failedSteps = plan.steps.filter((s) => s.status === "failed").length;

  const getStatusColor = () => {
    if (plan.buildStatus === BuildStatus.COMPLETED) return "text-green-500";
    if (plan.buildStatus === BuildStatus.FAILED) return "text-red-500";
    if (plan.buildStatus === BuildStatus.PAUSED) return "text-amber-500";
    return "text-blue-500";
  };

  const getStatusIcon = () => {
    switch (plan.buildStatus) {
      case BuildStatus.COMPLETED:
        return <CheckCircle2 size={20} className="text-green-500" />;
      case BuildStatus.FAILED:
        return <AlertCircle size={20} className="text-red-500" />;
      case BuildStatus.PAUSED:
        return <Pause size={20} className="text-amber-500" />;
      case BuildStatus.EXECUTING:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Clock size={20} className="text-blue-500" />
          </motion.div>
        );
      default:
        return <Hammer size={20} className="text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Build Header */}
      <div className="px-4 py-3 border-b border-border/40 bg-card/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h2 className="font-semibold">
                {plan.buildStatus === BuildStatus.COMPLETED
                  ? "Build Complete!"
                  : plan.buildStatus === BuildStatus.FAILED
                  ? "Build Failed"
                  : plan.buildStatus === BuildStatus.PAUSED
                  ? "Build Paused"
                  : "Building..."}
              </h2>
              <p className="text-xs text-muted-foreground">
                {plan.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Elapsed Time */}
            <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-mono">
              {formatTime(elapsedTime)}
            </div>

            {/* Control Buttons */}
            {isBuilding && !isPaused && (
              <button
                onClick={onPause}
                className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
                title="Pause build"
              >
                <Pause size={18} />
              </button>
            )}

            {isPaused && (
              <button
                onClick={onResume}
                className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                title="Resume build"
              >
                <Play size={18} />
              </button>
            )}

            <button
              onClick={onStop}
              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              title="Stop build"
            >
              <StopCircle size={18} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {plan.currentStepIndex + 1} of {plan.steps.length}
            </span>
            <span className={getStatusColor()}>
              {completedSteps} completed
              {failedSteps > 0 && `, ${failedSteps} failed`}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                plan.buildStatus === BuildStatus.FAILED
                  ? "bg-gradient-to-r from-red-500 to-red-400"
                  : plan.buildStatus === BuildStatus.COMPLETED
                  ? "bg-gradient-to-r from-green-500 to-green-400"
                  : "bg-gradient-to-r from-blue-500 to-blue-400"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${plan.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Current Step Detail */}
      {currentStep && (
        <div className="px-4 py-3 border-b border-border/40 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={isBuilding && !isPaused ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
            >
              {plan.currentStepIndex + 1}
            </motion.div>
            <span className="font-medium">{currentStep.title}</span>
          </div>
          <p className="text-sm text-muted-foreground ml-8">
            {currentStep.description}
          </p>
          {currentStep.filesToCreate?.length || currentStep.filesToModify?.length ? (
            <div className="ml-8 mt-2 flex flex-wrap gap-2">
              {currentStep.filesToCreate?.map((file) => (
                <span
                  key={file}
                  className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-mono"
                >
                  + {file}
                </span>
              ))}
              {currentStep.filesToModify?.map((file) => (
                <span
                  key={file}
                  className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono"
                >
                  ~ {file}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Step List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {plan.steps.map((step, index) => (
            <StepRow
              key={step.id}
              step={step}
              index={index}
              isCurrent={index === plan.currentStepIndex}
              isBuilding={isBuilding}
            />
          ))}
        </div>
      </div>

      {/* Build Complete Actions */}
      {plan.buildStatus === BuildStatus.COMPLETED && (
        <div className="px-4 py-3 border-t border-border/40 bg-green-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 size={18} />
              <span className="font-medium">
                All {plan.steps.length} steps completed successfully!
              </span>
            </div>
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Build Failed Actions */}
      {plan.buildStatus === BuildStatus.FAILED && (
        <div className="px-4 py-3 border-t border-border/40 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <span className="font-medium">
                Build failed at step {plan.currentStepIndex + 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors text-sm font-medium"
              >
                <RotateCcw size={14} />
                Retry
              </button>
              <button
                onClick={onStop}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepRow({
  step,
  index,
  isCurrent,
  isBuilding,
}: {
  step: PlanStep;
  index: number;
  isCurrent: boolean;
  isBuilding: boolean;
}) {
  const getIcon = () => {
    switch (step.status) {
      case "completed":
        return <CheckCircle2 size={16} className="text-green-500" />;
      case "failed":
        return <AlertCircle size={16} className="text-red-500" />;
      case "in_progress":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Clock size={16} className="text-blue-500" />
          </motion.div>
        );
      case "skipped":
        return <ChevronRight size={16} className="text-muted-foreground/50" />;
      default:
        return (
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
        );
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{
        backgroundColor: isCurrent && isBuilding
          ? "rgba(59, 130, 246, 0.05)"
          : "transparent",
      }}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
        step.status === "completed"
          ? "opacity-70"
          : step.status === "failed"
          ? "border border-red-500/30"
          : ""
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          step.status === "completed"
            ? "bg-green-500/20 text-green-600 dark:text-green-400"
            : step.status === "failed"
            ? "bg-red-500/20 text-red-600 dark:text-red-400"
            : step.status === "in_progress"
            ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {index + 1}
      </span>
      {getIcon()}
      <span
        className={`flex-1 text-sm ${
          step.status === "pending" ? "text-muted-foreground" : ""
        }`}
      >
        {step.title}
      </span>
      {step.estimatedComplexity && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded ${
            step.estimatedComplexity === "high"
              ? "bg-red-500/10 text-red-500"
              : step.estimatedComplexity === "medium"
              ? "bg-amber-500/10 text-amber-500"
              : "bg-green-500/10 text-green-500"
          }`}
        >
          {step.estimatedComplexity}
        </span>
      )}
    </motion.div>
  );
}
