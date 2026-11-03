import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ai/test-chat/route";

vi.mock("@/lib/assert-admin", () => ({
  assertAdmin: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => [
            {
              id: "cloudflare",
              name: "Cloudflare AI Gateway",
              baseUrl: "https://er-ai-gateway.duckdns.org/v1",
              apiKey: "test-key",
            },
          ],
        }),
      }),
    }),
  },
}));

describe("POST /api/ai/test-chat", () => {
  it("rejects missing providerId or modelId with 400", async () => {
    const req = new Request("http://localhost:3000/api/ai/test-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("streams responses from upstream gateway successfully", async () => {
    const mockSSE = [
      'data: {"choices":[{"delta":{"content":"Pong"}}]}\n\n',
      "data: [DONE]\n\n",
    ].join("");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(mockSSE));
        controller.close();
      },
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    );

    const req = new Request("http://localhost:3000/api/ai/test-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: "cloudflare",
        modelId: "@cf/zai-org/glm-4.7-flash",
        message: "Ping",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }

    expect(text).toContain("Pong");
  });
});
