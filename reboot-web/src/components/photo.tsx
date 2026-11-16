// 사진 컴포넌트. 지금 쓰는 사진은 모두 AI로 생성한 이미지라서 항상 표시를 붙인다 (BRAND.md · Photography).
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export type PhotoName = "wash" | "hands" | "razor" | "track" | "mirror" | "kit";

export function Photo({
  name, alt, className = "", sizes = "small", priority = false, ratio,
}: { name: PhotoName; alt: string; className?: string; sizes?: "small" | "large"; priority?: boolean; ratio?: string }) {
  return (
    <figure className={`photo ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      <img
        src={`${base}/images/${name}${sizes === "small" ? "-sm" : ""}.webp`}
        srcSet={`${base}/images/${name}-sm.webp 800w, ${base}/images/${name}.webp 1600w`}
        sizes={sizes === "large" ? "(min-width: 900px) 55vw, 100vw" : "(min-width: 900px) 30vw, 50vw"}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
      <span className="ai-tag">AI 생성 이미지</span>
    </figure>
  );
}
