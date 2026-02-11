import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@atoms/Accordion";
import { Button } from "@atoms/button/Button";
import { Typography } from "@atoms/Typography";
import { COLORS } from "@constants/colors";
import { TypoVariants } from "@constants/common";
import { useTodo } from "@hooks/useToDo";
import MoreIcon from "@icons/More";
import PlusIcon from "@icons/Plus";
import { useTodoStore } from "@stores/todoStore";

export const ManagementSidebar = () => {
  const { setSelectedTask } = useTodoStore();
  const { lists, selectedList, handleSelectList } = useTodo();

  const onSelectList = (listId: string) => {
    setSelectedTask(null);
    handleSelectList(listId);
  };

  return (
    <div className="w-[16%] h-full py-4 pr-4 border-r border-white/20">
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

              <Button icon={PlusIcon} iconColor={COLORS.WHITE} isGhost />
            </div>
          </AccordionTrigger>
          <AccordionContent id="lists">
            <div className="flex flex-col gap-1 mt-4">
              {lists.map((list) => {
                return (
                  <div
                    key={list.id}
                    onClick={() => onSelectList(list.id)}
                    className={`px-2 py-1 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/10! ${selectedList?.id === list.id ? "bg-white/20" : ""}`}
                  >
                    <Typography className="text-text-color">
                      {list.title}
                    </Typography>

                    <MoreIcon />
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
