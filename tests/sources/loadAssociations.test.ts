import { describe, it, expect } from 'vitest';
import { loadAssociations } from '../../src/sources/loadAssociations.js';
import type { Fetcher, HttpResponse } from '../../src/types.js';

/**
 * loadAssociations(domain, fetcher) fetches both well-known files for one
 * domain, applies DL201, parses the rest, and returns
 * `{ aasa, assetlinks, findings }`. `fetcher` defaults to the real httpFetcher;
 * tests inject a fake, so no real requests are made.
 *
 * DL201 (error) fires for either file when: status is not 2xx (unreachable),
 * the response was `redirected`, or the body fails to parse (not JSON). On
 * failure that file's model is empty and a DL201 is emitted with the failed
 * URL in `target`. The OTHER file is still fetched and parsed independently.
 */

const AASA_URL = 'https://example.com/.well-known/apple-app-site-association';
const LINKS_URL = 'https://example.com/.well-known/assetlinks.json';

const validAasa = JSON.stringify({
  applinks: { details: [{ appID: '9JA89QQLNQ.com.example.app' }] },
});
const validLinks = JSON.stringify([
  { target: { package_name: 'com.example.app', sha256_cert_fingerprints: ['AA'] } },
]);

const ok = (body: string): HttpResponse => ({ status: 200, redirected: false, body });

// 404 with a non-JSON body is the default for any URL not in the map — proves
// the loader gates on status before attempting to parse.
const fetcherFrom =
  (map: Record<string, HttpResponse>): Fetcher =>
  (url) =>
    Promise.resolve(map[url] ?? { status: 404, redirected: false, body: 'Not Found' });

describe('loadAssociations', () => {
  it('parses both files and emits no findings when both are valid', async () => {
    const r = await loadAssociations(
      'example.com',
      fetcherFrom({ [AASA_URL]: ok(validAasa), [LINKS_URL]: ok(validLinks) }),
    );
    expect(r.findings).toEqual([]);
    expect(r.aasa.appIDs).toEqual(['9JA89QQLNQ.com.example.app']);
    expect(r.assetlinks).toEqual([{ packageName: 'com.example.app', fingerprints: ['AA'] }]);
  });

  it('flags DL201 for an unreachable AASA, still parses assetlinks', async () => {
    const r = await loadAssociations('example.com', fetcherFrom({ [LINKS_URL]: ok(validLinks) }));
    expect(r.findings.map((f) => f.code)).toEqual(['DL201']);
    expect(r.findings[0]?.target).toBe(AASA_URL);
    expect(r.aasa).toEqual({ appIDs: [] });
    expect(r.assetlinks).toEqual([{ packageName: 'com.example.app', fingerprints: ['AA'] }]);
  });

  it('flags DL201 when the AASA is served via a redirect', async () => {
    const r = await loadAssociations(
      'example.com',
      fetcherFrom({
        [AASA_URL]: { status: 200, redirected: true, body: validAasa },
        [LINKS_URL]: ok(validLinks),
      }),
    );
    expect(r.findings.map((f) => f.code)).toEqual(['DL201']);
    expect(r.findings[0]?.target).toBe(AASA_URL);
    expect(r.aasa).toEqual({ appIDs: [] });
  });

  it('flags DL201 when the AASA body is not JSON', async () => {
    const r = await loadAssociations(
      'example.com',
      fetcherFrom({ [AASA_URL]: ok('<html>404</html>'), [LINKS_URL]: ok(validLinks) }),
    );
    expect(r.findings.map((f) => f.code)).toEqual(['DL201']);
    expect(r.aasa).toEqual({ appIDs: [] });
  });

  it('flags DL201 for an unreachable assetlinks.json, still parses AASA', async () => {
    const r = await loadAssociations('example.com', fetcherFrom({ [AASA_URL]: ok(validAasa) }));
    expect(r.findings.map((f) => f.code)).toEqual(['DL201']);
    expect(r.findings[0]?.target).toBe(LINKS_URL);
    expect(r.assetlinks).toEqual([]);
    expect(r.aasa.appIDs).toEqual(['9JA89QQLNQ.com.example.app']);
  });

  it('flags a DL201 per file when both fail', async () => {
    const r = await loadAssociations('example.com', fetcherFrom({}));
    expect(r.findings.map((f) => f.code)).toEqual(['DL201', 'DL201']);
    expect(r.findings.map((f) => f.target).sort()).toEqual([AASA_URL, LINKS_URL].sort());
    expect(r.aasa).toEqual({ appIDs: [] });
    expect(r.assetlinks).toEqual([]);
  });

  it('marks DL201 as an error', async () => {
    const r = await loadAssociations('example.com', fetcherFrom({}));
    expect(r.findings.every((f) => f.severity === 'error')).toBe(true);
  });
});
