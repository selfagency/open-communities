import type { HttpHandler } from 'msw';

// Phase 0: empty handler registry — populated in Phase 1+
// Individual handler groups are imported and spread here.
export const handlers: HttpHandler[] = [];
