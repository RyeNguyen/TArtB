import { Dropdown } from "@atoms/Dropdown";
import { Typography } from "@atoms/Typography";
import { useTodo } from "@hooks/useToDo";
import PlusIcon from "@icons/Plus";
import SearchIcon from "@icons/SearchIcon";
import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface TagSelectorProps {
  children: ReactNode;
  value?: string[];
  onChange?: (value: string) => void;
}

const CREATE_TAG_VALUE = "createTag";

export const TagSelector = ({
  children,
  value,
  onChange,
}: TagSelectorProps) => {
  const { t } = useTranslation();
  const { searchTagsResults, tagSearchTerm, setTagSearchTerm } = useTodo();

  const tagsData = useMemo(() => {
    return searchTagsResults.length > 0
      ? searchTagsResults.map((item) => {
          return {
            value: item.id,
            label: (
              <div
                className={`rounded-full border px-2 ${value?.includes(item.id) ? "border-transparent" : "border-white"}`}
              >
                <Typography
                  className={`${value?.includes(item.id) ? "text-gray-300!" : "text-text-white"}`}
                >
                  #{item.title}
                </Typography>
              </div>
            ),
            color: item.color,
          };
        })
      : [
          {
            label: (
              <div className="w-full flex items-center gap-1">
                <PlusIcon />
                <Typography className="truncate flex-1">
                  {t("toDo.tag.createNew", { tagName: tagSearchTerm })}
                </Typography>
              </div>
            ),
            value: CREATE_TAG_VALUE,
          },
        ];
  }, [searchTagsResults, t, tagSearchTerm, value]);

  return (
    <Dropdown
      data={tagsData}
      value={value}
      multipleSelect
      isCompact
      menuClassName="max-w-80"
      menuItemClassName="p-0!"
      onChange={onChange}
      onOpenChange={() => setTagSearchTerm("")}
      header={
        <div className="w-full flex gap-2 items-center mb-2 pb-2 border-b border-white/20">
          <SearchIcon />
          <input
            value={tagSearchTerm}
            placeholder={t("toDo.tag.searchPlaceholder")}
            className="w-full outline-none text-white font-light text-sz-default"
            onChange={(e) => setTagSearchTerm(e.target.value)}
          />
        </div>
      }
    >
      {children}
    </Dropdown>
  );
};
