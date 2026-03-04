export function CompanyRequiredPanel({ hasCompanies }: any) {
  return (
    <section className="panel hero-panel">
      <p className="eyebrow">Company Scope</p>
      {hasCompanies ? (
        <>
          <h1>Select a company</h1>
          <p className="subcopy">
            Choose an existing company from the header dropdown to scope all queries.
          </p>
        </>
      ) : (
        <>
          <h1>Create your first company</h1>
          <p className="subcopy">
            No companies found yet. Open Settings to create your first company.
          </p>
        </>
      )}
    </section>
  );
}
