import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@atoms/Accordion";
import { Button } from "@atoms/button/Button";
import { Typography } from "@atoms/Typography";
import { COLORS } from "@constants/colors";
import { ListActions, ModalType, TypoVariants, WidgetId } from "@constants/common";
import { useTodo } from "@hooks/useToDo";
import MoreIcon from "@icons/More";
import PlusIcon from "@icons/Plus";
import { useTodoStore } from "@stores/todoStore";
import { useSettingsStore } from "@stores/settingsStore";
import { motion } from "framer-motion";
import { fadeInOut } from "@animations/hover";
import React, { useState } from "react";
import DeleteIcon from "@icons/Delete";
import { useTranslation } from "react-i18next";
import DuplicateIcon from "@icons/Duplicate";
import { Dropdown } from "@atoms/Dropdown";
import EditIcon from "@icons/Edit";
import { ConfirmDialog } from "@atoms/ConfirmDialog";
import { TaskList } from "@/types/toDo";
import { ModalState } from "@/types/common";
import { ListFormModal } from "@molecules/toDo/ListFormModal";
import DragListIcon from "@icons/DragList";
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
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { todoService } from "@services/todo/todoService";
import { Tag } from "@/types/toDo";

interface SortableTagItemProps {
  tag: Tag;
  isSelected: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

const SortableTagItem = ({
  tag,
  isSelected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: SortableTagItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-1 rounded-xl flex items-center justify-between gap-2 hover:bg-white/10 cursor-pointer ${isSelected ? "bg-white/20" : ""}`}
    >
      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
        <motion.div
          initial="hidden"
          animate={isHovered ? "visible" : "hidden"}
          variants={fadeInOut}
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <DragListIcon />
        </motion.div>

        <Typography className="text-text-color truncate">
          {tag.title}
        </Typography>
      </div>
    </div>
  );
};

interface SortableListItemProps {
  list: TaskList;
  isSelected: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onMoreClick: (e: React.MouseEvent) => void;
  getListActionData: (list: TaskList) => any[];
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}

const SortableListItem = ({
  list,
  isSelected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onMoreClick,
  getListActionData,
  openDropdownId,
  setOpenDropdownId,
}: SortableListItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-1 rounded-xl flex items-center justify-between gap-2 cursor-pointer hover:bg-white/10! ${isSelected ? "bg-white/20" : ""}`}
    >
      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
        <motion.div
          initial="hidden"
          animate={isHovered ? "visible" : "hidden"}
          variants={fadeInOut}
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <DragListIcon />
        </motion.div>

        <Typography className="text-text-color truncate">
          {list.title}
        </Typography>
      </div>

      <div className="flex justify-center" onClick={onMoreClick}>
        <Dropdown
          data={getListActionData(list)}
          open={openDropdownId === list.id}
          onOpenChange={(open?: boolean) =>
            setOpenDropdownId(open ? list.id : null)
          }
        >
          <motion.div
            initial="hidden"
            animate={isHovered ? "visible" : "hidden"}
            variants={fadeInOut}
          >
            <MoreIcon />
          </motion.div>
        </Dropdown>
      </div>
    </div>
  );
};

export const ManagementSidebar = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();
  const {
    lists: storeLists,
    tags: storeTags,
    setSelectedTask,
    deleteList,
    addList,
    updateList,
    duplicateList,
  } = useTodoStore();
  const { lists, tags, selectedList, toDoSettings } = useTodo();
  const [isHoveringList, setIsHoveringList] = useState(false);
  const [hoveredListId, setHoveredListId] = useState<string | null>(null);
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);
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

  const onSelectList = (listId: string) => {
    if (listId === selectedList?.id && !toDoSettings.selectedTagId) return;
    setSelectedTask(null);
    // Clear tag filter and select list in a single update to avoid race condition
    updateSettings({
      widgets: {
        ...settings.widgets,
        [WidgetId.TODO]: {
          ...toDoSettings,
          selectedTagId: null,
          selectedListId: listId,
        },
      },
    });
  };

  const onSelectTag = (tagId: string) => {
    setSelectedTask(null);
    // Clear list selection and select tag in a single update
    updateSettings({
      widgets: {
        ...settings.widgets,
        [WidgetId.TODO]: {
          ...toDoSettings,
          selectedListId: null,
          selectedTagId: tagId,
        },
      },
    });
  };

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
        console.error("[ManagementSidebar] Error reordering lists:", error);
      }
    }
  };

  const handleDragEndTag = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = tags.findIndex((tag) => tag.id === active.id);
    const newIndex = tags.findIndex((tag) => tag.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      // Use arrayMove to reorder the tags array
      const reorderedTags = arrayMove(tags, oldIndex, newIndex);

      // Update order values to match new positions
      const now = Date.now();
      const tagsWithNewOrders = reorderedTags.map((tag, index) => ({
        ...tag,
        order: index,
        updatedAt: now,
      }));

      // Optimistically update local state
      useTodoStore.setState({ tags: tagsWithNewOrders });

      try {
        // Save all tags with new orders
        await todoService.saveTags(tagsWithNewOrders);
      } catch (error) {
        // Revert on error
        useTodoStore.setState({ tags: storeTags });
        console.error("[ManagementSidebar] Error reordering tags:", error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div
        onMouseEnter={() => setIsHoveringList(true)}
        onMouseLeave={() => setIsHoveringList(false)}
      >
        <div className="p-2">
          <Accordion>
            <AccordionItem id="lists">
              <AccordionTrigger id="lists">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Typography variant={TypoVariants.SUBTITLE}>
                      List
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
                          isSelected={!toDoSettings.selectedTagId && selectedList?.id === list.id}
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

        <div className="p-2">
          <Accordion>
            <AccordionItem id="tags">
              <AccordionTrigger id="tags">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Typography variant={TypoVariants.SUBTITLE}>
                      Tags
                    </Typography>
                    <div className="flex items-center gap-1 px-2 rounded-full bg-white/20 text-sz-small text-white/80">
                      {tags.length}
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
                      onClick={() => {}}
                    />
                  </motion.div>
                </div>
              </AccordionTrigger>
              <AccordionContent id="tags">
                {tags.length === 0 ? (
                  <Typography className="text-white/50 text-sz-small text-center py-2">
                    {t("toDo.tag.none")}
                  </Typography>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEndTag}
                  >
                    <SortableContext
                      items={tags.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-1 mt-2">
                        {tags.map((tag) => (
                          <SortableTagItem
                            key={tag.id}
                            tag={tag}
                            isSelected={toDoSettings.selectedTagId === tag.id}
                            isHovered={hoveredTagId === tag.id}
                            onMouseEnter={() => setHoveredTagId(tag.id)}
                            onMouseLeave={() => setHoveredTagId(null)}
                            onClick={() => onSelectTag(tag.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
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
    </div>
  );
};
