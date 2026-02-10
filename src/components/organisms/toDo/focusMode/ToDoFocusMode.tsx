import { Typography } from "@atoms/Typography";
import { TypoVariants } from "@constants/common";
import { useTodo } from "@hooks/useToDo";
import { ToDoFilter } from "@molecules/toDo/toDoFilter";
import { FocusTaskDetail } from "@organisms/toDo/focusMode/FocusTaskDetail";
import { ManagementSidebar } from "@organisms/toDo/focusMode/ManagementSidebar";
import { ToDoForm } from "@organisms/toDo/toDoForm";
import { ToDoList } from "@organisms/toDo/toDoList";

export const ToDoFocusMode = () => {
  const { selectedList } = useTodo();

  return (
    <div className="flex w-full h-full border-t border-white/20">
      <ManagementSidebar />

      <div className="w-[50%] flex h-full flex-1 flex-col p-4 pb-0 gap-3">
        <div className="flex items-center justify-between shrink-0">
          <Typography variant={TypoVariants.SUBTITLE}>
            {selectedList?.title}
          </Typography>

          <ToDoFilter />
        </div>

        <ToDoList isFocusMode={true} />

        <ToDoForm />
      </div>

      <FocusTaskDetail />
    </div>
  );
};
