/**
 * Helper to parse LLM stream or final response to separate reasoning/thinking process
 * from the actual answer content.
 */

export interface ParsedAiResponse {
  thinking: string | null;
  isThinkingActive: boolean;
  content: string;
}

export function parseAiResponse(
  rawText: string,
  isStreaming: boolean,
): ParsedAiResponse {
  if (!rawText) {
    return { thinking: null, isThinkingActive: false, content: "" };
  }

  // Case 1: Standard <think> ... </think> tags
  if (rawText.includes("<think>")) {
    const thinkStart = rawText.indexOf("<think>") + 7;
    const thinkEnd = rawText.indexOf("</think>");

    if (thinkEnd !== -1) {
      // Completed <think>
      const thinking = rawText.slice(thinkStart, thinkEnd).trim();
      const content = rawText.slice(thinkEnd + 8).trimStart();
      return {
        thinking,
        isThinkingActive: false,
        content,
      };
    } else {
      // Streaming inside <think>
      const thinking = rawText.slice(thinkStart);
      return {
        thinking,
        isThinkingActive: isStreaming,
        content: "",
      };
    }
  }

  // Case 2: Plain text "Thinking Process:" or "Reasoning Process:" headers
  const thinkHeaderRegex =
    /^(?:Thinking Process|Reasoning Process|Proses Berpikir):\s*\n/i;
  const headerMatch = rawText.match(thinkHeaderRegex);

  if (headerMatch) {
    const body = rawText.slice(headerMatch[0].length);

    // Look for transition back to main response
    const delimiterRegex =
      /\n\n(?:\*{1,2}(?:Final Answer|Jawaban|Response)\*{1,2}:?|---\n|(?:Halo|Hai|Tentu|Berikut|Roby Karti S)\b)/i;
    const delimiterMatch = body.match(delimiterRegex);

    if (delimiterMatch && delimiterMatch.index !== undefined) {
      const thinking = body.slice(0, delimiterMatch.index).trim();
      const content = body.slice(delimiterMatch.index + 2).trimStart();
      return {
        thinking,
        isThinkingActive: false,
        content,
      };
    } else if (isStreaming) {
      // Still generating the thinking process
      return {
        thinking: body,
        isThinkingActive: true,
        content: "",
      };
    }
  }

  // Case 3: No thinking tag detected
  return {
    thinking: null,
    isThinkingActive: false,
    content: rawText,
  };
}
