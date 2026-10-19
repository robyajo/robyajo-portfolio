import { getComments } from "@/app/(site)/blogs/[slug]/actions";
import { PostEngagement } from "@/app/(site)/blogs/[slug]/_components/post-engagement";
import { Panel, PanelRow } from "@/components/layouts/page";

export async function CommentsSection({
  slug,
  currentUserId,
}: {
  slug: string;
  currentUserId: string | null;
}) {
  const { comments } = await getComments(slug);
  return (
    <PostEngagement
      slug={slug}
      initialComments={comments}
      currentUserId={currentUserId}
    />
  );
}

export function CommentsFallback() {
  return (
    <Panel aria-hidden="true" className="animate-pulse">
      <PanelRow className="h-10" />
      <PanelRow className="h-44" />
      <PanelRow className="h-64" />
    </Panel>
  );
}
