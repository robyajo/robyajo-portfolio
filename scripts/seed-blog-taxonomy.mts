import { promises as fs } from "node:fs";

const { db } = await import("./src/lib/db.ts");
const { blogCategories, blogTags } = await import("./src/lib/schema.ts");
const { slugify } = await import("./src/lib/text.ts");

const files = (await fs.readdir("content/blog")).filter((name) => name.endsWith(".mdx"));

const counts = new Map<string, number>();
for (const file of files) {
    const raw = await fs.readFile(`content/blog/${file}`, "utf8");
    const block = /^tags:\n((?:\s+-.*\n)+)/m.exec(raw);
    if (!block) continue;
    for (const line of block[1].split("\n")) {
        const match = /^\s+-\s+"?([^"]+?)"?\s*$/.exec(line);
        if (!match) continue;
        const tag = match[1].trim();
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
}

const existingTags = await db.select().from(blogTags);
const existingNames = new Set(existingTags.map((row) => row.name));

let insertedTags = 0;
let order = 0;
for (const [tag, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    order += 10;
    if (existingNames.has(tag)) continue;
    await db.insert(blogTags).values({
        name: tag,
        slug: slugify(tag) || `tag-${order}`,
        sortOrder: order,
        visible: true,
        description: null,
    });
    insertedTags += 1;
}

const existingCategories = await db.select().from(blogCategories);
const existingSlugs = new Set(existingCategories.map((row) => row.slug));

const seedCategories = [
    {
        slug: "fesyen-teknologi",
        nameId: "Fesyen & Teknologi",
        nameEn: "Fashion & Technology",
        descriptionId: "Perpotongan gaya berpakaian, perilaku belanja, dan algoritma digital.",
        descriptionEn: "Where clothing style, shopping behaviour, and digital algorithms meet.",
        sortOrder: 10,
    },
    {
        slug: "kerja-digital",
        nameId: "Kerja Digital",
        nameEn: "Digital Work",
        descriptionId: "Cara alat digital mengubah rutinitas kerja sehari-hari.",
        descriptionEn: "How digital tools reshape everyday working routines.",
        sortOrder: 20,
    },
];

let insertedCategories = 0;
for (const category of seedCategories) {
    if (existingSlugs.has(category.slug)) continue;
    await db.insert(blogCategories).values({ ...category, visible: true });
    insertedCategories += 1;
}

const finalTags = await db.select().from(blogTags);
const finalCategories = await db.select().from(blogCategories);

console.log(
    JSON.stringify(
        {
            tagsFoundInPosts: counts.size,
            insertedTags,
            totalTags: finalTags.length,
            tagNames: finalTags.map((row) => row.name),
            insertedCategories,
            categories: finalCategories.map((row) => `${row.slug} (${row.nameId})`),
        },
        null,
        2,
    ),
);
