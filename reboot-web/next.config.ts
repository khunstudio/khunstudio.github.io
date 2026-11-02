import type { NextConfig } from "next";

// 정적 export: Vercel · Cloudflare Pages · GitHub Pages 어디든 out/ 폴더만 올리면 된다.
// 하위 경로에 올릴 때만 NEXT_PUBLIC_BASE_PATH를 지정한다 (예: /reboot).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
