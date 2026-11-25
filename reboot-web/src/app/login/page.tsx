import type { Metadata } from "next";
import { AccountLogin } from "@/components/account-login";

export const metadata: Metadata = { title: "로그인", robots: { index: false } };

export default function Page() {
  return <div className="wrap-narrow py-12 md:py-16"><AccountLogin /></div>;
}
