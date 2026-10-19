import { z } from "zod";
import { isHttpUrl } from "@/lib/links-schema";

export const PROJECT_LIMITS = {
  title: 256,
  slug: 256,
  syncKey: 64,
  description: 2000,
  highlight: 300,
  highlights: 12,
  url: 512,
  caseStudy: 2000,
  period: 64,
  metricLabel: 40,
  metricValue: 40,
  metrics: 6,
  gallery: 8,
  galleryUrl: 1024,
} as const;

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .max(PROJECT_LIMITS.slug, `Slug must be ${PROJECT_LIMITS.slug} characters or fewer.`)
  .refine((v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), {
    message: "Slug may only contain lowercase letters, numbers, and dashes.",
  });

const syncKeyField = z
  .string()
  .trim()
  .max(PROJECT_LIMITS.syncKey, `Sync key must be ${PROJECT_LIMITS.syncKey} characters or fewer.`)
  .refine((v) => v === "" || /^pk_[0-9a-f]{32}$/.test(v), {
    message: "Sync key must look like pk_ + 32 hex characters.",
  })
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalUrl = z
  .string()
  .trim()
  .max(PROJECT_LIMITS.url, `URL must be ${PROJECT_LIMITS.url} characters or fewer.`)
  .refine((v) => v === "" || isHttpUrl(v), {
    message: "Enter a valid http(s):// URL.",
  })
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalCaseStudyText = z
  .string()
  .trim()
  .max(
    PROJECT_LIMITS.caseStudy,
    `Case study text must be ${PROJECT_LIMITS.caseStudy} characters or fewer.`,
  )
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .default(null);

const periodField = z
  .string()
  .trim()
  .max(PROJECT_LIMITS.period, `Period must be ${PROJECT_LIMITS.period} characters or fewer.`)
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .default(null);

const galleryUrl = z
  .string()
  .trim()
  .max(
    PROJECT_LIMITS.galleryUrl,
    `Screenshot URL must be ${PROJECT_LIMITS.galleryUrl} characters or fewer.`,
  )
  .refine((v) => isHttpUrl(v), {
    message: "Screenshot URL must be a valid http(s):// URL.",
  });

export const projectMetricSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Metric label is required.")
    .max(
      PROJECT_LIMITS.metricLabel,
      `Metric label must be ${PROJECT_LIMITS.metricLabel} characters or fewer.`,
    ),
  value: z
    .string()
    .trim()
    .min(1, "Metric value is required.")
    .max(
      PROJECT_LIMITS.metricValue,
      `Metric value must be ${PROJECT_LIMITS.metricValue} characters or fewer.`,
    ),
});

export type ProjectMetric = z.infer<typeof projectMetricSchema>;

export const projectInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(PROJECT_LIMITS.title, `Title must be ${PROJECT_LIMITS.title} characters or fewer.`),
  slug: slugField,
  syncKey: syncKeyField,
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(
      PROJECT_LIMITS.description,
      `Description must be ${PROJECT_LIMITS.description} characters or fewer.`,
    ),
  highlights: z
    .array(
      z
        .string()
        .trim()
        .max(
          PROJECT_LIMITS.highlight,
          `Each highlight must be ${PROJECT_LIMITS.highlight} characters or fewer.`,
        ),
    )
    .max(PROJECT_LIMITS.highlights, `Too many highlights (max ${PROJECT_LIMITS.highlights}).`)
    .transform((values) => values.filter((v) => v !== "")),
  live: optionalUrl,
  liveVisibility: z.enum(["public", "private"]),
  github: optionalUrl,
  repoVisibility: z
    .string()
    .refine((v) => v === "public" || v === "private", {
      message: "Repo visibility must be public or private.",
    })
    .default("public"),
  problem: optionalCaseStudyText,
  role: optionalCaseStudyText,
  outcome: optionalCaseStudyText,
  period: periodField,
  metrics: z
    .array(projectMetricSchema)
    .max(PROJECT_LIMITS.metrics, `Too many metrics (max ${PROJECT_LIMITS.metrics}).`)
    .default([]),
  gallery: z
    .array(galleryUrl)
    .max(PROJECT_LIMITS.gallery, `Too many screenshots (max ${PROJECT_LIMITS.gallery}).`)
    .default([]),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
