import { describe, it, expect } from 'vitest';
import { getCanonicalUrls, normalizeUrl } from './search.js';

describe('normalizeUrl', () => {
  it('normalizes URLs without protocol', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/');
  });

  it('returns null for invalid URLs', () => {
    expect(normalizeUrl('not a url')).toBeNull();
  });
});

describe('search helpers', () => {
  it('generates canonical urls for a company name', () => {
    const urls = getCanonicalUrls('Nubank');

    expect(urls).toContain('https://www.nubank.com');
    expect(urls).toContain('https://nubank.com');
    expect(urls).toContain('https://www.nubank.com.br');
    expect(urls).toContain('https://nubank.io');
  });

  it('normalizes accented company names', () => {
    const urls = getCanonicalUrls('Itaú');

    expect(urls).toContain('https://www.itau.com');
    expect(urls).toContain('https://itau.com.br');
  });

  it('returns empty array for empty company name', () => {
    const urls = getCanonicalUrls('   ');
    expect(urls).toEqual([]);
  });
});
