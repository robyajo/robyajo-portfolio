import { IsoBox, project, projector } from "./iso";
import { isoTwinkle, isoType } from "./classes";
import { cn } from "@/lib/cn";

/**
 * Tumpukan slab isometrik berisi stack situs ini: Neon Postgres, Next.js,
 * React — dibuat dengan mesin sederhana (`iso.tsx`), bukan menjiplak scene
 * template. Jadikan pola ini untuk scene orisinal Anda berikutnya.
 */
const SLABS = [
  { label: "Neon Postgres", tone: "default", z: 0 },
  { label: "Next.js", tone: "default", z: 9 },
  { label: "React", tone: "accent", z: 18 },
] as const;

const W = 40;
const D = 26;
const H = 6;

const p = projector(3.0, 150, 102);

function SlabLabel({ z, children }: { z: number; children: string }) {
  const [x, y] = project(p, [W / 2, D / 2, z + H]);
  return (
    <text
      x={x}
      y={y - 10}
      textAnchor="middle"
      fontSize="11"
      className={cn(isoType, "fill-foreground")}
    >
      {children}
    </text>
  );
}

const SPARKS: Array<[number, number, number]> = [
  [52, 6, 26],
  [-8, 30, 14],
  [46, 32, 8],
];

export function RobyStack({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 220"
      role="img"
      aria-label="Tumpukan tiga slab: Neon Postgres, Next.js, dan React"
      className={cn("h-auto w-full overflow-visible", className)}
    >
      {SLABS.map((slab) => (
        <g key={slab.label}>
          <IsoBox p={p} at={[0, 0, slab.z]} size={[W, D, H]} tone={slab.tone} />
          <SlabLabel z={slab.z}>{slab.label}</SlabLabel>
        </g>
      ))}
      {SPARKS.map(([x, y, z], i) => {
        const [sx, sy] = project(p, [x, y, z]);
        return (
          <circle
            key={i}
            cx={sx}
            cy={sy}
            r="2.5"
            className={isoTwinkle}
            style={{ animationDelay: `-${(i * 0.7).toFixed(1)}s` }}
          />
        );
      })}
    </svg>
  );
}
