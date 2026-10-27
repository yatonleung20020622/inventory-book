export const WORKING_CONDITIONS = ["working", "not_working", "broken"] as const;
export type WorkingCondition = (typeof WORKING_CONDITIONS)[number] | "";

export const DISPOSAL_STATUSES = ["to_dispose", "disposed"] as const;
export type DisposalStatus = (typeof DISPOSAL_STATUSES)[number] | "";

export const DISPOSAL_METHODS = [
  "recycle",
  "rubbish",
  "sell",
  "gift",
] as const;
export type DisposalMethod = (typeof DISPOSAL_METHODS)[number] | "";

export type ItemDispositionInput = {
  workingCondition?: string | null;
  disposalStatus?: string | null;
  disposalMethod?: string | null;
  soldPrice?: string | null;
};

export type ItemDispositionFields = {
  workingCondition: WorkingCondition;
  disposalStatus: DisposalStatus;
  disposalMethod: DisposalMethod;
  soldPrice: string;
  disposedAt: string;
};

const WORKING_SET = new Set<string>(WORKING_CONDITIONS);
const STATUS_SET = new Set<string>(DISPOSAL_STATUSES);
const METHOD_SET = new Set<string>(DISPOSAL_METHODS);

export function normalizeWorkingCondition(
  value: string | null | undefined,
): WorkingCondition {
  const trimmed = (value ?? "").trim();
  return WORKING_SET.has(trimmed) ? (trimmed as WorkingCondition) : "";
}

export function normalizeDisposalStatus(
  value: string | null | undefined,
): DisposalStatus {
  const trimmed = (value ?? "").trim();
  return STATUS_SET.has(trimmed) ? (trimmed as DisposalStatus) : "";
}

export function normalizeDisposalMethod(
  value: string | null | undefined,
): DisposalMethod {
  const trimmed = (value ?? "").trim();
  return METHOD_SET.has(trimmed) ? (trimmed as DisposalMethod) : "";
}

export function emptyDispositionFields(): ItemDispositionFields {
  return {
    workingCondition: "",
    disposalStatus: "",
    disposalMethod: "",
    soldPrice: "",
    disposedAt: "",
  };
}

/** Validate and normalize disposition input. Returns an error message or fields. */
export function resolveDispositionFields(
  input: ItemDispositionInput,
  previousDisposedAt = "",
): { ok: true; fields: ItemDispositionFields } | { ok: false; message: string } {
  const workingCondition = normalizeWorkingCondition(input.workingCondition);
  const disposalStatus = normalizeDisposalStatus(input.disposalStatus);
  let disposalMethod = normalizeDisposalMethod(input.disposalMethod);
  let soldPrice = (input.soldPrice ?? "").trim();

  if (!disposalStatus) {
    disposalMethod = "";
  }

  if (disposalMethod !== "sell") {
    soldPrice = "";
  }

  if (disposalMethod === "sell" && disposalStatus === "disposed" && !soldPrice) {
    return {
      ok: false,
      message: "Sold price is required when sold on a 2nd platform.",
    };
  }

  const disposedAt =
    disposalStatus === "disposed"
      ? previousDisposedAt.trim() || new Date().toISOString().slice(0, 10)
      : "";

  return {
    ok: true,
    fields: {
      workingCondition,
      disposalStatus,
      disposalMethod,
      soldPrice,
      disposedAt,
    },
  };
}

export function dispositionIsEmpty(fields: ItemDispositionFields) {
  return (
    !fields.workingCondition &&
    !fields.disposalStatus &&
    !fields.disposalMethod &&
    !fields.soldPrice &&
    !fields.disposedAt
  );
}

export function workingConditionLabel(value: WorkingCondition) {
  switch (value) {
    case "working":
      return "Working";
    case "not_working":
      return "Not working";
    case "broken":
      return "Broken";
    default:
      return "";
  }
}

export function disposalStatusLabel(value: DisposalStatus) {
  switch (value) {
    case "to_dispose":
      return "To dispose";
    case "disposed":
      return "Disposed";
    default:
      return "";
  }
}

export function disposalMethodLabel(value: DisposalMethod) {
  switch (value) {
    case "recycle":
      return "Recycle";
    case "rubbish":
      return "Rubbish";
    case "sell":
      return "2nd platform";
    case "gift":
      return "Friends gift";
    default:
      return "";
  }
}

export function disposalTagLabel(
  status: DisposalStatus,
  method: DisposalMethod,
) {
  if (status === "to_dispose") {
    if (method === "recycle") return "To recycle";
    if (method === "rubbish") return "To rubbish";
    if (method === "sell") return "To sell";
    if (method === "gift") return "To gift";
    return "To dispose";
  }
  if (status === "disposed") {
    if (method === "recycle") return "Recycled";
    if (method === "rubbish") return "Thrown away";
    if (method === "sell") return "Sold";
    if (method === "gift") return "Gifted";
    return "Disposed";
  }
  return "";
}
