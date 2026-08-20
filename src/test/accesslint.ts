/**
 * AccessLint accessibility assertion helper for browser tests.
 *
 * Usage: assertAccessible(container) instead of expect(container).toBeAccessible()
 * to avoid vitest type augmentation conflicts with @testing-library/jest-dom/vitest.
 *
 * @accesslint/vitest's toBeAccessible() matcher uses node:fs internally, which
 * doesn't work in Vitest's browser mode (Playwright browser runner). We use
 * @accesslint/core directly and filter violations to the container's descendants.
 */

import type { AuditResult, AxeViolation } from '@accesslint/core';
import { runAudit } from '@accesslint/core';

export function assertAccessible(container: Element | Document): void {
  const doc = container instanceof Document ? container : (container.ownerDocument ?? document);
  const results = runAudit(doc, { componentMode: true }) as AuditResult;
  const { violations } = results;

  // Filter violations to only those within the container's descendants
  const containerViolations =
    container instanceof Document
      ? violations
      : violations.filter((v) => {
          if (!v.selector) {
            return false;
          }
          try {
            return container.querySelector(v.selector) !== null;
          } catch {
            return false;
          }
        });

  if (containerViolations.length === 0) {
    return;
  }
  const violationToString = (v: Violation) =>
    `  [${v.impact ?? '?'}] ${v.message}${v.selector ? ` (${v.selector})` : ''}`;
  const detail = containerViolations.slice(0, 10).map(violationToString).join('\n');
  throw new Error(`Found ${containerViolations.length} accessibility violation(s):\n${detail}`);
}
