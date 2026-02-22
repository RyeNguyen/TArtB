import { DateFilterSection } from "./DateFilterSection";
import { ListsSection } from "./ListsSection";
import { TagsSection } from "./TagsSection";
import { CompletedTasksSection } from "./CompletedTasksSection";
import { DeletedTasksSection } from "./DeletedTasksSection";

export const ManagementSidebar = () => {
  return (
    <div className="h-full flex flex-col">
      <DateFilterSection />
      <ListsSection />
      <TagsSection />
      <CompletedTasksSection />
      <DeletedTasksSection />
    </div>
  );
};
