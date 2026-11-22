import type { Metadata } from "next";
import { Suspense } from "react";
import { CrewPost } from "./crew-post";

export const metadata: Metadata = { title: "CREW" };

export default function Page() {
  return <div className="wrap-narrow py-10 md:py-14"><Suspense fallback={<p className="small">불러오는 중…</p>}><CrewPost /></Suspense></div>;
}
