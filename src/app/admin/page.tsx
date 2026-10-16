import {
  BookOpenIcon,
  ChatCircleIcon,
  EyeIcon,
  HeartIcon,
} from "@/components/shared/icons";
import {
  TypographyH1,
  TypographyLead,
  TypographyMuted,
  TypographySmall,
  Text,
} from "@/components/ui/typography";
import { getAdminStats } from "@/app/admin/actions";
import { ResumeRefresh } from "@/app/admin/resume-refresh";
import { getDictionary } from "@/lib/i18n/server";

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-5">
      <div className="flex items-center justify-between">
        <TypographySmall className="text-muted-foreground">
          {label}
        </TypographySmall>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <Text as="p" className="text-3xl font-bold tabular-nums">
        {value.toLocaleString()}
      </Text>
      {sub && <TypographyMuted className="text-xs">{sub}</TypographyMuted>}
    </div>
  );
}

export default async function AdminPage() {
  const stats = await getAdminStats();
  const t = (await getDictionary()).admin;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-8 p-6">
        <div>
          <TypographyH1>{t.title}</TypographyH1>
          <TypographyLead>{t.overview}</TypographyLead>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label={t.overviewStats.guestbook}
            value={stats.guestbook.active}
            sub={t.overviewStats.totalPair.replace("{total}", String(stats.guestbook.total))}
            icon={<ChatCircleIcon className="size-4" weight="duotone" />}
          />
          <StatCard
            label={t.overviewStats.comments}
            value={stats.comments.active}
            sub={t.overviewStats.totalPair.replace("{total}", String(stats.comments.total))}
            icon={<BookOpenIcon className="size-4" weight="duotone" />}
          />
          <StatCard
            label={t.overviewStats.reads}
            value={stats.reads}
            sub={t.overviewStats.uniquePair}
            icon={<EyeIcon className="size-4" weight="duotone" />}
          />
          <StatCard
            label={t.overviewStats.reactions}
            value={stats.reactions}
            sub={t.overviewStats.uniquePair}
            icon={<HeartIcon className="size-4" weight="duotone" />}
          />
        </div>

        <ResumeRefresh />
      </div>
    </div>
  );
}
