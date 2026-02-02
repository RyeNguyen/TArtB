import { deleteField, FieldValue } from "firebase/firestore";

export const removeUndefined = <T extends Record<string, any>>(obj: T): T => {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

/**
 * Converts undefined values to Firestore deleteField() sentinel.
 * Use this when updating documents where undefined means "delete this field".
 */
export const undefinedToDeleteField = <T extends Record<string, any>>(
  obj: T,
): Record<string, any | FieldValue> => {
  const result: Record<string, any | FieldValue> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      result[key] = deleteField();
    } else {
      result[key] = obj[key];
    }
  });
  return result;
};
