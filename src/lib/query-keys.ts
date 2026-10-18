export const queryKeys = {
  guestbook: ["guestbook"] as const,
  reactions: (slug: string) => ["reactions", slug] as const,
  admin: {
    stats: ["admin", "stats"] as const,
    links: ["admin", "links"] as const,
    projects: ["admin", "projects"] as const,
    projectStacks: ["admin", "projects", "stacks"] as const,
    comments: ["admin", "comments"] as const,
    guestbook: ["admin", "guestbook"] as const,
    blogPosts: ["admin", "blog", "posts"] as const,
    blogPost: (slug: string) => ["admin", "blog", "post", slug] as const,
    blogCategories: ["admin", "blog", "categories"] as const,
    blogTags: ["admin", "blog", "tags"] as const,
  },
} as const;
