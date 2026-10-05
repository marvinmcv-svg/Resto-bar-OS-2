// Renders the HyperFrames film in video/ and writes a web-sized MP4 + poster for the landing page.
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const master = join(mkdtempSync(join(tmpdir(), "restobar-film-")), "master.mp4");
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1" } });

run("npx", ["--yes", "hyperframes@0.8.133", "render", "-o", master, "--quality", "looks", "--quiet"], "video");
// Web delivery: H.264, no audio track, fast start, ~3-4 MB for 43 s.
run("ffmpeg", ["-v", "error", "-y", "-i", master, "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p",
  "-movflags", "+faststart", "-an", "public/landing/demo.mp4"]);
run("ffmpeg", ["-v", "error", "-y", "-ss", "33.5", "-i", "public/landing/demo.mp4", "-frames:v", "1", "-vf", "scale=1600:-1",
  "-q:v", "4", "public/landing/demo-poster.jpg"]);
console.log("Wrote public/landing/demo.mp4 and demo-poster.jpg");
