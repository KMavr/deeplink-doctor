import type { Finding, FindingCode } from '../types.js';

export const FINDING_SEVERITIES: Record<FindingCode, Finding['severity']> = {
  DL001: 'error',
  DL002: 'warn',
  DL003: 'error',
  DL101: 'error',
  DL102: 'error',
  DL103: 'error',
  DL104: 'warn',
  DL201: 'error',
  DL202: 'error',
  DL203: 'error',
  DL204: 'warn',
  DL901: 'warn',
  DL902: 'warn',
};
