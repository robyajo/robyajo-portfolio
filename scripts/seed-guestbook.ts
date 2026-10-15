import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { inArray } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { guestbookEntries } from "@/lib/schema";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_IDS_FILE = resolve(__dirname, ".seed-guestbook-ids.json");

function getDb() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    return drizzle({ client: neon(url) });
}

function fakeMessage() {
    const templates = [
        () => faker.hacker.phrase(),
        () => faker.lorem.sentence(faker.number.int({ min: 6, max: 14 })),
        () => `Just found this through ${faker.internet.domainWord()}. ${faker.hacker.phrase()}`,
        () => faker.lorem.sentences(2),
        () => `${faker.company.catchPhrase()}. ${faker.lorem.sentence()}`,
        () => faker.lorem.sentence(faker.number.int({ min: 8, max: 18 })),
    ];
    return templates[Math.floor(Math.random() * templates.length)]();
}

function fakeSeedUser() {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
        userId: `seed_${faker.string.uuid()}`,
        authorName: `${firstName} ${lastName}`,
        authorImage: faker.image.avatar(),
    };
}

async function seed(count: number) {
    const db = getDb();

    console.log(`Seeding ${count} fake guestbook entries (no auth provider needed)...\n`);

    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const rows = Array.from({ length: count }, () => ({
        ...fakeSeedUser(),
        message: fakeMessage(),
        isPinned: false,
        isDeleted: false,
        createdAt: new Date(faker.number.int({ min: oneYearAgo, max: now })),
    }));

    const inserted = await db
        .insert(guestbookEntries)
        .values(rows)
        .returning({ id: guestbookEntries.id });
    const insertedIds = inserted.map((r) => r.id);

    const existing: number[] = existsSync(SEED_IDS_FILE)
        ? JSON.parse(readFileSync(SEED_IDS_FILE, "utf8"))
        : [];
    writeFileSync(SEED_IDS_FILE, JSON.stringify([...existing, ...insertedIds], null, 2));

    console.log(`\nSeeded ${insertedIds.length} entries.`);
}

async function cleanup() {
    if (!existsSync(SEED_IDS_FILE)) {
        console.log("No seed ID file found.");
        process.exit(0);
    }

    const ids: number[] = JSON.parse(readFileSync(SEED_IDS_FILE, "utf8"));
    if (ids.length === 0) {
        console.log("Nothing to clean up.");
        process.exit(0);
    }

    const db = getDb();

    console.log(`Deleting ${ids.length} seeded entries from DB...`);
    await db.delete(guestbookEntries).where(inArray(guestbookEntries.id, ids));

    writeFileSync(SEED_IDS_FILE, JSON.stringify([]));
    console.log(`\nCleaned up ${ids.length} entries.`);
}

const args = process.argv.slice(2);

if (args.includes("--cleanup")) {
    cleanup().catch((e) => { console.error(e); process.exit(1); });
} else {
    const countFlag = args.indexOf("--count");
    const count = countFlag !== -1 ? parseInt(args[countFlag + 1] ?? "15") : 15;
    if (isNaN(count) || count < 1) {
        console.error("--count must be a positive integer");
        process.exit(1);
    }
    seed(count).catch((e) => { console.error(e); process.exit(1); });
}
