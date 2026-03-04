export function Page({ children, className }: any) {
  const cls = className ? `page-container ${className}` : "page-container";
  return <div className={cls}>{children}</div>;
}
