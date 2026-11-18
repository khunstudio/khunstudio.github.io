// 사진 컴포넌트.
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export type PhotoName = "fogmirror" | "wash" | "hands" | "razor" | "track" | "mirror" | "kit";

export function Photo({
  name, alt, className = "", sizes = "small", priority = false, ratio, position,
}: {
  name: PhotoName;
  alt: string;
  className?: string;
  sizes?: "small" | "large";
  priority?: boolean;
  ratio?: string;
  /** 잘릴 때 남길 위치 (object-position) */
  position?: string;
}) {
  return (
    <figure className={`photo ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      <img
        src={`${base}/images/${name}${sizes === "small" ? "-sm" : ""}.webp`}
        srcSet={`${base}/images/${name}-sm.webp 800w, ${base}/images/${name}.webp 1600w`}
        sizes={sizes === "large" ? "(min-width: 768px) 58vw, 100vw" : "(min-width: 900px) 30vw, 50vw"}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        style={position ? { objectPosition: position } : undefined}
      />
    </figure>
  );
}
