#!/usr/bin/env node
/**
 * Illos Catalog Search CLI
 * Queries https://illos.dev/catalog.json or https://illos.dev/mcp
 * Usage: node search-illos.mjs [query] [--theme <theme>] [--free] [--size <size>] [--limit <n>]
 */

const CATALOG_URL = "https://illos.dev/catalog.json";

function parseArgs(args) {
  const options = {
    query: "",
    theme: null,
    freeOnly: false,
    size: null,
    limit: 10,
    json: false,
  };

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--theme" || arg === "-t") {
      options.theme = args[++i]?.toLowerCase();
    } else if (arg === "--free" || arg === "-f") {
      options.freeOnly = true;
    } else if (arg === "--size" || arg === "-s") {
      options.size = args[++i]?.toLowerCase();
    } else if (arg === "--limit" || arg === "-l") {
      options.limit = parseInt(args[++i], 10) || 10;
    } else if (arg === "--json") {
      options.json = true;
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  options.query = positional.join(" ").trim().toLowerCase();
  return options;
}

async function search() {
  const options = parseArgs(process.argv.slice(2));

  try {
    const res = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      throw new Error(`Gagal mengambil katalog illos: HTTP ${res.status}`);
    }

    const data = await res.json();
    const list = Array.isArray(data?.illustrations) ? data.illustrations : [];

    let filtered = list.filter((item) => {
      if (options.freeOnly && item.access !== "free") return false;
      if (options.theme && item.theme.toLowerCase() !== options.theme) return false;
      if (options.size && item.size.toLowerCase() !== options.size) return false;

      if (options.query) {
        const text = `${item.name} ${item.sentence}`.toLowerCase();
        return text.includes(options.query);
      }
      return true;
    });

    filtered = filtered.slice(0, options.limit);

    if (options.json) {
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }

    if (filtered.length === 0) {
      console.log(`[illos] Tidak ditemukan ilustrasi yang cocok dengan kriteria.`);
      return;
    }

    console.log(`\n=== Hasil Pencarian Ilustrasi Illos.dev (${filtered.length} ditemukan) ===\n`);
    for (const item of filtered) {
      const parts = item.page.split("/");
      const themeSlug = parts[parts.length - 2];
      const id = parts[parts.length - 1];
      const badge = item.access === "free" ? "✓ FREE" : "★ PRO";

      console.log(`[${badge}] ${item.name} (${item.theme} • ${item.size})`);
      console.log(`  Makna   : "${item.sentence}"`);
      console.log(`  Halaman : ${item.page}`);
      if (item.svg) {
        console.log(`  File SVG: ${item.svg}`);
      }
      console.log(`  Install : npx shadcn@latest add https://illos.dev/r/${themeSlug}/${id}.json`);
      console.log("");
    }
  } catch (err) {
    console.error(`[illos] Error:`, err.message);
    process.exit(1);
  }
}

search();
