/**
 * E&iD 制图字体标准，与 React 侧 `lib/eid-elements/drawing-typography.ts` 同源。
 *
 * 客户图纸（出图示例.dxf）全图只有两个字号：拉丁 2.5 mm、中文 2.0 mm，
 * 字体是 Arial Narrow（CAD 里的 CMSR-E / CMSR-C）。这里记的是 **字高**，
 * 也就是 CAD 量文字的方式；CSS 的 font-size 量的是字身框，所以要除以字面率
 * 再换算。少了这一步，出图的字会小三分之一。
 *
 * 编辑器与图纸同为 4 px/mm，所以这里设成多少毫米，图纸上就是多少毫米。
 */
export var EID_DRAWING_FONT_FAMILY =
  "ISOCPEUR,ISOCP,Arial Narrow,PingFang SC,Noto Sans SC";

export var EID_CAP_HEIGHT_RATIO = 0.716;
export var EID_PX_PER_MM = 4;

export var EID_TEXT_HEIGHT_MM = 2.5;
export var EID_TEXT_HEIGHT_CJK_MM = 2.0;
export var EID_LINE_WIDTH_MM = 0.25;

export function eidFontSizePx(capHeightMm) {
  return (
    Math.round((capHeightMm / EID_CAP_HEIGHT_RATIO) * EID_PX_PER_MM * 100) / 100
  );
}

export var EID_TEXT_SIZE_PX = eidFontSizePx(EID_TEXT_HEIGHT_MM);
export var EID_TEXT_SIZE_CJK_PX = eidFontSizePx(EID_TEXT_HEIGHT_CJK_MM);
export var EID_LINE_WIDTH_PX = EID_LINE_WIDTH_MM * EID_PX_PER_MM;

var CJK = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/;

/** 客户图纸给中文用小一号字，所以字号跟着内容走。 */
export function eidFontSizeFor(text) {
  return CJK.test(String(text || "")) ? EID_TEXT_SIZE_CJK_PX : EID_TEXT_SIZE_PX;
}
