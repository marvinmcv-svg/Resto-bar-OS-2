# Product film (HyperFrames)

`index.html` is a [HyperFrames](https://github.com/heygen-com/hyperframes) composition: HTML + CSS + GSAP, rendered frame by frame to MP4.

1. Capture fresh screens from a running app: `BASE=http://localhost:3000 pnpm video:shots` (writes `public/landing/*.jpg` and copies them here).
2. Render: `pnpm video:render` → `public/landing/demo.mp4` and the poster `public/landing/demo-poster.jpg`.

Needs Node 22+, FFmpeg and a headless Chrome. If Chrome isn't found, set `PRODUCER_HEADLESS_SHELL_PATH` to a `headless_shell` binary (or run `npx hyperframes browser ensure`).
GSAP and Inter are vendored in `assets/` so renders never depend on the network.
