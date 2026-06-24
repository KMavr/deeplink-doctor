import type { Fetcher } from '../types.js';

export const httpFetcher: Fetcher = async (url) => {
  const res = await fetch(url);
  return { status: res.status, redirected: res.redirected, body: await res.text() };
};
