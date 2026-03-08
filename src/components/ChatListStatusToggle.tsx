function normalizeChatListStatusFilter(value: any) {
  return String(value || "").trim().toLowerCase() === "archived" ? "archived" : "active";
}

export function ChatListStatusToggle({
  value = "active",
  onChange,
}: any) {
  const normalizedValue = normalizeChatListStatusFilter(value);

  return (
    <div className="chat-list-filter" aria-label="Chat list filter">
      <button
        type="button"
        className={`chat-list-filter-btn${normalizedValue === "active" ? " chat-list-filter-btn-active" : ""}`}
        aria-pressed={normalizedValue === "active"}
        onClick={() => onChange?.("active")}
      >
        Active
      </button>
      <button
        type="button"
        className={`chat-list-filter-btn${normalizedValue === "archived" ? " chat-list-filter-btn-active" : ""}`}
        aria-pressed={normalizedValue === "archived"}
        onClick={() => onChange?.("archived")}
      >
        Archived
      </button>
    </div>
  );
}
