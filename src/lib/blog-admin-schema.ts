import { z } from "zod";
import { slugify } from "@/lib/text";

export const BLOG_LIMITS = {
    slug: 120,
    title: 200,
    description: 400,
    body: 60000,
    name: 120,
    tagName: 64,
    descriptionShort: 300,
    sortOrder: 9999,
    tagsPerPost: 12,
} as const;

const SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MESSAGES = {
    slugFormat: "Slug hanya boleh huruf kecil, angka, dan tanda hubung.",
    slugTooLong: `Slug maksimal ${BLOG_LIMITS.slug} karakter.`,
    dateInvalid: "Tanggal harus format YYYY-MM-DD.",
    titleRequired: "Judul wajib diisi.",
    titleTooLong: `Judul maksimal ${BLOG_LIMITS.title} karakter.`,
    descriptionTooLong: `Deskripsi maksimal ${BLOG_LIMITS.description} karakter.`,
    bodyRequired: "Isi artikel wajib diisi.",
    bodyTooLong: `Isi artikel terlalu panjang (maks ${BLOG_LIMITS.body} karakter).`,
    bodyUnsafe:
        "Isi artikel tidak boleh memuat import/export atau tag script.",
    englishRequired: "Lengkapi judul dan isi versi Inggris, atau matikan opsi Inggris.",
    nameRequired: "Nama wajib diisi.",
    nameTooLong: `Nama maksimal ${BLOG_LIMITS.name} karakter.`,
    tagTooLong: `Nama tag maksimal ${BLOG_LIMITS.tagName} karakter.`,
    tooManyTags: `Maksimal ${BLOG_LIMITS.tagsPerPost} tag per artikel.`,
    sortOrderInvalid: "Urutan harus angka 0-9999.",
    slugTaken: "Slug sudah dipakai artikel lain.",
} as const;

const slugField = z
    .string()
    .trim()
    .min(1, MESSAGES.slugFormat)
    .max(BLOG_LIMITS.slug, MESSAGES.slugTooLong)
    .transform(slugify)
    .refine((v) => v.length > 0 && SEGMENT_RE.test(v), {
        message: MESSAGES.slugFormat,
    });

const nameField = z
    .string()
    .trim()
    .min(1, MESSAGES.nameRequired)
    .max(BLOG_LIMITS.name, MESSAGES.nameTooLong);

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max, `Maksimal ${max} karakter.`)
        .transform((v) => (v === "" ? null : v));

const sortOrderField = z.coerce
    .number()
    .int(MESSAGES.sortOrderInvalid)
    .min(0, MESSAGES.sortOrderInvalid)
    .max(BLOG_LIMITS.sortOrder, MESSAGES.sortOrderInvalid);

const UNSAFE_BODY_RE = /(^|\n)\s*(import|export)\s|<script/i;

function bodyField(required: boolean) {
    const base = z
        .string()
        .max(BLOG_LIMITS.body, MESSAGES.bodyTooLong)
        .refine((v) => !UNSAFE_BODY_RE.test(v), { message: MESSAGES.bodyUnsafe });
    return required ? base.trim().min(1, MESSAGES.bodyRequired) : base;
}

export const categoryInputSchema = z.object({
    slug: slugField,
    nameId: nameField,
    nameEn: nameField,
    descriptionId: optionalText(BLOG_LIMITS.descriptionShort),
    descriptionEn: optionalText(BLOG_LIMITS.descriptionShort),
    sortOrder: sortOrderField,
    visible: z.boolean(),
});

export const categoryFormSchema = z.object({
    slug: z
        .string()
        .min(1, MESSAGES.slugFormat)
        .max(BLOG_LIMITS.slug, MESSAGES.slugTooLong)
        .refine((v) => SEGMENT_RE.test(slugify(v)), {
            message: MESSAGES.slugFormat,
        }),
    nameId: z.string().min(1, MESSAGES.nameRequired),
    nameEn: z.string().min(1, MESSAGES.nameRequired),
    descriptionId: z.string().max(BLOG_LIMITS.descriptionShort),
    descriptionEn: z.string().max(BLOG_LIMITS.descriptionShort),
    sortOrder: z.number().int().min(0).max(BLOG_LIMITS.sortOrder),
    visible: z.boolean(),
});

export const tagInputSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, MESSAGES.nameRequired)
        .max(BLOG_LIMITS.tagName, MESSAGES.tagTooLong),
    description: optionalText(BLOG_LIMITS.descriptionShort),
    sortOrder: sortOrderField,
    visible: z.boolean(),
});

export const tagFormSchema = z.object({
    name: z.string().min(1, MESSAGES.nameRequired).max(BLOG_LIMITS.tagName, MESSAGES.tagTooLong),
    description: z.string().max(BLOG_LIMITS.descriptionShort),
    sortOrder: z.number().int().min(0).max(BLOG_LIMITS.sortOrder),
    visible: z.boolean(),
});

export function tagSlug(name: string): string {
    return slugify(name);
}

export const postInputSchema = z
    .object({
        slug: slugField,
        date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, MESSAGES.dateInvalid),
        category: z
            .string()
            .trim()
            .transform((v) => (v === "" ? null : v))
            .refine((v) => v === null || SEGMENT_RE.test(v), {
                message: MESSAGES.slugFormat,
            }),
        tags: z
            .array(z.string().trim().min(1).max(BLOG_LIMITS.tagName, MESSAGES.tagTooLong))
            .max(BLOG_LIMITS.tagsPerPost, MESSAGES.tooManyTags),
        titleId: z
            .string()
            .trim()
            .min(1, MESSAGES.titleRequired)
            .max(BLOG_LIMITS.title, MESSAGES.titleTooLong),
        descriptionId: z
            .string()
            .trim()
            .max(BLOG_LIMITS.description, MESSAGES.descriptionTooLong),
        bodyId: bodyField(true),
        includeEnglish: z.boolean(),
        titleEn: z.string().trim().max(BLOG_LIMITS.title, MESSAGES.titleTooLong),
        descriptionEn: z
            .string()
            .trim()
            .max(BLOG_LIMITS.description, MESSAGES.descriptionTooLong),
        bodyEn: bodyField(false),
    })
    .superRefine((value, ctx) => {
        if (!value.includeEnglish) return;
        if (value.titleEn === "" || value.bodyEn.trim() === "") {
            ctx.addIssue({
                code: "custom",
                message: MESSAGES.englishRequired,
                path: ["titleEn"],
            });
        }
    });

export const postFormSchema = z
    .object({
        slug: z
            .string()
            .min(1, MESSAGES.slugFormat)
            .max(BLOG_LIMITS.slug, MESSAGES.slugTooLong)
            .refine((v) => SEGMENT_RE.test(slugify(v)), {
                message: MESSAGES.slugFormat,
            }),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, MESSAGES.dateInvalid),
        category: z.string(),
        tags: z.array(z.string()).max(BLOG_LIMITS.tagsPerPost, MESSAGES.tooManyTags),
        titleId: z
            .string()
            .min(1, MESSAGES.titleRequired)
            .max(BLOG_LIMITS.title, MESSAGES.titleTooLong),
        descriptionId: z.string().max(BLOG_LIMITS.description, MESSAGES.descriptionTooLong),
        bodyId: z.string().min(1, MESSAGES.bodyRequired).max(BLOG_LIMITS.body, MESSAGES.bodyTooLong),
        includeEnglish: z.boolean(),
        titleEn: z.string().max(BLOG_LIMITS.title, MESSAGES.titleTooLong),
        descriptionEn: z
            .string()
            .max(BLOG_LIMITS.description, MESSAGES.descriptionTooLong),
        bodyEn: z.string().max(BLOG_LIMITS.body, MESSAGES.bodyTooLong),
    })
    .superRefine((value, ctx) => {
        if (!value.includeEnglish) return;
        if (value.titleEn.trim() === "" || value.bodyEn.trim() === "") {
            ctx.addIssue({
                code: "custom",
                message: MESSAGES.englishRequired,
                path: ["titleEn"],
            });
        }
    });

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type TagInput = z.infer<typeof tagInputSchema>;
export type TagFormValues = z.infer<typeof tagFormSchema>;
export type BlogPostInput = z.infer<typeof postInputSchema>;
export type BlogPostFormValues = z.infer<typeof postFormSchema>;
