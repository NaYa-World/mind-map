export interface Vector2 {
  x: number;
  y: number;
}

export interface MindMapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  children: string[];
  link?: string;
  color?: string;
  collapsed?: boolean;
}

export interface CrossLink {
  from: string;
  to: string;
}

export interface MindMapData {
  nodes: Record<string, MindMapNode>;
  rootId: string;
  crossLinks: CrossLink[];
  layout: string;
  theme: string;
  name: string;
  createdAt?: string;
}

export interface StateEvents {
  'NODE_SELECTED': string | null;
  'NODE_UPDATED': string;
  'MAP_LOADED': void;
  'STATE_CHANGED': void;
  'THEME_CHANGED': string;
  'LAYOUT_CHANGED': string;
}
