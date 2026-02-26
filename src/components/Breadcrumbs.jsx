export function Breadcrumbs({ items, onNavigate }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <nav className="panel breadcrumb-panel" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
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
                  onClick={(event) => {
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
    </nav>
  );
}
