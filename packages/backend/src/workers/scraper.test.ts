import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleScrape } from './scraper.js';

const insertMock = vi.fn();
const addIndexJobMock = vi.fn();

vi.mock('../db/client.js', () => ({
  db: {
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    insert: vi.fn(() => ({ values: insertMock })),
  },
}));

vi.mock('../db/schema.js', () => ({
  researches: {},
  documents: {},
}));

vi.mock('../queues/research.queue.js', () => ({
  addIndexJob: (...args: unknown[]) => addIndexJobMock(...args),
}));

vi.mock('../lib/search.js', () => ({
  discoverUrls: vi.fn(() =>
    Promise.resolve([
      { company: 'Nubank', urls: ['https://nubank.com'] },
    ]),
  ),
}));

vi.mock('../lib/playwright.js', () => ({
  isUrlReachable: vi.fn(() => Promise.resolve(true)),
  discoverSitePages: vi.fn(() =>
    Promise.resolve([
      { url: 'https://nubank.com', type: 'website' as const },
      { url: 'https://nubank.com/pricing', type: 'pricing' as const },
    ]),
  ),
  scrapePage: vi.fn((url: string) =>
    Promise.resolve(`Mocked content for ${url}`),
  ),
}));

describe('scraper worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scrapes discovered pages and saves documents', async () => {
    await handleScrape({
      researchId: 'research-1',
      targetCompany: 'Nubank',
      competitors: ['Itau'],
    });

    expect(insertMock).toHaveBeenCalled();
    expect(addIndexJobMock).toHaveBeenCalledWith({ researchId: 'research-1' });

    const insertedValues = insertMock.mock.calls[0][0];
    expect(insertedValues).toHaveLength(2);
    expect(insertedValues[0].source).toBe('https://nubank.com');
    expect(insertedValues[1].source).toBe('https://nubank.com/pricing');
  });
});
