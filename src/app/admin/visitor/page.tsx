import { TypographyH1, TypographyLead } from "@/components/ui/typography";
import { getVisitorMonitor, getVisitorOverview } from "@/app/admin/actions";
import { getDictionary } from "@/lib/i18n/server";
import { VisitorPanel } from "./panel";
import { VisitorCharts } from "./charts";

export default async function AdminVisitorPage() {
    const [monitor, overview, dict] = await Promise.all([
        getVisitorMonitor(),
        getVisitorOverview(),
        getDictionary(),
    ]);
    const t = dict.admin;

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-8 p-6">
                <div>
                    <TypographyH1>{t.visitor.title}</TypographyH1>
                    <TypographyLead>{t.visitor.overview}</TypographyLead>
                </div>
                <VisitorPanel
                    initial={monitor}
                    overview={overview}
                    ariaLabel={t.visitor.title}
                />
            </div>
        </div>
    );
}
