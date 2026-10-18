import {
  getAdminProjectStacks,
  getAdminProjects,
} from "@/app/admin/actions";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";
import { ProjectsPanel } from "@/app/admin/projects/panel";
import { ProjectsSubnav } from "@/app/admin/projects/subnav";

export default async function AdminProjectsPage() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.admin.projects,
      queryFn: getAdminProjects,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.admin.projectStacks,
      queryFn: getAdminProjectStacks,
    }),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-6">
        <ProjectsSubnav />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ProjectsPanel />
        </HydrationBoundary>
      </div>
    </div>
  );
}
