import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
await sql`DELETE FROM activities WHERE project_key = 'pk_5925f19d4946b581cdfaecff679f742a' AND project_name LIKE 'Uji-Bersama-%'`;
await sql`DELETE FROM sync_projects WHERE "key" = 'pk_5925f19d4946b581cdfaecff679f742a' AND name LIKE 'Uji-Bersama-%'`;
const left = await sql`SELECT count(*)::int AS c FROM sync_projects WHERE name LIKE 'Uji-Bersama-%'`;
console.log("remaining test projects:", left[0].c);
