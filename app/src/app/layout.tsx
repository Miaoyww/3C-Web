import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { FacilityProvider } from "@/components/providers/facility-provider";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";
import "@/styles/workspace.css";
export const metadata: Metadata = {
  title: "颐安 · 智慧养老综合监测平台",
  description: "银发经济主题 · 养老院智能监测大屏，模拟数据演示。",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className="dark h-full antialiased"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <FacilityProvider>
            <AppShell>{children}</AppShell>
          </FacilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
