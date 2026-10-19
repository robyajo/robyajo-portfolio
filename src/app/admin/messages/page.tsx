import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAdminContactMessages } from "@/app/admin/messages/actions";
import { MessagesPanel } from "@/app/admin/messages/panel";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminMessagesPage() {
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery({
        queryKey: queryKeys.admin.messages,
        queryFn: getAdminContactMessages,
    });

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-6 p-6">
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <MessagesPanel />
                </HydrationBoundary>
            </div>
        </div>
    );
}
