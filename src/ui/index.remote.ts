/**
 * UI Components - Remote exports (Plugin/Sandbox)
 *
 * These are DSL identifiers that map to native components on the Host.
 */

export { StepList } from './StepList/StepList.remote';
export { ThemeView } from './ThemeView/ThemeView.remote';
export { UserAvatar } from './UserAvatar/UserAvatar.remote';
export { ChatBubble } from './ChatBubble/ChatBubble.remote';

// Re-export types (same types for both environments)
export type {
  StepListProps,
  StepItem,
  StepStatus,
  ThemeViewProps,
  UserAvatarProps,
  ChatBubbleProps,
} from '../types';
