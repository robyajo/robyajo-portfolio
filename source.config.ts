import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { remarkReadingTime } from "@/lib/remarkReadingTime";
import { z } from "zod/v4";

export const docs = defineDocs({
    dir: "content/blog",
    docs: {
        schema: pageSchema.extend({
            tags: z.array(z.string()).optional(),
            date: z.coerce.date().optional(),
            // Bahasa artikel. Artikel lama dibiarkan kosong (dianggap Inggris).
            // Versi terjemahan memakai `lang: "en"` dan disembunyikan dari daftar.
            lang: z.enum(["id", "en"]).optional(),
            // Slug kategori (lihat tabel blog_categories). Boleh kosong.
            category: z.string().optional(),
            // Slug artikel pasangan dalam bahasa lain (tanpa awalan /blog/).
            translation: z.string().optional(),
            // Set explicitly in frontmatter when a post is meaningfully edited.
            // Previously derived from git history, but shallow clones on the
            // deploy host made every push re-date every post. Frontmatter is
            // deterministic and gives full control over what counts as an update.
            lastModified: z.coerce.date().optional(),
            // Penanda asal tulis artikel. `autopilot` berarti artikel dibuat
            // oleh alur tulis harian otomatis, bukan ditulis manual di admin.
            author: z.string().optional(),
        }),
        postprocess: {
            includeProcessedMarkdown: true,
            valueToExport: ['readingTime'],
        },
    },
    meta: {
        schema: metaSchema,
    },
});

export default defineConfig({
    mdxOptions: {
        remarkPlugins: [remarkReadingTime],
        rehypeCodeOptions: {
            inline: 'tailing-curly-colon',
            themes: {
                light: 'github-light',
                dark: 'github-dark',
            },
        },
    },
});
