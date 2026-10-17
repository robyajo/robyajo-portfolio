import {
    pgTable,
    varchar,
    timestamp,
    primaryKey,
    index,
    serial,
    boolean,
    text,
    integer,
    unique,
    type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
    "users",
    {
        id: serial("id").primaryKey(),
        email: varchar("email", { length: 320 }).notNull().unique(),
        name: varchar("name", { length: 256 }),
        image: varchar("image", { length: 2048 }),
        passwordHash: varchar("password_hash", { length: 256 }).notNull(),
        role: varchar("role", { length: 16 }).default("guest").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("users_email_idx").on(table.email),
    ],
);

export type UserRole = "guest" | "admin";

export const syncProjects = pgTable(
    "sync_projects",
    {
        id: serial("id").primaryKey(),
        /** Kunci auth bersama — satu kunci boleh menaungi banyak proyek (beda nama). */
        key: varchar("key", { length: 64 }).notNull(),
        name: varchar("name", { length: 256 }).notNull(),
        url: varchar("url", { length: 2048 }),
        description: text("description"),
        lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("sync_projects_name_idx").on(table.name),
        index("sync_projects_key_name_idx").on(table.key, table.name),
    ],
);

export const activities = pgTable(
    "activities",
    {
        id: serial("id").primaryKey(),
        projectKey: varchar("project_key", { length: 64 }).notNull(),
        projectName: varchar("project_name", { length: 256 }).notNull(),
        /** Kunci stabil dari pengirim (mis. nama berkas rilis) — untuk update, bukan duplikat. */
        externalId: varchar("external_id", { length: 256 }),
        kind: varchar("kind", { length: 32 }).default("update").notNull(),
        titleId: text("title_id").notNull(),
        titleEn: text("title_en").notNull(),
        bodyId: text("body_id"),
        bodyEn: text("body_en"),
        url: varchar("url", { length: 2048 }),
        occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("activities_project_idx").on(table.projectKey),
        index("activities_occurred_idx").on(table.occurredAt),
        index("activities_project_external_idx").on(table.projectKey, table.externalId),
    ],
);

export const blogPosts = pgTable(
    "blog_posts",
    {
        id: serial("id").primaryKey(),
        slug: varchar("slug", { length: 256 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        unique("blog_posts_slug_unique").on(table.slug),
    ],
);

export const blogReactions = pgTable(
    "blog_reactions",
    {
        postId: integer("post_id")
            .notNull()
            .references(() => blogPosts.id, { onDelete: "cascade", onUpdate: "cascade" }),
        ipHash: varchar("ip_hash", { length: 64 }).notNull(),
        mood: varchar("mood", { length: 32 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.postId, table.ipHash] }),
        index("blog_reactions_post_idx").on(table.postId),
    ],
);

export const blogReads = pgTable(
    "blog_reads",
    {
        postId: integer("post_id")
            .notNull()
            .references(() => blogPosts.id, { onDelete: "cascade", onUpdate: "cascade" }),
        ipHash: varchar("ip_hash", { length: 64 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.postId, table.ipHash] }),
        index("blog_reads_post_idx").on(table.postId),
    ],
);

export const guestbookEntries = pgTable(
    "guestbook_entries",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull(),
        authorName: varchar("author_name", { length: 256 }),
        authorImage: varchar("author_image", { length: 2048 }),
        message: text("message").notNull(),
        isPinned: boolean("is_pinned").default(false).notNull(),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("guestbook_entries_user_idx").on(table.userId),
        index("guestbook_entries_created_at_idx").on(table.createdAt),
    ],
);

export const guestbookLikes = pgTable(
    "guestbook_likes",
    {
        entryId: integer("entry_id")
            .notNull()
            .references(() => guestbookEntries.id, { onDelete: "cascade" }),
        userId: varchar("user_id", { length: 256 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.entryId, table.userId] }),
        index("guestbook_likes_entry_idx").on(table.entryId),
    ],
);

export const blogComments = pgTable(
    "blog_comments",
    {
        id: serial("id").primaryKey(),
        postId: integer("post_id")
            .notNull()
            .references(() => blogPosts.id, { onDelete: "cascade", onUpdate: "cascade" }),
        parentId: integer("parent_id").references(
            (): AnyPgColumn => blogComments.id,
            { onDelete: "cascade" },
        ),
        userId: varchar("user_id", { length: 256 }).notNull(),
        authorName: varchar("author_name", { length: 256 }),
        authorImage: varchar("author_image", { length: 2048 }),
        body: text("body").notNull(),
        isPinned: boolean("is_pinned").default(false).notNull(),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("blog_comments_post_idx").on(table.postId),
        index("blog_comments_parent_idx").on(table.parentId),
        index("blog_comments_pinned_idx").on(table.isPinned),
    ],
);

export const blogCommentLikes = pgTable(
    "blog_comment_likes",
    {
        commentId: integer("comment_id")
            .notNull()
            .references(() => blogComments.id, { onDelete: "cascade" }),
        userId: varchar("user_id", { length: 256 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.commentId, table.userId] }),
        index("blog_comment_likes_comment_idx").on(table.commentId),
    ],
);

export const projects = pgTable(
    "projects",
    {
        id: serial("id").primaryKey(),
        title: varchar("title", { length: 256 }).notNull(),
        slug: varchar("slug", { length: 256 }).notNull().unique(),
        /** Kunci X-project: aktivitas berkunci ini tampil di detail proyek. */
        syncKey: varchar("sync_key", { length: 64 }),
        description: text("description").notNull(),
        highlights: text("highlights").array().notNull().default(sql`'{}'::text[]`),
        live: varchar("live", { length: 512 }),
        github: varchar("github", { length: 512 }),
        enabled: boolean("enabled").default(true).notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("projects_enabled_idx").on(table.enabled),
        index("projects_sort_order_idx").on(table.sortOrder),
    ],
);

export const links = pgTable(
    "links",
    {
        id: serial("id").primaryKey(),
        target: varchar("target", { length: 2048 }).notNull(),
        title: varchar("title", { length: 256 }),
        description: text("description"),
        ogEnabled: boolean("og_enabled").default(false).notNull(),
        ogImage: varchar("og_image", { length: 2048 }),
        permanent: boolean("permanent").default(false).notNull(),
        enabled: boolean("enabled").default(true).notNull(),
        clicks: integer("clicks").default(0).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("links_enabled_idx").on(table.enabled),
    ],
);

export const linkSlugs = pgTable(
    "link_slugs",
    {
        id: serial("id").primaryKey(),
        linkId: integer("link_id")
            .notNull()
            .references(() => links.id, { onDelete: "cascade", onUpdate: "cascade" }),
        tag: varchar("tag", { length: 64 }).default("").notNull(),
        slug: varchar("slug", { length: 128 }).notNull(),
        isPrimary: boolean("is_primary").default(false).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        unique("link_slugs_tag_slug_unique").on(table.tag, table.slug),
        index("link_slugs_link_idx").on(table.linkId),
    ],
);

export const visitors = pgTable(
    "visitors",
    {
        /** Hash satu arah dari IP + perangkat (user-agent) + salt sisi server. */
        hash: varchar("hash", { length: 64 }).primaryKey(),
        views: integer("views").default(1).notNull(),
        firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
        lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
        country: varchar("country", { length: 64 }),
        region: varchar("region", { length: 128 }),
        city: varchar("city", { length: 128 }),
        device: varchar("device", { length: 128 }),
    },
    (table) => [
        index("visitors_last_seen_idx").on(table.lastSeenAt),
    ],
);
