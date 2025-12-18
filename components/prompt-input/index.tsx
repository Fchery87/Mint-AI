// Export all components and hooks
export {
  PromptInputProvider,
  usePromptInputController,
  usePromptInputTextarea,
} from "./context";

export type {
  PromptInputAttachment,
  PromptInputMessage,
  PromptInputController,
} from "./context";

export {
  PromptInput,
  PromptInputAttachments,
  PromptInputAttachmentCard,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputActionAddAttachments,
} from "./components";

export {
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
} from "./action-menu";

export {
  PromptInputSpeechButton,
} from "./speech-button";
