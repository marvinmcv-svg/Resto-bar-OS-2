/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element -- shim drops Next-only props and renders a plain <img> in the panel build */
import type { ImgHTMLAttributes } from "react";
// Generated at build time by demo/build.mjs: { "/menu/x.jpg": "data:image/jpeg;base64,..." }
import PHOTOS from "demo-photos";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

export default function Image({ src, fill, sizes: _s, priority: _p, alt, style, ...rest }: Props) {
  const fillStyle = fill ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%" } : undefined;
  return <img src={PHOTOS[src] ?? src} alt={alt} style={{ ...fillStyle, ...style }} decoding="async" {...rest} />;
}
