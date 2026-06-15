import type { Segment, PathData } from '../types.js';

const INDEX_REGEX = /\/?index\.(js|ts|jsx|tsx)$/;
const LAYOUT_REGEX = /\/?_layout\.(js|ts|jsx|tsx)$/;
const API_REGEX = /\+api\.(js|ts)$/;
const SPECIAL_REGEX = /^\+(not-found|html|native-intent)\.(js|ts|jsx|tsx)$/;
const GROUP_REGEX = /\/?\([^()]+\)/g;

const stripFileType = (path: string) => path.replace(/\.(js|ts|jsx|tsx)$/, '');
const isGroupSegment = (segment: string) => segment.startsWith('(') && segment.endsWith(')');

const renderSegment = (segment: Segment): string => {
  if (segment.kind === 'dynamic') {
    return `[${segment.value}]`;
  }
  if (segment.kind === 'catchall') {
    return `[...${segment.value}]`;
  }
  return segment.value;
};

const formatSegment = (segmentPath: string): Segment => {
  const segment = stripFileType(segmentPath);
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const isCatchall = segment.startsWith('[...');
    const segmentName = segment.replace(/^\[(\.\.\.)?([^\]]+)\]$/, '$2');
    return {
      kind: isCatchall ? 'catchall' : 'dynamic',
      value: segmentName,
    };
  }
  return { kind: 'static', value: segment };
};

export const parseRoutePath = (path: string): PathData => {
  const segments = path.split('/');
  const basename = segments.at(-1) ?? '';
  const group = path.match(GROUP_REGEX);
  const isLayout = LAYOUT_REGEX.test(basename);
  const isApi = API_REGEX.test(basename);
  const isSpecial = SPECIAL_REGEX.test(basename);

  const formattedSegments = segments
    .filter((s) => !s.match(INDEX_REGEX) && !s.match(LAYOUT_REGEX) && !isGroupSegment(s))
    .map(formatSegment);

  const pathname = `/${formattedSegments.map(renderSegment).join('/')}`;

  return {
    pathname,
    filePath: path,
    segments: formattedSegments,
    isLayout,
    inGroup: group !== null,
    isApi,
    isSpecial,
  };
};

export const isLinkableRoute = (pathData: PathData): boolean => {
  return !pathData.isLayout && !pathData.isApi && !pathData.isSpecial;
};
