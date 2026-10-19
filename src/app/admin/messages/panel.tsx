"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    deleteContactMessage,
    getAdminContactMessages,
    setContactMessageRead,
} from "@/app/admin/messages/actions";
import { useActionMutation } from "@/hooks/use-action-mutation";
import { queryKeys } from "@/lib/query-keys";
import { useDictionary, useLocale } from "@/lib/i18n/provider";
import { dayAgoLabel, formatLongDate, toISOString } from "@/lib/date";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import {
    CheckIcon,
    EnvelopeIcon,
    TrashIcon,
} from "@/components/shared/icons";
import {
    SectionHeader,
    TypographyMuted,
    TypographySmall,
} from "@/components/ui/typography";

type Filter = "all" | "unread";

export function MessagesPanel() {
    const t = useDictionary().admin.messages;
    const dateLocale = useLocale() === "id" ? "id-ID" : "en-US";
    const [filter, setFilter] = useState<Filter>("all");

    const { data: messages = [], isError } = useQuery({
        queryKey: queryKeys.admin.messages,
        queryFn: getAdminContactMessages,
    });

    const mark = useActionMutation({
        action: ({ id, isRead }: { id: number; isRead: boolean }) =>
            setContactMessageRead(id, isRead),
        successMessage: ({ isRead }) =>
            isRead ? t.markedRead : t.markedUnread,
        invalidate: [queryKeys.admin.messages],
    });

    const remove = useActionMutation({
        action: (id: number) => deleteContactMessage(id),
        successMessage: t.deleted,
        invalidate: [queryKeys.admin.messages],
    });

    const unreadCount = messages.filter((message) => !message.isRead).length;
    const visible = filter === "unread"
        ? messages.filter((message) => !message.isRead)
        : messages;
    const pending = mark.isPending || remove.isPending;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <SectionHeader className="mb-1">{t.title}</SectionHeader>
                    <TypographyMuted>{t.lead}</TypographyMuted>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={unreadCount > 0 ? "default" : "outline"}>
                        {t.unread.replace("{count}", String(unreadCount))}
                    </Badge>
                    <ButtonGroup>
                        <Button
                            variant={filter === "all" ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setFilter("all")}
                        >
                            {t.filterAll}
                        </Button>
                        <Button
                            variant={
                                filter === "unread" ? "secondary" : "outline"
                            }
                            size="sm"
                            onClick={() => setFilter("unread")}
                        >
                            {t.filterUnread}
                        </Button>
                    </ButtonGroup>
                </div>
            </div>

            {isError && (
                <TypographyMuted role="alert">{t.loadFailed}</TypographyMuted>
            )}

            {visible.length === 0 && !isError && (
                <Empty bordered>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <EnvelopeIcon aria-hidden="true" />
                        </EmptyMedia>
                        <EmptyTitle>
                            {filter === "unread" && unreadCount === 0
                                ? t.emptyUnreadTitle
                                : t.emptyTitle}
                        </EmptyTitle>
                        <EmptyDescription>
                            {filter === "unread" && unreadCount === 0
                                ? t.emptyUnreadBody
                                : t.emptyBody}
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            )}

            {visible.length > 0 && (
                <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border">
                    {visible.map((message) => (
                        <article
                            key={message.id}
                            className={cn(
                                "flex flex-col gap-3 p-4",
                                !message.isRead && "bg-accent/30",
                            )}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <TypographySmall>
                                    {message.name}
                                </TypographySmall>
                                {!message.isRead && (
                                    <Badge variant="secondary">
                                        {t.unreadBadge}
                                    </Badge>
                                )}
                                <TypographyMuted
                                    className="ml-auto"
                                    title={formatLongDate(
                                        message.createdAt,
                                        dateLocale,
                                    )}
                                >
                                    <time
                                        dateTime={toISOString(message.createdAt)}
                                    >
                                        {dayAgoLabel(message.createdAt, dateLocale)}
                                    </time>
                                </TypographyMuted>
                            </div>

                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <TypographySmall>
                                    {message.subject ?? t.noSubject}
                                </TypographySmall>
                                <TypographyMuted>
                                    <a
                                        href={`mailto:${message.email}`}
                                        className="underline-offset-4 hover:text-foreground hover:underline"
                                    >
                                        {message.email}
                                    </a>
                                </TypographyMuted>
                            </div>

                            <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                                {message.message}
                            </p>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pending}
                                    onClick={() =>
                                        mark.mutate({
                                            id: message.id,
                                            isRead: !message.isRead,
                                        })
                                    }
                                >
                                    <CheckIcon
                                        data-icon="inline-start"
                                        aria-hidden="true"
                                    />
                                    {message.isRead ? t.markUnread : t.markRead}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={pending}
                                        >
                                            <TrashIcon
                                                data-icon="inline-start"
                                                aria-hidden="true"
                                            />
                                            {t.delete}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                {t.deleteTitle}
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t.deleteBody.replace(
                                                    "{name}",
                                                    message.name,
                                                )}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                {t.cancel}
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    remove.mutate(message.id)
                                                }
                                            >
                                                {t.delete}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
