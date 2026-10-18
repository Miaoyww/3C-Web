import { Suspense } from "react";
import { DevicesPage } from "@/components/devices/devices-page";
export default function Page() {
  return (
    <Suspense fallback={<p>正在读取设备信息…</p>}>
      <DevicesPage />
    </Suspense>
  );
}
