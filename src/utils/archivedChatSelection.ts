export class ArchivedChatSelection {
  static getKey(agentId: string, sessionId: string) {
    return `${String(agentId || "").trim()}:${String(sessionId || "").trim()}`;
  }

  static toggle(current: Set<string>, key: string, shouldSelect: boolean) {
    const next = new Set(current);
    if (shouldSelect) {
      next.add(key);
    } else {
      next.delete(key);
    }
    return next;
  }

  static setAll(current: Set<string>, keys: string[], shouldSelect: boolean) {
    const next = new Set(current);
    for (const key of Array.isArray(keys) ? keys : []) {
      if (!key) {
        continue;
      }
      if (shouldSelect) {
        next.add(key);
      } else {
        next.delete(key);
      }
    }
    return next;
  }

  static clearKeys(current: Set<string>, keys: string[]) {
    return ArchivedChatSelection.setAll(current, keys, false);
  }

  static getSummary(current: Set<string>, visibleKeys: string[]) {
    const normalizedVisibleKeys = Array.isArray(visibleKeys) ? visibleKeys.filter(Boolean) : [];
    const selectedCount = Array.from(current).filter((key) => normalizedVisibleKeys.includes(key)).length;
    return {
      selectedCount,
      allVisibleSelected: normalizedVisibleKeys.length > 0 && selectedCount === normalizedVisibleKeys.length,
    };
  }

  static async runBatchDelete(
    entries: Array<{ agentId: string; sessionId: string; title?: string | null }>,
    deleteChat: (entry: { agentId: string; sessionId: string; title?: string | null }) => Promise<boolean>,
  ) {
    const deletedKeys: string[] = [];
    const failedKeys: string[] = [];

    for (const entry of Array.isArray(entries) ? entries : []) {
      const didDelete = await deleteChat(entry);
      const key = ArchivedChatSelection.getKey(entry.agentId, entry.sessionId);
      if (didDelete) {
        deletedKeys.push(key);
      } else {
        failedKeys.push(key);
      }
    }

    return { deletedKeys, failedKeys };
  }

  static getBatchDeleteSummaryMessage(deletedCount: number, failedCount: number) {
    return `${deletedCount} chats deleted, ${failedCount} failed.`;
  }
}
