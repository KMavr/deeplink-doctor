import { afterEach, describe, it, expect, vi } from 'vitest';
import { httpFetcher } from '../../src/sources/httpFetcher.js';

describe('httpFetcher', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps a fetch Response to status, redirected and body', async () => {
    const response = { status: 200, redirected: true, text: async () => 'hello' };
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await httpFetcher('https://example.com/x');

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/x');
    expect(result).toEqual({ status: 200, redirected: true, body: 'hello' });
  });

  it('propagates network errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    await expect(httpFetcher('https://example.com/x')).rejects.toThrow('ECONNREFUSED');
  });
});
