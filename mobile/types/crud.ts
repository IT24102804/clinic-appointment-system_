export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: { field: string; message: string }[];
};

export type RefValue =
  | string
  | {
      _id: string;
      referenceId?: string;
      fullName?: string;
      name?: string;
      specialization?: string;
      phone?: string;
      email?: string;
      appointmentDate?: string;
      timeSlot?: string;
      status?: string;
      sessionFee?: number;
    };

export type CrudRecord = {
  _id: string;
  referenceId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type UploadAsset = {
  uri: string;
  name: string;
  mimeType?: string | null;
};

export type FieldOption = {
  label: string;
  value: string;
};

export type FieldConfig = {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "number" | "date" | "time" | "multiline" | "select" | "reference";
  reference?: "patients" | "doctors" | "appointments";
  options?: FieldOption[];
  placeholder?: string;
  readOnly?: boolean;
  visibleIn?: ("create" | "edit")[];
};

export type ModuleConfig = {
  key: string;
  title: string;
  eyebrow: string;
  listTitle: string;
  createTitle: string;
  editTitle: string;
  detailTitle: string;
  basePath: string;
  fields: FieldConfig[];
  attachmentLabel?: string;
  attachmentUrlKey?: string;
  attachmentNameKey?: string;
  defaultValues: Record<string, string>;
  getCardTitle: (record: CrudRecord) => string;
  getCardSubtitle: (record: CrudRecord) => string;
  getDetailRows: (record: CrudRecord) => { label: string; value: string }[];
};
