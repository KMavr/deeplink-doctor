import type { AasaModel, AssetlinkEntry, Fetcher, Finding } from '../types.js';
import { parseAasa } from './aasa.js';
import { parseAssetlinks } from './assetlinks.js';
import { httpFetcher } from './httpFetcher.js';

type Associations = { aasa: AasaModel; assetlinks: AssetlinkEntry[]; findings: Finding[] };
type FileResult<T> = { value: T | null; findings: Finding[] };
type FetchResult = { body: string; finding: null } | { body: null; finding: Finding };

const createAasaUrl = (domain: string) =>
  `https://${domain}/.well-known/apple-app-site-association`;
const createAssetlinksUrl = (domain: string) => `https://${domain}/.well-known/assetlinks.json`;

const generateFinding = (url: string, reason: string): Finding => ({
  code: 'DL201',
  severity: 'error',
  message: `${url} ${reason}`,
  target: url,
});

const fetchFile = async (fetcher: Fetcher, url: string): Promise<FetchResult> => {
  try {
    const { status, redirected, body } = await fetcher(url);

    if (redirected) {
      return { body: null, finding: generateFinding(url, 'is served via a redirect') };
    }

    if (status < 200 || status >= 300) {
      return { body: null, finding: generateFinding(url, `responded with status ${status}`) };
    }

    return { body, finding: null };
  } catch {
    return { body: null, finding: generateFinding(url, 'is unreachable') };
  }
};

const parseFile = <T>(
  fetched: FetchResult,
  url: string,
  parse: (body: string) => T,
): FileResult<T> => {
  if (fetched.body === null) {
    return { value: null, findings: [fetched.finding] };
  }

  try {
    return { value: parse(fetched.body), findings: [] };
  } catch {
    return { value: null, findings: [generateFinding(url, 'did not return valid JSON')] };
  }
};

export const loadAssociations = async (
  domain: string,
  fetcher: Fetcher = httpFetcher,
): Promise<Associations> => {
  const aasaUrl = createAasaUrl(domain);
  const assetlinksUrl = createAssetlinksUrl(domain);

  const [aasaFetch, assetlinksFetch] = await Promise.all([
    fetchFile(fetcher, aasaUrl),
    fetchFile(fetcher, assetlinksUrl),
  ]);

  const aasa = parseFile(aasaFetch, aasaUrl, parseAasa);
  const assetlinks = parseFile(assetlinksFetch, assetlinksUrl, parseAssetlinks);

  return {
    aasa: aasa.value ?? { appIDs: [] },
    assetlinks: assetlinks.value ?? [],
    findings: [...aasa.findings, ...assetlinks.findings],
  };
};
