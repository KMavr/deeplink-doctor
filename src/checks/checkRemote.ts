import type { AasaModel, AssetlinkEntry, Finding, LinkConfig } from '../types.js';
import { checkAasaAppIds } from './checkAasaAppIds.js';
import { checkAssetlinks } from './checkAssetlinks.js';

export const checkRemote = (
  aasa: AasaModel,
  assetlinks: AssetlinkEntry[],
  config: LinkConfig,
): Finding[] => [...checkAasaAppIds(aasa, config), ...checkAssetlinks(assetlinks, config)];
