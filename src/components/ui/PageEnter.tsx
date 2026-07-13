"use client";

import type { ReactNode } from "react";

type PageEnterProps = {
  children: ReactNode;
  className?: string;
};

export default function PageEnter({ children, className = "" }: PageEnterProps) {
  return <div className={`page-enter ${className}`}>{children}</div>;
}
