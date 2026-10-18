"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  LayoutDashboard,
  Leaf,
  Monitor,
  Users,
  Radio,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFacility } from "@/components/providers/facility-provider";
import { Status } from "@/components/shared/display";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/residents", label: "人员信息", icon: Users },
  { href: "/alerts", label: "预警监测", icon: Bell },
  { href: "/activities", label: "活动 Dashboard", icon: CalendarDays },
  { href: "/devices", label: "设备 Dashboard", icon: Monitor },
];
function Clock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const update = () => {
      if (!document.hidden)
        setNow(
          new Intl.DateTimeFormat("zh-CN", {
            timeZone: "Asia/Shanghai",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(new Date()),
        );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  return <time className="clock">{now || "颐安 · 智慧养老"}</time>;
}
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data } = useFacility();
  const pending = data.alerts.filter((a) => a.status !== "resolved").length;
  return (
    <TooltipProvider>
      <div className="workspace-shell">
        <aside className="sidebar">
          <Link href="/" className="brand-mark" aria-label="颐安首页">
            <Leaf size={26} />
          </Link>
          <span className="sidebar-divider" />
          <nav aria-label="主导航">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Tooltip key={href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={href}
                      className={`nav-icon ${pathname === href ? "active" : ""}`}
                      aria-current={pathname === href ? "page" : undefined}
                      aria-label={label}
                    />
                  }
                >
                  <Icon size={20} />
                  {href === "/alerts" && pending > 0 && (
                    <i className="nav-dot" />
                  )}
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <span className="operator-avatar" title="值班员 · 演示">
              林
            </span>
          </div>
        </aside>
        <div className="workspace-main">
          <header className="topbar">
            <Link href="/" className="wordmark">
              颐安<span>智慧养老</span>
              <small>综合监测平台</small>
            </Link>
            <div className="topbar-right">
              <Status tone="success">演示系统运行中</Status>
              <Clock />
              <ThemeToggle />
            </div>
          </header>
          <main>{children}</main>
          <footer>
            <span>
              <Radio size={12} /> 所有人员、设备、读数和事件均为模拟数据
            </span>
            <span>
              颐安养老中心 <b>·</b> 让关怀触手可及
            </span>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
