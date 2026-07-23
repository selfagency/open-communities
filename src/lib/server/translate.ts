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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'en',
      target: locale,
      format: 'text',
      ...(ltKey ? { api_key: ltKey } : {})
    })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errMsg =
      ((body as Record<string, unknown>)?.error as string) ?? `Translation failed for ${locale}: ${res.status}`;
    log.error('LibreTranslate request failed', { locale, status: res.status, error: errMsg });
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

  return { translations, errors };
}
