import type { Metadata } from "next";
import { MyView } from "./my-view";

export const metadata: Metadata = { title: "MY RE:BOOT" };

export default function MyPage() {
  return <MyView />;
}
