import { Task } from "@/types/toDo";
import { Button } from "@atoms/button/Button";
import { Typography } from "@atoms/Typography";
import { COLORS } from "@constants/colors";
import { TypoVariants } from "@constants/common";
import { useTodo } from "@hooks/useToDo";
import CloseIcon from "@icons/Close";
import TagIcon from "@icons/Tag";
import { TagSelector } from "@molecules/toDo/TagSelector";
import { useTodoStore } from "@stores/todoStore";
import { useState } from "react";

const CREATE_TAG_VALUE = "createTag";

interface TagDisplayProps {
  task: Task;
}

export const TagDisplay = ({ task }: TagDisplayProps) => {
  const { addTag, updateTask } = useTodoStore();
  const { getDisplayTags, tagSearchTerm, setTagSearchTerm } = useTodo();

  const [tags, setTags] = useState<string[]>(task.tags || []);

  const onSelectTag = async (tagId: string) => {
    if (!tagId) return;
    let newTags: string[] = [];

    if (tagId === CREATE_TAG_VALUE) {
      const newTagId = await addTag(tagSearchTerm, COLORS.BLUE_50);
      newTags = [...tags, newTagId];
      setTagSearchTerm("");
    } else {
      if (tags.includes(tagId)) {
        newTags = tags.filter((tag) => tag !== tagId);
      } else {
        newTags = [...tags, tagId];
      }
    }

    setTags(newTags);
    updateTask(task.id, { tags: newTags });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <TagSelector value={tags} onChange={onSelectTag}>
        <Button
          className="p-0! bg-transparent!"
          iconColor={COLORS.WHITE}
          icon={TagIcon}
        />
      </TagSelector>

      {getDisplayTags(tags).map((item) => {
        return (
          <div
            key={item.id}
            className="flex items-center gap-1 rounded-full pl-2 pr-0.5"
            style={{ backgroundColor: item.color }}
          >
            <Typography
              variant={TypoVariants.DESCRIPTION}
              className="text-gray-300!"
            >
              #{item.title}
            </Typography>

            <Button
              className="p-0! bg-transparent!"
              icon={CloseIcon}
              iconColor={COLORS.GRAY_300}
              onClick={() => onSelectTag(item.id)}
            />
          </div>
        );
      })}
    </div>
  );
};
