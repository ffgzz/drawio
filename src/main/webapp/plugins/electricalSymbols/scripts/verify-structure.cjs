/**
 * electricalSymbols 结构校验脚本。
 * 用于验证 ESM 重构后的关键依赖约束，避免后续改动把 ui/runtime/domain/services 又耦合回去。
 */
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const checks = [];

function walkJsFiles(dir) {
  const result = [];

  if (!fs.existsSync(dir)) {
    return result;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...walkJsFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith(".js")) {
      result.push(fullPath);
    }
  }

  return result;
}

function toProjectPath(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

function addRegexCheck(name, files, regex, message) {
  checks.push(function () {
    const errors = [];

    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      const lines = text.split(/\r?\n/);

      for (let i = 0; i < lines.length; i += 1) {
        if (regex.test(lines[i])) {
          errors.push(
            `${toProjectPath(file)}:${i + 1} ${message}: ${lines[i].trim()}`,
          );
        }
      }
    }

    return { name, errors };
  });
}

function addRequiredFragmentsCheck(name, file, fragments) {
  checks.push(function () {
    const text = fs.readFileSync(file, "utf8");
    const errors = [];

    for (const fragment of fragments) {
      if (!text.includes(fragment.text)) {
        errors.push(`${toProjectPath(file)} ${fragment.message}`);
      }
    }

    return { name, errors };
  });
}

const uiFiles = walkJsFiles(path.join(rootDir, "ui"));
const allFiles = walkJsFiles(rootDir);
const snapshotGraphFile = path.join(rootDir, "domain", "snapshotGraph.js");
const cabinetGraphFile = path.join(rootDir, "domain", "cabinetGraph.js");
const cabinetCoreFile = path.join(rootDir, "domain", "cabinetCore.js");
const cabinetApiFile = path.join(rootDir, "domain", "cabinet.js");
const canvasFeaturesFile = path.join(rootDir, "runtime", "canvasFeatures.js");
const connectionConstraintsFile = path.join(
  rootDir,
  "runtime",
  "connectionConstraints.js",
);
const cellTooltipsFile = path.join(rootDir, "runtime", "cellTooltips.js");
const eidDrawingStandardFile = path.join(
  rootDir,
  "runtime",
  "eidDrawingStandard.js",
);
const createAppFile = path.join(rootDir, "bootstrap", "createApp.js");
const installElectricalSymbolsFile = path.join(
  rootDir,
  "bootstrap",
  "installElectricalSymbols.js",
);
const hostBridgeFile = path.join(rootDir, "runtime", "hostBridge.js");

addRegexCheck(
  "cabinet-segment-port-host",
  [cabinetGraphFile, createAppFile],
  /root\.insert\(createCabinetBlockCell|installCabinetOverlays\(/,
  "新柜体不得物化 cabinetBlock cell 或安装插块加号",
);

addRegexCheck(
  "legacy-bundle-refs",
  allFiles,
  /\bcreatePluginBundle\b|\bcreateUiRuntime\b|\bbundle\.ui\b|\bbundle\.runtime\b/,
  "不应回引旧 bundle/createUiRuntime 结构",
);

addRequiredFragmentsCheck("electrical-cell-tooltip-suppression", cellTooltipsFile, [
  {
    text: 'getAttr(cell, "esKind")',
    message: "Tooltip 屏蔽必须识别插件内部构件",
  },
  {
    text: "isElectricalTooltipCell(ctx, cell)",
    message: "Tooltip 覆写必须仅针对电气图元",
  },
  {
    text: "graph.setTooltips(false);",
    message: "集成页必须默认关闭 Drawio 画布 Tooltip handler",
  },
  {
    text: "return originalGetTooltipForCell.apply(this, arguments);",
    message: "普通单元必须保留 Drawio 原生 Tooltip",
  },
]);
addRequiredFragmentsCheck("electrical-cell-tooltip-install", createAppFile, [
  {
    text: "installCellTooltipSuppression(app.ctx);",
    message: "插件启动时必须安装 Tooltip 屏蔽",
  },
]);

addRequiredFragmentsCheck("eid-drawing-standard", eidDrawingStandardFile, [
  {
    text: "urlParams.eidStandard",
    message: "EID 标准必须由 eidStandard=1 显式开启",
  },
  {
    text: "graph.view.setUnit(mxConstants.MILLIMETERS);",
    message: "画布尺寸显示必须使用 Draw.io 内建毫米换算",
  },
  {
    text: "Editor.pageSizeUnit = mxConstants.MILLIMETERS;",
    message: "页面尺寸对话框必须显示毫米",
  },
  {
    text: 'var fontSize = eidFontSizeFor("");',
    message: "默认字号必须使用共享字高换算规则",
  },
  {
    text: "EID_LINE_WIDTH_PX",
    message: "EID 可见描边必须使用 CAD 默认 0.25mm 线宽",
  },
  {
    text: "var strokeWidth = EID_LINE_WIDTH_PX;",
    message: "0.25mm 线宽必须换算成 Draw.io 原生模型单位",
  },
  {
    text: 'shape === "text"',
    message: "纯文本 cell 必须继续保持无边框",
  },
  {
    text: 'strokeColor === "none"',
    message: "隐藏线与 SVG 图元外层必须继续保持无描边",
  },
  {
    text: "mxConstants.STYLE_STROKE_OPACITY",
    message: "strokeOpacity=0 的语义隐藏线不得被恢复",
  },
  {
    text: "keepsAuthoredType(cell)",
    message: "图框和图签必须保留作者字号",
  },
  {
    text: 'explicitStyleValue(style, "fillColor") === "#00b7c3"',
    message: "配电柜母线的细长填充图元必须按黑色线条处理",
  },
]);
addRequiredFragmentsCheck(
  "eid-drawing-standard-install",
  installElectricalSymbolsFile,
  [
    {
      text: "installEidDrawingStandard(ctx);",
      message: "插件启动时必须安装 EID 标准层",
    },
  ],
);
addRegexCheck(
  "eid-standard-keeps-native-model-scale",
  [eidDrawingStandardFile],
  /mxConstants\.(?:PIXELS_PER_MM|PIXELS_PER_INCH|PAGE_FORMAT_A4_PORTRAIT|PAGE_FORMAT_A4_LANDSCAPE)\s*=|(?:mxGraph\.prototype|graph)\.(?:pageFormat|pageScale|gridSize)\s*=|setAttribute\(\s*["'](?:drawingUnit|gridSize|pageScale|pageWidth|pageHeight)["']|(?:get|set)Geometry\(|new\s+mxGeometry\b/,
  "EID 标准层只能改显示单位与样式，不得改换算常量、页面、网格或几何",
);
addRegexCheck(
  "host-export-keeps-native-model-scale",
  [hostBridgeFile],
  /setAttribute\(\s*["']drawingUnit["']/,
  "宿主导出不得将 Draw.io 原生坐标标记为毫米坐标",
);

addRequiredFragmentsCheck("cabinet-snapshot-port-host", snapshotGraphFile, [
  {
    text: "deps.isCabinetBlock(cell)",
    message: "快照必须识别并过滤柜块内部 cell",
  },
  {
    text: "resolveSnapshotObjectId(cabinetSegment)",
    message: "柜块端点必须映射到所属柜段 objectId",
  },
  {
    text: "deps.getSegmentBlocks(segments[i])",
    message: "恢复柜体端点时必须遍历具体柜块",
  },
  {
    text: "deps.isCabinetBlock(root)",
    message: "端口约束恢复必须支持柜块宿主",
  },
]);
addRequiredFragmentsCheck("cabinet-relayout-connected-group", cabinetGraphFile, [
  {
    text: "deps.moveConnectedGroupByDelta(",
    message: "柜块重排必须整体移动开关、电缆和负载连接组",
  },
  {
    text: "movedGroup.vertices",
    message: "柜块重排必须对已整体移动的图元去重",
  },
]);
addRequiredFragmentsCheck(
  "cabinet-connected-group-runtime",
  connectionConstraintsFile,
  [
    {
      text: "export function moveConnectedGroupByDelta(",
      message: "连接约束层必须暴露按位移整体搬移连接组的能力",
    },
    {
      text: "shiftEdgePointsByDelta(groupEdge, delta.x, delta.y)",
      message: "整组搬移必须同步保留组内手工折点",
    },
    {
      text: "if (source != cell)",
      message: "柜块重排必须只沿下游连接搬移，不能穿过双路负载拖走另一回路",
    },
  ],
);
addRequiredFragmentsCheck("cabinet-bound-switch-protection", canvasFeaturesFile, [
  {
    text: "isCabinetBoundSwitchCell(cell)",
    message: "绑定到柜块的开关必须参与画布删除/移动/缩放保护",
  },
  {
    text: "cabinetDomainApi.isSwitchBoundToCabinet(root)",
    message: "画布保护必须以 CabinetModel 绑定为真相",
  },
]);
addRequiredFragmentsCheck("cabinet-managed-link-reconcile", snapshotGraphFile, [
  {
    text: "restoredCabinetLogicalIds[cabinetLogicalId]",
    message: "多页柜快照恢复必须按 logicalCabinetId 去重",
  },
  {
    text: "deps.reconcileCabinetSwitchLinks()",
    message: "快照恢复末尾必须补齐并去重柜块到开关托管线",
  },
]);
addRequiredFragmentsCheck("cabinet-managed-link-api", cabinetApiFile, [
  {
    text: "reconcileCabinetSwitchLinks",
    message: "配电柜公共 API 必须暴露托管线 reconcile",
  },
  {
    text: "isSwitchBoundToCabinet",
    message: "配电柜公共 API 必须暴露开关绑定判定",
  },
]);
addRequiredFragmentsCheck("cabinet-managed-link-style", cabinetCoreFile, [
  {
    text: "eidLayoutManaged=1",
    message: "插件生成的柜块托管线必须使用统一的布局托管标记",
  },
]);
addRegexCheck(
  "app-runtime-only",
  allFiles,
  /\bapp\.(utils|helpers|services|commands|selection|actions|domains|ui|runtime|activateRuntime|constants|graphApi|appContext)\b|\bgetApp\(\)\.(utils|helpers|services|commands|selection|actions|domains|ui|runtime|activateRuntime|constants|graphApi|appContext)\b/,
  "app 上不应再挂普通模块 API",
);
addRegexCheck(
  "ui-no-direct-model-write",
  uiFiles,
  /model\.beginUpdate|graph\.importCells|graph\.removeCells|model\.add\(|model\.remove\(|graph\.insertEdge|graph\.setSelectionCells\(|graph\.setSelectionCell\(/,
  "UI 层不应直接写 graph/model",
);

addRequiredFragmentsCheck("shared-drawing-typography", path.join(rootDir, "domain", "drawingTypography.js"), [
  {text: "EID_LINE_WIDTH_MM = 0.25", message: "保留 CAD 0.25mm 线宽"},
  {text: "EID_LINE_WIDTH_MM * EID_PX_PER_MM", message: "线宽必须从毫米换算"},
  {text: "capHeightMm / EID_CAP_HEIGHT_RATIO", message: "字号必须按字面率换算"},
]);

let hasError = false;

for (const runCheck of checks) {
  const result = runCheck();

  if (result.errors.length === 0) {
    process.stdout.write(`[OK] ${result.name}\n`);
    continue;
  }

  hasError = true;
  process.stderr.write(`[FAIL] ${result.name}\n`);

  for (const error of result.errors) {
    process.stderr.write(`  ${error}\n`);
  }
}

if (hasError) {
  process.exit(1);
}

process.stdout.write("结构校验通过。\n");
