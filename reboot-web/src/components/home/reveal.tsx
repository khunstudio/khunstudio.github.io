"use client";

import { useEffect } from "react";

/** [data-rv] 요소가 화면에 들어오면 data-in을 붙인다 (한 번만). CSS가 아래에서 올라오는 등장을 맡는다. */
export function RevealObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rv]"));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      els.forEach((e) => (e.dataset.in = ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { (en.target as HTMLElement).dataset.in = ""; io.unobserve(en.target); }
      }),
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}
