import type { Metadata } from "next";
import { AccountLogin } from "@/components/account-login";

// 로그인 후 돌아오는 주소(Supabase에 등록됨). 화면은 /login/과 같다.
export const metadata: Metadata = { title: "로그인", robots: { index: false } };

export default function Page() {
  return <div className="wrap-narrow py-12 md:py-16"><AccountLogin /></div>;
}
