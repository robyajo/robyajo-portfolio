import { getAdminProjectStacks } from "@/app/admin/actions";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";
import { ProjectsSubnav } from "@/app/admin/projects/subnav";
import { StacksPanel } from "@/app/admin/projects/stacks/panel";

export default async function AdminProjectStacksPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.admin.projectStacks,
    queryFn: getAdminProjectStacks,
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-6">
        <ProjectsSubnav />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <StacksPanel />
        </HydrationBoundary>
      </div>
    </div>
  );
}
