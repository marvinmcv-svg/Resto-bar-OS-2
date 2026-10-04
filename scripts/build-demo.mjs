// Builds the server-less demo (out/) used for shareable previews.
// Static hosts that reserve "_"-prefixed paths can't serve Next's "_next/" folder,
// so it is renamed to "next-static/" and every reference is rewritten.
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
rmSync(OUT, { recursive: true, force: true });
execSync("pnpm build", { stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "1" } });
renameSync(join(OUT, "_next"), join(OUT, "next-static"));
rmSync(join(OUT, "menu", "CREDITS.md"), { force: true });

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

let rewritten = 0;
for (const file of walk(OUT)) {
  if (!/\.(html|txt|js|css)$/.test(file)) continue;
  const src = readFileSync(file, "utf8");
  // Some hosts reject a literal U+FFFD; in JS strings the escape is equivalent.
  let next = src.replaceAll("/_next/", "/next-static/");
  if (file.endsWith(".js")) next = next.replaceAll("\uFFFD", "\\uFFFD");
  if (next !== src) {
    writeFileSync(file, next);
    rewritten++;
  }
}
console.log(`Demo built in ${OUT}/ (${rewritten} files rewritten)`);
