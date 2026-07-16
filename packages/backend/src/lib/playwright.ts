import { chromium } from 'playwright';
import { MAX_CONTENT_LENGTH } from '@verokt/shared';

let browserInstance: Awaited<ReturnType<typeof chromium.launch>> | null = null;

export async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function isUrlReachable(url: string): Promise<boolean> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    return response?.status() !== undefined && response.status() < 400;
  } catch {
    return false;
  } finally {
    await page.close();
  }
}

export async function scrapePage(url: string): Promise<string | null> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    if (!response || response.status() >= 400) {
      return null;
    }

    // Remove noisy elements
    await page.evaluate(() => {
      const selectors = ['nav', 'header', 'footer', 'aside', 'script', 'style', 'noscript', 'iframe', 'svg'];
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach((el) => el.remove());
      }
    });

    const title = await page.title().catch(() => '');
    const body = await page.innerText('body').catch(() => '');

    const text = `${title}\n\n${body}`
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (text.length < 80) {
      return null;
    }

    return text.length > MAX_CONTENT_LENGTH ? text.slice(0, MAX_CONTENT_LENGTH) + '\n...' : text;
  } catch (err) {
    console.warn(`[Playwright] Failed scraping ${url}:`, err);
    return null;
  } finally {
    await page.close();
  }
}

export async function discoverSitePages(
  baseUrl: string,
  maxPages = 4,
): Promise<{ url: string; type: 'website' | 'pricing' | 'blog' | 'news' }[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  const found: { url: string; type: 'website' | 'pricing' | 'blog' | 'news' }[] = [];

  try {
    const response = await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    if (!response || response.status() >= 400) {
      return [];
    }

    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'));
      return anchors
        .map((a) => ({
          href: a.getAttribute('href') ?? '',
          text: a.textContent?.toLowerCase() ?? '',
        }))
        .filter((item) => item.href && !item.href.startsWith('javascript:') && !item.href.startsWith('mailto:'));
    });

    const baseHost = new URL(baseUrl).hostname;

    const candidates = new Map<string, 'pricing' | 'blog' | 'news'>();

    for (const { href, text } of links) {
      try {
        const resolved = new URL(href, baseUrl);
        if (resolved.hostname !== baseHost) continue;

        const path = resolved.pathname.toLowerCase();
        const combined = `${path} ${text}`;

        if (/price|preco|planos?|pricing|assinatura|subscribe/.test(combined)) {
          candidates.set(resolved.toString(), 'pricing');
        } else if (/blog/.test(combined)) {
          candidates.set(resolved.toString(), 'blog');
        } else if (/news|press|release|noticia/.test(combined)) {
          candidates.set(resolved.toString(), 'news');
        }
      } catch {
        // ignore invalid URLs
      }
    }

    // Always include base as website
    found.push({ url: baseUrl, type: 'website' });

    for (const [url, type] of candidates.entries()) {
      if (found.length >= maxPages) break;
      if (!found.some((f) => f.url === url)) {
        found.push({ url, type });
      }
    }
  } catch (err) {
    console.warn(`[Playwright] Failed discovering pages from ${baseUrl}:`, err);
  } finally {
    await page.close();
  }

  return found;
}
