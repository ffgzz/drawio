/**
 * 快照域入口。
 * 对外暴露稳定的 snapshot API，内部仍复用 snapshotGraph.js 的实现。
 */
import { createSnapshotDomain } from "./snapshotGraph.js";
import {
  computeSnapshotChanges,
  deserializeCellValue,
  deserializeGeometry,
  getGenericObjectId,
  normalizeGenericStableId,
  normalizeSnapshotGenericIds,
  serializeCellValue,
  serializeGeometry,
} from "./snapshotCore.js";

function getSnapshotDomain() {
  return createSnapshotDomain();
}

export function collectChangeObjectIds() {
  return getSnapshotDomain().collectChangeObjectIds.apply(null, arguments);
}

export function collectGenericPortBindings() {
  return getSnapshotDomain().collectGenericPortBindings.apply(null, arguments);
}

export function exportDiagramSnapshot() {
  return getSnapshotDomain().exportDiagramSnapshot.apply(null, arguments);
}

export function getEdgePortId() {
  return getSnapshotDomain().getEdgePortId.apply(null, arguments);
}

export function getConstraintForPort() {
  return getSnapshotDomain().getConstraintForPort.apply(null, arguments);
}

export function getGenericPortBindingById() {
  return getSnapshotDomain().getGenericPortBindingById.apply(null, arguments);
}

export function isPluginInternalCell() {
  return getSnapshotDomain().isPluginInternalCell.apply(null, arguments);
}

export function restoreDiagramSnapshot() {
  return getSnapshotDomain().restoreDiagramSnapshot.apply(null, arguments);
}

export function shouldExportGenericObject() {
  return getSnapshotDomain().shouldExportGenericObject.apply(null, arguments);
}

export var snapshotDomainApi = {
  collectChangeObjectIds,
  collectGenericPortBindings,
  computeSnapshotChanges,
  deserializeCellValue,
  deserializeGeometry,
  exportDiagramSnapshot,
  getConstraintForPort,
  getEdgePortId,
  getGenericObjectId,
  getGenericPortBindingById,
  isPluginInternalCell,
  normalizeGenericStableId,
  normalizeSnapshotGenericIds,
  restoreDiagramSnapshot,
  serializeCellValue,
  serializeGeometry,
  shouldExportGenericObject,
};

export {
  computeSnapshotChanges,
  deserializeCellValue,
  deserializeGeometry,
  getGenericObjectId,
  normalizeGenericStableId,
  normalizeSnapshotGenericIds,
  serializeCellValue,
  serializeGeometry,
};
