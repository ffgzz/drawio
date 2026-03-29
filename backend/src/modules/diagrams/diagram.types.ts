// 图元类型
export type DiagramObjectKind = "frame" | "cabinet" | "symbol" | "generic";

// 图元的几何信息
export interface DiagramGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 图元记录结构
export interface DiagramObjectRecord {
  id: string;
  kind: DiagramObjectKind;
  parentId: string | null;
  groupId: string | null;
  geometry: DiagramGeometry;
  props: Record<string, any>;
}

export interface DiagramEdgeTerminal {
  objectId: string | null;
  portId: string | null;
}

export interface DiagramEdgeRecord {
  id: string;
  source: DiagramEdgeTerminal;
  target: DiagramEdgeTerminal;
  props: Record<string, any>;
}

// 整图快照结构
export interface DiagramSnapshotRecord {
  diagramId: string;
  version: number;
  updatedAt: string;
  objects: DiagramObjectRecord[];
  edges: DiagramEdgeRecord[];
}

export type DiagramChangeOperation = "create" | "update" | "delete";
// 提交类型，普通提交或回滚提交
export type DiagramCommitType = "normal" | "rollback";

// 原子变更
export interface DiagramChangeRecord {
  objectType: "object" | "edge";
  objectId: string;
  op: DiagramChangeOperation;
  sequence?: number;
  createdAt?: string;
  // 修改前后
  before: any;
  after: any;
}

// 变更记录
export interface DiagramCommitRecord {
  commitId: string;
  diagramId: string;
  // 变更基于的版本号
  baseVersion: number;
  // 变更提交后图纸的版本号
  resultVersion: number;
  actorId: string;
  commitType: DiagramCommitType;
  createdAt: string;
  // 本次变更涉及的对象ID列表
  touchedObjectIds: string[];
  changes: DiagramChangeRecord[];
}
