import { useCallback, useEffect, useMemo, useState } from "react";

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || "/graphql";
const PAGE_SIZE = 100;

const HELLO_QUERY = `
  query Hello {
    hello
  }
`;

const LIST_COMPANIES_QUERY = `
  query ListCompanies($first: Int!, $after: String) {
    companies(first: $first, after: $after) {
      edges {
        node {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const CREATE_COMPANY_MUTATION = `
  mutation CreateCompany($name: String!) {
    createCompany(name: $name) {
      id
      name
    }
  }
`;

const DELETE_COMPANY_MUTATION = `
  mutation DeleteCompany($companyId: ID!) {
    deleteCompany(companyId: $companyId)
  }
`;

const LIST_AGENTS_QUERY = `
  query ListAgents($companyId: ID, $first: Int!, $after: String) {
    agents(companyId: $companyId, first: $first, after: $after) {
      edges {
        node {
          id
          name
          companyId
          status
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const CREATE_AGENT_MUTATION = `
  mutation CreateAgent($name: String!, $companyId: ID!) {
    createAgent(name: $name, companyId: $companyId) {
      id
      name
      companyId
      status
    }
  }
`;

const DELETE_AGENT_MUTATION = `
  mutation DeleteAgent($agentId: ID!) {
    deleteAgent(agentId: $agentId)
  }
`;

const LIST_AGENT_RUNNERS_QUERY = `
  query ListAgentRunners($companyId: ID, $first: Int!, $after: String) {
    agentRunners(companyId: $companyId, first: $first, after: $after) {
      edges {
        node {
          id
          companyId
          status
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const CREATE_AGENT_RUNNER_MUTATION = `
  mutation CreateAgentRunner($companyId: ID!) {
    createAgentRunner(companyId: $companyId) {
      secret
      agentRunner {
        id
        companyId
        status
      }
    }
  }
`;

const REGENERATE_AGENT_RUNNER_SECRET_MUTATION = `
  mutation RegenerateAgentRunnerSecret($agentRunnerId: ID!) {
    regenerateAgentRunnerSecret(agentRunnerId: $agentRunnerId) {
      secret
      agentRunner {
        id
        companyId
        status
      }
    }
  }
`;

const DELETE_AGENT_RUNNER_MUTATION = `
  mutation DeleteAgentRunner($agentRunnerId: ID!) {
    deleteAgentRunner(agentRunnerId: $agentRunnerId)
  }
`;

const LIST_THREADS_QUERY = `
  query ListThreads($companyId: ID, $agentId: ID, $first: Int!, $after: String) {
    threads(companyId: $companyId, agentId: $agentId, first: $first, after: $after) {
      edges {
        node {
          id
          companyId
          agentId
          status
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const CREATE_THREAD_MUTATION = `
  mutation CreateThread($companyId: ID!, $agentId: ID!) {
    createThread(companyId: $companyId, agentId: $agentId) {
      id
      companyId
      agentId
      status
    }
  }
`;

const DELETE_THREAD_MUTATION = `
  mutation DeleteThread($threadId: ID!) {
    deleteThread(threadId: $threadId)
  }
`;

function asErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Request failed.";
}

async function executeGraphQL(query, variables = {}) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed (${response.status}).`);
  }

  const payload = await response.json();
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    throw new Error(payload.errors[0]?.message || "GraphQL query failed.");
  }

  return payload?.data || {};
}

function getConnectionNodes(connection) {
  if (!connection || !Array.isArray(connection.edges)) {
    return [];
  }

  return connection.edges
    .map((edge) => edge?.node)
    .filter((node) => node && typeof node.id === "string");
}

async function loadConnectionNodes(query, key, variables = {}) {
  const nodes = [];
  let after = null;
  const visited = new Set();

  while (true) {
    const data = await executeGraphQL(query, {
      ...variables,
      first: PAGE_SIZE,
      after,
    });

    const connection = data?.[key];
    nodes.push(...getConnectionNodes(connection));

    if (!connection?.pageInfo?.hasNextPage) {
      break;
    }

    const nextCursor = connection.pageInfo.endCursor;
    if (!nextCursor || visited.has(nextCursor)) {
      break;
    }

    visited.add(nextCursor);
    after = nextCursor;
  }

  return nodes;
}

function App() {
  const [helloMessage, setHelloMessage] = useState("");
  const [helloError, setHelloError] = useState("");

  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [agents, setAgents] = useState([]);
  const [agentRunners, setAgentRunners] = useState([]);
  const [threads, setThreads] = useState([]);

  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isDeletingAgentId, setIsDeletingAgentId] = useState("");
  const [isCreatingRunner, setIsCreatingRunner] = useState(false);
  const [isDeletingRunnerId, setIsDeletingRunnerId] = useState("");
  const [isRotatingRunnerSecretId, setIsRotatingRunnerSecretId] = useState("");
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [isDeletingThreadId, setIsDeletingThreadId] = useState("");

  const [newCompanyName, setNewCompanyName] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [newThreadAgentId, setNewThreadAgentId] = useState("");

  const [runnerSecretsById, setRunnerSecretsById] = useState({});
  const [operationError, setOperationError] = useState("");

  const selectedCompany = useMemo(() => {
    return companies.find((company) => company.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  const agentLookup = useMemo(() => {
    return agents.reduce((map, agent) => {
      map.set(agent.id, agent);
      return map;
    }, new Map());
  }, [agents]);

  const hasSelectedCompany = Boolean(selectedCompanyId);

  const loadHello = useCallback(async () => {
    setHelloError("");
    try {
      const data = await executeGraphQL(HELLO_QUERY);
      setHelloMessage(String(data?.hello || ""));
    } catch (error) {
      setHelloMessage("");
      setHelloError(asErrorMessage(error));
    }
  }, []);

  const refreshCompanies = useCallback(async () => {
    setIsLoadingCompanies(true);
    setOperationError("");
    try {
      const nextCompanies = await loadConnectionNodes(LIST_COMPANIES_QUERY, "companies");
      setCompanies(nextCompanies);
      setSelectedCompanyId((currentId) => {
        if (nextCompanies.some((company) => company.id === currentId)) {
          return currentId;
        }
        return nextCompanies[0]?.id || "";
      });
    } catch (error) {
      setOperationError(asErrorMessage(error));
      setCompanies([]);
      setSelectedCompanyId("");
    } finally {
      setIsLoadingCompanies(false);
    }
  }, []);

  const refreshAgents = useCallback(async (companyId) => {
    if (!companyId) {
      setAgents([]);
      return;
    }
    const nextAgents = await loadConnectionNodes(LIST_AGENTS_QUERY, "agents", { companyId });
    setAgents(nextAgents);
  }, []);

  const refreshAgentRunners = useCallback(async (companyId) => {
    if (!companyId) {
      setAgentRunners([]);
      return;
    }
    const nextRunners = await loadConnectionNodes(LIST_AGENT_RUNNERS_QUERY, "agentRunners", {
      companyId,
    });
    setAgentRunners(nextRunners);
  }, []);

  const refreshThreads = useCallback(async (companyId) => {
    if (!companyId) {
      setThreads([]);
      return;
    }
    const nextThreads = await loadConnectionNodes(LIST_THREADS_QUERY, "threads", { companyId });
    setThreads(nextThreads);
  }, []);

  const refreshCompanyScopedData = useCallback(
    async (companyId) => {
      if (!companyId) {
        setAgents([]);
        setAgentRunners([]);
        setThreads([]);
        return;
      }

      setIsLoadingCompanyData(true);
      setOperationError("");
      try {
        await Promise.all([
          refreshAgents(companyId),
          refreshAgentRunners(companyId),
          refreshThreads(companyId),
        ]);
      } catch (error) {
        setOperationError(asErrorMessage(error));
      } finally {
        setIsLoadingCompanyData(false);
      }
    },
    [refreshAgents, refreshAgentRunners, refreshThreads],
  );

  useEffect(() => {
    void loadHello();
    void refreshCompanies();
  }, [loadHello, refreshCompanies]);

  useEffect(() => {
    void refreshCompanyScopedData(selectedCompanyId);
  }, [refreshCompanyScopedData, selectedCompanyId]);

  useEffect(() => {
    if (!agents.some((agent) => agent.id === newThreadAgentId)) {
      setNewThreadAgentId(agents[0]?.id || "");
    }
  }, [agents, newThreadAgentId]);

  async function handleCreateCompany(event) {
    event.preventDefault();
    const trimmedName = newCompanyName.trim();
    if (!trimmedName) {
      return;
    }

    setIsCreatingCompany(true);
    setOperationError("");
    try {
      const data = await executeGraphQL(CREATE_COMPANY_MUTATION, { name: trimmedName });
      const createdCompanyId = data?.createCompany?.id ? String(data.createCompany.id) : "";
      setNewCompanyName("");
      await refreshCompanies();
      if (createdCompanyId) {
        setSelectedCompanyId(createdCompanyId);
      }
    } catch (error) {
      setOperationError(asErrorMessage(error));
    } finally {
      setIsCreatingCompany(false);
    }
  }

  async function handleDeleteSelectedCompany() {
    if (!selectedCompanyId || !selectedCompany) {
      return;
    }

    const confirmed = window.confirm(`Delete company \"${selectedCompany.name}\"?`);
    if (!confirmed) {
      return;
    }

    setIsDeletingCompany(true);
    setOperationError("");
    try {
      await executeGraphQL(DELETE_COMPANY_MUTATION, { companyId: selectedCompanyId });
      setRunnerSecretsById({});
      await refreshCompanies();
    } catch (error) {
      setOperationError(asErrorMessage(error));
    } finally {
      setIsDeletingCompany(false);
    }
  }

  async function handleCreateAgent(event) {
    event.preventDefault();
    if (!selectedCompanyId) {
      return;
    }

    const trimmedName = newAgentName.trim();
    if (!trimmedName) {
      return;
    }

    setIsCreatingAgent(true);
    setOperationError("");
    try {
      await executeGraphQL(CREATE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        name: trimmedName,
      });
      setNewAgentName("");
      await Promise.all([refreshAgents(selectedCompanyId), refreshThreads(selectedCompanyId)]);
    } catch (error) {
      setOperationError(asErrorMessage(error));
    } finally {
      setIsCreatingAgent(false);
    }
  }

  async function handleDeleteAgent(agent) {
    const confirmed = window.confirm(`Delete agent \"${agent.name}\"?`);
    if (!confirmed || !selectedCompanyId) {
      return;
    }

    setIsDeletingAgentId(agent.id);
    setOperationError("");
    try {
      await executeGraphQL(DELETE_AGENT_MUTATION, { agentId: agent.id });
      await Promise.all([refreshAgents(selectedCompanyId), refreshThreads(selectedCompanyId)]);
    } catch (error) {
      setOperationError(asErrorMessage(error));
    } finally {
      setIsDeletingAgentId("");
    }
  }

  async function handleCreateAgentRunner(event) {
    event.preventDefault();
    if (!selectedCompanyId) {
      return;
    }

    setIsCreatingRunner(true);
    setOperationError("");
    try {
      const data = await executeGraphQL(CREATE_AGENT_RUNNER_MUTATION, {
        companyId: selectedCompanyId,
      });
      const payload = data?.createAgentRunner;
      if (payload?.agentRunner?.id && payload?.secret) {
        setRunnerSecretsById((currentSecrets) => ({
          ...currentSecrets,
          [payload.agentRunner.id]: payload.secret,
        }));
      }
      await refreshAgentRunners(selectedCompanyId);
    } catch (error) {
      setOperationError(asErrorMessage(error));
    } finally {
      setIsCreatingRunner(false);
    }
  }

  async function handleRotateAgentRunnerSecret(agentRunnerId) {
    setIsRotatingRunnerSecretId(agentRunnerId);
    setOperationError("");
    try {
      const data = await executeGraphQL(REGENERATE_AGENT_RUNNER_SECRET_MUTATION, {
        agentRunnerId,
      });
      const payload = data?.regenerateAgentRunnerSecret;
      if (payload?.agentRunner?.id && payload?.secret) {
        setRunnerSecretsById((currentSecrets) => ({
          ...currentSecrets,
          [payload.agentRunner.id]: payload.secret,
        }));
      }
      if (selectedCompanyId) {
        await refreshAgentRunners(selectedCompanyId);
      }
    } catch (error) {
      setOperationError(asErrorMessage(error));
    } finally {
      setIsRotatingRunnerSecretId("");
    }
  }

  async function handleDeleteAgentRunner(agentRunnerId) {
    if (!selectedCompanyId) {
      return;
    }

    const confirmed = window.confirm(`Delete runner \"${agentRunnerId}\"?`);
    if (!confirmed) {
      return;
    }

    setIsDeletingRunnerId(agentRunnerId);
    setOperationError("");
    try {
      await executeGraphQL(DELETE_AGENT_RUNNER_MUTATION, { agentRunnerId });
      setRunnerSecretsById((currentSecrets) => {
        const nextSecrets = { ...currentSecrets };
        delete nextSecrets[agentRunnerId];
        return nextSecrets;
      });
      await refreshAgentRunners(selectedCompanyId);
    } catch (error) {
      setOperationError(asErrorMessage(error));
    } finally {
      setIsDeletingRunnerId("");
    }
  }

  async function handleCreateThread(event) {
    event.preventDefault();
    if (!selectedCompanyId || !newThreadAgentId) {
      return;
    }

    setIsCreatingThread(true);
    setOperationError("");
    try {
      await executeGraphQL(CREATE_THREAD_MUTATION, {
        companyId: selectedCompanyId,
        agentId: newThreadAgentId,
      });
      await refreshThreads(selectedCompanyId);
    } catch (error) {
      setOperationError(asErrorMessage(error));
    } finally {
      setIsCreatingThread(false);
    }
  }

  async function handleDeleteThread(threadId) {
    if (!selectedCompanyId) {
      return;
    }

    const confirmed = window.confirm(`Delete thread \"${threadId}\"?`);
    if (!confirmed) {
      return;
    }

    setIsDeletingThreadId(threadId);
    setOperationError("");
    try {
      await executeGraphQL(DELETE_THREAD_MUTATION, { threadId });
      await refreshThreads(selectedCompanyId);
    } catch (error) {
      setOperationError(asErrorMessage(error));
    } finally {
      setIsDeletingThreadId("");
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>CompanyHelm Frontend</h1>
        <p>This UI targets only the implemented GraphQL operations in `companyhelm-api`.</p>
        <div className="api-meta">
          <span>GraphQL endpoint</span>
          <code>{GRAPHQL_URL}</code>
        </div>
        <div className="api-meta">
          <span>hello</span>
          <code>{helloError ? `error: ${helloError}` : helloMessage || "loading..."}</code>
          <button type="button" onClick={() => void loadHello()}>
            Recheck
          </button>
        </div>
      </header>

      {operationError ? <p className="error-banner">{operationError}</p> : null}

      <main className="app-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Companies</h2>
            <button
              type="button"
              onClick={() => void refreshCompanies()}
              disabled={isLoadingCompanies || isDeletingCompany}
            >
              {isLoadingCompanies ? "Loading..." : "Refresh"}
            </button>
          </div>

          <form className="inline-form" onSubmit={handleCreateCompany}>
            <input
              value={newCompanyName}
              onChange={(event) => setNewCompanyName(event.target.value)}
              placeholder="New company name"
              aria-label="New company name"
            />
            <button type="submit" disabled={isCreatingCompany}>
              {isCreatingCompany ? "Creating..." : "Create"}
            </button>
          </form>

          <div className="field-row">
            <label htmlFor="company-select">Selected company</label>
            <select
              id="company-select"
              value={selectedCompanyId}
              onChange={(event) => setSelectedCompanyId(event.target.value)}
              disabled={companies.length === 0}
            >
              {companies.length === 0 ? <option value="">No companies</option> : null}
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.id})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="danger-button"
            onClick={() => void handleDeleteSelectedCompany()}
            disabled={!selectedCompanyId || isDeletingCompany}
          >
            {isDeletingCompany ? "Deleting..." : "Delete selected company"}
          </button>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Agents</h2>
            <span>{hasSelectedCompany ? `${agents.length} total` : "select a company"}</span>
          </div>

          <form className="inline-form" onSubmit={handleCreateAgent}>
            <input
              value={newAgentName}
              onChange={(event) => setNewAgentName(event.target.value)}
              placeholder="New agent name"
              aria-label="New agent name"
              disabled={!hasSelectedCompany}
            />
            <button type="submit" disabled={!hasSelectedCompany || isCreatingAgent}>
              {isCreatingAgent ? "Creating..." : "Create"}
            </button>
          </form>

          <ul className="list">
            {agents.map((agent) => (
              <li key={agent.id}>
                <div>
                  <strong>{agent.name}</strong>
                  <p>
                    id: {agent.id} | status: {agent.status}
                  </p>
                </div>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => void handleDeleteAgent(agent)}
                  disabled={isDeletingAgentId === agent.id}
                >
                  {isDeletingAgentId === agent.id ? "Deleting..." : "Delete"}
                </button>
              </li>
            ))}
            {hasSelectedCompany && agents.length === 0 ? (
              <li className="placeholder">No agents for this company.</li>
            ) : null}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Agent Runners</h2>
            <span>{hasSelectedCompany ? `${agentRunners.length} total` : "select a company"}</span>
          </div>

          <form className="inline-form" onSubmit={handleCreateAgentRunner}>
            <button type="submit" disabled={!hasSelectedCompany || isCreatingRunner}>
              {isCreatingRunner ? "Creating..." : "Create runner"}
            </button>
          </form>

          <ul className="list">
            {agentRunners.map((runner) => (
              <li key={runner.id}>
                <div>
                  <strong>{runner.id}</strong>
                  <p>status: {runner.status}</p>
                  {runnerSecretsById[runner.id] ? (
                    <p className="secret-value">secret: {runnerSecretsById[runner.id]}</p>
                  ) : null}
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    onClick={() => void handleRotateAgentRunnerSecret(runner.id)}
                    disabled={isRotatingRunnerSecretId === runner.id}
                  >
                    {isRotatingRunnerSecretId === runner.id ? "Rotating..." : "Rotate secret"}
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => void handleDeleteAgentRunner(runner.id)}
                    disabled={isDeletingRunnerId === runner.id}
                  >
                    {isDeletingRunnerId === runner.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            ))}
            {hasSelectedCompany && agentRunners.length === 0 ? (
              <li className="placeholder">No runners for this company.</li>
            ) : null}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Threads</h2>
            <span>{hasSelectedCompany ? `${threads.length} total` : "select a company"}</span>
          </div>

          <form className="inline-form" onSubmit={handleCreateThread}>
            <select
              value={newThreadAgentId}
              onChange={(event) => setNewThreadAgentId(event.target.value)}
              disabled={!hasSelectedCompany || agents.length === 0}
              aria-label="Agent used to create thread"
            >
              {agents.length === 0 ? <option value="">No agents available</option> : null}
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.id})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!hasSelectedCompany || !newThreadAgentId || isCreatingThread}
            >
              {isCreatingThread ? "Creating..." : "Create thread"}
            </button>
          </form>

          <ul className="list">
            {threads.map((thread) => {
              const threadAgent = agentLookup.get(thread.agentId);
              return (
                <li key={thread.id}>
                  <div>
                    <strong>{thread.id}</strong>
                    <p>
                      status: {thread.status} | agent: {threadAgent?.name || thread.agentId}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => void handleDeleteThread(thread.id)}
                    disabled={isDeletingThreadId === thread.id}
                  >
                    {isDeletingThreadId === thread.id ? "Deleting..." : "Delete"}
                  </button>
                </li>
              );
            })}
            {hasSelectedCompany && threads.length === 0 ? (
              <li className="placeholder">No threads for this company.</li>
            ) : null}
          </ul>
        </section>
      </main>

      {isLoadingCompanyData ? <p className="loading-note">Refreshing company data...</p> : null}
    </div>
  );
}

export default App;
