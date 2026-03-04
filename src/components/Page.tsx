import type { ReactNode } from "react";

interface PageProps {
  children: ReactNode;
  className?: string;
}

export function Page({ children, className }: PageProps) {
  const cls = className ? `page-container ${className}` : "page-container";
  return <div className={cls}>{children}</div>;
}
