import {build, context} from "esbuild";
import {fileURLToPath} from "node:url";
const options = {
  entryPoints: [fileURLToPath(new URL("../index.js", import.meta.url))],
  bundle: true, format: "iife", platform: "browser", target: "es2018",
  outfile: fileURLToPath(new URL("../../electricalSymbols.js", import.meta.url)),
  banner: {js: "/** Generated file. Edit sources in plugins/electricalSymbols/ instead. Built with npm run build from plugins/electricalSymbols/. */"},
};
if (process.argv.includes("--watch")) { const watcher = await context(options); await watcher.watch(); }
else await build(options);
