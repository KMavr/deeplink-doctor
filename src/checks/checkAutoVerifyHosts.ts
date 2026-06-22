import type { Finding, LinkConfig } from '../types.js';

export const checkAutoVerifyHosts = (config: LinkConfig): Finding[] => {
  const missingHostIntentFilters = config.android.intentFilters.filter(
    (intentFilter) =>
      intentFilter.autoVerify && !intentFilter.data.find((item) => item.host !== undefined),
  );

  return missingHostIntentFilters.map(() => ({
    code: 'DL104',
    severity: 'warn',
    message: 'intentFilter has autoVerify enabled but no data.host to verify',
  }));
};
