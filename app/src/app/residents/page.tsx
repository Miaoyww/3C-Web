import { Suspense } from "react";
import { ResidentsPage } from "@/components/residents/residents-page";
export default function Page() {
  return (
    <Suspense fallback={<p>正在读取人员信息…</p>}>
      <ResidentsPage />
    </Suspense>
  );
}
