/**
 * 剪贴板 XML 消毒器。
 *
 * drawio 的原生剪贴板（EditorUi.installNativeClipboardHandler）走的是
 * copyCells → 系统剪贴板 XML → pasteCells → pasteXml → importXml 这条链路，
 * 完全不经过 mxClipboard，所以图框/配电柜的保护必须在 XML 层再做一次。
 *
 * 这里只按 pluginType 剔除图框/配电柜及其后代和挂在上面的边，
 * 不去动图元自身的内部子节点（body/label 在 XML 里是独立元素，
 * 误删会把粘贴出来的图元掏空）。
 */
import { ELECTRICAL_CONSTANTS } from "../core/constants.js";

var CELL_TAG_NAMES = {
  mxCell: true,
  object: true,
  UserObject: true,
};

var PROTECTED_TYPE_REASON = {};
PROTECTED_TYPE_REASON[ELECTRICAL_CONSTANTS.FRAME_TYPE] = "frame";
PROTECTED_TYPE_REASON[ELECTRICAL_CONSTANTS.CABINET_TYPE] = "cabinet";
PROTECTED_TYPE_REASON[ELECTRICAL_CONSTANTS.CABINET_GAP_TYPE] = "cabinet";

function isCellElement(node) {
  return (
    node != null &&
    node.nodeType === 1 &&
    CELL_TAG_NAMES[node.nodeName] === true
  );
}

/**
 * object / UserObject 的几何与拓扑属性挂在内层 mxCell 上，
 * 纯 mxCell 则挂在自己身上。
 */
function getTopologyNode(element) {
  var inner;

  if (element.nodeName !== "mxCell") {
    inner = element.getElementsByTagName("mxCell");

    if (inner.length > 0) {
      return inner[0];
    }
  }

  return element;
}

/**
 * 收集 XML 里所有"独立 cell"元素，跳过 object/UserObject 的内层 mxCell。
 */
function collectCellElements(doc) {
  var all = doc.getElementsByTagName("*");
  var result = [];
  var i;

  for (i = 0; i < all.length; i++) {
    var element = all[i];

    if (!isCellElement(element) || element.getAttribute("id") == null) {
      continue;
    }

    if (element.nodeName === "mxCell" && isCellElement(element.parentNode)) {
      continue;
    }

    result.push(element);
  }

  return result;
}

/**
 * 只有真正承载内容的 cell 才算"还剩东西可粘贴"，
 * root/layer 这类骨架 cell 既不是 vertex 也不是 edge。
 */
function isContentCell(topologyNode) {
  return (
    topologyNode.getAttribute("vertex") === "1" ||
    topologyNode.getAttribute("edge") === "1"
  );
}

/**
 * 从待粘贴的 XML 中剔除图框 / 配电柜及其后代、以及连接到它们的边。
 *
 * @param {string} xml 剪贴板里的原始 XML
 * @returns {Object|null} null 表示不是可处理的图形 XML（纯文本/图片等原样放行）；
 *   否则返回 {xml, hadProtected, reasons, removedAll}
 */
export function sanitizePastedGraphXml(xml) {
  var doc;

  if (typeof xml !== "string" || xml.length === 0) {
    return null;
  }

  try {
    doc = mxUtils.parseXml(xml);
  } catch (e) {
    return null;
  }

  if (doc == null || doc.documentElement == null) {
    return null;
  }

  var elements = collectCellElements(doc);

  if (elements.length === 0) {
    return null;
  }

  var entries = [];
  var removed = {};
  var reasons = {};
  var i;

  for (i = 0; i < elements.length; i++) {
    var element = elements[i];
    var topology = getTopologyNode(element);
    var id = element.getAttribute("id");
    var reason = PROTECTED_TYPE_REASON[element.getAttribute("pluginType")];

    entries.push({ element: element, topology: topology, id: id });

    if (reason != null) {
      removed[id] = true;
      reasons[reason] = true;
    }
  }

  // 后代：父节点被剔除的一并剔除，直到不动点。
  var changed = true;

  while (changed) {
    changed = false;

    for (i = 0; i < entries.length; i++) {
      var entry = entries[i];

      if (removed[entry.id] === true) {
        continue;
      }

      var parentId = entry.topology.getAttribute("parent");

      if (parentId != null && removed[parentId] === true) {
        removed[entry.id] = true;
        changed = true;
      }
    }
  }

  // 连到被剔除对象上的边失去意义，一并剔除。
  for (i = 0; i < entries.length; i++) {
    var edgeEntry = entries[i];

    if (removed[edgeEntry.id] === true) {
      continue;
    }

    var source = edgeEntry.topology.getAttribute("source");
    var target = edgeEntry.topology.getAttribute("target");

    if (
      (source != null && removed[source] === true) ||
      (target != null && removed[target] === true)
    ) {
      removed[edgeEntry.id] = true;
    }
  }

  var hadProtected = false;
  var remaining = 0;

  for (i = 0; i < entries.length; i++) {
    var current = entries[i];

    if (removed[current.id] === true) {
      hadProtected = true;

      if (current.element.parentNode != null) {
        current.element.parentNode.removeChild(current.element);
      }
    } else if (isContentCell(current.topology)) {
      remaining++;
    }
  }

  if (!hadProtected) {
    return null;
  }

  return {
    xml: mxUtils.getXml(doc.documentElement),
    hadProtected: true,
    reasons: reasons,
    removedAll: remaining === 0,
  };
}
