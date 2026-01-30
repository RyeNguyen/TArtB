import { Dropdown } from "@atoms/Dropdown";
import { Typography } from "@atoms/Typography";
import { WidgetWrapper } from "@atoms/WidgetWrapper";
import { TypoVariants, WidgetId } from "@constants/common";
import ChevronIcon from "@icons/Chevron";
import { useTranslation } from "react-i18next";
import { useTodo } from "@hooks/useToDo";
import { ToDoForm } from "@molecules/toDo/toDoForm";
import { ToDoList } from "@molecules/toDo/toDoList";
import { ToDoFilter } from "@molecules/toDo/toDoFilter";

export const ToDo = () => {
  const { t } = useTranslation();
  const { toDoSettings, selectedList } = useTodo();

  if (!toDoSettings.enabled || !toDoSettings.visible) return null;

  return (
    <WidgetWrapper
      widgetId={WidgetId.TODO}
      innerGlassClassName="flex flex-col gap-4 min-w-[20rem] max-w-[25rem] max-h-[40rem]"
    >
      <div className="flex flex-col gap-2">
        <Dropdown data={[{ value: "test", label: "test" }]}>
          <div className="inline-flex gap-2 items-center cursor-pointer">
            <Typography variant={TypoVariants.SUBTITLE} className="uppercase">
              {selectedList?.title || t("toDo.myDay")}
            </Typography>
            <ChevronIcon size={16} />
          </div>
        </Dropdown>

        <ToDoFilter />
      </div>

      <ToDoList />

      <ToDoForm />
    </WidgetWrapper>
  );
};
