"use client";

import Image from "next/image";
import { useState } from "react";
import { landingHeroCollage } from "@/lib/landing/images";

const slides = [landingHeroCollage, landingHeroCollage, landingHeroCollage];

export default function LandingHeroVisual() {
  const [active, setActive] = useState(0);

  return (
    <div className="lp-visual lp-visual--v2" aria-hidden="true">
      <div className="lp-visual__frame">
        <div className="lp-visual__zmask">
          {slides.map((src, i) => (
            <Image
              key={src + i}
              src={src}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 1280px) 880px, (min-width: 1024px) 56vw, 100vw"
              className={`lp-visual__composite object-cover object-center transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <div className="lp-visual__diagonal" aria-hidden="true" />
          <div className="lp-slash lp-slash--1" aria-hidden="true" />
          <div className="lp-slash lp-slash--2" aria-hidden="true" />
          <div className="lp-slash lp-slash--3" aria-hidden="true" />
          <div className="lp-slash lp-slash--4" aria-hidden="true" />
          <div className="lp-spark lp-spark--1" aria-hidden="true" />
          <div className="lp-spark lp-spark--2" aria-hidden="true" />
          <div className="lp-spark lp-spark--3" aria-hidden="true" />
        </div>
      </div>

      <div className="lp-hero__dots">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`lp-hero__dot ${i === active ? "is-active" : ""}`}
            aria-label={`スライド ${i + 1}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}
