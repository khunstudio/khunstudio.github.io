import type { Metadata } from "next";
import { ResultView } from "./result-view";

export const metadata: Metadata = { title: "체크 결과" };

export default function ResultPage() {
  return <ResultView />;
}
