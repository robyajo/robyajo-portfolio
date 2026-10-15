DROP INDEX "guestbook_entries_clerk_user_idx";--> statement-breakpoint
ALTER TABLE "blog_comment_likes" DROP CONSTRAINT "blog_comment_likes_comment_id_clerk_user_id_pk";--> statement-breakpoint
ALTER TABLE "guestbook_likes" DROP CONSTRAINT "guestbook_likes_entry_id_clerk_user_id_pk";--> statement-breakpoint
ALTER TABLE "blog_comment_likes" ALTER COLUMN "clerk_user_id" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "blog_comments" ALTER COLUMN "clerk_user_id" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "guestbook_entries" ALTER COLUMN "clerk_user_id" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "guestbook_likes" ALTER COLUMN "clerk_user_id" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "blog_comment_likes" ADD COLUMN "user_id" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD COLUMN "user_id" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD COLUMN "author_name" varchar(256);--> statement-breakpoint
ALTER TABLE "blog_comments" ADD COLUMN "author_image" varchar(2048);--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD COLUMN "user_id" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD COLUMN "author_name" varchar(256);--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD COLUMN "author_image" varchar(2048);--> statement-breakpoint
ALTER TABLE "guestbook_likes" ADD COLUMN "user_id" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_comment_likes" ADD CONSTRAINT "blog_comment_likes_comment_id_user_id_pk" PRIMARY KEY("comment_id","user_id");--> statement-breakpoint
ALTER TABLE "guestbook_likes" ADD CONSTRAINT "guestbook_likes_entry_id_user_id_pk" PRIMARY KEY("entry_id","user_id");--> statement-breakpoint
CREATE INDEX "guestbook_entries_user_idx" ON "guestbook_entries" USING btree ("user_id");
