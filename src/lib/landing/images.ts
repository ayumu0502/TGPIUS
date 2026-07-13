export const landingHeroCollage = "/landing/hero-ref-v2.jpg";

export const landingHeroPanels = [
  { id: "basketball", src: "/landing/hero-basketball.jpg", alt: "バスケットボール" },
  { id: "stadium", src: "/landing/hero-stadium.jpg", alt: "スタジアム" },
  { id: "track", src: "/landing/hero-track.jpg", alt: "トラック" },
  { id: "soccer", src: "/landing/hero-soccer.jpg", alt: "サッカー" },
  { id: "volleyball", src: "/landing/hero-volleyball.jpg", alt: "バレーボール" },
  { id: "gym", src: "/landing/hero-gym.jpg", alt: "ジム" },
] as const;

export const landingSupportImages = {
  stadium: "/landing/support-stadium.jpg",
  court: "/landing/support-court.jpg",
  track: "/landing/support-track.jpg",
  pool: "/landing/support-pool.jpg",
} as const;
