import { describe, it, expect } from 'vitest';
import { parseAasa } from '../../src/sources/aasa.js';

/**
 * Contract for `parseAasa(text)`:
 *
 * Input  — the raw response body of
 *          `https://<domain>/.well-known/apple-app-site-association`.
 * Output — an `AasaModel`: every `appID`/`appIDs` across `applinks.details[]`,
 *          flattened into a single `appIDs: string[]`.
 *
 * Throws ONLY when the body is not valid JSON (e.g. an HTML 404 page) — that
 * is the DL201 "not served as JSON" case. Valid JSON with a missing/wrong
 * shape is lenient: it yields `appIDs: []` and lets DL202 own the verdict.
 * AASA path rules (legacy `paths`, modern `components`) are not modelled.
 */

describe('parseAasa', () => {
  it('normalizes a single string appID into the array', () => {
    const text = JSON.stringify({
      applinks: { details: [{ appID: '9JA89QQLNQ.com.example.app', paths: ['*'] }] },
    });
    expect(parseAasa(text)).toEqual({ appIDs: ['9JA89QQLNQ.com.example.app'] });
  });

  it('keeps a modern appIDs array as-is', () => {
    const text = JSON.stringify({
      applinks: {
        details: [
          {
            appIDs: ['9JA89QQLNQ.com.example.app', '9JA89QQLNQ.com.example.staging'],
            components: [{ '/': '/shop/*' }],
          },
        ],
      },
    });
    expect(parseAasa(text).appIDs).toEqual([
      '9JA89QQLNQ.com.example.app',
      '9JA89QQLNQ.com.example.staging',
    ]);
  });

  it('flattens appID and appIDs across multiple details', () => {
    const text = JSON.stringify({
      applinks: {
        details: [
          { appID: '9JA89QQLNQ.com.example.app' },
          { appIDs: ['TEAM2.com.other.app', 'TEAM2.com.other.beta'] },
        ],
      },
    });
    expect(parseAasa(text).appIDs).toEqual([
      '9JA89QQLNQ.com.example.app',
      'TEAM2.com.other.app',
      'TEAM2.com.other.beta',
    ]);
  });

  it('returns empty appIDs when applinks/details are absent (lenient)', () => {
    expect(parseAasa(JSON.stringify({}))).toEqual({ appIDs: [] });
  });

  it('ignores details that carry neither appID nor appIDs', () => {
    const text = JSON.stringify({ applinks: { details: [{ paths: ['*'] }] } });
    expect(parseAasa(text)).toEqual({ appIDs: [] });
  });

  it('throws on a non-JSON body (DL201 territory)', () => {
    expect(() => parseAasa('<html><body>404 Not Found</body></html>')).toThrow();
  });
});
