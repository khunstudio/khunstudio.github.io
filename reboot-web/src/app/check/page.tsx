import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckFlow } from "./check-flow";

export const metadata: Metadata = { title: "30초 체크" };

export default function CheckPage() {
  return (
    <Suspense fallback={<div className="wrap-narrow py-14 small">불러오는 중…</div>}>
      <CheckFlow />
    </Suspense>
  );
}
