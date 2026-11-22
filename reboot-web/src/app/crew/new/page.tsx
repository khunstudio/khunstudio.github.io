import type { Metadata } from "next";
import { CrewCompose } from "./crew-compose";

export const metadata: Metadata = { title: "CREW 글쓰기", robots: { index: false } };

export default function Page() {
  return <div className="wrap-narrow py-12 md:py-16"><CrewCompose /></div>;
}
