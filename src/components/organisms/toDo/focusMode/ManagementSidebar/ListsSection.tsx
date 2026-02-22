import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@atoms/Accordion";
import { Button } from "@atoms/button/Button";
import { Typography } from "@atoms/Typography";
import { ConfirmDialog } from "@atoms/ConfirmDialog";
import { COLORS } from "@constants/colors";
import {
  ListActions,
  ModalType,
  TypoVariants,
  WidgetId,
} from "@constants/common";
import PlusIcon from "@icons/Plus";
import EditIcon from "@icons/Edit";
import DuplicateIcon from "@icons/Duplicate";
import DeleteIcon from "@icons/Delete";
import { motion } from "framer-motion";
import { fadeInOut } from "@animations/hover";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { TaskList } from "@/types/toDo";
import { ModalState } from "@/types/common";
import { ListFormModal } from "@molecules/toDo/ListFormModal";
import { useTodoStore } from "@stores/todoStore";
import { useSettingsStore } from "@stores/settingsStore";
import { useTodo } from "@hooks/useToDo";
import { todoService } from "@services/todo/todoService";
import { arrayMove } from "@dnd-kit/sortable";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableListItem } from "./components/SortableListItem";

export const ListsSection = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();
  const {
    lists: storeLists,
    setSelectedTask,
    deleteList,
    addList,
    updateList,
    duplicateList,
  } = useTodoStore();
  const { lists, selectedList } = useTodo();
  const toDoSettings = settings.widgets[WidgetId.TODO];
  const [isHoveringList, setIsHoveringList] = useState(false);
  const [hoveredListId, setHoveredListId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState<TaskList>>({
    type: ModalType.NONE,
  });

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const onSelectList = (listId: string) => {
    if (listId === selectedList?.id && !toDoSettings.selectedTagId) return;
    setSelectedTask(null);
    // Clear tag, completed, and deleted filters when selecting a list
    updateSettings({
      widgets: {
        ...settings.widgets,
        [WidgetId.TODO]: {
          ...toDoSettings,
          selectedTagId: null,
          selectedListId: listId,
          showCompleted: false,
          showDeleted: false,
        },
      },
    });
  };

  const getListActionData = (list: TaskList) => [
    {
      label: (
        <div className="flex items-center gap-2">
          <EditIcon />
          <Typography className="text-white">
            {t("toDo.action.edit")}
          </Typography>
        </div>
      ),
      value: ListActions.EDIT,
      onClick: () => {
        setOpenDropdownId(null);
        setModalState({
          type: ModalType.EDIT,
          title: t("toDo.list.editTitle"),
          data: list,
        });
      },
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <DuplicateIcon />
          <Typography className="text-white">
            {t("toDo.action.duplicate")}
          </Typography>
        </div>
      ),
      value: ListActions.DUPLICATE,
      onClick: () => {
        setOpenDropdownId(null);
        setModalState({
          type: ModalType.DUPLICATE,
          title: t("toDo.list.duplicateTitle", { listName: list.title }),
          message: t("toDo.list.duplicateMessage"),
          data: list,
        });
      },
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <DeleteIcon color={COLORS.ERROR_400} />
          <Typography className="text-error-400!">
            {t("toDo.action.delete")}
          </Typography>
        </div>
      ),
      value: ListActions.DELETE,
      onClick: () => {
        setOpenDropdownId(null);
        setModalState({
          type: ModalType.DELETE,
          title: t("toDo.list.deleteTitle", { listName: list.title }),
          message: t("toDo.list.deleteMessage"),
          data: list,
        });
      },
    },
  ];

  const handleAddList = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalState({ type: ModalType.ADD, title: t("toDo.list.addTitle") });
  };

  const handleConfirmListForm = async (title: string, color: string) => {
    if (modalState.type === ModalType.ADD) {
      const newListId = await addList(title, color);
      onSelectList(newListId);
    } else if (modalState.type === ModalType.EDIT) {
      await updateList(modalState.data.id, { title, color });
    }
  };

  const handleConfirmDeleteList = async () => {
    if (modalState.type === ModalType.DELETE) {
      const deletedListId = modalState.data.id;
      const deletedIndex = lists.findIndex((list) => list.id === deletedListId);

      let nextListId: string | null = null;
      if (lists.length > 1) {
        if (deletedIndex >= lists.length - 1) {
          nextListId = lists[0].id;
        } else {
          nextListId = lists[deletedIndex + 1].id;
        }
      }
      await deleteList(deletedListId);
      if (nextListId) {
        onSelectList(nextListId);
      }
      setModalState({ type: ModalType.NONE });
    }
  };

  const handleConfirmDuplicateList = async () => {
    if (modalState.type === ModalType.DUPLICATE) {
      const newListId = await duplicateList(modalState.data.id);
      onSelectList(newListId);
      setModalState({ type: ModalType.NONE });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = lists.findIndex((list) => list.id === active.id);
    const newIndex = lists.findIndex((list) => list.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      // Use arrayMove to reorder the lists array
      const reorderedLists = arrayMove(lists, oldIndex, newIndex);

      // Update order values to match new positions
      const now = Date.now();
      const listsWithNewOrders = reorderedLists.map((list, index) => ({
        ...list,
        order: index,
        updatedAt: now,
      }));

      // Optimistically update local state
      useTodoStore.setState({ lists: listsWithNewOrders });

      try {
        // Save all lists with new orders
        await todoService.saveLists(listsWithNewOrders);
      } catch (error) {
        // Revert on error
        useTodoStore.setState({ lists: storeLists });
        console.error("[ListsSection] Error reordering lists:", error);
      }
    }
  };

  return (
    <>
      <div className="p-2">
        <div
          onMouseEnter={() => setIsHoveringList(true)}
          onMouseLeave={() => setIsHoveringList(false)}
        >
          <Accordion>
            <AccordionItem id="lists">
              <AccordionTrigger id="lists">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Typography variant={TypoVariants.SUBTITLE}>
                      {t("toDo.list.title")}
                    </Typography>
                    <div className="flex items-center gap-1 px-2 rounded-full bg-white/20 text-sz-small text-white/80">
                      {lists.length}
                    </div>
                  </div>

                  <motion.div
                    initial="hidden"
                    animate={isHoveringList ? "visible" : "hidden"}
                    variants={fadeInOut}
                  >
                    <Button
                      icon={PlusIcon}
                      iconColor={COLORS.WHITE}
                      isGhost
                      onClick={handleAddList}
                    />
                  </motion.div>
                </div>
              </AccordionTrigger>
              <AccordionContent id="lists">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={lists.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-1 mt-2">
                      {lists.map((list) => (
                        <SortableListItem
                          key={list.id}
                          list={list}
                          isSelected={
                            !toDoSettings.selectedTagId &&
                            selectedList?.id === list.id
                          }
                          isHovered={hoveredListId === list.id}
                          onMouseEnter={() => setHoveredListId(list.id)}
                          onMouseLeave={() => setHoveredListId(null)}
                          onClick={() => onSelectList(list.id)}
                          onMoreClick={(e) => e.stopPropagation()}
                          getListActionData={getListActionData}
                          openDropdownId={openDropdownId}
                          setOpenDropdownId={setOpenDropdownId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <ListFormModal
        open={
          modalState.type === ModalType.ADD ||
          modalState.type === ModalType.EDIT
        }
        onOpenChange={(open) => {
          if (!open) {
            setModalState({ type: ModalType.NONE });
          }
        }}
        modalTitle={
          modalState.type === ModalType.ADD ||
          modalState.type === ModalType.EDIT
            ? modalState.title
            : ""
        }
        mode={modalState.type === ModalType.ADD ? "add" : "edit"}
        initialTitle={
          modalState.type === ModalType.EDIT ? modalState.data.title : ""
        }
        initialColor={
          modalState.type === ModalType.EDIT ? modalState.data.color : undefined
        }
        onConfirm={handleConfirmListForm}
      />

      <ConfirmDialog
        open={
          modalState.type === ModalType.DELETE ||
          modalState.type === ModalType.DUPLICATE
        }
        onOpenChange={(open) => {
          if (!open) {
            setModalState({ type: ModalType.NONE });
          }
        }}
        title={
          modalState.type === ModalType.DELETE ||
          modalState.type === ModalType.DUPLICATE
            ? modalState.title
            : ""
        }
        message={
          modalState.type === ModalType.DELETE ||
          modalState.type === ModalType.DUPLICATE
            ? modalState.message
            : ""
        }
        confirmText={t("toDo.detail.deleteConfirm.confirm")}
        cancelText={t("toDo.detail.deleteConfirm.cancel")}
        onConfirm={
          modalState.type === ModalType.DELETE
            ? handleConfirmDeleteList
            : handleConfirmDuplicateList
        }
        variant="danger"
      />
    </>
  );
};
