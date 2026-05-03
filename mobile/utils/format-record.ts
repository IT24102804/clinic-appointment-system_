import { RefValue } from "@/types/crud";

export function formatRef(value: unknown) {
  if (!value) {
    return "Not set";
  }

  if (typeof value === "string") {
    return value;
  }

  const ref = value as RefValue;

  if (typeof ref === "object") {
    const referencePrefix = ref.referenceId ? `${ref.referenceId} - ` : "";

    if (ref.fullName) {
      return `${referencePrefix}${ref.fullName}`;
    }

    if (ref.name) {
      return `${referencePrefix}${ref.name}`;
    }

    if (ref.appointmentDate || ref.timeSlot) {
      return `${referencePrefix}${[formatDate(ref.appointmentDate), ref.timeSlot].filter(Boolean).join(" ")}`;
    }

    if (ref._id) {
      return ref._id;
    }
  }

  return String(value);
}

export function getReferenceId(value: unknown) {
  if (!value || typeof value !== "object" || !("referenceId" in value)) {
    return "";
  }

  return String((value as { referenceId?: string }).referenceId || "");
}

export function getRefId(value: unknown) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id: string })._id);
  }

  return "";
}

export function formatDate(value: unknown) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export function formatDateTime(value: unknown) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "Not set";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return formatRef(value);
}
