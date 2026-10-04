import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a server-less demo (out/) that can be hosted as static files.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport && {
    output: "export",
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
