import { assertAdmin } from "@/lib/assert-admin";
import { getSvgDashboardData } from "./actions";
import { AdminSvgPanel } from "./panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galeri & Manajemen Aset SVG | Admin",
  description: "Kelola dan inspeksi seluruh aset ilustrasi isometrik Illos dan kartu SVG dinamis portofolio.",
};

export const dynamic = "force-dynamic";

export default async function AdminSvgPage() {
  await assertAdmin();
  const data = await getSvgDashboardData();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Aset SVG</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Koleksi 17 ilustrasi isometrik beranimasi dari Illos.dev dan 9 kartu SVG dinamis untuk Readme GitHub, artikel MDX, dan arsitektur sistem.
        </p>
      </div>

      <AdminSvgPanel data={data} />
    </div>
  );
}
