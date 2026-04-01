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

const uiFiles = walkJsFiles(path.join(rootDir, "ui"));
const allFiles = walkJsFiles(rootDir);

addRegexCheck(
  "legacy-bundle-refs",
  allFiles,
  /\bcreatePluginBundle\b|\bcreateUiRuntime\b|\bbundle\.ui\b|\bbundle\.runtime\b/,
  "不应回引旧 bundle/createUiRuntime 结构",
);
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
