"use client";

import { useSyncExternalStore } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

let open = false;
let expanded = false;
let messages: ChatMessage[] = [];
let draftInput = "";
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeChat(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getChatOpen() {
  return open;
}

export function getChatExpanded() {
  return expanded;
}

export function getChatMessages(): ChatMessage[] {
  return messages;
}

export function getChatDraftInput(): string {
  return draftInput;
}

export function getChatServerSnapshot() {
  return false;
}

export function setChatOpen(next: boolean) {
  if (open === next) return;
  open = next;
  notify();
}

export function setChatExpanded(next: boolean) {
  if (expanded === next) return;
  expanded = next;
  notify();
}

export function setChatMessages(
  next: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
) {
  messages = typeof next === "function" ? next(messages) : next;
  notify();
}

export function clearChatMessages() {
  messages = [];
  draftInput = "";
  notify();
}

export function setChatDraftInput(text: string) {
  draftInput = text;
}

export function toggleChat() {
  setChatOpen(!open);
}

export function toggleChatExpanded() {
  setChatExpanded(!expanded);
}

export function useChatOpen(): boolean {
  return useSyncExternalStore(subscribeChat, getChatOpen, getChatServerSnapshot);
}

export function useChatExpanded(): boolean {
  return useSyncExternalStore(
    subscribeChat,
    getChatExpanded,
    getChatServerSnapshot,
  );
}

export function useChatMessages(): ChatMessage[] {
  return useSyncExternalStore(subscribeChat, getChatMessages, () => []);
}
