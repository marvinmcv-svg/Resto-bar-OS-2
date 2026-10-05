// Builds the single-file side-panel version of the OS: demo/dist/restobar-os.html.
// Reuses the real screens (src/); Next-only modules are shimmed (demo/shims), CSS goes through
// the same Tailwind PostCSS pipeline as the Next app, and menu photos are inlined.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

const photosPlugin = {
  name: "demo-photos",
  setup(b) {
    b.onResolve({ filter: /^demo-photos$/ }, () => ({ path: "demo-photos", namespace: "photos" }));
    b.onLoad({ filter: /.*/, namespace: "photos" }, () => {
      const dir = r("../public/menu");
      const map = Object.fromEntries(
        readdirSync(dir)
          .filter((f) => f.endsWith(".jpg"))
          .map((f) => [`/menu/${f}`, `data:image/jpeg;base64,${readFileSync(`${dir}/${f}`).toString("base64")}`]),
      );
      return { contents: `export default ${JSON.stringify(map)};`, loader: "js" };
    });
  },
};

const js = await build({
  entryPoints: [r("./main.tsx")],
  bundle: true,
  write: false,
  format: "iife",
  minify: true,
  target: "es2020",
  jsx: "automatic",
  tsconfig: r("../tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {
    "next/link": r("./shims/link.tsx"),
    "next/navigation": r("./shims/navigation.ts"),
    "next/image": r("./shims/image.tsx"),
  },
  plugins: [photosPlugin],
  logLevel: "warning",
});

const cssPath = r("./main.css");
const css = await postcss([tailwind({ base: r("../src") })]).process(readFileSync(cssPath, "utf8"), { from: cssPath });

const script = js.outputFiles[0].text.replaceAll("</script", "<\\/script");
const html = `<title>RestoBar OS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${css.css}</style>
<div id="root"></div>
<script>${script}</script>
`;
mkdirSync(r("./dist"), { recursive: true });
writeFileSync(r("./dist/restobar-os.html"), html);
console.log(`demo/dist/restobar-os.html: ${(html.length / 1024 / 1024).toFixed(2)} MB`);
