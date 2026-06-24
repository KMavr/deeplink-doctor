export type Segment = { kind: 'static' | 'dynamic' | 'catchall'; value: string };

export type PathData = {
  pathname: string;
  filePath: string;
  segments: Segment[];
  isLayout: boolean;
  inGroup: boolean;
  isApi: boolean;
  isSpecial: boolean;
};

export type IntentFilterData = {
  scheme?: string;
  host?: string;
  pathPrefix?: string;
  pathPattern?: string;
  path?: string;
};

export type IntentFilter = {
  action?: string;
  autoVerify?: boolean;
  category?: string[];
  data: IntentFilterData[];
};

export type LinkConfig = {
  schemes: string[];
  ios: {
    bundleIdentifier?: string;
    associatedDomains: string[];
  };
  android: {
    package?: string;
    intentFilters: IntentFilter[];
  };
};

export type ResolvedExpoConfig = {
  scheme?: string | string[];
  ios?: { bundleIdentifier?: string; associatedDomains?: string[] };
  android?: { package?: string; intentFilters?: IntentFilter[] };
};

export type LinkTarget = {
  host?: string;
  scheme?: string;
  segments: string[];
  kind: 'exact' | 'prefix' | 'pattern';
  raw: string;
};

// Codes emitted by the checks themselves (suppressible by ignore rules).
export const CHECK_CODES = ['DL001', 'DL002', 'DL003', 'DL101', 'DL102', 'DL103', 'DL104'] as const;

// DL9xx are governance codes emitted by the suppression layer, not the checks.
export type FindingCode = (typeof CHECK_CODES)[number] | 'DL901' | 'DL902';

export type Finding = {
  code: FindingCode;
  severity: 'warn' | 'error';
  message: string;
  route?: string;
  target?: string;
};

export type SuppressionRule = {
  code: string;
  route?: string;
  reason?: string;
  owner?: string;
  revisitWhen?: string;
};

export type DeeplinkConfig = { ignore: SuppressionRule[] };
