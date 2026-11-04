import { assertAdmin } from "@/lib/assert-admin";
import { getChatLogsAction } from "./actions";
import { ChatLogsPanel } from "./_components/chat-logs-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log Percakapan AI Pengunjung – Admin Panel",
};

export const dynamic = "force-dynamic";

export default async function AdminChatLogsPage() {
  await assertAdmin();
  const initialData = await getChatLogsAction();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Percakapan AI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau seluruh percakapan pengunjung dari Bot Asisten AI dan AI Markas 3D beserta data IP, perangkat, sistem operasi, browser, dan pertanyaan pengunjung.
        </p>
      </div>

      <ChatLogsPanel initialData={initialData} />
    </div>
  );
}
