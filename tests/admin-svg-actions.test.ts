import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/assert-admin", () => ({
  assertAdmin: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/svg/data/posts", () => ({
  findPost: () => undefined,
  loadPostCard: async () => {
    throw new Error("not used");
  },
  loadRecentPosts: async () => ({ total: 0, posts: [] }),
}));

import { getSvgDashboardData, getRawSvgAction } from "@/app/admin/svg/actions";

describe("Admin SVG Actions", () => {
  it("returns dashboard data with 17 isometric items and dynamic cards", async () => {
    const data = await getSvgDashboardData();
    expect(data.totalIsometric).toBe(17);
    expect(data.isometric.length).toBe(17);
    expect(data.totalDynamic).toBeGreaterThanOrEqual(9);

    const apiGateway = data.isometric.find((i) => i.id === "api-gateway");
    expect(apiGateway).toBeDefined();
    expect(apiGateway?.name).toBe("API Gateway");
    expect(apiGateway?.fileSizeBytes).toBeGreaterThan(0);
  });

  it("reads raw SVG markup for an existing isometric illustration", async () => {
    const svg = await getRawSvgAction("queue");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("Queue");
  });

  it("throws an error when reading a nonexistent SVG", async () => {
    await expect(getRawSvgAction("nonexistent-file-id")).rejects.toThrow();
  });
});
