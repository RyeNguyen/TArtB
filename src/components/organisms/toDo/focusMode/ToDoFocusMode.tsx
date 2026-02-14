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

export const ToDoFocusMode = () => {
  const { selectedList, tags, toDoSettings } = useTodo();

  // Get the selected tag if filtering by tag
  const selectedTag = toDoSettings.selectedTagId
    ? tags.find(t => t.id === toDoSettings.selectedTagId)
    : null;

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
                {selectedTag ? `# ${selectedTag.title}` : selectedList?.title}
              </Typography>

              <ToDoFilter />
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
    </div>
  );
};
