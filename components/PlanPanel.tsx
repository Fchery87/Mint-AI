"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Play,
  Edit3,
  ChevronDown,
  ChevronRight,
  FileCode,
  FilePlus,
  HelpCircle,
  Send,
  SkipForward,
} from "lucide-react";
import type {
  ExecutionPlan,
  PlanStep,
  ClarifyingQuestion,
  AnalyzedFile,
} from "@/types/plan-build";
import { PlanStatus, BuildStatus } from "@/types/plan-build";

interface PlanPanelProps {
  plan: ExecutionPlan | null;
  isEditable: boolean;
  onApprovePlan: () => void;
  onStartBuild: () => void;
  onEditPlan: (plan: ExecutionPlan) => void;
  onAnswerQuestion: (questionId: string, answer: string) => void;
  canStartBuild: boolean;
}

export function PlanPanel({
  plan,
  isEditable: _isEditable,
  onApprovePlan,
  onStartBuild,
  onEditPlan: _onEditPlan,
  onAnswerQuestion,
  canStartBuild,
}: PlanPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showAnalyzedFiles, setShowAnalyzedFiles] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <FileCode size={32} className="text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-lg font-medium">No plan yet</p>
            <p className="text-sm text-muted-foreground/70">
              Describe what you want to build to start planning
            </p>
          </div>
        </div>
      </div>
    );
  }

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };



  const handleSubmitAnswer = (questionId: string) => {
    const answer = questionAnswers[questionId];
    if (answer?.trim()) {
      onAnswerQuestion(questionId, answer.trim());
      setQuestionAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const isPlanReady = plan.status === PlanStatus.READY || plan.status === PlanStatus.APPROVED;
  const isApproved = plan.status === PlanStatus.APPROVED;
  const hasUnansweredQuestions = plan.clarifyingQuestions.some(
    (q) => q.required && !q.answer
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Plan Header */}
      <div className="px-4 py-3 border-b border-border/40 bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">📋 {plan.title}</h2>
            {plan.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {plan.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {plan.estimatedDuration && (
              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                ~{plan.estimatedDuration}
              </span>
            )}
            {isPlanReady && !isApproved && (
              <button
                onClick={onApprovePlan}
                className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/20 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                Approve Plan
              </button>
            )}
            {isApproved && canStartBuild && (
              <button
                onClick={onStartBuild}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1.5"
              >
                <Play size={14} />
                Start Building
              </button>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        {plan.buildStatus !== BuildStatus.IDLE && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Build Progress</span>
              <span>{plan.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${plan.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Plan Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Clarifying Questions Section */}
        {plan.clarifyingQuestions.length > 0 && (
          <div className="p-4 border-b border-border/40">
            <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
              <HelpCircle size={16} className="text-amber-500" />
              Questions for You
              {hasUnansweredQuestions && (
                <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  Action needed
                </span>
              )}
            </h3>
            <div className="space-y-3">
              {plan.clarifyingQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  answer={questionAnswers[question.id] || ""}
                  onChangeAnswer={(answer) =>
                    setQuestionAnswers((prev) => ({ ...prev, [question.id]: answer }))
                  }
                  onSubmit={() => handleSubmitAnswer(question.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Analyzed Files Section */}
        {plan.analyzedFiles.length > 0 && (
          <div className="p-4 border-b border-border/40">
            <button
              onClick={() => setShowAnalyzedFiles(!showAnalyzedFiles)}
              className="flex items-center gap-2 font-medium text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showAnalyzedFiles ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              <FileCode size={16} />
              <span>Analyzed Files ({plan.analyzedFiles.length})</span>
            </button>
            <AnimatePresence>
              {showAnalyzedFiles && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-1 overflow-hidden"
                >
                  {plan.analyzedFiles.map((file) => (
                    <AnalyzedFileCard key={file.path} file={file} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Steps Section */}
        <div className="p-4">
          <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
            <Edit3 size={16} />
            Implementation Steps ({plan.steps.length})
          </h3>
          <div className="space-y-2">
            {plan.steps.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                isExpanded={expandedSteps.has(step.id)}
                onToggle={() => toggleStep(step.id)}
                isCurrent={index === plan.currentStepIndex && plan.buildStatus === BuildStatus.EXECUTING}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  answer,
  onChangeAnswer,
  onSubmit,
}: {
  question: ClarifyingQuestion;
  answer: string;
  onChangeAnswer: (answer: string) => void;
  onSubmit: () => void;
}) {
  const isAnswered = !!question.answer;

  return (
    <div
      className={`p-3 rounded-lg border ${
        isAnswered
          ? "bg-green-500/5 border-green-500/20"
          : "bg-amber-500/5 border-amber-500/20"
      }`}
    >
      <p className="text-sm font-medium mb-2">
        {question.question}
        {question.required && !isAnswered && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </p>
      {isAnswered ? (
        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
          <CheckCircle2 size={14} />
          {question.answer}
        </p>
      ) : (
        <div className="flex gap-2">
          {question.options ? (
            <div className="flex flex-wrap gap-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChangeAnswer(option);
                    setTimeout(onSubmit, 100);
                  }}
                  className="px-2 py-1 text-xs bg-background border border-border rounded hover:bg-muted transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <>
              <input
                type="text"
                value={answer}
                onChange={(e) => onChangeAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                placeholder="Type your answer..."
                className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={onSubmit}
                disabled={!answer.trim()}
                className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AnalyzedFileCard({ file }: { file: AnalyzedFile }) {
  const relevanceColors = {
    high: "text-green-500 bg-green-500/10",
    medium: "text-amber-500 bg-amber-500/10",
    low: "text-muted-foreground bg-muted",
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded text-sm">
      {file.willModify ? (
        <FilePlus size={14} className="text-blue-500" />
      ) : (
        <FileCode size={14} className="text-muted-foreground" />
      )}
      <span className="flex-1 font-mono text-xs truncate">{file.path}</span>
      <span
        className={`text-xs px-1.5 py-0.5 rounded ${relevanceColors[file.relevance]}`}
      >
        {file.relevance}
      </span>
    </div>
  );
}

function StepCard({
  step,
  index,
  isExpanded,
  onToggle,
  isCurrent,
}: {
  step: PlanStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isCurrent: boolean;
}) {
  const getStepIcon = (status: PlanStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={18} className="text-green-500" />;
      case "in_progress":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Clock size={18} className="text-blue-500" />
          </motion.div>
        );
      case "failed":
        return <AlertCircle size={18} className="text-red-500" />;
      case "skipped":
        return <SkipForward size={18} className="text-muted-foreground" />;
      default:
        return <Circle size={18} className="text-muted-foreground/50" />;
    }
  };

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isCurrent
          ? "border-blue-500/50 bg-blue-500/5"
          : step.status === "completed"
          ? "border-green-500/30 bg-green-500/5"
          : step.status === "failed"
          ? "border-red-500/30 bg-red-500/5"
          : "border-border/40 bg-card/30"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
          {index + 1}
        </span>
        {getStepIcon(step.status)}
        <span className="flex-1 font-medium text-sm">{step.title}</span>
        {step.estimatedComplexity && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
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
        {isExpanded ? (
          <ChevronDown size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 border-t border-border/20 mt-1">
              <p className="text-sm text-muted-foreground mt-2">
                {step.description}
              </p>

              {/* Files to modify/create */}
              {(step.filesToModify?.length || step.filesToCreate?.length) && (
                <div className="mt-2 space-y-1">
                  {step.filesToCreate?.map((file) => (
                    <div
                      key={file}
                      className="flex items-center gap-1.5 text-xs text-blue-500"
                    >
                      <FilePlus size={12} />
                      <span className="font-mono">{file}</span>
                      <span className="text-muted-foreground">(new)</span>
                    </div>
                  ))}
                  {step.filesToModify?.map((file) => (
                    <div
                      key={file}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <FileCode size={12} />
                      <span className="font-mono">{file}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Output/Error */}
              {step.output && (
                <div
                  className={`mt-2 p-2 rounded text-xs font-mono ${
                    step.status === "failed"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.output}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
