import type { AssetlinkEntry } from '../types.js';

type RawStatement = { target?: { package_name?: string; sha256_cert_fingerprints?: string[] } };

export const parseAssetlinks = (body: string): AssetlinkEntry[] => {
  const data: unknown = JSON.parse(body);

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((statement: RawStatement) => ({
      packageName: statement?.target?.package_name,
      fingerprints: statement?.target?.sha256_cert_fingerprints ?? [],
    }))
    .filter((t): t is AssetlinkEntry => !!t.packageName);
};
