import {
  getAdminBlogCategories,
  getAdminBlogPosts,
  getAdminBlogTags,
} from "@/app/admin/blog/actions";
import { BlogPostsPanel } from "@/app/admin/blog/panel";
import { BlogSubnav } from "@/app/admin/blog/blog-subnav";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminBlogPage() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.admin.blogPosts,
      queryFn: getAdminBlogPosts,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.admin.blogCategories,
      queryFn: getAdminBlogCategories,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.admin.blogTags,
      queryFn: getAdminBlogTags,
    }),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-6">
        <BlogSubnav />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <BlogPostsPanel />
        </HydrationBoundary>
      </div>
    </div>
  );
}
