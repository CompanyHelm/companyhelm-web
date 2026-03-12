import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { formatTimestamp } from "../utils/formatting.ts";

const LIMIT_OPTIONS = [25, 50, 100, 200];

function renderCellValue(columnKey: string, value: string | null) {
  if (value == null || value === "") {
    return <span className="admin-table-null">null</span>;
  }

  if (/_at$/i.test(columnKey)) {
    return formatTimestamp(value);
  }

  if (value.length > 180) {
    return (
      <span className="admin-table-cell-value" title={value}>
        {value.slice(0, 177)}
        ...
      </span>
    );
  }

  return (
    <span className="admin-table-cell-value" title={value}>
      {value}
    </span>
  );
}

interface AdminPageProps {
  adminTables: any[];
  adminTableData: any;
  activeTableName: string;
  isLoadingAdminTables: boolean;
  isLoadingAdminTable: boolean;
  adminError: string;
  limit: number;
  status: string;
  search: string;
  onApplyFilters: (nextFilters: { limit: number; status: string; search: string }) => void;
  onResetFilters: () => void;
  onOpenTable: (tableName: string) => void;
}

export function AdminPage({
  adminTables,
  adminTableData,
  activeTableName,
  isLoadingAdminTables,
  isLoadingAdminTable,
  adminError,
  limit,
  status,
  search,
  onApplyFilters,
  onResetFilters,
  onOpenTable,
}: AdminPageProps) {
  const [draftLimit, setDraftLimit] = useState<number>(limit);
  const [draftStatus, setDraftStatus] = useState<string>(status);
  const [draftSearch, setDraftSearch] = useState<string>(search);

  useEffect(() => {
    setDraftLimit(limit);
  }, [limit]);

  useEffect(() => {
    setDraftStatus(status);
  }, [status]);

  useEffect(() => {
    setDraftSearch(search);
  }, [search]);

  const featuredTables = useMemo(
    () => adminTables.filter((table) => table?.featured),
    [adminTables],
  );
  const secondaryTables = useMemo(
    () => adminTables.filter((table) => !table?.featured),
    [adminTables],
  );
  const tableCountLabel = useMemo(() => {
    if (!Array.isArray(adminTables) || adminTables.length === 0) {
      return "No tables";
    }
    if (adminTables.length === 1) {
      return "1 table";
    }
    return `${adminTables.length} tables`;
  }, [adminTables]);

  const pageActions = useMemo(() => (
    <>
      <span className="chat-card-meta">{tableCountLabel}</span>
      {activeTableName ? <span className="chat-card-meta">/{activeTableName}</span> : null}
    </>
  ), [activeTableName, tableCountLabel]);
  useSetPageActions(pageActions);

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApplyFilters({
      limit: draftLimit,
      status: draftStatus,
      search: draftSearch,
    });
  }

  return (
    <Page className="page-container-full"><div className="page-stack admin-page-stack">
      <section className="dashboard-grid">
        <article className="panel stat-panel">
          <p className="stat-label">Current table</p>
          <p className="stat-value admin-stat-value">{adminTableData?.label || "Admin"}</p>
          <p className="stat-footnote">{activeTableName || "runner_requests"}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Visible rows</p>
          <p className="stat-value">{Array.isArray(adminTableData?.rows) ? adminTableData.rows.length : 0}</p>
          <p className="stat-footnote">current filter window</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Total rows</p>
          <p className="stat-value">{Number(adminTableData?.totalCount || 0)}</p>
          <p className="stat-footnote">company scoped</p>
        </article>
      </section>

      <section className="admin-layout">
        <aside className="panel list-panel admin-catalog-panel">
          <div className="admin-catalog-section">
            <p className="admin-catalog-heading">Runner views</p>
            {featuredTables.map((table) => (
              <button
                key={table.name}
                type="button"
                className={`admin-catalog-btn${activeTableName === table.name ? " admin-catalog-btn-active" : ""}`}
                onClick={() => onOpenTable(table.name)}
              >
                <strong>{table.label}</strong>
                {table.description ? <span>{table.description}</span> : null}
              </button>
            ))}
          </div>

          <div className="admin-catalog-section">
            <p className="admin-catalog-heading">All company tables</p>
            {isLoadingAdminTables ? <p className="empty-hint">Loading table catalog...</p> : null}
            {secondaryTables.map((table) => (
              <button
                key={table.name}
                type="button"
                className={`admin-catalog-btn${activeTableName === table.name ? " admin-catalog-btn-active" : ""}`}
                onClick={() => onOpenTable(table.name)}
              >
                <strong>{table.label}</strong>
                <span>{table.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="admin-main-column">
          <section className="panel list-panel admin-filters-panel">
            <form className="admin-filter-form" onSubmit={handleApplyFilters}>
              <label className="admin-filter-field">
                <span>Limit</span>
                <select
                  value={draftLimit}
                  onChange={(event) => setDraftLimit(Number.parseInt(event.target.value, 10) || 50)}
                >
                  {LIMIT_OPTIONS.map((limitOption) => (
                    <option key={limitOption} value={limitOption}>
                      {limitOption}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-filter-field">
                <span>Status</span>
                <select
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value)}
                  disabled={!adminTableData?.supportsStatusFilter}
                >
                  <option value="">All statuses</option>
                  {(adminTableData?.availableStatuses || []).map((statusOption: string) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-filter-field admin-filter-field-search">
                <span>Search</span>
                <input
                  value={draftSearch}
                  onChange={(event) => setDraftSearch(event.target.value)}
                  placeholder="Search row JSON"
                />
              </label>

              <div className="admin-filter-actions">
                <button type="submit">Apply</button>
                <button type="button" className="secondary-btn" onClick={onResetFilters}>
                  Reset
                </button>
              </div>
            </form>

            {adminTableData?.description ? (
              <p className="admin-table-description">{adminTableData.description}</p>
            ) : null}
            {adminError ? <p className="error-banner">{adminError}</p> : null}
          </section>

          <section className="panel list-panel admin-table-panel">
            <div className="admin-table-header">
              <div>
                <p className="chat-card-title">
                  <strong>{adminTableData?.label || "Admin table"}</strong>
                </p>
                <p className="chat-card-meta">{activeTableName || "runner_requests"}</p>
              </div>
              {isLoadingAdminTable ? <span className="empty-hint">Refreshing...</span> : null}
            </div>

            {!isLoadingAdminTable && (!Array.isArray(adminTableData?.rows) || adminTableData.rows.length === 0) ? (
              <p className="empty-hint">No rows matched the current filters.</p>
            ) : null}

            <div className="task-table-scroll admin-table-scroll">
              <table className="task-table admin-table">
                <thead>
                  <tr>
                    {(adminTableData?.columns || []).map((column: any) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(adminTableData?.rows || []).map((row: any) => (
                    <tr key={row.id} className="task-table-row">
                      {(row.cells || []).map((cell: any) => (
                        <td key={`${row.id}:${cell.key}`} className="admin-table-cell">
                          {renderCellValue(cell.key, cell.value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </div></Page>
  );
}
