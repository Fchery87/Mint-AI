'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExecutionPlan, PlanStep, ClarifyingQuestion } from '@/types/plan-build';
import {
  X,
  ClipboardList,
  AlertCircle,
  Check,
  Trash2,
  Plus,
  GripVertical,
} from 'lucide-react';

interface PlanReviewModalProps {
  isOpen: boolean;
  plan: ExecutionPlan | null;
  onClose: () => void;
  onApprove: () => void;
  onSave: (updatedPlan: ExecutionPlan) => void;
}

export function PlanReviewModal({
  isOpen,
  plan,
  onClose,
  onApprove,
  onSave,
}: PlanReviewModalProps) {
  const [editedPlan, setEditedPlan] = useState<ExecutionPlan | null>(plan);

  // Sync with prop changes (using useEffect to avoid infinite render loop)
  useEffect(() => {
    if (plan && editedPlan?.id !== plan.id) {
      setEditedPlan(plan);
    }
  }, [plan?.id]); // Only re-run when plan ID changes

  if (!editedPlan) return null;

  const hasUnansweredQuestions = editedPlan.clarifyingQuestions.some(
    (q) => q.required && !q.answer
  );

  const handleApprove = () => {
    onSave(editedPlan);
    onApprove();
    onClose();
  };

  const updateQuestion = (id: string, updates: Partial<ClarifyingQuestion>) => {
    setEditedPlan({
      ...editedPlan,
      clarifyingQuestions: editedPlan.clarifyingQuestions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    });
  };

  const deleteQuestion = (id: string) => {
    setEditedPlan({
      ...editedPlan,
      clarifyingQuestions: editedPlan.clarifyingQuestions.filter((q) => q.id !== id),
    });
  };

  const updateStep = (id: string, updates: Partial<PlanStep>) => {
    setEditedPlan({
      ...editedPlan,
      steps: editedPlan.steps.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const deleteStep = (id: string) => {
    setEditedPlan({
      ...editedPlan,
      steps: editedPlan.steps.filter((s) => s.id !== id),
    });
  };

  const addStep = () => {
    const newStep: PlanStep = {
      id: `step_${Date.now()}`,
      order: editedPlan.steps.length + 1,
      title: 'New Step',
      description: '',
      status: 'pending',
      estimatedComplexity: 'medium',
    };
    setEditedPlan({
      ...editedPlan,
      steps: [...editedPlan.steps, newStep],
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center
                     bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[85vh] mx-4
                       bg-card border border-border/40 rounded-2xl
                       shadow-2xl shadow-black/20 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4
                            border-b border-border/40 bg-muted/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <ClipboardList className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Review Plan
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Edit steps, questions, or approve to proceed
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {/* Plan Title */}
              <div className="mb-6">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Plan Title
                </label>
                <input
                  type="text"
                  value={editedPlan.title}
                  onChange={(e) =>
                    setEditedPlan({ ...editedPlan, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border
                             text-foreground text-sm focus:outline-none focus:ring-2
                             focus:ring-primary/20 focus:border-primary/50 transition-all"
                />
              </div>

              {/* Questions */}
              {editedPlan.clarifyingQuestions.length > 0 && (
                <div className="mb-6">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 block">
                    Clarifying Questions
                  </label>
                  <div className="space-y-3">
                    {editedPlan.clarifyingQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold shrink-0 mt-1">
                            Q{idx + 1}
                          </span>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) =>
                                updateQuestion(q.id, { question: e.target.value })
                              }
                              className="w-full px-3 py-1.5 rounded-lg bg-background/50 border border-border/50
                                         text-sm focus:outline-none focus:ring-2 focus:ring-primary/20
                                         focus:border-primary/50 transition-all"
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={(e) =>
                                    updateQuestion(q.id, { required: e.target.checked })
                                  }
                                  className="rounded accent-primary"
                                />
                                Required
                              </label>
                              <button
                                onClick={() => deleteQuestion(q.id)}
                                className="ml-auto p-1.5 rounded-lg hover:bg-red-500/10
                                           text-red-500/50 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Implementation Steps ({editedPlan.steps.length})
                  </label>
                  <button
                    onClick={addStep}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                               bg-primary/10 hover:bg-primary/20 border border-primary/20
                               text-xs font-medium text-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Step
                  </button>
                </div>
                <div className="space-y-3">
                  {editedPlan.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="p-4 rounded-xl bg-muted/50 border border-border/50
                                 hover:border-border transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold border-2 border-primary/20">
                            {idx + 1}
                          </span>
                          <GripVertical className="w-4 h-4 text-muted-foreground/30 mt-1" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) =>
                              updateStep(step.id, { title: e.target.value })
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-background border border-border
                                       text-sm font-medium focus:outline-none focus:ring-2
                                       focus:ring-primary/20 focus:border-primary/50 transition-all"
                          />
                          <textarea
                            value={step.description}
                            onChange={(e) =>
                              updateStep(step.id, { description: e.target.value })
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-background border border-border
                                       text-xs text-muted-foreground focus:outline-none focus:ring-2
                                       focus:ring-primary/20 focus:border-primary/50 transition-all
                                       min-h-[60px]"
                            placeholder="Description..."
                          />
                          <div className="flex items-center gap-3 flex-wrap">
                            <select
                              value={step.estimatedComplexity || 'medium'}
                              onChange={(e) =>
                                updateStep(step.id, {
                                  estimatedComplexity: e.target.value as 'low' | 'medium' | 'high',
                                })
                              }
                              className="px-2 py-1 rounded text-xs bg-background border border-border
                                         focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="low">Low Complexity</option>
                              <option value="medium">Medium Complexity</option>
                              <option value="high">High Complexity</option>
                            </select>
                            <button
                              onClick={() => deleteStep(step.id)}
                              className="ml-auto p-1.5 rounded-lg hover:bg-red-500/10
                                         text-red-500/50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4
                            border-t border-border/40 bg-muted/30 shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Changes are saved automatically</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-border/50
                             bg-background hover:bg-muted transition-colors
                             text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={hasUnansweredQuestions}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg
                             bg-primary hover:bg-primary/90 disabled:bg-muted
                             disabled:text-muted-foreground
                             border border-primary/20
                             shadow-lg shadow-primary/20
                             transition-all duration-200
                             text-sm font-semibold text-primary-foreground
                             disabled:shadow-none disabled:border-border/50"
                >
                  <Check className="w-4 h-4" />
                  Approve & Build
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PlanReviewModal;
