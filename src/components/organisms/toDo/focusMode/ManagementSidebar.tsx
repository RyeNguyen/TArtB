import { Typography } from "@atoms/Typography";
import { TypoVariants } from "@constants/common";
import { useTodo } from "@hooks/useToDo";

export const ManagementSidebar = () => {
  const { lists, selectedList, handleSelectList } = useTodo();

  return (
    <div className="w-[16%] h-full py-4 pr-4 border-r border-white/20">
      <div>
        <div className="flex items-center gap-2">
          <Typography variant={TypoVariants.SUBTITLE}>List</Typography>
          <div className="flex items-center gap-1 px-2 rounded-full bg-white/20 text-sz-small text-white/80">
            {lists.length}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {lists.map((list) => {
            return (
              <div
                key={list.id}
                onClick={() => handleSelectList(list.id)}
                className={`px-2 py-1 rounded-xl flex items-center justify-between cursor-pointer ${selectedList?.id === list.id ? "bg-white/20" : ""}`}
              >
                <Typography className="text-text-color">
                  {list.title}
                </Typography>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
