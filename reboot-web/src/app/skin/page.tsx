import type { Metadata } from "next";
import { SkinTest } from "./skin-test";

export const metadata: Metadata = {
  title: "피부 타입 셀프 체크",
  description: "6문항으로 지성 · 건성 · 복합성 · 중성, 예민 여부를 확인하고 맞는 성분과 제품 종류를 추천받아요.",
};

export default function SkinPage() {
  return <SkinTest />;
}
