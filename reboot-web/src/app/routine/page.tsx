import type { Metadata } from "next";
import { RoutineView } from "./routine-view";

export const metadata: Metadata = { title: "오늘의 루틴" };

export default function RoutinePage() {
  return <RoutineView />;
}
