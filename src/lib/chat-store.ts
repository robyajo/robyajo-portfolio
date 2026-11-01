let open = false;
const listeners = new Set<() => void>();

export function subscribeChat(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getChatOpen() {
  return open;
}

export function getChatServerSnapshot() {
  return false;
}

export function setChatOpen(next: boolean) {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
}

export function toggleChat() {
  setChatOpen(!open);
}
