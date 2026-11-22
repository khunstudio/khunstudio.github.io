import type { Metadata } from "next";
import { CrewLogin } from "./crew-login";

export const metadata: Metadata = { title: "CREW 로그인", robots: { index: false } };

export default function Page() {
  return <div className="wrap-narrow py-12 md:py-16"><CrewLogin /></div>;
}
