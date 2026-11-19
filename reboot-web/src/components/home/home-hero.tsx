import Link from "next/link";
import { Photo } from "@/components/photo";

export function HomeHero() {
  return (
    <section className="start-hero" aria-labelledby="start-hero-title">
      <div className="wrap start-hero-grid">
        <div className="start-hero-copy">
          <p className="t-k">SELF-CARE IN PROGRESS.</p>
          <h1 id="start-hero-title" className="start-hero-title">
            오늘의 관리,<br />여기서 시작<span className="colon">.</span>
          </h1>
          <p className="start-hero-description">
            군 생활부터 일상까지.<br />
            30초 체크로 나에게 맞는 관리 루틴을 찾고,<br className="start-hero-break" />
            오늘 할 수 있는 것부터 시작해 보세요.
          </p>
          <div className="start-hero-actions">
            <Link href="/start/" className="btn btn-primary">30초 체크 시작</Link>
            <Link href="/care/" className="btn btn-line">가이드 둘러보기</Link>
          </div>
          <p className="start-hero-note">로그인 없이 시작 · 기록은 내 브라우저에만</p>
        </div>

        <div className="start-hero-visual">
          <Photo name="moisture" alt="세면대 앞에서 손바닥에 보습제를 덜어 바를 준비를 하는 모습" sizes="large" priority position="43% 40%" className="start-hero-photo" />
          <div className="start-hero-example" aria-label="추천받을 수 있는 아침 루틴 예시">
            <div className="start-hero-example-heading">
              <p>아침 루틴 예시</p>
              <span>3단계 · 1분 30초</span>
            </div>
            <ol className="start-hero-steps">
              {["세안", "보습", "자외선 차단"].map((step, i) => (
                <li key={step}>
                  <span className="start-hero-step-number" aria-hidden="true">{i + 1}</span>
                  <span className="start-hero-step-title">{step}</span>
                  <span className="start-hero-step-time">30초</span>
                </li>
              ))}
            </ol>
            <p className="start-hero-example-note">내 루틴은 체크 후 직접 바꿀 수 있어요.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
