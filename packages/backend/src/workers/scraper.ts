import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { researches, documents } from '../db/schema.js';
import { addIndexJob, type ScrapeJobData } from '../queues/research.queue.js';
import { discoverUrls } from '../lib/search.js';
import { isUrlReachable, scrapePage, discoverSitePages } from '../lib/playwright.js';
import { MAX_DOCS_PER_RESEARCH } from '@verokt/shared';

export async function handleScrape(data: ScrapeJobData) {
  const { researchId, targetCompany, competitors } = data;

  await db
    .update(researches)
    .set({ status: 'scraping', updatedAt: new Date() })
    .where(eq(researches.id, researchId));

  console.log(`[Scraper] Target: ${targetCompany} | Competitors: ${competitors.join(', ')}`);

  try {
    const discovered = await discoverUrls(targetCompany, competitors, 4);
    const docsToInsert: {
      researchId: string;
      source: string;
      sourceType: 'website' | 'pricing' | 'blog' | 'news';
      content: string;
    }[] = [];

    for (const { company, urls } of discovered) {
      if (docsToInsert.length >= MAX_DOCS_PER_RESEARCH) break;

      for (const url of urls) {
        if (docsToInsert.length >= MAX_DOCS_PER_RESEARCH) break;

        const reachable = await isUrlReachable(url);
        if (!reachable) continue;

        const pages = await discoverSitePages(url, 4);

        for (const page of pages) {
          if (docsToInsert.length >= MAX_DOCS_PER_RESEARCH) break;

          const content = await scrapePage(page.url);
          if (!content) continue;

          // Avoid duplicates
          if (docsToInsert.some((d) => d.source === page.url)) continue;

          docsToInsert.push({
            researchId,
            source: page.url,
            sourceType: page.type,
            content: `[Company: ${company}]\n${content}`,
          });
        }
      }
    }

    if (docsToInsert.length > 0) {
      await db.insert(documents).values(docsToInsert);
      console.log(`[Scraper] Inserted ${docsToInsert.length} documents for research ${researchId}`);
    } else {
      console.warn(`[Scraper] No documents found for research ${researchId}. Adding fallback doc.`);
      await db.insert(documents).values({
        researchId,
        source: 'https://fallback.local',
        sourceType: 'website',
        content: `No public data could be scraped for ${targetCompany} and competitors ${competitors.join(', ')}.`,
      });
    }
  } catch (err) {
    console.error(`[Scraper] Error scraping research ${researchId}:`, err);
    // Continue to analysis with fallback content
    await db.insert(documents).values({
      researchId,
      source: 'https://fallback.local',
      sourceType: 'website',
      content: `Error during data collection for ${targetCompany}. Analysis will use general knowledge.`,
    });
  }

  await addIndexJob({ researchId });
}
