import { notFound } from "next/navigation";
import {
  getAdminBlogPostSource,
  getAdminBlogPosts,
} from "@/app/admin/blog/actions";
import { BlogPostDetail } from "./detail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminBlogPostDetailPage({ params }: Props) {
  const { id } = await params;
  const [source, posts] = await Promise.all([
    getAdminBlogPostSource(id),
    getAdminBlogPosts(),
  ]);
  const post = source ? posts.find((c) => c.slug === id) : null;
  if (!source || !post) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-6">
        <BlogPostDetail post={post} source={source} />
      </div>
    </div>
  );
}
