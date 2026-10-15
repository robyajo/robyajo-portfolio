ALTER TABLE "blog_comment_likes" DROP COLUMN "clerk_user_id";--> statement-breakpoint
ALTER TABLE "blog_comments" DROP COLUMN "clerk_user_id";--> statement-breakpoint
ALTER TABLE "guestbook_entries" DROP COLUMN "clerk_user_id";--> statement-breakpoint
ALTER TABLE "guestbook_likes" DROP COLUMN "clerk_user_id";