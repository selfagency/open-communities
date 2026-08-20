// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

import { processTranslationResults, translateLocale } from '$lib/server/translate';

vi.mock('$lib/server/logger', () => ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
  log: { error: () => {} }
}));

describe('translateLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns translated text on success', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ translatedText: 'Bonjour' }));
    const result = await translateLocale('Hello', 'fr', 'http://lt.test');
    expect(result).toEqual({ locale: 'fr', translatedText: 'Bonjour' });
  });

  it('throws with the server error message when the body carries an error', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ error: 'Rate limit exceeded' }, { status: 429 }));
    await expect(translateLocale('hello', 'fr', 'http://lt.test')).rejects.toThrow('Rate limit exceeded');
  });

  it('throws with a fallback message when the body has no error field', async () => {
    vi.stubGlobal('fetch', async () => Response.json({}, { status: 500 }));
    await expect(translateLocale('hello', 'fr', 'http://lt.test')).rejects.toThrow('Translation failed for fr: 500');
  });
});

describe('processTranslationResults', () => {
  it('collects fulfilled translations and rejected errors', () => {
    const raw = [
      { status: 'fulfilled', value: { locale: 'fr', translatedText: 'Bonjour' } },
      { reason: new Error('boom'), status: 'rejected' }
    ] as PromiseSettledResult<{ locale: string; translatedText: string }>[];
    const { errors, translations } = processTranslationResults(raw);
    expect(translations).toEqual([{ locale: 'fr', translatedText: 'Bonjour' }]);
    expect(errors).toEqual(['boom']);
  });
});
