import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { GUIDES } from "../src/content/guides.ts";
import { TEMPLATES } from "../src/lib/templates.ts";

test("모든 가이드의 대표 이미지 두 크기와 루틴의 가이드 연결이 존재", () => {
  const slugs = new Set(GUIDES.map((g) => g.slug));
  assert.equal(slugs.size, GUIDES.length);
  for (const guide of GUIDES) {
    assert.ok(guide.image, guide.slug);
    for (const suffix of ["", "-sm"]) {
      assert.ok(existsSync(new URL(`../public/images/${guide.image}${suffix}.webp`, import.meta.url)), guide.slug);
    }
  }
  for (const item of TEMPLATES) if (item.guide) assert.ok(slugs.has(item.guide), item.id);
});

test("주요 입문 가이드의 출처·확인일을 제공해도 전문가 검수 상태는 바꾸지 않는다", () => {
  for (const slug of ["skin-basics", "shaving", "outdoor-day"]) {
    const guide = GUIDES.find((g) => g.slug === slug)!;
    assert.ok(guide.sources?.length);
    assert.equal(guide.review, "draft");
    for (const source of guide.sources!) {
      assert.equal(new URL(source.url).protocol, "https:");
      assert.match(source.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
});
