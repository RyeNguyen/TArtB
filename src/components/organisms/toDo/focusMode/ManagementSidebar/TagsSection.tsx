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
import { TypoVariants, WidgetId, ModalType } from "@constants/common";
import PlusIcon from "@icons/Plus";
import EditIcon from "@icons/Edit";
import DeleteIcon from "@icons/Delete";
import DuplicateIcon from "@icons/Duplicate";
import { motion } from "framer-motion";
import { fadeInOut } from "@animations/hover";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodoStore } from "@stores/todoStore";
import { useSettingsStore } from "@stores/settingsStore";
import { useTodo } from "@hooks/useToDo";
import { todoService } from "@services/todo/todoService";
import { arrayMove } from "@dnd-kit/sortable";
import { Tag } from "@/types/toDo";
import { ModalState } from "@/types/common";
import { TagFormModal } from "@molecules/toDo/TagFormModal";
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
import { SortableTagItem } from "./components/SortableTagItem";

export const TagsSection = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();
  const { tags: storeTags, setSelectedTask, addTag, updateTag, deleteTag, duplicateTag } = useTodoStore();
  const { tags, lists } = useTodo();
  const toDoSettings = settings.widgets[WidgetId.TODO];
  const [isHoveringList, setIsHoveringList] = useState(false);
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState<Tag>>({
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

  const getTagActionData = (tag: Tag) => [
    {
      label: (
        <div className="flex items-center gap-2">
          <EditIcon />
          <Typography className="text-white">
            {t("toDo.action.edit")}
          </Typography>
        </div>
      ),
      value: "edit",
      onClick: () => {
        setOpenDropdownId(null);
        setModalState({
          type: ModalType.EDIT,
          title: t("toDo.tag.editTitle"),
          data: tag,
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
      value: "duplicate",
      onClick: async () => {
        setOpenDropdownId(null);
        await duplicateTag(tag.id);
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
      value: "delete",
      onClick: () => {
        setOpenDropdownId(null);
        setModalState({
          type: ModalType.DELETE,
          title: t("toDo.tag.deleteTitle", { tagName: tag.title }),
          message: t("toDo.tag.deleteMessage"),
          data: tag,
        });
      },
    },
  ];

  const handleAddTag = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalState({ type: ModalType.ADD, title: t("toDo.tag.addTitle") });
  };

  const handleConfirmTagForm = async (title: string, color: string) => {
    if (modalState.type === ModalType.ADD) {
      await addTag(title, color);
    } else if (modalState.type === ModalType.EDIT) {
      await updateTag(modalState.data.id, { title, color });
    }
  };

  const onSelectTag = (tagId: string) => {
    setSelectedTask(null);
    // Clear list, completed, and deleted filters when selecting a tag
    updateSettings({
      widgets: {
        ...settings.widgets,
        [WidgetId.TODO]: {
          ...toDoSettings,
          selectedListId: null,
          selectedTagId: tagId,
          showCompleted: false,
          showDeleted: false,
        },
      },
    });
  };

  const handleConfirmDeleteTag = async () => {
    if (modalState.type === ModalType.DELETE) {
      const deletedTagId = modalState.data.id;

      await deleteTag(deletedTagId);

      // If the deleted tag was selected, restore to first list
      if (toDoSettings.selectedTagId === deletedTagId && lists.length > 0) {
        updateSettings({
          widgets: {
            ...settings.widgets,
            [WidgetId.TODO]: {
              ...toDoSettings,
              selectedTagId: null,
              selectedListId: lists[0].id,
            },
          },
        });
      }

      setModalState({ type: ModalType.NONE });
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
        console.error("[TagsSection] Error reordering tags:", error);
      }
    }
  };

  return (
    <div className="p-2">
      <div
        onMouseEnter={() => setIsHoveringList(true)}
        onMouseLeave={() => setIsHoveringList(false)}
      >
        <Accordion>
          <AccordionItem id="tags">
            <AccordionTrigger id="tags">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Typography variant={TypoVariants.SUBTITLE}>
                    {t("toDo.tag.title")}
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
                    onClick={handleAddTag}
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
                          onMoreClick={(e) => e.stopPropagation()}
                          getTagActionData={getTagActionData}
                          openDropdownId={openDropdownId}
                          setOpenDropdownId={setOpenDropdownId}
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

      <TagFormModal
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
        onConfirm={handleConfirmTagForm}
      />

      <ConfirmDialog
        open={modalState.type === ModalType.DELETE}
        onOpenChange={(open) => {
          if (!open) {
            setModalState({ type: ModalType.NONE });
          }
        }}
        title={modalState.type === ModalType.DELETE ? modalState.title : ""}
        message={modalState.type === ModalType.DELETE ? modalState.message : ""}
        confirmText={t("toDo.detail.deleteConfirm.confirm")}
        cancelText={t("toDo.detail.deleteConfirm.cancel")}
        onConfirm={handleConfirmDeleteTag}
        variant="danger"
      />
    </div>
  );
};
