import React, { useState, useRef } from "react";
import { Subtask } from "@/types/toDo";
import { useTodoStore } from "@stores/todoStore";
import { useTranslation } from "react-i18next";
import PlusIcon from "@icons/Plus";
import { SubtaskList } from "./SubtaskList";
import { Typography } from "@atoms/Typography";

interface SubtaskSectionProps {
  taskId: string;
  subtasks: Subtask[];
}

export const SubtaskSection = ({ taskId, subtasks }: SubtaskSectionProps) => {
  const { t } = useTranslation();
  const {
    addSubtask,
    toggleSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtask,
  } = useTodoStore();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingTitles, setEditingTitles] = useState<Record<string, string>>(
    {},
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedSubtasks = [...subtasks].sort((a, b) => a.order - b.order);
  const completedAmount = sortedSubtasks.filter((s) => s.isCompleted).length;
  const havingSubtasks = sortedSubtasks && sortedSubtasks.length > 0;

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newSubtaskTitle.trim();
    if (!title) return;

    try {
      await addSubtask(taskId, title);
      setNewSubtaskTitle("");

      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch {
      // Silent fail - optimistic update already applied
      // Only show error if sync fails (handled by store)
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    try {
      await toggleSubtask(taskId, subtaskId);
    } catch {
      // Silent fail - optimistic update already applied
    }
  };

  const handleTitleChange = (subtaskId: string, title: string) => {
    setEditingTitles((prev) => ({ ...prev, [subtaskId]: title }));
  };

  const handleTitleBlur = async (subtaskId: string) => {
    const editedTitle = editingTitles[subtaskId];
    const subtask = subtasks.find((s) => s.id === subtaskId);

    setEditingTitles((prev) => {
      const newState = { ...prev };
      delete newState[subtaskId];
      return newState;
    });

    if (!editedTitle || !subtask || editedTitle === subtask.title) {
      return;
    }

    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle) {
      return;
    }

    try {
      await updateSubtask(taskId, subtaskId, { title: trimmedTitle });
    } catch {
      // Silent fail - optimistic update already applied
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask(taskId, subtaskId);
    } catch {
      // Silent fail - optimistic update already applied
    }
  };

  const handleReorderSubtask = async (subtaskId: string, newOrder: number) => {
    try {
      await reorderSubtask(taskId, subtaskId, newOrder);
    } catch {
      // Silent fail - optimistic update already applied
    }
  };

  const getDisplayTitle = (subtaskId: string, originalTitle: string) => {
    return editingTitles[subtaskId] ?? originalTitle;
  };

  return (
    <div
      className={`w-full flex flex-col gap-2 border-t ${havingSubtasks ? "border-transparent" : "border-white/20 pt-2"}`}
    >
      {havingSubtasks && (
        <div className="flex items-center gap-1">
          {Array.from({ length: completedAmount }, (_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full bg-primary-300`}
            />
          ))}
          {Array.from(
            { length: sortedSubtasks.length - completedAmount },
            (_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full bg-white/20`}
              />
            ),
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Typography className="font-bold!">
          {t("toDo.subtask.title")}
        </Typography>

        {havingSubtasks && (
          <div className="flex items-center gap-1 px-2 rounded-full bg-white/20 text-sz-small text-white/80">
            {sortedSubtasks.filter((s) => s.isCompleted).length}/
            {sortedSubtasks.length}
          </div>
        )}
      </div>

      {/* Subtask List */}
      <SubtaskList
        subtasks={sortedSubtasks}
        taskId={taskId}
        getDisplayTitle={getDisplayTitle}
        onTitleChange={handleTitleChange}
        onTitleBlur={handleTitleBlur}
        onToggle={handleToggleSubtask}
        onDelete={handleDeleteSubtask}
        onReorder={handleReorderSubtask}
      />

      {/* Add Subtask Form */}
      <form onSubmit={handleAddSubtask}>
        <div className="flex items-center gap-1 ml-5.5">
          <PlusIcon />
          <input
            ref={inputRef}
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder={t("toDo.subtask.placeholder")}
            className="flex-1 text-white text-sz-default font-light placeholder:text-white/50 outline-none transition-colors"
          />
        </div>
      </form>
    </div>
  );
};
