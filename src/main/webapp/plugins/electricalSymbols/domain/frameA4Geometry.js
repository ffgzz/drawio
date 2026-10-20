/**
 * A4 图框几何 —— 自动生成，请勿手改。
 *
 * 来源：eid_frame_template.dxf 中的块 'Drawing Frame A4_P'（取自客户参考图纸
 * data/出图示例.dwg）。重新生成：
 *   cd python-backend && uv run python scripts/generate_frame_svg.py
 *
 * viewBox 就是以毫米为单位的图幅，所以插件画布与导出的 DWG 是同一套几何。
 * 共 42 个图元。
 */

/** 画布像素 / 图纸毫米。取整数，px→mm 不产生舍入。 */
export var PX_PER_MM = 4;

export var A4_PORTRAIT_MM = { width: 210, height: 297 };

/** 图幅内框（毫米），即可用绘图区。 */
export var A4_INNER_BORDER_MM = { left: 10, bottom: 10, right: 200, top: 287 };

export var FRAME_A4_WIDTH_PX = A4_PORTRAIT_MM.width * PX_PER_MM;
export var FRAME_A4_HEIGHT_PX = A4_PORTRAIT_MM.height * PX_PER_MM;

export var FRAME_A4_PORTRAIT_SVG =
  "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 210 297\" width=\"210mm\" height=\"297mm\"><path d=\"M 10.0 297.0 L 0.0 297.0 L 0.0 287.0 M 5.0 148.5 L 10.0 148.5 M 10.0 240.5 L 5.0 240.5 M 10.0 194.5 L 5.0 194.5 M 105.0 292.0 L 105.0 287.0 M 10.0 102.5 L 5.0 102.5 M 10.0 56.5 L 5.0 56.5 M 10.0 0.0 L 0.0 0.0 L 0.0 10.0 M 57.5 10.0 L 57.5 5.0 M 210.0 15.0 L 210.0 5.0 M 210.0 287.0 L 210.0 297.0 L 200.0 297.0 M 200.0 148.5 L 205.0 148.5 M 205.0 240.5 L 200.0 240.5 M 205.0 194.5 L 200.0 194.5 M 205.0 102.5 L 200.0 102.5 M 205.0 56.5 L 200.0 56.5 M 210.0 10.0 L 210.0 0.0 L 200.0 0.0 M 152.5 10.0 L 152.5 5.0 M 57.5 287.0 L 57.5 292.0 M 152.5 287.0 L 152.5 292.0 M 105.0 5.0 L 105.0 10.0\" fill=\"none\" stroke=\"#111111\" stroke-width=\"0.25\" stroke-linecap=\"square\" stroke-linejoin=\"miter\"/><path d=\"M 200.0 10.0 L 10.0 10.0 L 10.0 287.0 L 200.0 287.0 Z\" fill=\"none\" stroke=\"#111111\" stroke-width=\"0.5\" stroke-linecap=\"square\" stroke-linejoin=\"miter\"/><g fill=\"#111111\" font-family=\"ARIALN, Arial Narrow, Arial, sans-serif\"><text x=\"7.5\" y=\"263.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">F</text><text x=\"7.5\" y=\"217.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">E</text><text x=\"7.5\" y=\"171.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">D</text><text x=\"7.5\" y=\"125.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">C</text><text x=\"7.5\" y=\"79.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">B</text><text x=\"7.5\" y=\"33.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">A</text><text x=\"33.75\" y=\"7.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">1</text><text x=\"202.5\" y=\"263.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">F</text><text x=\"202.5\" y=\"217.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">E</text><text x=\"202.5\" y=\"171.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">D</text><text x=\"202.5\" y=\"125.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">C</text><text x=\"202.5\" y=\"79.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">B</text><text x=\"202.5\" y=\"33.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">A</text><text x=\"81.25\" y=\"7.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">2</text><text x=\"128.75\" y=\"7.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">3</text><text x=\"176.25\" y=\"7.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">4</text><text x=\"33.75\" y=\"289.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">1</text><text x=\"81.25\" y=\"289.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">2</text><text x=\"128.75\" y=\"289.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">3</text><text x=\"176.25\" y=\"289.5\" font-size=\"3.0\" text-anchor=\"middle\" dominant-baseline=\"central\">4</text></g></svg>";
