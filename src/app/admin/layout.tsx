import { AuthProvider } from "@/components/shared/auth-session";
import { getAuth } from "@/lib/auth";
import { getUnreadContactCount } from "@/lib/contact";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/app/admin/sidebar";
import { AdminHeader } from "@/app/admin/admin-header";
import { AdminUnauthorized } from "@/app/admin/unauthorized";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, role } = await getAuth();

  if (!userId) return redirect("/");
  const isOwner = userId === process.env.OWNER_USER_ID;
  if (role !== "admin" && !isOwner) return <AdminUnauthorized />;

  const unreadMessages = await getUnreadContactCount().catch(() => 0);

  return (
    <AuthProvider>
      <SidebarProvider>
        <AdminSidebar unreadMessages={unreadMessages} />
        <SidebarInset>
          <AdminHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
