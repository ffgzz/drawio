/**
 * 后端相关对话框。
 * 负责保存、加载、回滚三个面向用户的窗口，不直接承担后端通信细节。
 */
// 这里主要做表单与按钮布局，实际请求都走 backend service。
import { getApp } from "../core/appRuntime.js";
import { isObject, toInt, trim } from "../utils/base.js";
import { showStatus } from "../core/runtimeHelpers.js";
import { backendServiceApi } from "../services/backend.js";
import { createPluginButton } from "./shared/buttonFactory.js";

function buildBackendDialogDeps() {
  var app = getApp();

  return {
    ctx: app.ctx,
    backend: backendServiceApi,
    trim,
    showStatus,
    createButton: createPluginButton,
    isObject,
    toInt,
  };
}

function getBackendDialogDeps() {
  return buildBackendDialogDeps();
}

function createLabeledInputRow(container, labelText, input) {
  var row = document.createElement("div");
  row.style.display = "grid";
  row.style.gridTemplateColumns = "100px 1fr";
  row.style.alignItems = "center";
  row.style.gap = "8px";
  row.style.marginBottom = "8px";
  container.appendChild(row);

  var label = document.createElement("div");
  label.innerText = labelText;
  row.appendChild(label);

  input.style.width = "100%";
  input.style.boxSizing = "border-box";
  row.appendChild(input);
}

export async function openBackendSaveDialog() {
  var deps = getBackendDialogDeps();
  var ctx = deps.ctx;
  var state = ctx.state;
  var trim = deps.trim;

  if (trim(state.backendDiagramId).length > 0) {
    try {
      await deps.backend.saveDiagramToBackend(state.backendDiagramTitle || "未命名图纸");
    } catch (e) {
      var payload = e.payload || {};

      if (
        payload != null &&
        payload.latestVersion != null &&
        Array.isArray(payload.conflictingObjectIds)
      ) {
        deps.showStatus(
          "保存冲突，最新版本：" +
            payload.latestVersion +
            "，冲突对象：" +
            payload.conflictingObjectIds.join(", "),
          true,
        );
      } else {
        deps.showStatus(e.message || String(e), true);
      }
    }

    return;
  }

  var div = document.createElement("div");
  div.style.padding = "12px";
  div.style.width = "100%";
  div.style.height = "100%";
  div.style.boxSizing = "border-box";
  div.style.display = "flex";
  div.style.flexDirection = "column";

  var title = document.createElement("div");
  title.style.fontWeight = "bold";
  title.style.marginBottom = "8px";
  title.innerText = "保存当前图纸到后端";
  div.appendChild(title);

  var titleInput = document.createElement("input");
  titleInput.value = state.backendDiagramTitle || "未命名图纸";
  createLabeledInputRow(div, "图纸标题", titleInput);

  var note = document.createElement("div");
  note.style.fontSize = "12px";
  note.style.color = "#666";
  note.style.marginBottom = "10px";
  note.innerText = "首次保存会在后端创建一张新图，后续保存将直接覆盖到同一图纸版本链。";
  div.appendChild(note);

  var buttons = document.createElement("div");
  div.appendChild(buttons);

  var wnd = new mxWindow("保存到后端", div, 180, 120, 440, 190, true, true);
  wnd.destroyOnClose = true;
  wnd.setClosable(true);
  wnd.setMaximizable(false);
  wnd.setResizable(true);
  wnd.setScrollable(true);

  var saveButton = deps.createButton("保存", async function () {
    try {
      state.backendDiagramTitle = trim(titleInput.value) || "未命名图纸";
      deps.backend.saveBackendSession();
      await deps.backend.saveDiagramToBackend(state.backendDiagramTitle);
      wnd.destroy();
    } catch (e) {
      var payload = e.payload || {};

      if (
        payload != null &&
        payload.latestVersion != null &&
        Array.isArray(payload.conflictingObjectIds)
      ) {
        deps.showStatus(
          "保存冲突，最新版本：" +
            payload.latestVersion +
            "，冲突对象：" +
            payload.conflictingObjectIds.join(", "),
          true,
        );
      } else {
        deps.showStatus(e.message || String(e), true);
      }
    }
  });
  saveButton.style.marginTop = "0";
  buttons.appendChild(saveButton);

  wnd.setVisible(true);
}

export async function openBackendLoadDialog() {
  var deps = getBackendDialogDeps();
  var ctx = deps.ctx;
  var state = ctx.state;
  var trim = deps.trim;

  if (trim(state.backendDiagramId).length > 0) {
    try {
      await deps.backend.loadDiagramFromBackend(state.backendDiagramId);
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
    }

    return;
  }

  var div = document.createElement("div");
  div.style.padding = "12px";
  div.style.width = "100%";
  div.style.height = "100%";
  div.style.boxSizing = "border-box";
  div.style.display = "flex";
  div.style.flexDirection = "column";

  var title = document.createElement("div");
  title.style.fontWeight = "bold";
  title.style.marginBottom = "8px";
  title.innerText = "选择要加载的图纸";
  div.appendChild(title);

  var select = document.createElement("select");
  select.style.width = "100%";
  select.style.boxSizing = "border-box";
  select.style.marginBottom = "10px";
  div.appendChild(select);

  var note = document.createElement("div");
  note.style.fontSize = "12px";
  note.style.color = "#666";
  note.style.marginBottom = "10px";
  note.innerText = "加载会先清空当前页面，再按后端快照完整恢复。";
  div.appendChild(note);

  var buttons = document.createElement("div");
  div.appendChild(buttons);

  var wnd = new mxWindow("从后端加载", div, 220, 140, 520, 220, true, true);
  wnd.destroyOnClose = true;
  wnd.setClosable(true);
  wnd.setMaximizable(false);
  wnd.setResizable(true);
  wnd.setScrollable(true);

  var loadButton = deps.createButton("加载", async function () {
    try {
      var diagramId =
        select.options.length > 0 ? select.options[select.selectedIndex].value : "";
      var titleText =
        select.options.length > 0
          ? trim(select.options[select.selectedIndex].getAttribute("data-title")) ||
            select.options[select.selectedIndex].innerText
          : "";
      await deps.backend.loadDiagramFromBackend(diagramId);
      state.backendDiagramTitle = titleText;
      deps.backend.saveBackendSession();
      wnd.destroy();
    } catch (e) {
      deps.showStatus(e.message || String(e), true);
    }
  });
  loadButton.style.marginTop = "0";
  buttons.appendChild(loadButton);

  var refreshButton = deps.createButton("刷新列表", function () {
    select.innerHTML = "";
    note.innerText = "正在从后端读取图纸列表...";
    deps.backend
      .listDiagramsFromBackend()
      .then(function (payload) {
        var diagrams = Array.isArray(payload.diagrams) ? payload.diagrams : [];

        diagrams.forEach(function (diagram) {
          var option = document.createElement("option");
          option.value = diagram.diagramId;
          var titleText = trim(diagram.title) || "图纸 " + diagram.diagramId.slice(0, 8);
          option.innerText =
            titleText +
            " | v" +
            diagram.latestVersion +
            (diagram.updatedAt != null
              ? " | " + String(diagram.updatedAt).replace("T", " ").slice(0, 19)
              : "");
          option.setAttribute("data-title", titleText);

          if (trim(state.backendDiagramId) == trim(diagram.diagramId)) {
            option.selected = true;
          }

          select.appendChild(option);
        });

        note.innerText =
          diagrams.length == 0 ? "后端还没有可加载的图纸。" : "请选择一张图纸进行加载。";
      })
      .catch(function (error) {
        note.innerText = "读取图纸列表失败";
        deps.showStatus(error.message || String(error), true);
      });
  });
  refreshButton.style.marginTop = "0";
  refreshButton.style.marginLeft = "8px";
  buttons.appendChild(refreshButton);

  wnd.setVisible(true);
  refreshButton.click();
}

export async function openBackendRollbackDialog() {
  var deps = getBackendDialogDeps();
  var ctx = deps.ctx;
  var state = ctx.state;
  var trim = deps.trim;
  var diagramId = trim(state.backendDiagramId);

  if (diagramId.length == 0) {
    deps.showStatus("请先保存图纸到后端，再执行版本回滚", true);
    return;
  }

  var div = document.createElement("div");
  div.style.padding = "12px";
  div.style.width = "100%";
  div.style.height = "100%";
  div.style.boxSizing = "border-box";
  div.style.display = "flex";
  div.style.flexDirection = "column";

  var title = document.createElement("div");
  title.style.fontWeight = "bold";
  title.style.marginBottom = "8px";
  title.innerText = "版本回滚";
  div.appendChild(title);

  var note = document.createElement("div");
  note.style.fontSize = "12px";
  note.style.color = "#666";
  note.style.marginBottom = "10px";
  note.innerText = "请选择一个历史版本进行回滚，回滚会生成一个新的版本。";
  div.appendChild(note);

  var list = document.createElement("div");
  list.style.flex = "1 1 auto";
  list.style.overflow = "auto";
  list.style.border = "1px solid #ddd";
  list.style.padding = "8px";
  list.style.background = Editor.isDarkMode() ? "#2b2b2b" : "#fff";
  div.appendChild(list);

  var wnd = new mxWindow("版本回滚", div, 240, 160, 560, 420, true, true);
  wnd.destroyOnClose = true;
  wnd.setClosable(true);
  wnd.setMaximizable(false);
  wnd.setResizable(true);
  wnd.setScrollable(true);

  function renderHistory(payload) {
    list.innerHTML = "";

    var commits = payload != null && Array.isArray(payload.commits) ? payload.commits.slice() : [];
    var versionItems = [
      {
        version: 0,
        actorId: "",
        commitType: "initial",
        createdAt: "",
        rollbackTargetVersion: null,
      },
    ].concat(
      commits.map(function (commit) {
        var rollbackTargetVersion = null;

        if (trim(commit.commitType) === "rollback" && Array.isArray(commit.changes)) {
          for (var changeIndex = 0; changeIndex < commit.changes.length; changeIndex++) {
            var change = commit.changes[changeIndex];

            if (
              change != null &&
              change.objectId === "__rollback__" &&
              deps.isObject(change.after) &&
              change.after.version != null
            ) {
              rollbackTargetVersion = Math.max(0, deps.toInt(change.after.version, 0));
              break;
            }
          }
        }

        return {
          version: Math.max(0, deps.toInt(commit.resultVersion, 0)),
          actorId: trim(commit.actorId),
          commitType: trim(commit.commitType) || "normal",
          createdAt: trim(commit.createdAt),
          rollbackTargetVersion,
        };
      }),
    );

    versionItems.sort(function (a, b) {
      return b.version - a.version;
    });

    if (versionItems.length == 0) {
      var empty = document.createElement("div");
      empty.style.color = "#666";
      empty.innerText = "暂无可回滚的版本历史。";
      list.appendChild(empty);
      return;
    }

    versionItems.forEach(function (item) {
      var row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.gap = "12px";
      row.style.padding = "8px 0";
      row.style.borderBottom = "1px solid #eee";
      list.appendChild(row);

      var meta = document.createElement("div");
      meta.style.flex = "1 1 auto";
      row.appendChild(meta);

      var versionText = document.createElement("div");
      versionText.style.fontWeight = "bold";
      versionText.innerText =
        "v" + String(item.version) + (item.version === state.backendDiagramVersion ? "（当前）" : "");
      meta.appendChild(versionText);

      var detail = document.createElement("div");
      detail.style.fontSize = "12px";
      detail.style.color = "#666";
      detail.innerText =
        (item.commitType === "rollback"
          ? "回滚提交" +
            (item.rollbackTargetVersion != null
              ? "（回滚到 v" + String(item.rollbackTargetVersion) + "）"
              : "")
          : item.commitType === "initial"
            ? "初始版本"
            : "普通提交") +
        (item.actorId.length > 0 ? " | " + item.actorId : "") +
        (item.createdAt.length > 0
          ? " | " + item.createdAt.replace("T", " ").slice(0, 19)
          : "");
      meta.appendChild(detail);

      var rollbackButton = deps.createButton("回滚到此版本", async function () {
        if (
          !mxUtils.confirm(
            "确定回滚到版本 v" + String(item.version) + " 吗？当前画布内容会被该版本覆盖。",
          )
        ) {
          return;
        }

        try {
          await deps.backend.rollbackDiagramToVersion(item.version);
          wnd.destroy();
        } catch (e) {
          deps.showStatus(e.message || String(e), true);
        }
      });
      rollbackButton.style.marginTop = "0";
      rollbackButton.disabled = item.version === state.backendDiagramVersion;
      row.appendChild(rollbackButton);
    });
  }

  wnd.setVisible(true);
  list.innerText = "正在读取版本历史...";

  try {
    renderHistory(await deps.backend.getDiagramHistoryFromBackend(diagramId));
  } catch (e) {
    list.innerText = "读取版本历史失败";
    deps.showStatus(e.message || String(e), true);
  }
}

export var backendDialogsApi = {
  openBackendLoadDialog,
  openBackendRollbackDialog,
  openBackendSaveDialog,
};
