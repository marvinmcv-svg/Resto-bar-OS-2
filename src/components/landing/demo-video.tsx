"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/** Muted, looping product film. Paused for people who ask for reduced motion; always controllable. */
export function DemoVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => {});
    else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="relative">
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        className="block aspect-video w-full bg-black object-cover"
      />
      <button
        onClick={toggle}
        className="press glass absolute right-4 bottom-4 flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold"
        aria-label={playing ? "Pausar video" : "Reproducir video"}
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        {playing ? "Pausar" : "Ver demo"}
      </button>
    </div>
  );
}
