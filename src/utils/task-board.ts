import type { TaskCategory, TaskItem } from "../types/domain.ts";

export interface TaskBoardColumn {
  key: string;
  label: string;
  tasks: TaskItem[];
}

function normalizeTaskCategory(value: string | null | undefined) {
  return String(value || "").trim();
}

export function filterTasksByCategories(tasks: TaskItem[], selectedCategories: string[]) {
  const normalizedSelectedCategories = new Set(
    (Array.isArray(selectedCategories) ? selectedCategories : [])
      .map((category) => String(category || "").trim())
      .filter(Boolean),
  );
  if (normalizedSelectedCategories.size === 0) {
    return Array.isArray(tasks) ? tasks : [];
  }

  return (Array.isArray(tasks) ? tasks : []).filter((task) => {
    const category = normalizeTaskCategory(task?.category);
    if (!category) {
      return normalizedSelectedCategories.has("uncategorized");
    }
    return normalizedSelectedCategories.has(category);
  });
}

export function buildTaskBoardColumns(params: {
  tasks: TaskItem[];
  taskCategories: TaskCategory[];
}) {
  const taskList = Array.isArray(params.tasks) ? params.tasks : [];
  const configuredCategories = (Array.isArray(params.taskCategories) ? params.taskCategories : [])
    .map((taskCategory) => normalizeTaskCategory(taskCategory?.name))
    .filter(Boolean);
  const seenCategoryNames = new Set(configuredCategories);
  const taskCategories = taskList
    .map((task) => normalizeTaskCategory(task?.category))
    .filter(Boolean)
    .filter((category) => {
      if (seenCategoryNames.has(category)) {
        return false;
      }
      seenCategoryNames.add(category);
      return true;
    });
  const categoryNames = [...configuredCategories, ...taskCategories];
  const columns: TaskBoardColumn[] = categoryNames.map((categoryName) => ({
    key: categoryName,
    label: categoryName,
    tasks: taskList.filter((task) => normalizeTaskCategory(task?.category) === categoryName),
  }));

  columns.push({
    key: "uncategorized",
    label: "Uncategorized",
    tasks: taskList.filter((task) => !normalizeTaskCategory(task?.category)),
  });

  return columns;
}
