import Link from "next/link";
import LandingHeroVisual from "./LandingHeroVisual";

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

export default function LandingHero() {
  return (
    <section className="lp-hero lp-hero--v2">
      <div className="lp-hero__layout">
        <div className="lp-hero__left">
          <h1 className="lp-hero__title ja-heading">
            応援が、
            <br />
            <span className="lp-hero__accent">チカラ</span>になる。
          </h1>

          <p className="lp-hero__subtitle ja-body">
            TGPLUSは、アスリートとファン、そしてスポンサーをつなぐ
            <br className="hidden sm:block" />
            次世代のスポーツ応援プラットフォームです。
          </p>

          <div className="lp-hero__actions">
            <Link href="/register" className="landing-btn-primary landing-btn-primary--hero group">
              今すぐ応援を始める
              <ArrowIcon />
            </Link>
            <a href="#features" className="lp-hero__link">
              TGPLUSについて詳しく見る
              <ArrowIcon />
            </a>
          </div>
        </div>

        <div className="lp-hero__right">
          <LandingHeroVisual />
        </div>
      </div>
    </section>
  );
}
