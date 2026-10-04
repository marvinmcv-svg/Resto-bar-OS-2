"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? "Usar modo claro" : "Usar modo oscuro"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <Sun className="size-[18px] scale-100 rotate-0 transition-[transform,opacity] duration-300 dark:scale-0 dark:-rotate-90 dark:opacity-0" />
      <Moon className="absolute size-[18px] scale-0 rotate-90 opacity-0 transition-[transform,opacity] duration-300 dark:scale-100 dark:rotate-0 dark:opacity-100" />
    </Button>
  );
}
