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

export type FindingCode = 'DL001';

export type Finding = {
  code: FindingCode;
  severity: 'warn' | 'error';
  message: string;
  route?: string;
  target?: string;
};
