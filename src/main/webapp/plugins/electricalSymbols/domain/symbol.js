/**
 * 电气图元域入口。
 * 对外暴露稳定的 symbol API，内部仍复用 symbolGraph.js 的实现。
 */
import { createSymbolDomain } from "./symbolGraph.js";

function getSymbolDomain() {
  return createSymbolDomain();
}

export function buildSymbolCell() {
  return getSymbolDomain().buildSymbolCell.apply(null, arguments);
}

export function extractSpec() {
  return getSymbolDomain().extractSpec.apply(null, arguments);
}

export function refreshRoot() {
  return getSymbolDomain().refreshRoot.apply(null, arguments);
}

export function syncRoot() {
  return getSymbolDomain().syncRoot.apply(null, arguments);
}

export var symbolDomainApi = {
  buildSymbolCell,
  extractSpec,
  refreshRoot,
  syncRoot,
};
