import type { HttpHandler } from 'msw';

import { captchaHandlers } from './captcha';
import { congregationHandlers } from './pocketbase/congregations';
import { locationHandlers } from './pocketbase/locations';
import { pageHandlers } from './pocketbase/pages';
import { userHandlers } from './pocketbase/users';
import { posthogHandlers } from './posthog';

export const handlers: HttpHandler[] = [
  ...captchaHandlers,
  ...congregationHandlers,
  ...locationHandlers,
  ...pageHandlers,
  ...posthogHandlers,
  ...userHandlers
];
