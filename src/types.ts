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
