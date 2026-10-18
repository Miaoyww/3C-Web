import { Suspense } from "react";
import { AlertsPage } from "@/components/alerts/alerts-page";
export default function Page() {
  return (
    <Suspense fallback={<p>正在读取预警信息…</p>}>
      <AlertsPage />
    </Suspense>
  );
}
