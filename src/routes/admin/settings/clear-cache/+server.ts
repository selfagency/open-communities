import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
  // Clear any server-side caches
  // Currently no in-memory cache to clear, but this endpoint exists
  // for future cache implementations
  return json({ success: true });
};
