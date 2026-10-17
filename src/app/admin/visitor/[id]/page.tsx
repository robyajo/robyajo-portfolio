import { getVisitor } from "@/app/admin/actions";
import { notFound } from "next/navigation";
import { VisitorDetail } from "./detail";

export const dynamic = "force-dynamic";

const HEX_ID = /^[a-f0-9]{8}$/;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminVisitorDetailPage({ params }: Props) {
  const { id } = await params;
  if (!HEX_ID.test(id)) notFound();
  const visitor = await getVisitor(id);
  if (!visitor) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 p-6">
        <VisitorDetail visitor={visitor} />
      </div>
    </div>
  );
}
