import { assertAdmin } from "@/lib/assert-admin";
import { getAiDashboardData } from "./actions";
import { AdminModelsPanel } from "./panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Model AI & Provider | Admin",
  description: "Kelola katalog model AI dan konfigurasi provider untuk Chat Bot dan Blog.",
};

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  await assertAdmin();
  const data = await getAiDashboardData();

  return <AdminModelsPanel initialData={data} />;
}
