import { Button } from "@atoms/button/Button";
import { Dropdown } from "@atoms/Dropdown";
import { COLORS } from "@constants/colors";
import {
  getGroupCriteriaConfig,
  getGroupByData,
  getSortCriteriaConfig,
  getSortByData,
} from "@constants/toDoConfig";
import { useTodo } from "@hooks/useToDo";
import GroupIcon from "@icons/Group";
import SortIcon from "@icons/Sort";
import { useTranslation } from "react-i18next";

export const ToDoFilter = () => {
  const { t } = useTranslation();
  const { toDoSettings, handleUpdateSetting } = useTodo();

  const groupCriteriaConfig = getGroupCriteriaConfig();
  const sortCriteriaConfig = getSortCriteriaConfig();

  return (
    <div className="flex gap-2">
      <Dropdown
        header={t("toDo.groupBy.title")}
        data={getGroupByData()}
        value={toDoSettings.groupBy}
        onChange={(value: string) => handleUpdateSetting("groupBy", value)}
      >
        <Button
          icon={GroupIcon}
          isOutline
          iconColor={COLORS.WHITE}
          text={groupCriteriaConfig[toDoSettings.groupBy]}
        />
      </Dropdown>

      <Dropdown
        header={t("toDo.sortBy.title")}
        data={getSortByData()}
        value={toDoSettings.sortBy}
        onChange={(value: string) => handleUpdateSetting("sortBy", value)}
      >
        <Button
          icon={SortIcon}
          isOutline
          iconColor={COLORS.WHITE}
          text={sortCriteriaConfig[toDoSettings.sortBy]}
        />
      </Dropdown>
    </div>
  );
};
