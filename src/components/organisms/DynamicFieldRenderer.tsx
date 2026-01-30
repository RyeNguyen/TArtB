import { Selector } from "@atoms/Selector";
import { FieldType, TypoVariants } from "@constants/common";
import { SETTINGS_CONFIG } from "@constants/settingConfig";
import { useSettingsStore } from "@stores/index";
import { Switch } from "@atoms/Switch";
import { Typography } from "@atoms/Typography";
import { useTranslation } from "react-i18next";
import { ParseKeys } from "i18next";
import { UserSettings } from "../../types/settings";

// Helper to get nested value from object using dot notation path
const getNestedValue = (obj: UserSettings, path: string): unknown => {
  return path.split(".").reduce((current: unknown, key: string) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

// Helper to set nested value in object using dot notation path
const setNestedValue = (
  path: string,
  value: unknown,
): Partial<UserSettings> => {
  const keys = path.split(".");
  const result: Record<string, unknown> = {};
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = {};
    current = current[keys[i]] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return result as Partial<UserSettings>;
};

export const DynamicFieldRenderer = ({ category }: { category: string }) => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();

  const fields = (SETTINGS_CONFIG[category] || []).filter((field) => {
    if (field.condition) {
      return field.condition(settings);
    }
    return true;
  });

  const handleChange = (fieldId: string, value: unknown) => {
    const nestedUpdate = setNestedValue(fieldId, value);
    updateSettings(nestedUpdate);
  };

  return (
    <div className="flex flex-col gap-4 pt-12 px-6">
      <Typography variant={TypoVariants.TITLE} className="mb-3 uppercase">
        {t(`settings.categories.${category.toLocaleLowerCase()}` as ParseKeys)}
      </Typography>

      {fields.map((field, index) => {
        const currentValue = getNestedValue(settings, field.id);

        return (
          <div
            key={field.id}
            className={`flex justify-between items-center group pb-4 border-b-2 ${index !== fields.length - 1 ? "border-gray-500" : "border-transparent"} `}
          >
            <Typography>{t(field.label)}</Typography>

            {field.type === FieldType.SWITCH && (
              <Switch
                isDefaultActive={!!currentValue}
                onChange={(val) => handleChange(field.id, val)}
              />
            )}

            {field.type === FieldType.SELECT && (
              <Selector
                id={field.id}
                data={
                  field.items?.map((item) => ({
                    ...item,
                    label: t(item.label as ParseKeys),
                  })) || []
                }
                defaultValue={currentValue?.toString()}
                onChange={(val) => handleChange(field.id, val)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
