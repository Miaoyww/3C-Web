"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useReducedMotion } from "motion/react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const subscribe = () => () => {};

export function ThemeToggle() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { resolvedTheme, setTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const theme = mounted && resolvedTheme === "light" ? "light" : "dark";
  const label = theme === "dark" ? "切换至明亮主题" : "切换至深色主题";
  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={setTheme}
      disabled={!mounted}
      duration={reducedMotion ? 0 : 400}
      className="theme-toggle"
      aria-label={label}
      title={label}
    />
  );
}
