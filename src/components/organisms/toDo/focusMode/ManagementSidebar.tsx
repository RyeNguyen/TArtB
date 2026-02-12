import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@atoms/Accordion";
import { Button } from "@atoms/button/Button";
import { Typography } from "@atoms/Typography";
import { COLORS } from "@constants/colors";
import { ListActions, ModalType, TypoVariants } from "@constants/common";
import { useTodo } from "@hooks/useToDo";
import MoreIcon from "@icons/More";
import PlusIcon from "@icons/Plus";
import { useTodoStore } from "@stores/todoStore";
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

export const ManagementSidebar = () => {
  const { t } = useTranslation();
  const { setSelectedTask, deleteList, addList, updateList } = useTodoStore();
  const { lists, selectedList, handleSelectList } = useTodo();
  const [isHoveringList, setIsHoveringList] = useState(false);
  const [hoveredListId, setHoveredListId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState<TaskList>>({
    type: ModalType.NONE,
  });

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
        setOpenDropdownId(null); // Close dropdown
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
    if (listId === selectedList?.id) return;
    setSelectedTask(null);
    handleSelectList(listId);
  };

  const handleAddList = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalState({ type: ModalType.ADD, title: t("toDo.list.addTitle") });
  };

  const handleConfirmListForm = async (title: string, color: string) => {
    if (modalState.type === ModalType.ADD) {
      const newListId = await addList(title, color);
      handleSelectList(newListId);
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
        handleSelectList(nextListId);
      }
      setModalState({ type: ModalType.NONE });
    }
  };

  return (
    <div className="w-[16%] h-full p-2 pr-4 border-r border-white/20">
      <div
        onMouseEnter={() => setIsHoveringList(true)}
        onMouseLeave={() => setIsHoveringList(false)}
      >
        <Accordion>
          <AccordionItem id="lists">
            <AccordionTrigger id="lists">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Typography variant={TypoVariants.SUBTITLE}>List</Typography>
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
              <div className="flex flex-col gap-1 mt-2">
                {lists.map((list) => {
                  const isHovered = hoveredListId === list.id;
                  return (
                    <div
                      key={list.id}
                      onClick={() => onSelectList(list.id)}
                      onMouseEnter={() => setHoveredListId(list.id)}
                      onMouseLeave={() => setHoveredListId(null)}
                      className={`px-2 py-1 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/10! ${selectedList?.id === list.id ? "bg-white/20" : ""}`}
                    >
                      <Typography className="text-text-color">
                        {list.title}
                      </Typography>

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
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
        onConfirm={handleConfirmDeleteList}
        variant="danger"
      />
    </div>
  );
};
