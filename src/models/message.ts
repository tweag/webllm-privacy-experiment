/**
 * Message Types
 * Contains types related to chat messages
 */

export type Message = {
  id?: string;
  text: string;
  isUser: boolean;
  source?: string;
}; 