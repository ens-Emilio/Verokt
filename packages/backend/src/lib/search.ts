import { getBrowser } from './playwright.js';

const SEARCH_ENGINES = [
  (q: string) => `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
  (q: string) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
];

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export function normalizeUrl(url: string): string | null {
  try {
    const clean = url.trim().replace(/^[\s\u200B]+|[\s\u200B]+$/g, '');
    const u = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
    return u.toString();
  } catch {
    return null;
  }
}

export async function searchWeb(query: string, limit = 5): Promise<SearchResult[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  const results: SearchResult[] = [];

  try {
    for (const buildUrl of SEARCH_ENGINES) {
      if (results.length >= limit) break;

      try {
        await page.goto(buildUrl(query), { waitUntil: 'domcontentloaded', timeout: 15000 });

        const links = await page.$$('a.result__a, a.result__aURL, .links_main a, a[data-testid="result-title-a"]');

        for (const link of links) {
          if (results.length >= limit) break;

          const href = await link.evaluate((el) => {
            const raw = el.getAttribute('href') ?? '';
            // DuckDuckGo sometimes wraps URLs in a redirect
            const duckMatch = raw.match(/uddg=([^&]+)/);
            if (duckMatch) return decodeURIComponent(duckMatch[1]);
            return raw;
          });

          const title = await link.evaluate((el) => el.textContent?.trim() ?? '');
          const url = normalizeUrl(href);

          if (url && !results.some((r) => r.url === url)) {
            results.push({
              title,
              url,
              snippet: title,
            });
          }
        }
      } catch (err) {
        console.warn(`[Search] Engine failed: ${buildUrl(query)}`, err);
      }
    }
  } finally {
    await page.close();
  }

  return results.slice(0, limit);
}

export function getCanonicalUrls(companyName: string): string[] {
  const normalized = companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  if (!normalized) return [];

  return [
    `https://www.${normalized}.com`,
    `https://${normalized}.com`,
    `https://www.${normalized}.com.br`,
    `https://${normalized}.com.br`,
    `https://${normalized}.io`,
  ];
}

export async function discoverUrls(
  companyName: string,
  competitors: string[],
  maxPerCompany = 4,
): Promise<{ company: string; urls: string[] }[]> {
  const allCompanies = [companyName, ...competitors];
  const discovered: { company: string; urls: string[] }[] = [];

  for (const company of allCompanies) {
    const urls = new Set<string>();

    // 1. Canonical guesses
    const canonical = getCanonicalUrls(company);
    for (const url of canonical) {
      urls.add(url);
    }

    // 2. Web search
    try {
      const searchResults = await searchWeb(`${company} official website pricing`, maxPerCompany);
      for (const r of searchResults) {
        urls.add(r.url);
      }
    } catch (err) {
      console.warn(`[Search] Failed for ${company}:`, err);
    }

    discovered.push({ company, urls: Array.from(urls).slice(0, maxPerCompany) });
  }

  return discovered;
}
