import { Typography } from "@atoms/Typography";
import { TypoVariants } from "@constants/common";
import { useTodo } from "@hooks/useToDo";
import { ToDoFilter } from "@molecules/toDo/toDoFilter";
import { FocusTaskDetail } from "@organisms/toDo/focusMode/FocusTaskDetail";
import { ManagementSidebar } from "@organisms/toDo/focusMode/ManagementSidebar";
import { ResizeHandle } from "@organisms/toDo/focusMode/ResizeHandle";
import { ToDoForm } from "@organisms/toDo/toDoForm";
import { ToDoList } from "@organisms/toDo/toDoList";
import { Panel, Group } from "react-resizable-panels";
import { Button } from "@atoms/button/Button";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodoStore } from "@stores/todoStore";
import { ConfirmDialog } from "@atoms/ConfirmDialog";
import DeleteIcon from "@icons/Delete";
import { COLORS } from "@constants/colors";

export const ToDoFocusMode = () => {
  const { t } = useTranslation();
  const { selectedList, tags, toDoSettings } = useTodo();
  const { tasks, permanentDeleteTask } = useTodoStore();
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const selectedTag = toDoSettings.selectedTagId
    ? tags.find((t) => t.id === toDoSettings.selectedTagId)
    : null;

  const deletedTasks = tasks.filter((t) => t.deletedAt);
  const hasDeletedTasks = deletedTasks.length > 0;

  const handleDeleteAll = async () => {
    for (const task of deletedTasks) {
      await permanentDeleteTask(task.id);
    }
    setShowDeleteAllConfirm(false);
  };

  const getTitle = () => {
    if (toDoSettings.showDeleted) return t("toDo.trash.title");
    if (toDoSettings.showCompleted) return t("toDo.completed");
    if (selectedTag) return `# ${selectedTag.title}`;
    return selectedList?.title;
  };

  return (
    <div className="flex w-full h-full overflow-hidden rounded-b-2xl">
      <Group
        orientation="horizontal"
        id="todo-focus-mode-layout"
        autoSave="todo-focus-mode-layout"
      >
        <Panel defaultSize="16%" minSize="12%" maxSize="20%" id="sidebar">
          <ManagementSidebar />
        </Panel>

        <ResizeHandle />

        <Panel defaultSize="50%" minSize="30%" maxSize="60%" id="todo-list">
          <div
            className="flex h-full flex-col p-4 gap-3"
            style={{ backgroundColor: selectedList?.color }}
          >
            <div className="flex items-center justify-between shrink-0">
              <Typography variant={TypoVariants.SUBTITLE} className="uppercase">
                {getTitle()}
              </Typography>

              {toDoSettings.showDeleted && hasDeletedTasks ? (
                <Button
                  text={t("toDo.action.deleteAll")}
                  onClick={() => setShowDeleteAllConfirm(true)}
                  icon={DeleteIcon}
                  iconColor={COLORS.WHITE}
                  className="bg-error-400!"
                />
              ) : !toDoSettings.showDeleted && !toDoSettings.showCompleted ? (
                <ToDoFilter />
              ) : null}
            </div>

            <ToDoList isFocusMode={true} />

            <ToDoForm />
          </div>
        </Panel>

        <ResizeHandle />

        <Panel defaultSize="34%" minSize="25%" maxSize="50%" id="task-detail">
          <FocusTaskDetail />
        </Panel>
      </Group>

      <ConfirmDialog
        open={showDeleteAllConfirm}
        onOpenChange={setShowDeleteAllConfirm}
        title={t("toDo.trash.deleteAllTitle")}
        message={t("toDo.trash.deleteAllMessage")}
        confirmText={t("toDo.action.deleteAll")}
        cancelText={t("toDo.detail.deleteConfirm.cancel")}
        onConfirm={handleDeleteAll}
        variant="danger"
      />
    </div>
  );
};
