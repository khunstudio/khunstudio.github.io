import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-kr/400.css";
import "@fontsource/ibm-plex-sans-kr/500.css";
import "@fontsource/ibm-plex-sans-kr/700.css";
import "@fontsource/chakra-petch/500.css";
import "@fontsource/chakra-petch/600.css";
import "@fontsource/chakra-petch/700.css";
import "./globals.css";
import { BottomNav, Footer, Header } from "@/components/chrome";

export const metadata: Metadata = {
  title: { default: "RE:BOOT — 남자의 자기관리, 다시 켜다", template: "%s · RE:BOOT" },
  description: "피부 · 운동 · 스타일 · 생활 루틴을 30초 체크로 시작하세요. 입대 전부터 전역 후, 일상까지 이어지는 남성 자기관리 서비스. (프로토타입)",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-ink focus:p-3 focus:text-white">본문 바로가기</a>
        <Header />
        <main id="main" className="page">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
