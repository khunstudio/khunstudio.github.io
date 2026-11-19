import type { Metadata } from "next";
import { GoalsView } from "./goals-view";

export const metadata: Metadata = {
  title: "GOALS · 버킷리스트",
  description: "입대일 · 전역일 · 목표일까지 남은 기간에 맞춘 추천과 버킷리스트. 구글 캘린더로 바로 보내기.",
};

export default function GoalsPage() {
  return <GoalsView />;
}
