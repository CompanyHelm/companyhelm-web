import { usePageActions } from "./PageActionsContext.tsx";

export function Breadcrumbs({ items, onNavigate }: any) {
  const pageActionsCtx = usePageActions();
  const actions = pageActionsCtx?.actions || null;

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const pageTitle = String(items[items.length - 1]?.label || "").trim();

  return (
    <nav className="panel breadcrumb-panel" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item: any, index: any) => {
          const isLast = index === items.length - 1;
          const label = String(item?.label || "").trim();
          const href = String(item?.href || "").trim();
          const key = `${label || "crumb"}-${index}`;

          return (
            <li key={key} className="breadcrumb-item">
              {href ? (
                <a
                  className="breadcrumb-link"
                  href={href}
                  onClick={(event: any) => {
                    if (!onNavigate) {
                      return;
                    }
                    event.preventDefault();
                    onNavigate(href);
                  }}
                >
                  {label || "Untitled"}
                </a>
              ) : (
                <span className={isLast ? "breadcrumb-current" : "breadcrumb-text"}>
                  {label || "Untitled"}
                </span>
              )}
              {!isLast ? <span className="breadcrumb-separator">/</span> : null}
            </li>
          );
        })}
      </ol>
      {pageTitle ? (
        <div className="breadcrumb-title-row">
          <h1 className="breadcrumb-page-title">{pageTitle}</h1>
          {actions ? <div className="breadcrumb-page-actions">{actions}</div> : null}
        </div>
      ) : null}
    </nav>
  );
}
