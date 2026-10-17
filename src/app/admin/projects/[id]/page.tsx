import { getAdminProject } from "@/app/admin/actions";
import { notFound } from "next/navigation";
import { ProjectDetail } from "./detail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();
  const project = await getAdminProject(numericId);
  if (!project) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-6">
        <ProjectDetail project={project} />
      </div>
    </div>
  );
}
