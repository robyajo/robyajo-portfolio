"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionMutation } from "@/hooks/use-action-mutation";
import { useDictionary } from "@/lib/i18n/provider";
import { queryKeys } from "@/lib/query-keys";
import {
    createManualActivity,
    deleteActivityAction,
    getProjectActivities,
    updateActivity,
} from "@/app/admin/actions";
import type { Activity } from "@/lib/activities";
import { splitActivityBody } from "@/lib/activities-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { formatShortDate } from "@/lib/date";
import { useLocale } from "@/lib/i18n/provider";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/shared/icons";

const KINDS = ["deploy", "feature", "fix", "update"] as const;

const emptyDraft = { kind: "update", titleId: "", titleEn: "", bodyId: "", bodyEn: "", url: "" };

function ActivityEditor({
    initial,
    submitLabel,
    pending,
    onSubmit,
    onCancel,
}: {
    initial?: Partial<typeof emptyDraft>;
    submitLabel: string;
    pending: boolean;
    onSubmit: (values: typeof emptyDraft) => void;
    onCancel?: () => void;
}) {
    const t = useDictionary().admin.activities;
    const [draft, setDraft] = useState({ ...emptyDraft, ...initial });
    const set = (key: keyof typeof emptyDraft) => (value: string) =>
        setDraft((d) => ({ ...d, [key]: value }));

    return (
        <form
            className="flex flex-col gap-2 rounded-lg border p-3"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(draft);
            }}
        >
            <div className="grid grid-cols-2 gap-2">
                <Input
                    value={draft.titleId}
                    onChange={(e) => set("titleId")(e.target.value)}
                    placeholder={t.titleId}
                    disabled={pending}
                />
                <Input
                    value={draft.titleEn}
                    onChange={(e) => set("titleEn")(e.target.value)}
                    placeholder={t.titleEn}
                    disabled={pending}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Textarea
                    value={draft.bodyId}
                    onChange={(e) => set("bodyId")(e.target.value)}
                    placeholder={t.bodyId}
                    rows={2}
                    disabled={pending}
                />
                <Textarea
                    value={draft.bodyEn}
                    onChange={(e) => set("bodyEn")(e.target.value)}
                    placeholder={t.bodyEn}
                    disabled={pending}
                />
            </div>
            <div className="flex gap-2">
                <Select
                    value={draft.kind}
                    onValueChange={(v) => set("kind")(v)}
                    disabled={pending}
                >
                    <SelectTrigger className="w-32" aria-label={t.kind}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {KINDS.map((k) => (
                            <SelectItem key={k} value={k}>
                                {k}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    value={draft.url}
                    onChange={(e) => set("url")(e.target.value)}
                    placeholder={t.url}
                    disabled={pending}
                    className="font-mono"
                />
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                    {submitLabel}
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onCancel}
                        disabled={pending}
                    >
                        {t.cancel}
                    </Button>
                )}
            </div>
        </form>
    );
}

export function ProjectActivities({ syncKey }: { syncKey: string }) {
    const t = useDictionary().admin.activities;
    const locale = useLocale();
    const queryClient = useQueryClient();
    const { data: items = [] } = useQuery({
        queryKey: [...queryKeys.admin.projects, "activities", syncKey],
        queryFn: () => getProjectActivities(syncKey),
    });
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [confirmId, setConfirmId] = useState<number | null>(null);

    function refresh() {
        void queryClient.invalidateQueries({
            queryKey: [...queryKeys.admin.projects, "activities", syncKey],
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.admin.projects });
    }

    const save = useActionMutation({
        action: (values: typeof emptyDraft) =>
            createManualActivity({ ...values, syncKey }),
        successMessage: () => t.added,
        onDone: () => {
            setAdding(false);
            refresh();
        },
    });

    const edit = useActionMutation({
        action: ({ id, values }: { id: number; values: typeof emptyDraft }) =>
            updateActivity(id, values),
        successMessage: () => t.updated,
        onDone: () => {
            setEditingId(null);
            refresh();
        },
    });

    const remove = useActionMutation({
        action: (id: number) => deleteActivityAction(id),
        successMessage: () => t.deleted,
        onDone: () => {
            setConfirmId(null);
            refresh();
        },
    });

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <TypographySmall className="font-semibold">{t.heading}</TypographySmall>
                {!adding && (
                    <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
                        <PlusIcon data-icon="inline-start" className="size-3.5" aria-hidden="true" />
                        {t.add}
                    </Button>
                )}
            </div>

            {adding && (
                <ActivityEditor
                    submitLabel={t.save}
                    pending={save.isPending}
                    onSubmit={(values) => save.mutate(values)}
                    onCancel={() => setAdding(false)}
                />
            )}

            {items.length === 0 && !adding ? (
                <TypographyMuted className="text-sm">{t.empty}</TypographyMuted>
            ) : (
                <ul className="flex flex-col gap-2">
                    {items.map((a: Activity) => (
                        <li key={a.id} className="rounded-lg border p-3">
                            {editingId === a.id ? (
                                <ActivityEditor
                                    initial={{
                                        kind: a.kind,
                                        titleId: a.titleId,
                                        titleEn: a.titleEn,
                                        bodyId: a.bodyId ?? "",
                                        bodyEn: a.bodyEn ?? "",
                                        url: a.url ?? "",
                                    }}
                                    submitLabel={t.update}
                                    pending={edit.isPending}
                                    onSubmit={(values) =>
                                        edit.mutate({ id: a.id, values })
                                    }
                                    onCancel={() => setEditingId(null)}
                                />
                            ) : (
                                <div className="flex items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold">
                                                {a.titleId}
                                            </span>
                                            <Badge variant="secondary" size="tiny">
                                                {a.kind}
                                            </Badge>
                                        </div>
                                        <TypographyMuted className="text-xs">
                                            {a.titleEn} · {formatShortDate(a.occurredAt)}
                                        </TypographyMuted>
                                        {(() => {
                                            const pickBody = () =>
                                                locale === "id"
                                                    ? splitActivityBody(a.bodyId)
                                                    : splitActivityBody(a.bodyEn);
                                            const { lead, bullets } = pickBody();
                                            if (!lead && bullets.length === 0) return null;
                                            return (
                                                <div className="mt-2 flex flex-col gap-1.5">
                                                    {lead && (
                                                        <TypographyMuted>{lead}</TypographyMuted>
                                                    )}
                                                    {bullets.length > 0 && (
                                                        <ul className="flex flex-col gap-1">
                                                            {bullets.map((b) => (
                                                                <li key={b} className="flex gap-1.5 text-xs text-muted-foreground">
                                                                    <span aria-hidden="true">–</span>
                                                                    <span className="min-w-0">{b}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <Button
                                        size="icon-sm"
                                        variant="secondary"
                                        onClick={() => setEditingId(a.id)}
                                        aria-label={t.edit}
                                        className="size-7 shrink-0"
                                    >
                                        <PencilIcon className="size-3.5" />
                                    </Button>
                                    {confirmId === a.id ? (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => remove.mutate(a.id)}
                                            disabled={remove.isPending}
                                            className="h-7 shrink-0"
                                        >
                                            {t.delete}?
                                        </Button>
                                    ) : (
                                        <Button
                                            size="icon-sm"
                                            variant="secondary"
                                            onClick={() => setConfirmId(a.id)}
                                            aria-label={t.delete}
                                            className="size-7 shrink-0 text-destructive hover:text-destructive"
                                        >
                                            <TrashIcon className="size-3.5" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
