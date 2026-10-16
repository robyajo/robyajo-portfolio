import { IsoBox, projector } from "@/components/diagrams/iso";
import { SectionLabel } from "@/components/ui/typography";
import { getDictionary } from "@/lib/i18n/server";

const p = projector(24, 60, 40);

export async function PostGridFiller() {
  const filler = (await getDictionary()).blog.filler;
  return (
    <div className="hatch flex h-full min-h-64 flex-col items-center justify-center gap-4 p-gutter">
      <svg viewBox="0 0 120 90" aria-hidden="true" className="w-28">
        <IsoBox p={p} at={[0, 0, 0]} size={[2, 2, 1]} tone="ghost" />
      </svg>
      <SectionLabel pixel>{filler}</SectionLabel>
    </div>
  );
}
