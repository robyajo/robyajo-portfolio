import { getAdminBlogCategories } from "@/app/admin/blog/actions";
import { BlogCategoriesPanel } from "@/app/admin/blog/categories/panel";
import { BlogSubnav } from "@/app/admin/blog/blog-subnav";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminBlogCategoriesPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.admin.blogCategories,
    queryFn: getAdminBlogCategories,
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-6">
        <BlogSubnav />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <BlogCategoriesPanel />
        </HydrationBoundary>
      </div>
    </div>
  );
}
