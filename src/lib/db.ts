import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

function createDb() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error(
            "DATABASE_URL is not set. Database-backed features (guestbook, admin, blog engagement) require a Neon database connection string.",
        );
    }
    return drizzle({ client: neon(url) });
}

type Db = ReturnType<typeof createDb>;
let cached: Db | undefined;

function getDb(): Db {
    cached ??= createDb();
    return cached;
}

/**
 * Lazily-initialized database client.
 *
 * The client is only created on first query, so importing this module
 * (e.g. during `next build` page-data collection) never throws when
 * DATABASE_URL is missing. Routes that actually query the database
 * still fail fast with a clear error at request time.
 */
export const db: Db = new Proxy({} as Db, {
    get(_target, prop, receiver) {
        return Reflect.get(getDb(), prop, receiver);
    },
    has(_target, prop) {
        return Reflect.has(getDb(), prop);
    },
});
