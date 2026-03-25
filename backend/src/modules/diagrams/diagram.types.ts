export type DiagramObjectKind = 'frame' | 'cabinet' | 'symbol';

export interface DiagramGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramObjectRecord {
  id: string;
  kind: DiagramObjectKind;
  parentId: string | null;
  groupId: string | null;
  geometry: DiagramGeometry;
  props: Record<string, any>;
}

export interface DiagramEdgeTerminal {
  objectId: string;
  portId: string;
}

export interface DiagramEdgeRecord {
  id: string;
  source: DiagramEdgeTerminal;
  target: DiagramEdgeTerminal;
  props: Record<string, any>;
}

export interface DiagramSnapshotRecord {
  diagramId: string;
  version: number;
  updatedAt: string;
  rawGraphXml: string;
  objects: DiagramObjectRecord[];
  edges: DiagramEdgeRecord[];
}

export type DiagramChangeOperation = 'create' | 'update' | 'delete';
export type DiagramCommitType = 'normal' | 'rollback';

export interface DiagramChangeRecord {
  objectType: 'object' | 'edge';
  objectId: string;
  op: DiagramChangeOperation;
  before: any;
  after: any;
}

export interface DiagramCommitRecord {
  commitId: string;
  diagramId: string;
  baseVersion: number;
  resultVersion: number;
  actorId: string;
  commitType: DiagramCommitType;
  createdAt: string;
  touchedObjectIds: string[];
  changes: DiagramChangeRecord[];
}

