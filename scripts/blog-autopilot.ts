/**
 * Penulis otomatis artikel blog (dwibahasa: Indonesia + Inggris).
 *
 * Dipakai oleh `.github/workflows/blog-autopilot.yml` (jadwal harian), tetapi
 * bisa juga dijalankan manual:
 *
 *   pnpm tsx --env-file=.env.local scripts/blog-autopilot.ts --dry-run
 *   pnpm tsx --env-file=.env.local scripts/blog-autopilot.ts --topic "tren sepatu lokal"
 *   pnpm tsx --env-file=.env.local scripts/blog-autopilot.ts --sync
 *
 * Alur: pilih topik (tren Google Trends Indonesia, kalau tidak ada pakai rotasi
 * pilar) -> minta model menulis dua versi -> validasi ketat -> tulis berkas MDX
 * + catatan rilis harian + registri topik. Skrip TIDAK melakukan commit;
 * commit/push dikerjakan workflow setelah verifikasi build lolos.
 */

import {
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    writeFileSync,
} from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BLOG_DIR = join(ROOT, "content/blog");
const RELEASES_DIR = join(ROOT, "releases");
const PIPELINE_DIR = join(ROOT, "scripts/blog-pipeline");
const SKILL_DIR = join(ROOT, ".agents/skills/blog-writer");

const ACTIVITY_API = "https://ajoroby.is-a.dev/api/activities";

const MIN_WORDS = 700;
const MAX_WORDS = 2200;
const MIN_LINKS = 3;
const MAX_TITLE = 70;

const DEFAULT_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
];

const BANNED_PHRASES = [
    "dalam dunia yang serba cepat",
    "di era digital yang terus berkembang",
    "mari kita selami",
    "tak dapat dipungkiri",
    "perlu dicatat bahwa",
    "sebagai kesimpulan",
    "pada akhirnya, perlu",
    "in today's fast-paced world",
    "delve into",
    "tapestry of",
    "game-changer",
    "game changer",
    "unlock the power",
    "it's worth noting",
    "let's dive in",
    "revolutionize the",
];

const BANNED_IDENTITIES = [
    "anish",
    "shobith",
    "royal challengers",
    "rcb",
];

interface Pillar {
    id: string;
    label: string;
    angle: string;
}

interface NewsItem {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
}

interface Pipeline {
    news: { sources: { name: string; url: string }[]; lexicon: string[] };
    pillars: Pillar[];
}

interface Published {
    slugs: string[];
    titles: string[];
    topics: string[];
    lastPublishedDate: string | null;
}

interface Article {
    title: string;
    description: string;
    lines?: string[];
    body: string;
}

interface Draft {
    slug: string;
    tags: string[];
    id: Omit<Article, "body"> & { body?: string };
    en: Omit<Article, "body"> & { body?: string };
}

interface Generated {
    slug: string;
    tags: string[];
    id: Article;
    en: Article;
}

function log(message: string): void {
    console.log(`[blog-autopilot] ${message}`);
}

function fail(message: string): never {
    throw new Error(message);
}

function readJson<T>(path: string, fallback: T): T {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8")) as T;
}

function readText(path: string): string {
    if (!existsSync(path)) return "";
    return readFileSync(path, "utf8");
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
    const args: Record<string, string | boolean> = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (!token.startsWith("--")) continue;
        const key = token.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith("--")) {
            args[key] = next;
            i += 1;
        } else {
            args[key] = true;
        }
    }
    return args;
}

function todayISO(): string {
    // Tanggal menurut zona waktu Indonesia (WIB), bukan UTC: pukul 00:00-07:00
    // WIB masih terbaca sebagai hari kemarin bila memakai UTC.
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function decodeXml(value: string): string {
    return value
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .trim();
}

function slugify(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60)
        .replace(/-+$/g, "");
}

function countWords(markdown: string): number {
    const stripped = markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[#>*_`|-]/g, " ");
    return stripped.split(/\s+/).filter(Boolean).length;
}

function extractLinks(markdown: string): string[] {
    const links = new Set<string>();
    for (const match of markdown.matchAll(/\((https?:\/\/[^\s)]+)\)/g)) {
        links.add(match[1]);
    }
    for (const match of markdown.matchAll(/href="(https?:\/\/[^\s"]+)"/g)) {
        links.add(match[1]);
    }
    return [...links];
}

function yamlString(value: string): string {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function stripWrapper(body: string): string {
    let clean = body.trim();
    const fence = clean.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
    if (fence) clean = fence[1].trim();
    clean = clean.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
    return clean;
}

async function fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number,
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function fetchNews(
    sources: { name: string; url: string }[],
    attempt = 0,
): Promise<NewsItem[]> {
    const items: NewsItem[] = [];
    for (const source of sources) {
        try {
            const response = await fetchWithTimeout(
                source.url,
                { headers: { "user-agent": "robyajo-portfolio-blog-bot" } },
                15_000,
            );
            if (!response.ok) continue;
            const xml = await response.text();
            const blocks = xml.split("<item>").slice(1);
            for (const block of blocks.slice(0, 20)) {
                const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
                const url = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "";
                const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";
                const cleaned = decodeXml(title).replace(/<!\[CDATA\[|\]\]>/g, "").trim();
                if (cleaned.length > 3 && url) {
                    items.push({
                        title: cleaned,
                        url: url.trim(),
                        source: source.name,
                        publishedAt: pubDate,
                    });
                }
            }
        } catch {
            continue;
        }
    }
    if (items.length === 0 && attempt < 2) {
        await sleep(2_000 * (attempt + 1));
        return fetchNews(sources, attempt + 1);
    }
    return items;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickTopic(
    news: NewsItem[],
    pipeline: Pipeline,
    published: Published,
    forced?: string,
): { topic: string; pillar: Pillar; origin: string } {
    const pillar =
        pipeline.pillars[published.topics.length % pipeline.pillars.length];
    if (forced) return { topic: forced, pillar, origin: "manual" };

    const used = new Set(published.topics.map((t) => t.toLowerCase()));
    const lexicon = pipeline.news.lexicon.map((k) => k.toLowerCase());
    const matched = news.find((item) => {
        const title = item.title.toLowerCase();
        if (used.has(title)) return false;
        return lexicon.some((keyword) => title.includes(keyword));
    });
    if (matched) return { topic: matched.title, pillar, origin: "berita" };

    return { topic: pillar.label, pillar, origin: "pilar" };
}

function buildSystemPrompt(
    facts: string,
    pillar: Pillar,
): string {
    const style = readText(join(SKILL_DIR, "reference/voice-and-style.md"));
    const skill = readText(join(SKILL_DIR, "SKILL.md"));
    return [
        "Kamu menulis artikel blog untuk situs pribadi seorang developer asal",
        "Pekanbaru, Indonesia. Kamu menulis SEBAGAI pemilik situs, orang pertama,",
        "dan tulisannya harus terasa ditulis manusia: santai, jujur, kadang",
        "bercanda, tidak rapi berlebihan, dan tidak pernah terdengar seperti mesin.",
        "Fokus utama situs ini adalah teknologi dan kecerdasan buatan (AI).",
        "",
        "=== PANDUAN GAYA (ikuti) ===",
        style,
        "",
        "=== RINGKASAN SKILL PENULISAN ===",
        skill.slice(0, 6_000),
        "",
        "=== FAKTA YANG BOLEH DIPAKAI ===",
        facts,
        "",
        "=== ATURAN KERAS ===",
        "1. Balas HANYA JSON valid. Tanpa penjelasan, tanpa pagar kode.",
        "2. Bentuk JSON:",
        '   {"slug":"kebab-case","tags":["..."],"id":{"title":"...","description":"...","lines":["baris 1","baris 2"]},"en":{"title":"...","description":"...","lines":["line 1","line 2"]}}',
        "   PENTING: isi artikel ditulis sebagai ARRAY baris teks (`lines`), satu",
        "   elemen per baris markdown. Jangan memakai karakter baris baru di dalam",
        "   satu elemen string. Baris kosong ditulis sebagai string kosong \"\".",
        "3. `id` = Bahasa Indonesia (versi utama, wajib paling hidup dan santai).",
        "   `en` = Bahasa Inggris yang ditulis ulang secara natural, bukan terjemahan harfiah.",
        `4. Setiap versi minimal ${MIN_WORDS} kata, idealnya 900-1500 kata.`,
        `   Jangan melebihi ${MAX_WORDS} kata. Judul maksimal ${MAX_TITLE} karakter,`,
        "   description 110-155 karakter, tanpa titik di akhir description.",
        `5. Setiap versi memuat minimal ${MIN_LINKS} tautan sumber nyata dalam bentuk`,
        "   markdown [teks](https://...). Tautan akan DIPERIKSA OTOMATIS dan URL",
        "   karangan langsung ditolak. Karena itu: pakai hanya tautan yang kamu yakin",
        "   ada. Bila ragu pada URL artikel yang panjang, tautkan halaman kategori",
        "   atau beranda resmi sumbernya (contoh aman: https://news.ycombinator.com/,",
        "   https://www.techcrunch.com/, https://arstechnica.com/,",
        "   https://www.theverge.com/). Dilarang mengarang URL atau judul artikel.",
        "   Semua angka atau statistik wajib punya tautan sumbernya.",
        "6. Struktur: 2-3 paragraf pembuka (mulai dari kejadian/observasi konkret),",
        "   3-5 subjudul `##`, lalu penutup pendek yang mengajak berpikir. Jangan menulis",
        '   bagian berjudul "Kesimpulan".',
        "7. Boleh memakai <TypographyMark>teks</TypographyMark> (maksimal 4 kali) dan",
        "   <TypographyMuted as='span'>catatan</TypographyMuted> (maksimal 2 kali).",
        "   Untuk atribut WAJIB memakai tanda kutip tunggal, dan jangan memakai tanda",
        "   kutip ganda (\") di dalam isi artikel sama sekali.",
        "   Dilarang memakai impor, gambar, emoji, tombol, atau komponen lain.",
        "   Hanya boleh memakai blok kode, daftar, tabel (maksimal satu), dan kutipan.",
        "8. Di dalam paragraf jangan memakai karakter <, >, {, } kecuali pada komponen",
        "   yang diizinkan di poin 7 (agar file tetap valid).",
        "9. Dilarang: emoji, frasa klise mesin seperti 'dalam dunia yang serba cepat',",
        "   'di era digital yang terus berkembang', 'mari kita selami', 'delve',",
        "   'game-changer', superlatif kosong, dan judul clickbait.",
        "10. Dilarang mengarang pengalaman pribadi, angka, kolaborasi merek, atau",
        "    perjalanan. Opini dan selera pribadi boleh. Semua fakta pribadi hanya dari",
        "    bagian FAKTA YANG BOLEH DIPAKAI. Boleh menuliskan pengamatan umum dengan",
        "    bahasa kebiasaan ('sering', 'banyak orang', 'belakangan ini'), tetapi",
        "    dilarang menciptakan kejadian spesifik yang terkesan nyata: tanggal atau",
        "    hari tertentu, jumlah orang, jumlah uang, atau nama teman. Semua angka",
        "    wajib berasal dari sumber yang ditautkan.",
        "11. Dilarang memakai identitas pemilik template lama (Anish Shobith P S, RCB,",
        "    konteks India). Penulis adalah orang Pekanbaru, Indonesia.",
        "",
        "=== PILAR YANG DIPAKAI HARI INI ===",
        `Pilar: ${pillar.id} — ${pillar.label}`,
    ].join("\n");
}

function buildUserPrompt(
    topic: string,
    origin: string,
    pillar: Pillar,
    avoid: string[],
): string {
    return [
        `Topik hari ini: "${topic}" (asal: ${origin}).`,
        `Sudut pandang pilar "${pillar.label}": ${pillar.angle}`,
        "",
        "Tulisan wajib bertema TEKNOLOGI dan AI (perangkat lunak, kecerdasan buatan,",
        "gadget, keamanan siber, alat developer, teknologi kehidupan sehari-hari)",
        "dengan sudut pandang relevan untuk orang Indonesia. Kalau berita di atas",
        "tampak sangat teknis, tetap cari jembatannya ke kehidupan sehari-hari",
        "(misalnya: bagaimana ini mengubah cara orang bekerja, belajar, atau berbisnis).",
        "Jangan menulis artikel berita olahraga, hiburan, atau politik semata.",
        "",
        avoid.length > 0
            ? `Jangan mengulang topik berikut: ${avoid.slice(-25).join("; ")}.`
            : "",
        "",
        "Tulis sekarang. Ingat: JSON valid saja.",
    ]
        .filter(Boolean)
        .join("\n");
}

async function callModel(
    messages: { role: string; content: string }[],
    models: string[],
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.LLM_API_KEY;
    if (!apiKey) fail("GEMINI_API_KEY tidak diset");
    const baseUrl =
        process.env.LLM_BASE_URL ??
        "https://generativelanguage.googleapis.com/v1beta/openai";

    let lastError = "";
    for (let round = 0; round < 2; round += 1) {
        for (const model of models) {
            try {
                const response = await fetchWithTimeout(
                    `${baseUrl}/chat/completions`,
                    {
                        method: "POST",
                        headers: {
                            "content-type": "application/json",
                            authorization: `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model,
                            messages,
                            temperature: 0.95,
                            max_tokens: 8192,
                            response_format: { type: "json_object" },
                        }),
                    },
                    180_000,
                );
                const raw = await response.text();
                if (!response.ok) {
                    lastError = `${model}: HTTP ${response.status} ${raw.slice(0, 160)}`;
                    log(lastError);
                    await sleep(2_500);
                    continue;
                }
                const parsed = JSON.parse(raw) as
                    | { choices?: { message?: { content?: string } }[] }
                    | { choices?: { message?: { content?: string } }[] }[];
                const payload = Array.isArray(parsed) ? parsed[0] : parsed;
                const content = payload.choices?.[0]?.message?.content;
                if (!content) {
                    lastError = `${model}: balasan kosong`;
                    log(lastError);
                    continue;
                }
                log(`model terpakai: ${model}`);
                return content;
            } catch (error) {
                lastError = `${model}: ${(error as Error).message}`;
                log(lastError);
                await sleep(2_500);
            }
        }
        log("semua model gagal pada putaran ini, mencoba lagi…");
    }
    fail(`gagal memanggil model (${lastError})`);
}

function repairJson(text: string): string {
    let out = "";
    let inString = false;
    let escaped = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (escaped) {
            out += char;
            escaped = false;
            continue;
        }
        if (char === "\\") {
            out += char;
            escaped = true;
            continue;
        }
        if (inString && char === "\n") {
            out += "\\n";
            continue;
        }
        if (inString && char === "\r") continue;
        if (inString && char === "\t") {
            out += "\\t";
            continue;
        }
        if (char === '"') {
            if (!inString) {
                inString = true;
                out += char;
                continue;
            }
            let j = i + 1;
            while (j < text.length && (text[j] === " " || text[j] === "\t")) j += 1;
            const next = text[j] ?? "";
            const closes = next === "" || next === "\n" || ",:}]".includes(next);
            if (closes) {
                inString = false;
                out += char;
            } else {
                out += '\\"';
            }
            continue;
        }
        out += char;
    }
    return out;
}

function parseGenerated(content: string): Generated {
    const clean = content
        .trim()
        .replace(/^```[a-zA-Z]*\n/, "")
        .replace(/\n```$/, "")
        .trim();

    const attempt = (text: string): Draft | null => {
        try {
            return JSON.parse(text) as Draft;
        } catch {
            return null;
        }
    };

    let draft =
        attempt(clean) ??
        attempt(repairJson(clean)) ??
        attempt(
            repairJson(
                clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1),
            ),
        );
    if (!draft?.id || !draft?.en) {
        const dump = join("/tmp", "blog-autopilot-raw.txt");
        writeFileSync(dump, content);
        fail(
            `bentuk JSON tidak sesuai (id/en hilang). Balasan mentah: ${dump} (${content.length} karakter)`,
        );
    }

    const normalize = (
        article: Draft["id"],
        fallbackTitle: string,
    ): Article => {
        const raw = article.body ?? article.lines?.join("\n") ?? "";
        const body = stripWrapper(raw);
        if (!body) fail("artikel tidak punya isi (lines/body kosong)");
        return {
            title: article.title?.trim() || fallbackTitle,
            description: article.description?.trim() ?? "",
            body,
        };
    };

    return {
        slug: draft.slug ?? "",
        tags: Array.isArray(draft.tags) ? draft.tags.slice(0, 5) : [],
        id: normalize(draft.id, draft.slug ?? ""),
        en: normalize(draft.en, draft.slug ?? ""),
    };
}

async function linkIsBroken(url: string): Promise<boolean> {
    try {
        const response = await fetchWithTimeout(
            url,
            { method: "GET", redirect: "follow" },
            10_000,
        );
        return response.status === 404 || response.status === 410;
    } catch {
        return false;
    }
}

function containsPhrase(haystack: string, needle: string): boolean {
    const pattern = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${pattern}\\b`, "i").test(haystack);
}

async function collectProblems(
    data: Generated,
    existingSlugs: Set<string>,
    checkLinks: boolean,
): Promise<string[]> {
    const problems: string[] = [];

    const slug = slugify(data.slug ?? data.id.title);
    if (!slug) problems.push("slug kosong");
    if (existingSlugs.has(slug)) problems.push(`slug sudah dipakai: ${slug}`);

    for (const [lang, article] of [
        ["id", data.id],
        ["en", data.en],
    ] as const) {
        const words = countWords(article.body);
        if (article.title.length > MAX_TITLE) {
            problems.push(`${lang}: judul ${article.title.length} karakter (>${MAX_TITLE})`);
        }
        if (!article.description?.trim()) {
            problems.push(`${lang}: description kosong`);
        }
        if (article.description && article.description.length > 170) {
            problems.push(`${lang}: description terlalu panjang`);
        }
        if (words < MIN_WORDS) problems.push(`${lang}: hanya ${words} kata (min ${MIN_WORDS})`);
        if (words > MAX_WORDS) problems.push(`${lang}: ${words} kata (maks ${MAX_WORDS})`);

        const links = extractLinks(article.body);
        if (links.length < MIN_LINKS) {
            problems.push(`${lang}: hanya ${links.length} tautan sumber (min ${MIN_LINKS})`);
        }
        const host = new Set(links.map((url) => new URL(url).hostname));
        if (host.size < 2) problems.push(`${lang}: sumber terlalu sedikit ragam`);

        if (/\p{Extended_Pictographic}/u.test(article.body)) {
            problems.push(`${lang}: memuat emoji`);
        }
        if (/\bimport\s+\{|require\(/.test(article.body)) {
            problems.push(`${lang}: memuat impor`);
        }
        if (/<(?!\/?(?:TypographyMark|TypographyMuted)\b)/.test(article.body)) {
            problems.push(`${lang}: memuat tag di luar komponen yang diizinkan`);
        }

        const haystack = `${article.title}\n${article.body}`.toLowerCase();
        for (const phrase of BANNED_PHRASES) {
            if (containsPhrase(haystack, phrase)) {
                problems.push(`${lang}: frasa klise "${phrase}"`);
            }
        }
        for (const identity of BANNED_IDENTITIES) {
            if (containsPhrase(haystack, identity)) {
                problems.push(`${lang}: menyebut identitas lama "${identity}"`);
            }
        }

        if (checkLinks) {
            const broken: string[] = [];
            for (const url of links.slice(0, 6)) {
                if (await linkIsBroken(url)) broken.push(url);
            }
            if (broken.length >= 2) {
                problems.push(
                    `${lang}: terlalu banyak tautan mati (${broken.join(", ")})`,
                );
            } else if (broken.length === 1) {
                log(`peringatan: satu tautan mati di versi ${lang}: ${broken[0]}`);
            }
        }
    }

    if (problems.length > 0) {
        log(`validasi menemukan ${problems.length} masalah`);
    }
    return problems;
}

function renderPost(
    data: Generated,
    lang: "id" | "en",
    date: string,
    sibling: string,
): string {
    const article = data[lang];
    const slug = slugify(data.slug ?? data.id.title);
    const tags = data.tags.length > 0 ? data.tags : ["Teknologi", "AI"];
    const frontmatter = [
        "---",
        `title: ${yamlString(article.title.trim())}`,
        `description: ${yamlString(article.description.trim())}`,
        `date: ${date}`,
        "tags:",
        ...tags.map((tag) => `    - ${yamlString(tag)}`),
        `lang: ${lang}`,
        `translation: ${yamlString(sibling)}`,
        `author: autopilot`,
        "---",
        "",
    ];
    return `${frontmatter.join("\n")}${article.body.trim()}\n`;
}

function updateRelease(
    data: Generated,
    date: string,
    slug: string,
    titleOverrideId?: string,
): string {
    if (!existsSync(RELEASES_DIR)) mkdirSync(RELEASES_DIR, { recursive: true });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ajoroby.is-a.dev";
    const url = `${baseUrl}/blogs/${slug}`;
    const existing = readdirSync(RELEASES_DIR)
        .find(
            (file) =>
                (file === `${date}.json` || file.startsWith(`${date}-`)) &&
                file.endsWith(".json"),
        ) ?? `${date}.json`;

    const item = {
        type: "new",
        id: `Tulisan baru: "${data.id.title}". Selengkapnya di ${url}`,
        en: `New article: "${data.en.title}". Read it at ${url}`,
    };

    if (existing) {
        const path = join(RELEASES_DIR, existing);
        const payload = JSON.parse(readFileSync(path, "utf8")) as {
            items?: unknown[];
            title?: { id?: string; en?: string };
            body?: { id?: string; en?: string };
        };
        payload.items = [...(payload.items ?? []), item];
        if (payload.body) {
            const extraId = ` Artikel terbaru: "${data.id.title}".`;
            const extraEn = ` Latest article: "${data.en.title}".`;
            payload.body.id = `${payload.body.id ?? ""}${extraId}`.trim();
            payload.body.en = `${payload.body.en ?? ""}${extraEn}`.trim();
        }
        writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
        log(`catatan rilis diperbarui: releases/${existing} (${payload.items.length} butir)`);
        return path;
    }

    const titleId = titleOverrideId ?? `Artikel baru: ${data.id.title}`;
    const titleEn = `New article: ${data.en.title}`;
    const trim = (value: string) =>
        value.length > 80 ? `${value.slice(0, 77).trimEnd()}…` : value;
    const payload = {
        date,
        type: "feature",
        status: "published",
        title: {
            id: trim(titleId),
            en: trim(titleEn),
        },
        body: {
            id: `Satu tulisan baru ditambahkan ke blog: "${data.id.title}". Tulisannya membahas ${data.id.description.toLowerCase()}`,
            en: `A new article was added to the blog: "${data.en.title}". It covers ${data.en.description.toLowerCase()}`,
        },
        items: [item],
    };
    const shortSlug =
        slug.length <= 48 ? slug : `${slug.slice(0, 48).replace(/-[^-]*$/, "")}`;
    const fileName = `${date}-${shortSlug}.json`;
    const path = join(RELEASES_DIR, fileName);
    writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
    log(`catatan rilis dibuat: releases/${fileName}`);
    return path;
}

function readEnvValue(name: string): string {
    const candidates = [
        join(SKILL_DIR, "..", "activity-sync/.ACTIVITY_PROJECT_KEYS"),
        join(ROOT, ".env.local"),
    ];
    for (const file of candidates) {
        const line = readText(file)
            .split("\n")
            .find((entry) => entry.startsWith(`${name}=`));
        if (line) return line.slice(name.length + 1).trim();
    }
    return "";
}

async function syncActivities(): Promise<void> {
    const raw = process.env.ACTIVITY_PROJECT_KEYS ?? readEnvValue("ACTIVITY_PROJECT_KEYS");
    if (!raw) {
        log("ACTIVITY_PROJECT_KEYS tidak ada; sinkronisasi dilewati");
        return;
    }
    const key = raw.split(",")[0].split(":")[0].trim();
    if (!key) {
        log("kunci kegiatan tidak terbaca; sinkronisasi dilewati");
        return;
    }

    const date = todayISO();
    const file = readdirSync(RELEASES_DIR).find((name) =>
        name.startsWith(`${date}-`) && name.endsWith(".json"),
    );
    if (!file) {
        log(`berkas rilis ${date} tidak ditemukan; sinkronisasi dilewati`);
        return;
    }

    const payload = readFileSync(join(RELEASES_DIR, file), "utf8");
    const response = await fetchWithTimeout(
        ACTIVITY_API,
        {
            method: "POST",
            headers: { "content-type": "application/json", "X-project": key },
            body: payload,
        },
        30_000,
    );
    const text = await response.text();
    log(`sinkronisasi kegiatan: HTTP ${response.status} ${text.slice(0, 200)}`);
    if (!response.ok) fail(`sinkronisasi kegiatan gagal (HTTP ${response.status})`);
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));

    if (args.sync) {
        await syncActivities();
        return;
    }

    if (typeof args["parse-file"] === "string") {
        const raw = readText(args["parse-file"] as string);
        const parsed = parseGenerated(raw);
        log(`berhasil diurai: ${parsed.id.title} / ${parsed.en.title}`);
        return;
    }

    const pipeline = readJson<Pipeline>(join(PIPELINE_DIR, "pillars.json"), {
        news: {
            sources: [{ name: "Hacker News", url: "https://hnrss.org/frontpage" }],
            lexicon: [],
        },
        pillars: [],
    });
    if (pipeline.pillars.length === 0) fail("pillars.json kosong");
    const published = readJson<Published>(join(PIPELINE_DIR, "published.json"), {
        slugs: [],
        titles: [],
        topics: [],
        lastPublishedDate: null,
    });
    const facts = readText(join(PIPELINE_DIR, "facts.md"));
    const today = (args.date as string) ?? todayISO();

    if (published.lastPublishedDate === today && !args.force && !args["dry-run"]) {
        log(`sudah ada tulisan untuk ${today}; dilewati`);
        return;
    }

    const existingSlugs = new Set(
        readdirSync(BLOG_DIR)
            .filter((file) => file.endsWith(".mdx"))
            .map((file) => file.replace(/\.mdx$/, "")),
    );
    for (const slug of published.slugs) existingSlugs.add(slug);

    const news = args.topic ? [] : await fetchNews(pipeline.news.sources);
    if (news.length > 0) log(`berita diambil: ${news.length} item`);

    const chosen = pickTopic(
        news,
        pipeline,
        published,
        typeof args.topic === "string" ? args.topic : undefined,
    );
    log(`topik: "${chosen.topic}" (${chosen.origin}) | pilar: ${chosen.pillar.id}`);

    const systemPrompt = buildSystemPrompt(facts, chosen.pillar);
    const userPrompt = buildUserPrompt(
        chosen.topic,
        chosen.origin,
        chosen.pillar,
        published.topics,
    );

    const models = process.env.LLM_MODELS
        ? process.env.LLM_MODELS.split(",").map((m) => m.trim()).filter(Boolean)
        : DEFAULT_MODELS;

    const content = await callModel(
        [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        models,
    );
    let data = parseGenerated(content);
    let problems = await collectProblems(
        data,
        existingSlugs,
        !args["no-link-check"],
    );
    let attempts = 0;
    while (problems.length > 0 && attempts < 2) {
        attempts += 1;
        log(`mencoba ulang (${attempts}/2) dengan catatan perbaikan…`);
        const feedback = [
            userPrompt,
            "",
            "Draf sebelumnya ditolak. Perbaiki masalah berikut lalu tulis ulang",
            "JSON LENGKAP dari awal (jangan hanya menambal sebagian):",
            ...problems.map((problem) => `- ${problem}`),
        ].join("\n");
        const retry = await callModel(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: feedback },
            ],
            models,
        );
        data = parseGenerated(retry);
        problems = await collectProblems(
            data,
            existingSlugs,
            !args["no-link-check"],
        );
    }
    if (problems.length > 0) {
        fail(`validasi gagal setelah percobaan ulang:\n - ${problems.join("\n - ")}`);
    }

    const slug = slugify(data.slug || data.id.title);
    data.slug = slug;

    const wordsId = countWords(data.id.body);
    const wordsEn = countWords(data.en.body);
    log(`draft lolos validasi: ${wordsId} kata (id) / ${wordsEn} kata (en)`);

    if (args["dry-run"]) {
        const out = join("/tmp", "blog-autopilot-dryrun.json");
        writeFileSync(out, JSON.stringify(data, null, 2));
        log(`dry-run: hasil lengkap di ${out}`);
        log(`judul id: ${data.id.title}`);
        log(`judul en: ${data.en.title}`);
        return;
    }

    const idPath = join(BLOG_DIR, `${slug}.mdx`);
    const enPath = join(BLOG_DIR, `${slug}-en.mdx`);
    writeFileSync(idPath, renderPost(data, "id", today, `${slug}-en`));
    writeFileSync(enPath, renderPost(data, "en", today, slug));
    log(`ditulis: content/blog/${slug}.mdx + ${slug}-en.mdx`);

    if (!args["no-release"]) {
        updateRelease(data, today, slug);
    }

    published.slugs.push(slug);
    published.titles.push(data.id.title);
    published.topics.push(chosen.topic);
    published.lastPublishedDate = today;
    writeFileSync(
        join(PIPELINE_DIR, "published.json"),
        `${JSON.stringify(published, null, 2)}\n`,
    );
    log("registri topik diperbarui");
}

main().catch((error: unknown) => {
    console.error(`[blog-autopilot] GAGAL: ${(error as Error).message}`);
    process.exitCode = 1;
});
