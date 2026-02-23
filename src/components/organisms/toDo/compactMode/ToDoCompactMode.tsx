import { Dropdown } from "@atoms/Dropdown";
import { Typography } from "@atoms/Typography";
import { TypoVariants, DateFilter, WidgetId } from "@constants/common";
import { useTodo } from "@hooks/useToDo";
import ChevronIcon from "@icons/Chevron";
import PlusIcon from "@icons/Plus";
import SearchIcon from "@icons/SearchIcon";
import { ToDoFilter } from "@molecules/toDo/toDoFilter";
import { ToDoForm } from "@organisms/toDo/toDoForm";
import { ToDoList } from "@organisms/toDo/toDoList";
import { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@stores/settingsStore";

const CREATE_LIST_VALUE = "createList";

export const ToDoCompactMode = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();
  const {
    setSearchTerm,
    searchTerm,
    searchResults,
    selectedList,
    handleAddList,
    handleSelectList,
    toDoSettings,
    lists,
  } = useTodo();

  // Auto-select first list when compact mode is shown with no list selected
  // or when other filters (date, tag, completed, deleted) are active
  useEffect(() => {
    if (lists.length === 0) return;

    const hasNonListFilter =
      toDoSettings.showCompleted ||
      toDoSettings.showDeleted ||
      toDoSettings.selectedTagId ||
      toDoSettings.dateFilter !== DateFilter.ALL;

    if (!toDoSettings.selectedListId || hasNonListFilter) {
      // Clear all non-list filters and select first list in a single update
      updateSettings({
        widgets: {
          ...settings.widgets,
          [WidgetId.TODO]: {
            ...toDoSettings,
            selectedListId: lists[0].id,
            showCompleted: false,
            showDeleted: false,
            selectedTagId: null,
            dateFilter: DateFilter.ALL,
          },
        },
      });
    }
    // Only run on mount to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <div className="w-full flex items-center gap-1">
                <PlusIcon />
                <Typography className="truncate flex-1">
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

  return (
    <div className="flex p-4 pt-2 flex-col gap-2 min-w-[20rem] max-w-100 max-h-160 relative">
      <div className="flex flex-col gap-2">
        <Dropdown
          value={selectedList?.id}
          onChange={onSelectList}
          onOpenChange={() => setSearchTerm("")}
          menuClassName="max-w-80"
          header={
            <div className="w-full flex gap-2 items-center mb-2 pb-2 border-b border-white/20">
              <SearchIcon />
              <input
                value={searchTerm}
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
              {selectedList?.title || ""}
            </Typography>
            <ChevronIcon />
          </div>
        </Dropdown>

        <ToDoFilter />
      </div>

      <ToDoList />

      <ToDoForm />
    </div>
  );
};
