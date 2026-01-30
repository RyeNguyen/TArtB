import { COLORS } from "@constants/colors";
import { TaskGroupBy, TaskPriorityType, TaskSortBy } from "@constants/common";
import i18next from "i18next";

export const PRIORITY_COLORS = {
  [TaskPriorityType.HIGH]: {
    color: COLORS.ERROR_400,
    bgColor: COLORS.ERROR_50,
  },
  [TaskPriorityType.MEDIUM]: {
    color: COLORS.WARNING_400,
    bgColor: COLORS.WARNING_50,
  },
  [TaskPriorityType.LOW]: {
    color: COLORS.BLUE_400,
    bgColor: COLORS.BLUE_50,
  },
  [TaskPriorityType.NONE]: {
    color: COLORS.WHITE,
    bgColor: COLORS.WHITE,
  },
};

export const getPriorityConfig = () => ({
  [TaskPriorityType.HIGH]: {
    label: i18next.t("toDo.priority.high"),
    ...PRIORITY_COLORS[TaskPriorityType.HIGH],
  },
  [TaskPriorityType.MEDIUM]: {
    label: i18next.t("toDo.priority.medium"),
    ...PRIORITY_COLORS[TaskPriorityType.MEDIUM],
  },
  [TaskPriorityType.LOW]: {
    label: i18next.t("toDo.priority.low"),
    ...PRIORITY_COLORS[TaskPriorityType.LOW],
  },
  [TaskPriorityType.NONE]: {
    label: i18next.t("toDo.priority.none"),
    ...PRIORITY_COLORS[TaskPriorityType.NONE],
  },
});

export const getSortCriteriaConfig = () => ({
  [TaskSortBy.DATE]: i18next.t("toDo.sortBy.date"),
  [TaskSortBy.DUE_DATE]: i18next.t("toDo.sortBy.dueDate"),
  [TaskSortBy.PRIORITY]: i18next.t("toDo.sortBy.priority"),
  [TaskSortBy.TITLE]: i18next.t("toDo.sortBy.name"),
  [TaskSortBy.MANUAL]: i18next.t("toDo.sortBy.manual"),
});

export const getGroupCriteriaConfig = () => ({
  [TaskGroupBy.DATE]: i18next.t("toDo.groupBy.date"),
  [TaskGroupBy.DUE_DATE]: i18next.t("toDo.groupBy.dueDate"),
  [TaskGroupBy.PRIORITY]: i18next.t("toDo.groupBy.priority"),
  [TaskGroupBy.TAGS]: i18next.t("toDo.groupBy.tags"),
  [TaskGroupBy.NONE]: i18next.t("toDo.groupBy.none"),
});

export const getSortByData = () => [
  { label: i18next.t("toDo.sortBy.date"), value: TaskSortBy.DATE },
  { label: i18next.t("toDo.sortBy.dueDate"), value: TaskSortBy.DUE_DATE },
  { label: i18next.t("toDo.sortBy.priority"), value: TaskSortBy.PRIORITY },
  { label: i18next.t("toDo.sortBy.name"), value: TaskSortBy.TITLE },
  { label: i18next.t("toDo.sortBy.manual"), value: TaskSortBy.MANUAL },
];

export const getGroupByData = () => [
  { label: i18next.t("toDo.groupBy.date"), value: TaskGroupBy.DATE },
  { label: i18next.t("toDo.groupBy.dueDate"), value: TaskGroupBy.DUE_DATE },
  { label: i18next.t("toDo.groupBy.priority"), value: TaskGroupBy.PRIORITY },
  { label: i18next.t("toDo.groupBy.tags"), value: TaskGroupBy.TAGS },
  { label: i18next.t("toDo.groupBy.none"), value: TaskGroupBy.NONE },
];