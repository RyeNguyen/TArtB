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
import { useMemo } from "react";
import RefreshIcon from "@icons/Refresh";
import PlusIcon from "@icons/Plus";

const CREATE_LIST_VALUE = "createList";

export const ToDo = () => {
  const { t } = useTranslation();
  const {
    toDoSettings,
    setSearchTerm,
    searchTerm,
    searchResults,
    selectedList,
    handleAddList,
    handleSelectList,
  } = useTodo();

  const listsData = useMemo(() => {
    return searchResults.length > 0
      ? searchResults.map((item) => {
          return {
            value: item.id,
            label: item.title,
          };
        })
      : [
          {
            label: (
              <div className="flex items-center gap-1">
                <PlusIcon />
                <Typography>
                  {t("toDo.list.createNew", { listName: searchTerm })}
                </Typography>
              </div>
            ),
            value: CREATE_LIST_VALUE,
          },
        ];
  }, [searchResults, t, searchTerm]);

  const onSelectList = (listId: string) => {
    if (!listId) return;
    if (listId === CREATE_LIST_VALUE) {
      handleAddList();
    } else {
      handleSelectList(listId);
    }
  };

  if (!toDoSettings.enabled || !toDoSettings.visible) return null;

  return (
    <WidgetWrapper
      widgetId={WidgetId.TODO}
      innerGlassClassName="flex flex-col gap-4 min-w-[20rem] max-w-[25rem] max-h-[40rem]"
    >
      <div className="flex flex-col gap-2">
        <Dropdown
          value={selectedList?.id}
          onChange={onSelectList}
          header={
            <div className="w-full flex gap-2 items-center mb-2 pb-2 border-b border-white/20">
              <RefreshIcon size={16} />
              <input
                placeholder={t("toDo.list.searchPlaceholder")}
                className="w-full outline-none text-white font-light text-sz-default"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          }
          data={listsData}
        >
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
