/**
 * 从图库创建实例的对话框。
 * 用户在这里选择模板、填写 schema 字段，并生成实例规格插入画布。
 */
// 这里的表单结构完全来自模板 schema，而不是写死字段。
import { getApp } from "../core/appRuntime.js";
import { trim } from "../utils/base.js";
import { showStatus } from "../core/runtimeHelpers.js";
import { commandApi } from "../application/commands.js";
import { specDomainApi } from "../domain/spec.js";
import { libraryStoreApi } from "../services/libraryStore.js";
import { createPluginButton } from "./shared/buttonFactory.js";

function getCreateInstanceDeps() {
  return {
    trim,
    library: libraryStoreApi,
    getLibraryEntrySpec: libraryStoreApi.getLibraryEntrySpec,
    showStatus,
    flattenSchemaFields: specDomainApi.flattenSchemaFields,
    normalizeSchemaType: specDomainApi.normalizeSchemaType,
    setValueByPath: specDomainApi.setValueByPath,
    buildInstanceSpec: specDomainApi.buildInstanceSpec,
    createButton: createPluginButton,
    insertIntoGraph: commandApi.insertIntoGraph,
  };
}

export function openCreateFromLibraryDialog() {
  var deps = arguments.length > 0 && arguments[0] != null && typeof arguments[0] == "object" && !Array.isArray(arguments[0]) && arguments[0].library != null
    ? arguments[0]
    : getCreateInstanceDeps();
  var preferredSymbolId =
    arguments.length > 1 ||
    (arguments.length > 0 &&
      (arguments[0] == null || typeof arguments[0] != "object" || Array.isArray(arguments[0]) || arguments[0].library == null))
      ? arguments[arguments.length > 1 ? 1 : 0]
      : arguments[1];
  var trim = deps.trim;

  deps.library.loadStoredLibrary(function (images) {
    var templates = [];
    var i;

    for (i = 0; i < images.length; i++) {
      try {
        templates.push(deps.getLibraryEntrySpec(images[i]));
      } catch (e) {
        // ignore malformed entry
      }
    }

    if (templates.length == 0) {
      deps.showStatus("电气图库为空，请先保存图元类型", true);
      return;
    }

    var initialIndex = 0;

    if (trim(preferredSymbolId).length > 0) {
      for (i = 0; i < templates.length; i++) {
        if (trim(templates[i].symbolId) == trim(preferredSymbolId)) {
          initialIndex = i;
          break;
        }
      }
    }

    var currentTemplate = templates[initialIndex];
    var div = document.createElement("div");
    div.style.padding = "12px";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.boxSizing = "border-box";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.background = Editor.isDarkMode() ? "#1e1e1e" : "#ffffff";

    var title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    title.innerText = "选择图元类型并填写实例属性";
    div.appendChild(title);

    var select = document.createElement("select");
    select.style.width = "100%";
    select.style.boxSizing = "border-box";
    select.style.marginBottom = "10px";
    div.appendChild(select);

    var sizeRow = document.createElement("div");
    sizeRow.style.display = "flex";
    sizeRow.style.alignItems = "center";
    sizeRow.style.gap = "8px";
    sizeRow.style.marginBottom = "10px";
    div.appendChild(sizeRow);

    var widthLabel = document.createElement("div");
    widthLabel.innerText = "宽";
    sizeRow.appendChild(widthLabel);

    var widthInput = document.createElement("input");
    widthInput.setAttribute("type", "number");
    widthInput.setAttribute("min", "20");
    widthInput.style.width = "120px";
    sizeRow.appendChild(widthInput);

    var heightLabel = document.createElement("div");
    heightLabel.innerText = "高";
    sizeRow.appendChild(heightLabel);

    var heightInput = document.createElement("input");
    heightInput.setAttribute("type", "number");
    heightInput.setAttribute("min", "20");
    heightInput.style.width = "120px";
    sizeRow.appendChild(heightInput);

    var formPanel = document.createElement("div");
    formPanel.style.flex = "1 1 auto";
    formPanel.style.minHeight = "220px";
    formPanel.style.overflow = "auto";
    formPanel.style.display = "flex";
    formPanel.style.flexDirection = "column";
    formPanel.style.gap = "8px";
    div.appendChild(formPanel);

    var formControls = [];

    var buttons = document.createElement("div");
    buttons.style.marginTop = "10px";
    buttons.style.flex = "0 0 auto";
    div.appendChild(buttons);

    function syncTemplate(index) {
      currentTemplate = templates[index];
      widthInput.value = String(currentTemplate.size.width);
      heightInput.value = String(currentTemplate.size.height);
      formPanel.innerHTML = "";
      formControls = [];

      deps.flattenSchemaFields(currentTemplate.schema, "", []).forEach(
        function (field) {
          var block = document.createElement("div");
          block.style.display = "flex";
          block.style.flexDirection = "column";
          block.style.gap = "4px";
          formPanel.appendChild(block);

          var row = document.createElement("div");
          row.style.display = "grid";
          row.style.gridTemplateColumns = "140px 1fr";
          row.style.gap = "8px";
          row.style.alignItems = "center";
          block.appendChild(row);

          var label = document.createElement("div");
          label.innerText = field.path + (field.required ? " *" : "");
          row.appendChild(label);

          var control;
          var type = deps.normalizeSchemaType(field.type);

          if (type == "enum") {
            control = document.createElement("select");
            var emptyOption = document.createElement("option");
            emptyOption.value = "";
            emptyOption.innerText = "请选择";
            control.appendChild(emptyOption);
            field.enumValues.forEach(function (optionValue) {
              var option = document.createElement("option");
              option.value = optionValue;
              option.innerText = optionValue;
              control.appendChild(option);
            });
          } else if (type == "boolean") {
            control = document.createElement("select");
            [
              { value: "", label: "请选择" },
              { value: "true", label: "true" },
              { value: "false", label: "false" },
            ].forEach(function (item) {
              var option = document.createElement("option");
              option.value = item.value;
              option.innerText = item.label;
              control.appendChild(option);
            });
          } else {
            control = document.createElement("input");
            control.setAttribute(
              "type",
              type == "number" ? "number" : "text",
            );
          }

          control.style.width = "100%";
          control.style.boxSizing = "border-box";
          row.appendChild(control);

          var error = document.createElement("div");
          error.style.marginLeft = "148px";
          error.style.minHeight = "16px";
          error.style.fontSize = "12px";
          error.style.color = "#b3261e";
          block.appendChild(error);

          formControls.push({
            field,
            control,
            type,
            error,
          });
        },
      );
    }

    for (i = 0; i < templates.length; i++) {
      var option = document.createElement("option");
      option.value = String(i);
      option.innerText = templates[i].templateName || templates[i].title;
      select.appendChild(option);
    }

    mxEvent.addListener(select, "change", function () {
      syncTemplate(parseInt(select.value, 10) || 0);
    });

    select.value = String(initialIndex);
    syncTemplate(initialIndex);

    var wnd = new mxWindow(
      "创建电气图元",
      div,
      140,
      120,
      460,
      520,
      true,
      true,
    );
    wnd.destroyOnClose = true;
    wnd.setClosable(true);
    wnd.setMaximizable(false);
    wnd.setResizable(true);
    wnd.setScrollable(true);
    wnd.setVisible(true);

    var submitButton = deps.createButton("创建到画布", function () {
      try {
        var payload = {};
        var firstInvalid = null;

        formControls.forEach(function (entry) {
          entry.error.innerText = "";
          entry.control.style.borderColor = "";
          entry.control.style.boxShadow = "";
        });

        formControls.forEach(function (entry) {
          var rawValue = trim(entry.control.value);
          var value = null;

          if (entry.type == "number") {
            value = rawValue.length > 0 ? deps.toFloat(rawValue, null) : null;
          } else if (entry.type == "boolean") {
            value =
              rawValue == "true" ? true : rawValue == "false" ? false : null;
          } else {
            value = rawValue;
          }

          if (
            entry.field.required &&
            (value == null ||
              (typeof value === "string" && value.length == 0))
          ) {
            entry.error.innerText = "必填项";
            entry.control.style.borderColor = "#b3261e";
            entry.control.style.boxShadow = "0 0 0 1px rgba(179,38,30,0.2)";
            firstInvalid = firstInvalid || entry;
            return;
          }

          if (entry.type == "enum" && rawValue.length > 0) {
            if (entry.field.enumValues.indexOf(rawValue) < 0) {
              entry.error.innerText = "必须选择枚举定义中的值";
              entry.control.style.borderColor = "#b3261e";
              entry.control.style.boxShadow =
                "0 0 0 1px rgba(179,38,30,0.2)";
              firstInvalid = firstInvalid || entry;
              return;
            }
          }

          if (
            entry.type == "number" &&
            rawValue.length > 0 &&
            value == null
          ) {
            entry.error.innerText = "请输入有效数字";
            entry.control.style.borderColor = "#b3261e";
            entry.control.style.boxShadow = "0 0 0 1px rgba(179,38,30,0.2)";
            firstInvalid = firstInvalid || entry;
            return;
          }

          deps.setValueByPath(payload, entry.field.path, value);
        });

        if (firstInvalid != null) {
          firstInvalid.control.focus();

          if (typeof firstInvalid.control.scrollIntoView === "function") {
            firstInvalid.control.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }

          deps.showStatus("请先修正表单中的错误字段", true);
          return;
        }

        deps.insertIntoGraph(
          deps.buildInstanceSpec(payload, currentTemplate, {
            width: widthInput.value,
            height: heightInput.value,
          }),
        );
        wnd.destroy();
      } catch (e) {
        deps.showStatus(e.message || String(e), true);
      }
    });
    submitButton.style.marginTop = "0";
    buttons.appendChild(submitButton);
  });
}
