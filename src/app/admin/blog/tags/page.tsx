import { getAdminBlogTags } from "@/app/admin/blog/actions";
import { BlogTagsPanel } from "@/app/admin/blog/tags/panel";
import { BlogSubnav } from "@/app/admin/blog/blog-subnav";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminBlogTagsPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.admin.blogTags,
    queryFn: getAdminBlogTags,
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-6">
        <BlogSubnav />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <BlogTagsPanel />
        </HydrationBoundary>
      </div>
    </div>
  );
}
