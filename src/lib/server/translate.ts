// fallow-ignore-file security-sink — intentional: connects to config-defined LibreTranslate endpoint
import { log } from '$lib/server/logger';

export interface TranslateResult {
  locale: string;
  translatedText: string;
}

export async function translateLocale(
  text: string,
  locale: string,
  apiUrl: string,
  ltKey?: string
): Promise<TranslateResult> {
  const res = await fetch(`${apiUrl}/translate`, {
    body: JSON.stringify({
      format: 'text',
      q: text,
      source: 'en',
      target: locale,
      ...(ltKey ? { api_key: ltKey } : {})
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errMsg =
      ((body as Record<string, unknown>).error as string) || `Translation failed for ${locale}: ${res.status}`;
    log.error('LibreTranslate request failed', { error: errMsg, locale, status: res.status });
    throw new Error(errMsg);
  }

  const data = (await res.json()) as { translatedText: string };
  return { locale, translatedText: data.translatedText };
}

export function processTranslationResults(rawResults: PromiseSettledResult<TranslateResult>[]): {
  translations: TranslateResult[];
  errors: string[];
} {
  const translations: TranslateResult[] = [];
  const errors: string[] = [];

  for (const result of rawResults) {
    if (result.status === 'fulfilled') {
      translations.push(result.value);
    } else {
      const msg = result.reason?.message ?? 'Unknown error';
      errors.push(msg);
      log.error('Translation failed', { error: msg });
    }
  }

  return { errors, translations };
}
